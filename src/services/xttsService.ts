/**
 * xttsService.ts
 *
 * Thin client for the local XTTS-v2 voice server (voice/server.py).
 *
 * The server URL is read from the env variable VITE_VOICE_URL.
 * If the variable is not set the service is disabled and the app falls back
 * to the browser's built-in SpeechSynthesis.
 */

const VOICE_URL = (import.meta.env.VITE_VOICE_URL as string | undefined)?.replace(/\/$/, '') ?? '';

export const xttsAvailable = Boolean(VOICE_URL);

/** In-flight requests keyed by text so we never send duplicates in parallel. */
const inflight = new Map<string, Promise<Blob | null>>();

/**
 * Fetches (or returns cached blob) audio for `text` from the XTTS server.
 * Returns `null` if the server is unavailable or an error occurs.
 */
async function fetchAudio(text: string, language = 'en'): Promise<Blob | null> {
  const existing = inflight.get(text);
  if (existing) return existing;

  const promise = (async (): Promise<Blob | null> => {
    try {
      const response = await fetch(`${VOICE_URL}/speak`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, language }),
        signal: AbortSignal.timeout(30_000),
      });

      if (!response.ok) {
        console.warn('[XTTS] Server returned', response.status, 'for:', text.slice(0, 60));
        return null;
      }

      return await response.blob();
    } catch (err) {
      console.warn('[XTTS] Request failed:', err);
      return null;
    } finally {
      inflight.delete(text);
    }
  })();

  inflight.set(text, promise);
  return promise;
}

// ---------------------------------------------------------------------------
// Audio playback queue — play one clip at a time, queue the rest
// ---------------------------------------------------------------------------
let currentAudio: HTMLAudioElement | null = null;
const playQueue: Array<{ blob: Blob; resolve: () => void }> = [];
let isPlaying = false;

function processQueue() {
  if (isPlaying || playQueue.length === 0) return;

  const item = playQueue.shift()!;
  isPlaying = true;

  const url = URL.createObjectURL(item.blob);
  const audio = new Audio(url);
  currentAudio = audio;

  audio.onended = () => {
    URL.revokeObjectURL(url);
    currentAudio = null;
    isPlaying = false;
    item.resolve();
    processQueue();
  };

  audio.onerror = () => {
    URL.revokeObjectURL(url);
    currentAudio = null;
    isPlaying = false;
    item.resolve();
    processQueue();
  };

  audio.play().catch(() => {
    URL.revokeObjectURL(url);
    currentAudio = null;
    isPlaying = false;
    item.resolve();
    processQueue();
  });
}

/** Enqueue a blob for sequential playback. */
function enqueueBlob(blob: Blob): Promise<void> {
  return new Promise((resolve) => {
    playQueue.push({ blob, resolve });
    processQueue();
  });
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Synthesise `text` via the XTTS server and play the resulting audio.
 * If the server is not available this is a no-op and returns `false`.
 */
export async function xttsSpeakAsync(text: string, language = 'en'): Promise<boolean> {
  if (!xttsAvailable) return false;
  const blob = await fetchAudio(text, language);
  if (!blob) return false;
  await enqueueBlob(blob);
  return true;
}

/** Stop any currently playing XTTS audio and empty the queue. */
export function xttsCancel(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  playQueue.length = 0;
  isPlaying = false;
}

/** Check if the XTTS server is reachable and the model is loaded. */
export async function xttsCheckHealth(): Promise<{ ok: boolean; modelLoaded: boolean }> {
  if (!xttsAvailable) return { ok: false, modelLoaded: false };
  try {
    const res = await fetch(`${VOICE_URL}/health`, { signal: AbortSignal.timeout(5_000) });
    if (!res.ok) return { ok: false, modelLoaded: false };
    const json = (await res.json()) as { status: string; model_loaded: boolean };
    return { ok: json.status === 'ok', modelLoaded: json.model_loaded };
  } catch {
    return { ok: false, modelLoaded: false };
  }
}

/**
 * Pre-warm the cache by asking the server to generate audio for a list of texts.
 * Runs in the background — does not block.
 */
export function xttsPregenerateAsync(texts: string[], language = 'en'): void {
  if (!xttsAvailable || texts.length === 0) return;
  fetch(`${VOICE_URL}/pregenerate?language=${language}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(texts),
  }).catch(() => { /* silent — best-effort */ });
}
