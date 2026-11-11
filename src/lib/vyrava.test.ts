import dayjs from 'dayjs';
import { describe, expect, it } from 'vitest';
import {
  filterRunningVyrava,
  getVyravaItemState,
  getVyravaItemStates,
  getVyravaKey,
  normalizeVyravaTimers,
} from './vyrava';
import { getVyravaReminderMessage, getVyravaStartMessage } from './messages';
import { scheduleDataSchema } from '../schemas/schedule';
import type { VyravaItem, VyravaSection } from '../schemas/schedule';

const items: VyravaItem[] = [
  { id: 'heedmar', name: 'Heedmar', icon: 'castle_siege' },
  { id: 'nuimari', name: 'Nuimari', icon: 'castle_siege' },
  { id: 'calmlands', name: 'Calmlands', icon: 'castle_siege' },
  { id: 'marcala', name: 'Marcala', icon: 'castle_siege' },
];

const section: VyravaSection = {
  enabled: true,
  title: 'Vyrava Auroria',
  icon: 'boss',
  color: '#834bff',
  durationSeconds: 3 * 60 * 60,
  startMessage: undefined,
  reminderMessage: undefined,
  startCueId: undefined,
  reminderCueId: undefined,
  items,
};

describe('normalizeVyravaTimers', () => {
  it('returns an empty record for invalid payloads', () => {
    expect(normalizeVyravaTimers(null)).toEqual({});
    expect(normalizeVyravaTimers([])).toEqual({});
    expect(normalizeVyravaTimers('nope')).toEqual({});
  });

  it('keeps only entries with valid ISO timestamps', () => {
    const timers = normalizeVyravaTimers({
      heedmar: '2026-11-11T10:00:00.000Z',
      nuimari: 'not-a-date',
      '': '2026-11-11T10:00:00.000Z',
      calmlands: 42,
    });

    expect(timers).toEqual({ heedmar: '2026-11-11T10:00:00.000Z' });
  });
});

describe('getVyravaItemState', () => {
  it('is idle when no timer has been started', () => {
    const now = dayjs('2026-11-11T12:00:00Z');
    const state = getVyravaItemState(section, items[0], undefined, now);

    expect(state.startedAt).toBeNull();
    expect(state.end).toBeNull();
    expect(state.remainingMs).toBe(0);
    expect(state.counting).toBe(false);
    expect(state.running).toBe(false);
  });

  it('is idle for an invalid timestamp', () => {
    const now = dayjs('2026-11-11T12:00:00Z');
    const state = getVyravaItemState(section, items[0], 'not-a-date', now);

    expect(state.startedAt).toBeNull();
    expect(state.counting).toBe(false);
    expect(state.running).toBe(false);
  });

  it('counts down while the countdown is running', () => {
    const now = dayjs('2026-11-11T12:00:00Z');
    const startedAt = now.subtract(1, 'hour').toISOString();
    const state = getVyravaItemState(section, items[0], startedAt, now);

    expect(state.counting).toBe(true);
    expect(state.running).toBe(false);
    expect(state.end?.toISOString()).toBe(
      now.subtract(1, 'hour').add(3, 'hour').toISOString(),
    );
    expect(state.remainingMs).toBeCloseTo(2 * 60 * 60 * 1000, -3);
  });

  it('is running exactly when the countdown ends', () => {
    const now = dayjs('2026-11-11T12:00:00Z');
    const startedAt = now.subtract(3, 'hour').toISOString();
    const state = getVyravaItemState(section, items[0], startedAt, now);

    expect(state.counting).toBe(false);
    expect(state.running).toBe(true);
    expect(state.remainingMs).toBe(0);
  });

  it('stays running indefinitely after the countdown ends', () => {
    const now = dayjs('2026-11-11T12:00:00Z');
    const startedAt = now.subtract(9, 'hour').toISOString();
    const state = getVyravaItemState(section, items[0], startedAt, now);

    expect(state.running).toBe(true);
    expect(state.counting).toBe(false);
  });

  it('restarts the countdown from a new startedAt', () => {
    const now = dayjs('2026-11-11T12:00:00Z');
    const restartedAt = now.subtract(10, 'minute').toISOString();
    const state = getVyravaItemState(section, items[0], restartedAt, now);

    expect(state.counting).toBe(true);
    expect(state.remainingMs).toBeCloseTo(
      (3 * 60 - 10) * 60 * 1000,
      -3,
    );
  });
});

describe('getVyravaItemStates', () => {
  it('maps every item and mixes started timers', () => {
    const now = dayjs('2026-11-11T12:00:00Z');
    const states = getVyravaItemStates(
      section,
      {
        heedmar: now.subtract(1, 'hour').toISOString(),
        marcala: now.subtract(4, 'hour').toISOString(),
      },
      now,
    );

    expect(states.map((state) => state.item.id)).toEqual([
      'heedmar',
      'nuimari',
      'calmlands',
      'marcala',
    ]);
    expect(states[0].counting).toBe(true);
    expect(states[1].counting).toBe(false);
    expect(states[1].running).toBe(false);
    expect(states[3].running).toBe(true);
  });
});

describe('getVyravaKey', () => {
  it('builds a unique key per item', () => {
    expect(getVyravaKey('heedmar')).toBe('vyrava:heedmar');
    expect(getVyravaKey('marcala')).toBe('vyrava:marcala');
  });
});

describe('filterRunningVyrava', () => {
  it('keeps only running items', () => {
    const now = dayjs('2026-11-11T12:00:00Z');
    const states = getVyravaItemStates(
      section,
      {
        heedmar: now.subtract(1, 'hour').toISOString(),
        marcala: now.subtract(4, 'hour').toISOString(),
      },
      now,
    );
    const running = filterRunningVyrava(states);

    expect(running.map((state) => state.item.id)).toEqual(['marcala']);
  });
});

describe('vyrava messages', () => {
  it('uses the default templates', () => {
    expect(getVyravaStartMessage(section, items[0])).toBe(
      'The Vyrava is active in Heedmar.',
    );
    expect(getVyravaReminderMessage(section, items[1], 900)).toBe(
      'The Vyrava will be active in Nuimari in 15 minutes.',
    );
  });

  it('interpolates custom templates', () => {
    const custom: VyravaSection = {
      ...section,
      startMessage: '{event}: the Vyrava has spawned ({duration} countdown).',
      reminderMessage: '{event} in {remaining}!',
    };

    expect(getVyravaStartMessage(custom, items[2])).toBe(
      'Calmlands: the Vyrava has spawned (3 hours countdown).',
    );
    expect(getVyravaReminderMessage(custom, items[3], 60)).toBe(
      'Marcala in 1 minute!',
    );
  });
});

describe('schedule data defaults', () => {
  it('falls back to the bundled vyrava section', () => {
    const parsed = scheduleDataSchema.parse({
      version: 1,
      categories: [],
      events: [],
      timers: [],
    });

    expect(parsed.vyrava.enabled).toBe(true);
    expect(parsed.vyrava.title).toBe('Vyrava Auroria');
    expect(parsed.vyrava.durationSeconds).toBe(10_800);
    expect(parsed.vyrava.items.map((item) => item.id)).toEqual([
      'heedmar',
      'nuimari',
      'calmlands',
      'marcala',
    ]);
  });
});
