import dayjs, { type Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { DAYS, type Day } from './constants';
import type { CargoStep, ScheduleSettings, ScheduleTimer } from '../schemas/schedule';

dayjs.extend(utc);

export interface TimeParts {
  hours: number;
  minutes: number;
  seconds: number;
}

export interface Occurrence {
  timer: ScheduleTimer;
  start: Dayjs;
  end: Dayjs;
  day: Day;
  durationSeconds: number;
}

export function parseTime(value: string | undefined | null): TimeParts | null {
  if (!value) return null;
  const match = value.match(/^(\d{1,3}):([0-5]\d)(?::([0-5]\d))?$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = Number(match[3] ?? 0);
  if (hours > 23 || minutes > 59 || seconds > 59) return null;
  return { hours, minutes, seconds };
}

export function durationSeconds(value: string | undefined | null): number {
  if (!value) return 0;
  const match = value.match(/^(\d{1,3}):([0-5]\d)(?::([0-5]\d))?$/);
  if (!match) return 0;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3] ?? 0);
}

export function dayKey(date: Dayjs): Day {
  return DAYS[date.day()];
}

function createOccurrence(timer: ScheduleTimer, start: Dayjs): Occurrence | null {
  const parts = parseTime(timer.time);
  if (!parts) return null;

  const occurrenceStart = start
    .hour(parts.hours)
    .minute(parts.minutes)
    .second(parts.seconds)
    .millisecond(0);
  const day = dayKey(occurrenceStart);

  if (timer.days.length > 0 && !timer.days.includes(day)) return null;

  const length = durationSeconds(timer.duration);
  return {
    timer,
    start: occurrenceStart,
    end: occurrenceStart.add(length, 'second'),
    day,
    durationSeconds: length,
  };
}

export function getOccurrences(
  timer: ScheduleTimer,
  now: Dayjs,
  backDays = 1,
  forwardDays = 8,
): Occurrence[] {
  const today = now.utc().startOf('day');
  const occurrences: Occurrence[] = [];

  for (let offset = -backDays; offset <= forwardDays; offset += 1) {
    const occurrence = createOccurrence(timer, today.add(offset, 'day'));
    if (occurrence) occurrences.push(occurrence);
  }

  return occurrences.sort((left, right) => left.start.valueOf() - right.start.valueOf());
}

export function getNextOccurrence(timer: ScheduleTimer, now: Dayjs): Occurrence | null {
  return (
    getOccurrences(timer, now, 0, 9).find((occurrence) => occurrence.start.isAfter(now)) ??
    null
  );
}

export function getPreviousOccurrence(timer: ScheduleTimer, now: Dayjs): Occurrence | null {
  const occurrences = getOccurrences(timer, now, 2, 0).filter(
    (occurrence) => !occurrence.start.isAfter(now),
  );
  return occurrences.at(-1) ?? null;
}

export function getActiveOccurrence(timer: ScheduleTimer, now: Dayjs): Occurrence | null {
  const active = getOccurrences(timer, now, 2, 0).filter(
    (occurrence) => !occurrence.start.isAfter(now) && occurrence.end.isAfter(now),
  );
  return active.at(-1) ?? null;
}

export function getUpcomingOccurrences(
  timer: ScheduleTimer,
  now: Dayjs,
  limit = 8,
): Occurrence[] {
  return getOccurrences(timer, now, 0, 9)
    .filter((occurrence) => occurrence.start.isAfter(now))
    .slice(0, limit);
}

export function getMostRelevantOccurrence(
  timer: ScheduleTimer,
  now: Dayjs,
): Occurrence | null {
  return getActiveOccurrence(timer, now) ?? getNextOccurrence(timer, now);
}

export function formatCountdown(milliseconds: number): string {
  const totalSeconds = Math.max(0, Math.floor(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) {
    return `${days}:${String(hours).padStart(2, '0')}:${String(minutes).padStart(
      2,
      '0',
    )}:${String(seconds).padStart(2, '0')}`;
  }
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(
      2,
      '0',
    )}`;
  }
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export function formatDurationHuman(totalSeconds: number): string {
  if (totalSeconds <= 0) return '0 seconds';
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.round(totalSeconds % 60);
  const parts: string[] = [];

  if (days) parts.push(`${days} ${days === 1 ? 'day' : 'days'}`);
  if (hours) parts.push(`${hours} ${hours === 1 ? 'hour' : 'hours'}`);
  if (minutes) parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`);
  if (!days && !hours && seconds) {
    parts.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`);
  }

  return parts.join(' ');
}

export function formatTimeOfDay(start: Dayjs, now: Dayjs): string {
  const localStart = start.local();
  const localNow = now.local();
  return localStart.isSame(localNow, 'day')
    ? localStart.format('h:mm A')
    : localStart.format('ddd h:mm A');
}

export function formatDateTime(start: Dayjs): string {
  return start.local().format('ddd h:mm A');
}

export function formatClockTime(start: Dayjs): string {
  return start.local().format('h:mm A');
}

export function getInGameTime(now: Dayjs, settings: ScheduleSettings['inGame']): string {
  const utc = now.utc();
  const realSeconds =
    utc.hour() * 3600 + utc.minute() * 60 + utc.second();
  const cycleSeconds = Math.max(1, settings.cycleHours * 3600);
  const shifted =
    ((realSeconds - settings.offsetHours * 3600 - settings.offsetMinutes * 60) %
      cycleSeconds +
      cycleSeconds) %
    cycleSeconds;
  const secondsPerGameHour = Math.max(1, settings.hourMinutes * 60);
  const hour = Math.floor(shifted / secondsPerGameHour);
  const minute = Math.floor(
    (shifted % secondsPerGameHour) / (secondsPerGameHour / 60),
  );

  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function getMaintenanceStart(
  day: Day,
  time: string | undefined,
  now: Dayjs,
): Dayjs {
  const parsed = parseTime(time ?? '00:00') ?? {
    hours: 0,
    minutes: 0,
    seconds: 0,
  };
  const targetDay = DAYS.indexOf(day);
  let daysBack = (now.utc().day() - targetDay + 7) % 7;
  let candidate = now
    .utc()
    .startOf('day')
    .subtract(daysBack, 'day')
    .hour(parsed.hours)
    .minute(parsed.minutes)
    .second(parsed.seconds)
    .millisecond(0);

  if (candidate.isAfter(now)) {
    candidate = candidate.subtract(7, 'day');
    daysBack += 7;
  }

  return candidate;
}

export interface CargoPlanStep {
  step: CargoStep;
  index: number;
  start: Dayjs;
  end: Dayjs;
}

export interface CargoPlan {
  current: CargoPlanStep | null;
  previous: CargoPlanStep | null;
  steps: CargoPlanStep[];
  remainingSeconds: number;
  progress: number;
  stale: boolean;
  updatedAt: Dayjs | null;
}

export function formatShipDuration(seconds: number): string {
  const safe = Math.max(0, Math.ceil(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
}
