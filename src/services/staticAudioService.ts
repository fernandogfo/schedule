/**
 * staticAudioService.ts
 *
 * Manages pre-generated voice audio clips served statically from public/assets/audio/voice/
 * This allows the entire schedule app to speak alerts with the cloned XTTS voice
 * without needing the Python server running in real-time.
 */

let manifest: Record<string, string> = {};
let manifestLoaded = false;

let currentAudio: HTMLAudioElement | null = null;
const queue: Array<{ url: string; volume: number; resolve: () => void }> = [];
let isPlaying = false;

/** Load manifest once at app launch. */
export async function loadStaticVoiceManifest(): Promise<Record<string, string>> {
  if (manifestLoaded) return manifest;
  try {
    const res = await fetch('/assets/audio/voice/manifest.json', { cache: 'no-cache' });
    if (res.ok) {
      manifest = (await res.json()) as Record<string, string>;
      manifestLoaded = true;
    }
  } catch {
    // If manifest doesn't exist yet, simply stays empty
  }
  return manifest;
}

export function getStaticClipCount(): number {
  return Object.keys(manifest).length;
}

export function getStaticClipUrl(text: string): string | null {
  const clean = text.trim();
  const relPath = manifest[clean];
  if (!relPath) return null;
  return relPath.startsWith('/') ? relPath : `/${relPath}`;
}

export function hasStaticClip(text: string): boolean {
  return Boolean(manifest[text.trim()]);
}

function processQueue() {
  if (isPlaying || queue.length === 0) return;
  const item = queue.shift();
  if (!item) return;

  isPlaying = true;
  const audio = new Audio(item.url);
  currentAudio = audio;
  audio.volume = Math.max(0, Math.min(1, item.volume));

  const done = () => {
    currentAudio = null;
    isPlaying = false;
    item.resolve();
    processQueue();
  };

  audio.onended = done;
  audio.onerror = done;

  audio.play().catch(() => {
    done();
  });
}

/** Enqueue a static audio clip to play. */
export function playStaticClip(url: string, volume = 1): Promise<void> {
  return new Promise((resolve) => {
    queue.push({ url, volume, resolve });
    processQueue();
  });
}

/** Cancel current playback and clear queue. */
export function stopStaticClips(): void {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  queue.length = 0;
  isPlaying = false;
}
