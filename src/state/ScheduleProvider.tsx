import dayjs, { type Dayjs } from 'dayjs';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type {
  CargoServer,
  CargoShip,
  CargoTimer,
  EventWithTimers,
  ScheduleData,
} from '../schemas/schedule';
import { DEFAULT_SETTINGS, REGIONS, STORAGE_KEYS, type Region } from '../lib/constants';
import {
  normalizeLayoutColumns,
  normalizePanelLayout,
  type PanelLayout,
} from '../lib/layout';
import {
  applyCargoTimer,
  emptyOverrides,
  mergeCargo,
  mergeEvents,
  normalizeOverrides,
  type ScheduleOverrides,
} from '../lib/overrides';
import { loadSchedule } from '../services/schedule';
import { usePersistentState } from './usePersistentState';

export interface TtsPreferences {
  voiceURI: string;
  rate: number;
  pitch: number;
  volume: number;
}

export interface Preferences {
  region: Region;
  showDisabled: boolean;
  darkMode: boolean;
  volume: number;
  cargoServerId: string;
  layoutColumns: number;
  panelLayout: PanelLayout;
  tts: TtsPreferences;
}

export type AlertSelections = Record<string, string[]>;
export type SpeakSelections = Record<string, boolean>;

const defaultPreferences = (): Preferences => ({
  ...DEFAULT_SETTINGS,
  layoutColumns: 4,
  panelLayout: [],
  tts: { ...DEFAULT_SETTINGS.tts },
});

function normalizePreferences(value: unknown): Preferences {
  const fallback = defaultPreferences();
  if (!value || typeof value !== 'object') return fallback;
  const candidate = value as Partial<Preferences>;
  const tts =
    candidate.tts && typeof candidate.tts === 'object'
      ? candidate.tts
      : fallback.tts;

  return {
    region: REGIONS.includes(candidate.region as Region)
      ? (candidate.region as Region)
      : fallback.region,
    showDisabled:
      typeof candidate.showDisabled === 'boolean'
        ? candidate.showDisabled
        : fallback.showDisabled,
    darkMode:
      typeof candidate.darkMode === 'boolean'
        ? candidate.darkMode
        : fallback.darkMode,
    volume:
      typeof candidate.volume === 'number' && Number.isFinite(candidate.volume)
        ? Math.min(100, Math.max(0, candidate.volume))
        : fallback.volume,
    cargoServerId:
      typeof candidate.cargoServerId === 'string'
        ? candidate.cargoServerId
        : fallback.cargoServerId,
    layoutColumns:
      candidate.layoutColumns === undefined
        ? fallback.layoutColumns
        : normalizeLayoutColumns(candidate.layoutColumns),
    panelLayout: normalizeStoredPanelLayout(candidate.panelLayout),
    tts: {
      voiceURI: typeof tts.voiceURI === 'string' ? tts.voiceURI : fallback.tts.voiceURI,
      rate:
        typeof tts.rate === 'number' && Number.isFinite(tts.rate)
          ? Math.min(2, Math.max(0.5, tts.rate))
          : fallback.tts.rate,
      pitch:
        typeof tts.pitch === 'number' && Number.isFinite(tts.pitch)
          ? Math.min(2, Math.max(0, tts.pitch))
          : fallback.tts.pitch,
      volume:
        typeof tts.volume === 'number' && Number.isFinite(tts.volume)
          ? Math.min(1, Math.max(0, tts.volume))
          : fallback.tts.volume,
    },
  };
}

function readLegacyPanelOrder(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.panelOrder);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed)
      ? [
          ...new Set(
            parsed.filter((key): key is string => typeof key === 'string'),
          ),
        ]
      : [];
  } catch {
    return [];
  }
}

function normalizeStoredPanelLayout(value: unknown): PanelLayout {
  if (Array.isArray(value)) return normalizePanelLayout(value);
  const legacy = readLegacyPanelOrder();
  return legacy.length > 0 ? [legacy] : [];
}

function normalizeStringArrayMap(value: unknown): Record<string, string[]> {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([, list]) => Array.isArray(list))
      .map(([key, list]) => [
        key,
        (list as unknown[]).filter((item): item is string => typeof item === 'string'),
      ])
      .filter(([, list]) => list.length > 0),
  );
}

function normalizeBooleanMap(value: unknown): Record<string, boolean> {
  if (!value || typeof value !== 'object') return {};
  return Object.fromEntries(
    Object.entries(value).filter(([, enabled]) => typeof enabled === 'boolean'),
  ) as Record<string, boolean>;
}

