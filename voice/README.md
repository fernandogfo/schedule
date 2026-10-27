# Voice Server — XTTS-v2

Local TTS server powered by [Coqui XTTS-v2](https://huggingface.co/coqui/XTTS-v2).  
It generates audio clips for the schedule alerts and caches them so they are never re-generated.

---

## Directory Layout

```
voice/
├── README.md               ← you are here
├── requirements.txt        ← Python dependencies
├── server.py               ← FastAPI server (main entry-point)
├── tts_engine.py           ← XTTS-v2 wrapper + cache logic
├── speaker/
│   └── reference.wav       ← PUT YOUR VOICE REFERENCE FILE HERE
├── cache/                  ← auto-created — generated .wav files live here
└── .env.example            ← copy to .env to customise
```

### Voice Reference File

Place a **6–30 second clean audio clip** at `voice/speaker/reference.mp3` (or `.wav`).  
Requirements:
- **Format**: MP3 or WAV (22 050 Hz or higher, mono or stereo)
- **Content**: Clear speech, no background noise, no music
- **Length**: 6–30 seconds (10–15 s is optimal)

If `reference.mp3` or `reference.wav` is missing, the server falls back to the default XTTS-v2 built-in voice.


---

## Quick-Start

```powershell
cd voice
python -m venv .venv
.venv\Scripts\activate          # Windows
pip install -r requirements.txt # installs coqui-tts (community XTTS-v2 fork)
python server.py
```

Server listens on **http://localhost:8000** by default.

> **GPU (optional):** Edit `requirements.txt`, comment out the plain `torch` lines and
> uncomment the `--index-url https://download.pytorch.org/whl/cu121` variants, then re-run `pip install -r requirements.txt`.

---

## API Reference

### `GET /health`
Returns `{"status": "ok", "model_loaded": true/false}`.

### `POST /speak`
Generate (or retrieve cached) audio.

**Body** (JSON):
```json
{ "text": "Gathering of Heroes will start in 5 minutes.", "language": "en" }
```
**Response**: WAV audio streamed directly.

### `GET /cache` — List cached entries  
### `DELETE /cache` — Wipe cache  
### `POST /pregenerate` — Pre-generate a list of texts (array of strings)

---

## Integration with the Schedule App

Set in a `.env` file at the **project root**:
```
VITE_VOICE_URL=http://localhost:8000
```
