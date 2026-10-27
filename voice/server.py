"""
server.py — FastAPI voice server for XTTS-v2.

Endpoints
---------
GET  /health          — liveness / model-ready check
POST /speak           — synthesise (or return cached) audio for a text
GET  /cache           — list cached audio files
DELETE /cache         — wipe audio cache
POST /pregenerate     — bulk pre-generate a list of texts

Run with:
    python server.py
"""
from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path

import aiofiles
import uvicorn
from dotenv import load_dotenv
from fastapi import BackgroundTasks, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response, StreamingResponse
from pydantic import BaseModel, Field

import tts_engine

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Configuration from .env (falls back to environment / defaults)
# ---------------------------------------------------------------------------
load_dotenv(dotenv_path=Path(__file__).parent / ".env", override=False)

HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
SPEAKER_CONFIG = os.getenv("SPEAKER_FILE") or os.getenv("SPEAKER_WAV")
LANGUAGE = os.getenv("LANGUAGE", "en")
CACHE_DIR = os.getenv("CACHE_DIR", "cache")
FORCE_CPU = os.getenv("FORCE_CPU", "0") == "1"

# Resolve paths relative to this file so the server works from any cwd
BASE_DIR = Path(__file__).parent


def _resolve_speaker_path() -> Path | None:
    if SPEAKER_CONFIG:
        p = BASE_DIR / SPEAKER_CONFIG
        if p.is_file():
            return p
    # Auto-detect common formats in speaker/ directory if not explicitly found
    for filename in ["reference.mp3", "reference.wav", "reference.flac", "reference.ogg"]:
        p = BASE_DIR / "speaker" / filename
        if p.is_file():
            return p
    return None


_speaker_path = _resolve_speaker_path()
_cache_path = BASE_DIR / CACHE_DIR


# ---------------------------------------------------------------------------
# Lifespan: load model once at startup
# ---------------------------------------------------------------------------
@asynccontextmanager
async def lifespan(app: FastAPI):  # type: ignore[type-arg]
    tts_engine.configure(
        speaker_wav=str(_speaker_path) if _speaker_path else None,
        language=LANGUAGE,
        cache_dir=str(_cache_path),
        force_cpu=FORCE_CPU,
    )
    tts_engine.load_model()
    yield
    logger.info("Server shutting down.")


# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(
    title="XTTS Voice Server",
    description="Generates and caches TTS audio via XTTS-v2 for the schedule alert app.",
    version="1.0.0",
    lifespan=lifespan,
)

# Allow the Vite dev server (and any local origin) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------
class SpeakRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=2000, description="Text to synthesise.")
    language: str | None = Field(None, description="ISO-639-1 language code. Defaults to server default.")


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool


class CacheEntry(BaseModel):
    hash: str
    text: str
    file: str


class PregenerateResponse(BaseModel):
    generated: int
    cached: int
    errors: list[dict]


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

@app.get("/health", response_model=HealthResponse, summary="Liveness check")
async def health() -> HealthResponse:
    return HealthResponse(status="ok", model_loaded=tts_engine.is_loaded())


@app.post(
    "/speak",
    summary="Synthesise text to speech (cached)",
    responses={200: {"content": {"audio/wav": {}}}},
)
async def speak(req: SpeakRequest) -> StreamingResponse:
    if not tts_engine.is_loaded():
        raise HTTPException(status_code=503, detail="TTS model is still loading. Try again shortly.")

    text = req.text.strip()
    if not text:
        raise HTTPException(status_code=422, detail="text must not be blank.")

    try:
        wav_path = tts_engine.get_or_generate(text, req.language)
    except Exception as exc:
        logger.error("TTS generation error: %s", exc)
        raise HTTPException(status_code=500, detail=f"TTS generation failed: {exc}") from exc

    async def _stream():
        async with aiofiles.open(wav_path, "rb") as f:
            while chunk := await f.read(65536):
                yield chunk

    return StreamingResponse(
        _stream(),
        media_type="audio/wav",
        headers={"Cache-Control": "public, max-age=86400"},
    )


@app.get("/cache", response_model=list[CacheEntry], summary="List cached audio files")
async def list_cache() -> list[CacheEntry]:
    entries = tts_engine.list_cache()
    return [CacheEntry(**e) for e in entries]


@app.delete("/cache", summary="Clear all cached audio files")
async def clear_cache() -> dict:
    removed = tts_engine.clear_cache()
    return {"removed": removed, "message": f"Removed {removed} cached files."}


@app.post("/pregenerate", response_model=PregenerateResponse, summary="Pre-generate a list of texts")
async def pregenerate(
    texts: list[str],
    background_tasks: BackgroundTasks,
    language: str | None = None,
) -> Response:
    if not tts_engine.is_loaded():
        raise HTTPException(status_code=503, detail="TTS model is still loading.")

    # Run in a background thread so the endpoint returns immediately
    def _run():
        result = tts_engine.pregenerate(texts, language)
        logger.info("Pregenerate complete: %s", result)

    background_tasks.add_task(_run)
    return Response(
        content='{"message":"Pre-generation started in background."}',
        media_type="application/json",
        status_code=202,
    )


# ---------------------------------------------------------------------------
# Entry-point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host=HOST,
        port=PORT,
        reload=False,
        log_level="info",
    )
