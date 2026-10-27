import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useSchedule } from '../../state/ScheduleProvider';

export interface AudioContextValue {
  unlocked: boolean | null;
  playCue: (cueId: string) => void;
  testAudio: () => void;
}

const AudioContext = createContext<AudioContextValue | null>(null);

export function useAudioCues(): AudioContextValue {
  const context = useContext(AudioContext);
  if (!context) {
    throw new Error('useAudioCues must be used inside AudioProvider.');
  }
  return context;
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const { data, preferences } = useSchedule();
  const cues = useMemo(() => data?.cues ?? [], [data?.cues]);
  const audioRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const [unlocked, setUnlocked] = useState<boolean | null>(null);
  const volume = Math.min(1, Math.max(0, preferences.volume / 100));

  useEffect(() => {
    const map = audioRef.current;
    cues.forEach((cue) => {
      if (!map.has(cue.id)) {
        const audio = new Audio(cue.file);
        audio.preload = 'auto';
        map.set(cue.id, audio);
      }
    });

    return () => {
      map.forEach((audio) => {
        audio.pause();
        audio.src = '';
      });
      map.clear();
    };
  }, [cues]);

  useEffect(() => {
    audioRef.current.forEach((audio) => {
      audio.volume = volume;
    });
  }, [volume]);

  const playCue = useCallback(
    (cueId: string) => {
      const cue = cues.find((item) => item.id === cueId) ?? cues[0];
      if (!cue) return;
      let audio = audioRef.current.get(cue.id);
      if (!audio) {
        audio = new Audio(cue.file);
        audio.preload = 'auto';
        audioRef.current.set(cue.id, audio);
      }

      audio.pause();
      audio.currentTime = 0;
      audio.volume = volume;
      void audio
        .play()
        .then(() => setUnlocked(true))
        .catch(() => setUnlocked(false));
    },
    [cues, volume],
  );

  useEffect(() => {
    if (unlocked !== false) return;

    const retry = () => playCue('test');
    window.addEventListener('click', retry, { once: true });
    return () => window.removeEventListener('click', retry);
  }, [playCue, unlocked]);

  const testAudio = useCallback(() => {
    playCue('test');
  }, [playCue]);

  const value = useMemo<AudioContextValue>(
    () => ({ unlocked, playCue, testAudio }),
    [playCue, testAudio, unlocked],
  );

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>;
}