function useNow(interval = 1000): Dayjs {
  const [now, setNow] = useState<Dayjs>(() => dayjs());

  useEffect(() => {
    const tick = () => setNow(dayjs());
    const timer = window.setInterval(tick, interval);
    const onVisibility = () => tick();
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onVisibility);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onVisibility);
    };
  }, [interval]);

  return now;
}

export interface ScheduleContextValue {
  data: ScheduleData | null;
  events: EventWithTimers[];
  cargoShip: CargoShip | null;
  cargoServers: CargoServer[];
  now: Dayjs;
  loading: boolean;
  error: string | null;
  warning: string | null;
  source: string;
  reload: () => Promise<void>;
  dismissWarning: () => void;
  preferences: Preferences;
  setPreferences: Dispatch<SetStateAction<Preferences>>;
  resetPreferences: () => void;
  overrides: ScheduleOverrides;
  saveEvent: (event: EventWithTimers) => void;
  deleteEvent: (eventId: string) => void;
  restoreEvent: (eventId: string) => void;
  isEventOverridden: (eventId: string) => boolean;
  resetOverrides: () => void;
  saveCargoTimer: (serverId: string, timer: CargoTimer) => void;
  alertSelections: AlertSelections;
  speakSelections: SpeakSelections;
  toggleAlert: (key: string, optionId: string) => void;
  clearAlerts: (key: string) => void;
  setSpeaking: (key: string, enabled: boolean) => void;
}

const ScheduleContext = createContext<ScheduleContextValue | null>(null);

export function useSchedule(): ScheduleContextValue {
  const context = useContext(ScheduleContext);
  if (!context) {
    throw new Error('useSchedule must be used inside ScheduleProvider.');
  }
  return context;
}

