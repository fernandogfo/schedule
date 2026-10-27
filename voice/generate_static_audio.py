"""
generate_static_audio.py — Batch generates all schedule alert audios and stores them in public/assets/audio/voice/
"""
from __future__ import annotations

import hashlib
import json
import logging
import os
import sys
import time
from pathlib import Path

import soundfile as sf
import torch
import torchaudio.functional as F

from extract_phrases import get_all_phrases

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger("generator")

# Destination directory in Vite public folder
PUBLIC_VOICE_DIR = Path(__file__).resolve().parent.parent / "public" / "assets" / "audio" / "voice"
SPEAKER_FILE = Path(__file__).resolve().parent / "speaker" / "reference.mp3"


def _hash_phrase(phrase: str, lang: str = "en") -> str:
    key = f"{lang}::{phrase.strip()}"
    return hashlib.sha256(key.encode("utf-8")).hexdigest()[:16]


def setup_tts_engine():
    import TTS.tts.models.xtts as xtts_mod
    from TTS.api import TTS

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

        # Trim leading and trailing dead silence
        energy = audio.abs()
        mask = energy > 0.015
        indices = torch.nonzero(mask)
        if len(indices) > 0:
            start = max(0, indices[0, 1].item() - int(sampling_rate * 0.05))
            end = min(audio.shape[1], indices[-1, 1].item() + int(sampling_rate * 0.05))
            audio = audio[:, start:end]

        # Peak normalization
        peak = torch.max(torch.abs(audio))
        if peak > 1e-4:
            audio = audio / peak * 0.95

        return audio.clip(-1, 1)

    xtts_mod.load_audio = _safe_load_audio

    logger.info("Loading XTTS-v2 model...")
    device = "cuda" if torch.cuda.is_available() else "cpu"
    tts = TTS(model_name="tts_models/multilingual/multi-dataset/xtts_v2").to(device)
    logger.info("XTTS-v2 model loaded on %s.", device)
    return tts


def generate_all(limit: int | None = None):
    PUBLIC_VOICE_DIR.mkdir(parents=True, exist_ok=True)

    if not SPEAKER_FILE.is_file():
        raise FileNotFoundError(f"Reference audio not found at {SPEAKER_FILE}")

    phrases = get_all_phrases()
    total = len(phrases) if limit is None else min(limit, len(phrases))
    logger.info("Found %d total unique phrases. Target: %d.", len(phrases), total)

    manifest_path = PUBLIC_VOICE_DIR / "manifest.json"
    manifest: dict[str, str] = {}
    if manifest_path.is_file():
        try:
            manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
        except Exception:
            manifest = {}

    tts = setup_tts_engine()

    skipped = 0
    generated = 0
    start_time = time.time()

    for idx, phrase in enumerate(phrases[:total], start=1):
        h = _hash_phrase(phrase)
        out_wav = PUBLIC_VOICE_DIR / f"{h}.wav"

        manifest[phrase] = f"assets/audio/voice/{h}.wav"

        if out_wav.is_file() and out_wav.stat().st_size > 1000:
            skipped += 1
            continue

        logger.info("[%d/%d] Generating: %s", idx, total, phrase)
        t0 = time.time()
        tts.tts_to_file(
            text=phrase,
            language="en",
            speaker_wav=str(SPEAKER_FILE),
            file_path=str(out_wav),
            temperature=0.65,
            top_p=0.85,
            repetition_penalty=5.0,
        )
        elapsed = time.time() - t0
        generated += 1
        logger.info("  -> Saved in %.2fs (%s)", elapsed, out_wav.name)

        # Update manifest periodically
        if generated % 10 == 0:
            manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")

    # Final manifest save
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False), encoding="utf-8")
    total_elapsed = time.time() - start_time
    logger.info("Generation complete! Generated: %d, Skipped: %d, Total time: %.1fs", generated, skipped, total_elapsed)


if __name__ == "__main__":
    limit_arg = int(sys.argv[1]) if len(sys.argv) > 1 else None
    generate_all(limit=limit_arg)
