const KEEP_AWAKE_URL = '/assets/audio/keepawake.wav';
const KEEP_AWAKE_VOLUME = 0.1;

let element: HTMLAudioElement | null = null;
let active = false;

export function startKeepAwake(): void {
  active = true;
  if (element) {
    void element.play().catch(() => undefined);
    return;
  }

  const created = new Audio(KEEP_AWAKE_URL);
  created.loop = true;
  created.preload = 'auto';
  created.volume = KEEP_AWAKE_VOLUME;
  created.addEventListener('pause', () => {
    if (active) void created.play().catch(() => undefined);
  });
  element = created;
  void created.play().catch(() => undefined);
}

export function stopKeepAwake(): void {
  active = false;
  if (!element) return;
  element.pause();
  element.src = '';
  element = null;
}
