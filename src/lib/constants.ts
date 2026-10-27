export const REGIONS = ['NA', 'EU', 'SEA'] as const;

export type Region = (typeof REGIONS)[number];

export const DAYS = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
] as const;

export type Day = (typeof DAYS)[number];

export const DAY_LABELS: Record<Day, string> = {
  SUNDAY: 'Sunday',
  MONDAY: 'Monday',
  TUESDAY: 'Tuesday',
  WEDNESDAY: 'Wednesday',
  THURSDAY: 'Thursday',
  FRIDAY: 'Friday',
  SATURDAY: 'Saturday',
};

export const DAY_ABBR: Record<Day, string> = {
  SUNDAY: 'S',
  MONDAY: 'M',
  TUESDAY: 'T',
  WEDNESDAY: 'W',
  THURSDAY: 'Th',
  FRIDAY: 'F',
  SATURDAY: 'Sa',
};

export const DEFAULT_TTS = {
  voiceURI: '',
  rate: 1,
  pitch: 1,
  volume: 1,
} as const;

export const DEFAULT_SETTINGS = {
  region: 'NA' as Region,
  showDisabled: false,
  darkMode: false,
  volume: 70,
  cargoServerId: '',
  tts: { ...DEFAULT_TTS },
} as const;

export const STORAGE_KEYS = {
  overrides: 'archeage-schedule.overrides.v1',
  preferences: 'archeage-schedule.preferences.v1',
  alerts: 'archeage-schedule.alerts.v1',
  speak: 'archeage-schedule.speak.v1',
  collapsedCategories: 'archeage-schedule.collapsed-categories.v1',
  panelOrder: 'archeage-schedule.panel-order.v1',
} as const;

export const FALLBACK_DATA_URL = '/data/schedule.json';
