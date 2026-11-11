import dayjs, { type Dayjs } from 'dayjs';
import type { VyravaItem, VyravaSection } from '../schemas/schedule';

export type VyravaTimers = Record<string, string>;

export interface VyravaItemState {
  item: VyravaItem;
  startedAt: Dayjs | null;
  end: Dayjs | null;
  remainingMs: number;
  counting: boolean;
  running: boolean;
}

export function normalizeVyravaTimers(value: unknown): VyravaTimers {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      (entry): entry is [string, string] =>
        entry[0].length > 0 &&
        typeof entry[1] === 'string' &&
        !Number.isNaN(Date.parse(entry[1])),
    ),
  );
}

export function getVyravaItemState(
  section: VyravaSection,
  item: VyravaItem,
  startedAt: string | undefined,
  now: Dayjs,
): VyravaItemState {
  const start =
    startedAt && !Number.isNaN(Date.parse(startedAt))
      ? dayjs(startedAt)
      : null;
  const end = start ? start.add(section.durationSeconds, 'second') : null;
  const remainingMs = end ? Math.max(0, end.diff(now)) : 0;

  return {
    item,
    startedAt: start,
    end,
    remainingMs,
    counting: Boolean(start && end && end.isAfter(now)),
    running: Boolean(start && end && !end.isAfter(now)),
  };
}

export function getVyravaItemStates(
  section: VyravaSection,
  timers: VyravaTimers,
  now: Dayjs,
): VyravaItemState[] {
  return section.items.map((item) =>
    getVyravaItemState(section, item, timers[item.id], now),
  );
}

export function filterRunningVyrava(states: VyravaItemState[]): VyravaItemState[] {
  return states.filter((state) => state.running);
}
