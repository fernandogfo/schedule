import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { describe, expect, it } from 'vitest';
import {
  durationSeconds,
  formatCountdown,
  getActiveOccurrence,
  getInGameTime,
  getMaintenanceStart,
  getNextOccurrence,
  parseTime,
} from './time';
import type { ScheduleTimer } from '../schemas/schedule';

dayjs.extend(utc);

function timer(overrides: Partial<ScheduleTimer> = {}): ScheduleTimer {
  return {
    id: 'timer-1',
    eventId: 'event-1',
    time: '11:00:00',
    days: [],
    messages: {},
    ...overrides,
  };
}

describe('time helpers', () => {
  it('parses clocks and durations', () => {
    expect(parseTime('09:30')).toEqual({ hours: 9, minutes: 30, seconds: 0 });
    expect(parseTime('23:59:59')).toEqual({
      hours: 23,
      minutes: 59,
      seconds: 59,
    });
    expect(parseTime('24:00')).toBeNull();
    expect(durationSeconds('01:15:30')).toBe(4530);
  });

  it('finds the next and active UTC occurrence', () => {
    const now = dayjs.utc('2026-10-26T10:00:00Z');
    const next = getNextOccurrence(timer(), now);
    expect(next?.start.toISOString()).toBe('2026-10-26T11:00:00.000Z');

    const active = getActiveOccurrence(
      timer({ time: '09:30:00', duration: '01:00:00' }),
      now,
    );
    expect(active?.start.toISOString()).toBe('2026-10-26T09:30:00.000Z');
  });

  it('respects day filters', () => {
    const now = dayjs.utc('2026-10-26T10:00:00Z');
    const next = getNextOccurrence(timer({ days: ['TUESDAY'] }), now);
    expect(next?.start.toISOString()).toBe('2026-10-27T11:00:00.000Z');
  });

  it('formats long and short countdowns', () => {
    expect(formatCountdown(65_000)).toBe('1:05');
    expect(formatCountdown(3_665_000)).toBe('1:01:05');
    expect(formatCountdown(90_065_000)).toBe('1:01:01:05');
  });

  it('computes the in-game clock and maintenance start', () => {
    const now = dayjs.utc('2026-10-26T00:00:00Z');
    expect(
      getInGameTime(now, {
        offsetHours: 2,
        offsetMinutes: 20,
        cycleHours: 4,
        hourMinutes: 10,
      }),
    ).toBe('10:00');

    expect(getMaintenanceStart('THURSDAY', '12:00', now).toISOString()).toBe(
      '2026-10-22T12:00:00.000Z',
    );
  });
});