export function ScheduleProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [source, setSource] = useState('');
  const [preferences, setPreferences, resetPreferencesState] =
    usePersistentState<Preferences>(
      STORAGE_KEYS.preferences,
      defaultPreferences(),
      normalizePreferences,
    );
  const [overrides, setOverrides, resetOverridesState] =
    usePersistentState<ScheduleOverrides>(
      STORAGE_KEYS.overrides,
      emptyOverrides(),
      normalizeOverrides,
    );
  const [alertSelections, setAlertSelections, resetAlertSelections] =
    usePersistentState<AlertSelections>(
      STORAGE_KEYS.alerts,
      {},
      normalizeStringArrayMap,
    );
  const [speakSelections, setSpeakSelections, resetSpeakSelections] =
    usePersistentState<SpeakSelections>(
      STORAGE_KEYS.speak,
      {},
      normalizeBooleanMap,
    );
  const requestId = useRef(0);
  const hasData = useRef(false);
  const now = useNow();

  const load = useCallback(async (background = false) => {
    const id = requestId.current + 1;
    requestId.current = id;
    if (!background) setLoading(true);

    try {
      const loaded = await loadSchedule();
      if (requestId.current !== id) return;
      hasData.current = true;
      setData(loaded.data);
      setSource(loaded.source);
      setWarning(loaded.warning);
      setError(null);
    } catch (loadError) {
      if (requestId.current !== id) return;
      const message =
        loadError instanceof Error ? loadError.message : 'Failed to load the schedule.';
      if (hasData.current) {
        setWarning(`Refresh failed. Showing the last loaded schedule. ${message}`);
      } else {
        setError(message);
      }
    } finally {
      if (requestId.current === id) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!data) return;
    const interval = window.setInterval(
      () => void load(true),
      Math.max(1, data.settings.refreshMinutes) * 60_000,
    );
    return () => window.clearInterval(interval);
  }, [data, load]);

  useEffect(() => {
    if (!data) return;
    const servers = data.cargoShip.servers;
    if (servers.length === 0) return;
    if (!servers.some((server) => server.id === preferences.cargoServerId)) {
      setPreferences((current) => ({
        ...current,
        cargoServerId: data.cargoShip.defaultServerId ?? servers[0].id,
      }));
    }
  }, [data, preferences.cargoServerId, setPreferences]);

  const events = useMemo(
    () => (data ? mergeEvents(data.events, data.timers, overrides) : []),
    [data, overrides],
  );

  const cargo = useMemo(
    () =>
      data
        ? mergeCargo(data.cargoShip, overrides)
        : { cargoShip: null, servers: [] },
    [data, overrides],
  );

  const reload = useCallback(async () => {
    await load();
  }, [load]);

  const saveEvent = useCallback((event: EventWithTimers) => {
    setOverrides((current) => ({
      ...current,
      events: {
        ...current.events,
        [event.id]: {
          ...event,
          timers: event.timers.map((timer) => ({ ...timer })),
        },
      },
      deletedEventIds: current.deletedEventIds.filter((id) => id !== event.id),
    }));
  }, [setOverrides]);

  const deleteEvent = useCallback((eventId: string) => {
    setOverrides((current) => {
      const nextEvents = { ...current.events };
      delete nextEvents[eventId];
      return {
        ...current,
        events: nextEvents,
        deletedEventIds: Array.from(new Set([...current.deletedEventIds, eventId])),
      };
    });
  }, [setOverrides]);

  const restoreEvent = useCallback((eventId: string) => {
    setOverrides((current) => {
      const nextEvents = { ...current.events };
      delete nextEvents[eventId];
      return {
        ...current,
        events: nextEvents,
        deletedEventIds: current.deletedEventIds.filter((id) => id !== eventId),
      };
    });
  }, [setOverrides]);

  const isEventOverridden = useCallback(
    (eventId: string) =>
      Boolean(overrides.events[eventId]) ||
      overrides.deletedEventIds.includes(eventId),
    [overrides],
  );

  const resetOverrides = useCallback(() => {
    resetOverridesState();
  }, [resetOverridesState]);

  const saveCargoTimer = useCallback(
    (serverId: string, timer: CargoTimer) => {
      if (!data) return;
      setOverrides((current) =>
        applyCargoTimer(current, data.cargoShip, serverId, timer),
      );
    },
    [data, setOverrides],
  );

  const toggleAlert = useCallback(
    (key: string, optionId: string) => {
      setAlertSelections((current) => {
        const selected = current[key] ?? [];
        const next = selected.includes(optionId)
          ? selected.filter((id) => id !== optionId)
          : [...selected, optionId];
        const updated = { ...current };
        if (next.length > 0) updated[key] = next;
        else delete updated[key];
        return updated;
      });
    },
    [setAlertSelections],
  );

  const clearAlerts = useCallback(
    (key: string) => {
      setAlertSelections((current) => {
        if (!current[key]) return current;
        const updated = { ...current };
        delete updated[key];
        return updated;
      });
    },
    [setAlertSelections],
  );

  const setSpeaking = useCallback(
    (key: string, enabled: boolean) => {
      setSpeakSelections((current) => {
        if (!enabled) {
          if (!current[key]) return current;
          const updated = { ...current };
          delete updated[key];
          return updated;
        }
        return { ...current, [key]: true };
      });
    },
    [setSpeakSelections],
  );

  const resetPreferences = useCallback(() => {
    resetPreferencesState();
    resetAlertSelections();
    resetSpeakSelections();
    try {
      window.localStorage.removeItem(STORAGE_KEYS.panelOrder);
    } catch {
      // Storage can be unavailable in private browsing or when the quota is full.
    }
  }, [resetAlertSelections, resetPreferencesState, resetSpeakSelections]);

  const value = useMemo<ScheduleContextValue>(
    () => ({
      data,
      events,
      cargoShip: cargo.cargoShip,
      cargoServers: cargo.servers,
      now,
      loading,
      error,
      warning,
      source,
      reload,
      dismissWarning: () => setWarning(null),
      preferences,
      setPreferences,
      resetPreferences,
      overrides,
      saveEvent,
      deleteEvent,
      restoreEvent,
      isEventOverridden,
      resetOverrides,
      saveCargoTimer,
      alertSelections,
      speakSelections,
      toggleAlert,
      clearAlerts,
      setSpeaking,
    }),
    [
      alertSelections,
      cargo,
      clearAlerts,
      data,
      deleteEvent,
      error,
      events,
      isEventOverridden,
      loading,
      now,
      overrides,
      preferences,
      reload,
      resetOverrides,
      resetPreferences,
      restoreEvent,
      saveCargoTimer,
      saveEvent,
      setPreferences,
      setSpeaking,
      source,
      speakSelections,
      toggleAlert,
      warning,
    ],
  );

  return (
    <ScheduleContext.Provider value={value}>{children}</ScheduleContext.Provider>
  );
}
