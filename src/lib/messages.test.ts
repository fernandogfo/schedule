import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { describe, expect, it } from 'vitest';
import type { Category, ScheduleEvent, ScheduleTimer } from '../schemas/schedule';
import type { Occurrence } from './time';
import { getReminderMessage, getStartMessage } from './messages';

dayjs.extend(utc);

const event: ScheduleEvent = {
  id: 'event-1',
  name: 'Test Event',
  categoryId: 'instances',
  icon: 'event',
  disabled: false,
};

const timer: ScheduleTimer = {
  id: 'timer-1',
  eventId: event.id,
  time: '11:00:00',
  duration: '01:00:00',
  days: [],
  messages: {},
};

const start = dayjs.utc('2026-10-26T11:00:00Z');
const occurrence: Occurrence = {
  timer,
  start,
  end: start.add(1, 'hour'),
  day: 'MONDAY',
  durationSeconds: 3600,
};

describe('message interpolation', () => {
  it('uses category messages and named variables', () => {
    const category: Category = {
      id: 'instances',
      name: 'Instances',
      icon: 'instance',
      color: '#f93a2f',
      startMessage: '{event} is now available for {duration}.',
      reminderMessage:
        '{event} will be available in {remaining} for {duration}.',
    };

    expect(
      getStartMessage(event, category, timer, occurrence, start),
    ).toBe('Test Event is now available for 1 hour.');
    expect(
      getReminderMessage(
        event,
        category,
        timer,
        occurrence,
        start.subtract(15, 'minute'),
      ),
    ).toBe('Test Event will be available in 15 minutes for 1 hour.');
  });

  it('translates legacy numbered tokens', () => {
    const legacyTimer: ScheduleTimer = {
      ...timer,
      messages: {
        start: '$0 have spawned.',
        reminder: '$0 will spawn in $1.',
      },
    };

    expect(
      getStartMessage(event, undefined, legacyTimer, occurrence, start),
    ).toBe('Test Event have spawned.');
    expect(
      getReminderMessage(
        event,
        undefined,
        legacyTimer,
        occurrence,
        start.subtract(10, 'minute'),
      ),
    ).toBe('Test Event will spawn in 10 minutes.');
  });

  it('formats reminder phrases matching static audio manifest even with clock jitter', () => {
    const category: Category = {
      id: 'pvp-events',
      name: 'PvP Events',
      icon: 'pvp',
      color: '#e8b600',
      startMessage: '{event} has started.',
      reminderMessage: '{event} will start in {remaining}.',
    };

    // Simulate clock jitter (fired 350ms after the target alert time)
    const nowWithJitter = start.subtract(60, 'second').add(350, 'millisecond');

    // 1 minute before (60s)
    expect(
      getReminderMessage(event, category, timer, occurrence, nowWithJitter, 60),
    ).toBe('Test Event will start in 1 minute.');

    // 7.5 minutes before (450s)
    expect(
      getReminderMessage(event, category, timer, occurrence, nowWithJitter, 450),
    ).toBe('Test Event will start in 7 minutes 30 seconds.');

    // 15 minutes before (900s)
    expect(
      getReminderMessage(event, category, timer, occurrence, nowWithJitter, 900),
    ).toBe('Test Event will start in 15 minutes.');

    // 30 minutes before (1800s)
    expect(
      getReminderMessage(event, category, timer, occurrence, nowWithJitter, 1800),
    ).toBe('Test Event will start in 30 minutes.');
  });
});

