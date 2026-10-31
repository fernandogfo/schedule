import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { describe, expect, it } from 'vitest';
import {
  calculateEventState,
  filterActiveStates,
  filterFavoriteStates,
} from './schedule';
import type { EventWithTimers, ScheduleTimer } from '../schemas/schedule';

dayjs.extend(utc);

function event(
  id: string,
  timers: ScheduleTimer[],
): EventWithTimers {
  return {
    id,
    name: id,
    categoryId: 'category-1',
    icon: 'event',
    disabled: false,
    timers,
  };
}

function timer(
  id: string,
  eventId: string,
  overrides: Partial<ScheduleTimer> = {},
): ScheduleTimer {
  return {
    id,
    eventId,
    time: '11:00:00',
    days: [],
    messages: {},
    ...overrides,
  };
}

describe('event state filters', () => {
  const now = dayjs.utc('2026-10-26T10:00:00Z');
  const running = calculateEventState(
    event('running', [
      timer('timer-1', 'running', { time: '09:30:00', duration: '01:00:00' }),
    ]),
    now,
    'NA',
  );
  const upcoming = calculateEventState(
    event('upcoming', [timer('timer-2', 'upcoming')]),
    now,
    'NA',
  );

  it('keeps only favorite events', () => {
    const states = [running, upcoming];
    expect(filterFavoriteStates(states, new Set(['upcoming']))).toEqual([
      upcoming,
    ]);
    expect(filterFavoriteStates(states, new Set())).toEqual([]);
  });

  it('keeps only events with an active duration', () => {
    expect(filterActiveStates([running, upcoming])).toEqual([running]);
    expect(filterActiveStates([upcoming])).toEqual([]);
  });
});
