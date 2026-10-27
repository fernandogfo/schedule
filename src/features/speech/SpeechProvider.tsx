import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useSchedule } from '../../state/ScheduleProvider';
import {
  xttsAvailable,
  xttsCancel,
  xttsSpeakAsync,
} from '../../services/xttsService';
import {
  getStaticClipCount,
  getStaticClipUrl,
  loadStaticVoiceManifest,
  playStaticClip,
  stopStaticClips,
} from '../../services/staticAudioService';

export interface SpeechContextValue {
  supported: boolean;
  /** True when the XTTS server is the active backend. */
  xttsActive: boolean;
  /** Number of offline pre-generated voice clips available. */
  staticClipsCount: number;
  voices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  speak: (text: string, interrupt?: boolean) => boolean;
  cancel: () => void;
}

const SpeechContext = createContext<SpeechContextValue | null>(null);

export function useSpeech(): SpeechContextValue {
  const context = useContext(SpeechContext);
  if (!context) throw new Error('useSpeech must be used inside SpeechProvider.');
  return context;
}

function applyPronunciations(
  text: string,
  pronunciations: Record<string, string>,
): string {
  return Object.entries(pronunciations).reduce((result, [word, replacement]) => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return result.replace(new RegExp(`\\b${escaped}\\b`, 'gi'), replacement);
  }, text);
}

export function SpeechProvider({ children }: { children: ReactNode }) {
  const { data, preferences } = useSchedule();
  const browserSupported =
    typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [staticClipsCount, setStaticClipsCount] = useState<number>(() => getStaticClipCount());
  const tts = preferences.tts;
  const pronunciations = useMemo(
    () => data?.pronunciations ?? {},
    [data?.pronunciations],
  );

  // Load static voice clips manifest once at mount
  useEffect(() => {
    void loadStaticVoiceManifest().then(() => {
      setStaticClipsCount(getStaticClipCount());
    });
  }, []);

  // XTTS server is an optional online fallback
  const xttsActive = xttsAvailable;

  // supported = pre-generated static audio is available OR XTTS server OR browser speech
  const supported = staticClipsCount > 0 || xttsActive || browserSupported;

  useEffect(() => {
    if (!browserSupported) return;

    const loadVoices = () => {
      const next = window.speechSynthesis.getVoices();
      setVoices(next);
    };

    loadVoices();
    window.speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, [browserSupported]);

  const selectedVoice = useMemo(() => {
    const available = voices;
    if (available.length === 0) return null;
    if (tts.voiceURI) {
      const chosen = available.find((voice) => voice.voiceURI === tts.voiceURI);
      if (chosen) return chosen;
    }

    const language = typeof navigator !== 'undefined' ? navigator.language : 'en';
    const languagePrefix = language.split('-')[0];
    return (
      available.find(
        (voice) =>
          voice.lang.toLowerCase() === language.toLowerCase() &&
          (voice.name.includes('Google') || voice.name.includes('Microsoft')),
      ) ??
      available.find((voice) => voice.lang.toLowerCase().startsWith(languagePrefix)) ??
      available[0] ??
      null
    );
  }, [tts.voiceURI, voices]);

  const cancel = useCallback(() => {
    stopStaticClips();
    if (xttsActive) {
      xttsCancel();
    } else if (browserSupported) {
      window.speechSynthesis.cancel();
    }
  }, [xttsActive, browserSupported]);

  const speakBrowser = useCallback(
    (textToSpeak: string, interrupt = false): boolean => {
      if (!browserSupported) return false;
      if (interrupt) cancel();

      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      const voice = selectedVoice;
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else if (typeof navigator !== 'undefined') {
        utterance.lang = navigator.language;
      }
      utterance.rate = tts.rate;
      utterance.pitch = tts.pitch;
      utterance.volume = tts.volume;

      try {
        window.speechSynthesis.speak(utterance);
        window.speechSynthesis.resume();
        return true;
      } catch {
        return false;
      }
    },
    [browserSupported, cancel, selectedVoice, tts.pitch, tts.rate, tts.volume],
  );

  const speak = useCallback(
    (text: string, interrupt = false) => {
      const finalText = applyPronunciations(text, pronunciations);
      if (!finalText.trim()) return false;

      // ── Priority 1: Pre-generated static voice clip ────────────────────────
      const staticUrl = getStaticClipUrl(finalText) ?? getStaticClipUrl(text);
      if (staticUrl) {
        if (interrupt) cancel();
        void playStaticClip(staticUrl, tts.volume);
        return true;
      }

      // ── Priority 2: XTTS server (if running) ───────────────────────────────
      if (xttsActive) {
        if (interrupt) cancel();
        void xttsSpeakAsync(finalText, 'en').then((success) => {
          if (!success) {
            // Fallback to browser synthesis if XTTS fails or server is offline
            speakBrowser(finalText, false);
          }
        });
        return true;
      }

      // ── Priority 3: Browser SpeechSynthesis fallback ───────────────────────
      return speakBrowser(finalText, interrupt);
    },
    [applyPronunciations, cancel, pronunciations, speakBrowser, tts.volume, xttsActive],
  );

  const value = useMemo<SpeechContextValue>(
    () => ({
      supported,
      xttsActive,
      staticClipsCount,
      voices,
      selectedVoice,
      speak,
      cancel,
    }),
    [cancel, selectedVoice, speak, staticClipsCount, supported, voices, xttsActive],
  );

  return <SpeechContext.Provider value={value}>{children}</SpeechContext.Provider>;
}
