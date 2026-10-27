"""
tts_engine.py — XTTS-v2 wrapper with disk-based audio cache.

The cache key is a SHA-256 hash of (text + language).
Generated WAV files are stored under CACHE_DIR and reused on subsequent calls.
"""
from __future__ import annotations

import hashlib
import logging
import os
import threading
from pathlib import Path

import soundfile as sf
import torch
import torchaudio.functional as F
from TTS.api import TTS
import TTS.tts.models.xtts as xtts_mod

logger = logging.getLogger(__name__)

# Patch XTTS internal audio loader to use soundfile instead of torchaudio.load().
# This natively supports MP3, WAV, FLAC, OGG and bypasses Windows torchcodec/FFmpeg DLL loading issues.
def _safe_load_audio(audiopath: str | os.PathLike, sampling_rate: int) -> torch.Tensor:
    data, sr = sf.read(str(audiopath), dtype="float32")
    audio = torch.from_numpy(data)
    if audio.ndim > 1:
        audio = audio.t()
        audio = torch.mean(audio, dim=0, keepdim=True)
    else:
        audio = audio.unsqueeze(0)
    if sr != sampling_rate:
        audio = F.resample(audio, sr, sampling_rate)

    # Trim leading and trailing dead silence (< -35 dB)
    energy = audio.abs()
    mask = energy > 0.015
    indices = torch.nonzero(mask)
    if len(indices) > 0:
        start = max(0, indices[0, 1].item() - int(sampling_rate * 0.05))
        end = min(audio.shape[1], indices[-1, 1].item() + int(sampling_rate * 0.05))
        audio = audio[:, start:end]

    # Peak normalization: scale volume so reference is clean and not quiet/muffled
    peak = torch.max(torch.abs(audio))
    if peak > 1e-4:
        audio = audio / peak * 0.95

    return audio.clip(-1, 1)

xtts_mod.load_audio = _safe_load_audio


# ---------------------------------------------------------------------------
# Configuration (overridden from server.py via module-level setters)
# ---------------------------------------------------------------------------
_SPEAKER_WAV: Path | None = None
_LANGUAGE: str = "en"
_CACHE_DIR: Path = Path("cache")
_FORCE_CPU: bool = False

_tts: TTS | None = None
_lock = threading.Lock()
_model_loaded = False


def configure(
    speaker_wav: str | None,
    language: str,
    cache_dir: str,
    force_cpu: bool = False,
) -> None:
    """Set engine configuration BEFORE calling load_model()."""
    global _SPEAKER_WAV, _LANGUAGE, _CACHE_DIR, _FORCE_CPU
    _LANGUAGE = language
    _CACHE_DIR = Path(cache_dir)
    _FORCE_CPU = force_cpu

    if speaker_wav and Path(speaker_wav).is_file():
        _SPEAKER_WAV = Path(speaker_wav)
        logger.info("Speaker reference: %s", _SPEAKER_WAV)
    else:
        _SPEAKER_WAV = None
        if speaker_wav:
            logger.warning(
                "Speaker reference not found at '%s' — using default XTTS voice.",
                speaker_wav,
            )
        else:
            logger.info("No speaker reference configured — using default XTTS voice.")


def load_model() -> None:
    """Load XTTS-v2 into memory (blocking). Safe to call multiple times."""
    global _tts, _model_loaded

    with _lock:
        if _model_loaded:
            return

        device = _select_device()
        logger.info("Loading XTTS-v2 on device: %s …", device)

        _tts = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2").to(device)
        _CACHE_DIR.mkdir(parents=True, exist_ok=True)
        _model_loaded = True
        logger.info("XTTS-v2 loaded successfully.")


def is_loaded() -> bool:
    return _model_loaded


# ---------------------------------------------------------------------------
# Public synthesis API
# ---------------------------------------------------------------------------

def get_or_generate(text: str, language: str | None = None) -> Path:
    """
    Return the path to a WAV file for *text*.
    Reads from cache if it already exists, otherwise generates and caches it.
    """
    lang = language or _LANGUAGE
    key = _cache_key(text, lang)
    cached = _CACHE_DIR / f"{key}.wav"

    if cached.is_file():
        logger.debug("Cache HIT  %s  →  %s", key, text[:60])
        return cached

    logger.info("Cache MISS — generating audio for: %s", text[:80])
    _synthesise(text, lang, cached)
    return cached


def list_cache() -> list[dict]:
    """Return metadata for every cached audio file."""
    _CACHE_DIR.mkdir(parents=True, exist_ok=True)
    entries = []
    for wav in sorted(_CACHE_DIR.glob("*.wav")):
        meta_file = wav.with_suffix(".txt")
        text = meta_file.read_text(encoding="utf-8") if meta_file.is_file() else ""
        entries.append({"hash": wav.stem, "text": text, "file": str(wav)})
    return entries


def clear_cache() -> int:
    """Delete all cached audio files. Returns the number of files removed."""
    removed = 0
    _CACHE_DIR.mkdir(parents=True, exist_ok=True)
    for path in _CACHE_DIR.iterdir():
        if path.suffix in {".wav", ".txt"}:
            path.unlink(missing_ok=True)
            removed += 1
    logger.info("Cache cleared (%d files removed).", removed)
    return removed


def pregenerate(texts: list[str], language: str | None = None) -> dict:
    """Generate audio for a list of texts. Returns a summary."""
    lang = language or _LANGUAGE
    results = {"generated": 0, "cached": 0, "errors": []}
    for text in texts:
        if not text.strip():
            continue
        key = _cache_key(text, lang)
        cached = _CACHE_DIR / f"{key}.wav"
        if cached.is_file():
            results["cached"] += 1
            continue
        try:
            _synthesise(text, lang, cached)
            results["generated"] += 1
        except Exception as exc:  # noqa: BLE001
            logger.error("Failed to generate audio for '%s': %s", text[:60], exc)
            results["errors"].append({"text": text, "error": str(exc)})
    return results


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _select_device() -> str:
    if _FORCE_CPU:
        return "cpu"
    if torch.cuda.is_available():
        return "cuda"
    if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
        return "mps"
    return "cpu"


def _cache_key(text: str, language: str) -> str:
    payload = f"{language}::{text}"
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:32]


def _synthesise(text: str, language: str, output_path: Path) -> None:
    if not _model_loaded or _tts is None:
        raise RuntimeError("TTS model is not loaded. Call load_model() first.")

    output_path.parent.mkdir(parents=True, exist_ok=True)

    with _lock:
        if _SPEAKER_WAV is not None:
            _tts.tts_to_file(
                text=text,
                language=language,
                speaker_wav=str(_SPEAKER_WAV),
                file_path=str(output_path),
                temperature=0.65,
                repetition_penalty=5.0,
                top_p=0.85,
            )
        else:
            # Use the first built-in XTTS-v2 speaker when no reference wav is provided
            speakers = _tts.speakers or []
            speaker = speakers[0] if speakers else None
            _tts.tts_to_file(
                text=text,
                language=language,
                speaker=speaker,
                file_path=str(output_path),
                temperature=0.65,
                repetition_penalty=5.0,
                top_p=0.85,
            )

    # Persist the source text alongside the WAV for cache inspection
    output_path.with_suffix(".txt").write_text(text, encoding="utf-8")
    logger.info("Saved audio: %s", output_path)
