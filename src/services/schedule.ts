import { FALLBACK_DATA_URL } from '../lib/constants';
import { scheduleDataSchema, type ScheduleData } from '../schemas/schedule';

export interface LoadedSchedule {
  data: ScheduleData;
  source: string;
  usedFallback: boolean;
  warning: string | null;
}

export class ScheduleLoadError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ScheduleLoadError';
  }
}

export function getScheduleUrl(): string {
  if (typeof window !== 'undefined') {
    const queryUrl = new URLSearchParams(window.location.search).get('data');
    if (queryUrl) return queryUrl;
  }
  const configured = import.meta.env.VITE_SCHEDULE_URL?.trim();
  return configured || FALLBACK_DATA_URL;
}

async function fetchSchedule(url: string): Promise<ScheduleData> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(url, {
      headers: { Accept: 'application/json' },
      cache: url.startsWith('http') ? 'no-cache' : 'default',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ScheduleLoadError(`Request returned HTTP ${response.status}.`);
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      throw new ScheduleLoadError('The schedule response is not valid JSON.');
    }

    const parsed = scheduleDataSchema.safeParse(payload);
    if (!parsed.success) {
      const details = parsed.error.issues
        .slice(0, 5)
        .map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`)
        .join(' | ');
      throw new ScheduleLoadError(`The schedule data is invalid. ${details}`);
    }

    return parsed.data;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new ScheduleLoadError('The schedule request timed out.');
    }
    if (error instanceof ScheduleLoadError) throw error;
    throw new ScheduleLoadError(
      error instanceof Error ? error.message : 'Failed to load the schedule.',
    );
  } finally {
    window.clearTimeout(timeout);
  }
}

export async function loadSchedule(): Promise<LoadedSchedule> {
  const primaryUrl = getScheduleUrl();

  try {
    return {
      data: await fetchSchedule(primaryUrl),
      source: primaryUrl,
      usedFallback: false,
      warning: null,
    };
  } catch (primaryError) {
    if (primaryUrl === FALLBACK_DATA_URL) {
      throw primaryError;
    }

    try {
      const data = await fetchSchedule(FALLBACK_DATA_URL);
      return {
        data,
        source: FALLBACK_DATA_URL,
        usedFallback: true,
        warning: `Could not load the remote schedule (${primaryError instanceof Error
          ? primaryError.message
          : 'unknown error'}). Using the bundled fallback data.`,
      };
    } catch {
      throw primaryError;
    }
  }
}
