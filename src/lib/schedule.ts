import type { Dayjs } from 'dayjs';
import type {
  Category,
  EventWithTimers,
  ScheduleEvent,
  ScheduleTimer,
} from '../schemas/schedule';
import type { Region } from './constants';
import {
  getActiveOccurrence,
  getNextOccurrence,
  getUpcomingOccurrences,
  type Occurrence,
} from './time';

export interface TimerState {
  timer: ScheduleTimer;
  active: Occurrence | null;
  next: Occurrence | null;
}

export interface EventState {
  event: EventWithTimers;
  timers: TimerState[];
  active: Occurrence | null;
  next: Occurrence | null;
  target: Dayjs | null;
  running: boolean;
}

export function filterTimersByRegion(
  timers: ScheduleTimer[],
  region: Region,
): ScheduleTimer[] {
  return timers.filter((timer) => !timer.region || timer.region === region);
}

export function calculateEventState(
  event: EventWithTimers,
  now: Dayjs,
  region: Region,
): EventState {
  const timers = filterTimersByRegion(event.timers, region).map((timer) => ({
    timer,
    active: getActiveOccurrence(timer, now),
    next: getNextOccurrence(timer, now),
  }));

  const active =
    timers
      .map((state) => state.active)
      .filter((occurrence): occurrence is Occurrence => Boolean(occurrence))
      .sort((left, right) => right.start.valueOf() - left.start.valueOf())[0] ?? null;

  const next =
    timers
      .map((state) => state.next)
      .filter((occurrence): occurrence is Occurrence => Boolean(occurrence))
      .sort((left, right) => left.start.valueOf() - right.start.valueOf())[0] ?? null;

  return {
    event,
    timers,
    active,
    next,
    target: active?.end ?? next?.start ?? null,
    running: Boolean(active && active.durationSeconds > 0),
  };
}

export function calculateEventStates(
  events: EventWithTimers[],
  now: Dayjs,
  region: Region,
  showDisabled: boolean,
): EventState[] {
  return events
    .filter((event) => showDisabled || !event.disabled)
    .map((event) => calculateEventState(event, now, region))
    .sort((left, right) => {
      if (left.running !== right.running) return left.running ? -1 : 1;
      if (left.target && right.target) {
        const difference = left.target.valueOf() - right.target.valueOf();
        if (difference !== 0) return difference;
      } else if (left.target) {
        return -1;
      } else if (right.target) {
        return 1;
      }
      return left.event.name.localeCompare(right.event.name);
    });
}

export function filterFavoriteStates(
  states: EventState[],
  favoriteIds: ReadonlySet<string>,
): EventState[] {
  return states.filter((state) => favoriteIds.has(state.event.id));
}

export function filterActiveStates(states: EventState[]): EventState[] {
  return states.filter((state) => state.running);
}

export function mergeEventsWithTimers(
  events: ScheduleEvent[],
  timers: ScheduleTimer[],
): EventWithTimers[] {
  const timersByEvent = new Map<string, ScheduleTimer[]>();
  timers.forEach((timer) => {
    const list = timersByEvent.get(timer.eventId) ?? [];
    list.push(timer);
    timersByEvent.set(timer.eventId, list);
  });

  return events.map((event) => ({
    ...event,
    timers: timersByEvent.get(event.id) ?? [],
  }));
}

export function getCategory(
  categories: Category[],
  categoryId: string,
): Category | undefined {
  return categories.find((category) => category.id === categoryId);
}

export function getEventUpcomingOccurrences(
  event: EventWithTimers,
  now: Dayjs,
  region: Region,
  limit = 8,
): Occurrence[] {
  return filterTimersByRegion(event.timers, region)
    .flatMap((timer) => getUpcomingOccurrences(timer, now, limit))
    .sort((left, right) => left.start.valueOf() - right.start.valueOf())
    .slice(0, limit);
}

export function getDaysBadge(occurrence: Occurrence | null): string | null {
  if (!occurrence) return null;
  const days = occurrence.timer.days;
  if (days.length === 0 || days.length >= 7) return null;
  return occurrence.day.charAt(0) + occurrence.day.slice(1).toLowerCase();
}

export function getEventDisplayTimer(
  state: EventState,
  preferredTimer?: ScheduleTimer | null,
): ScheduleTimer | null {
  return (
    preferredTimer ??
    state.active?.timer ??
    state.next?.timer ??
    state.timers[0]?.timer ??
    null
  );
}
