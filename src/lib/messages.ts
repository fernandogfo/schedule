import type { Dayjs } from 'dayjs';
import type {
  Category,
  ScheduleEvent,
  ScheduleTimer,
} from '../schemas/schedule';
import type { Occurrence } from './time';
import { formatDurationHuman, formatTimeOfDay } from './time';

interface MessageVariables {
  event: string;
  time: string;
  duration: string;
  remaining: string;
  label: string;
}

function interpolate(template: string, variables: MessageVariables): string {
  const named = template
    .replace(/\$\{(\w+)\}/g, (_, key: string) => variables[key as keyof MessageVariables] ?? '')
    .replace(/\{(\w+)\}/g, (_, key: string) => variables[key as keyof MessageVariables] ?? '');

  return named.replace(/\s+/g, ' ').trim();
}

function legacyInterpolate(template: string, values: string[]): string {
  return template.replace(/\$(\d+)/g, (_, index: string) => values[Number(index)] ?? '');
}

function buildVariables(
  event: ScheduleEvent,
  timer: ScheduleTimer,
  occurrence: Occurrence,
  now: Dayjs,
  leadSeconds?: number,
): MessageVariables {
  const duration = occurrence.durationSeconds
    ? formatDurationHuman(occurrence.durationSeconds)
    : 'now';
  const remainingSeconds =
    leadSeconds !== undefined
      ? leadSeconds
      : Math.max(0, Math.round(occurrence.start.diff(now, 'second', true)));
  const remaining = formatDurationHuman(remainingSeconds);

  return {
    event: event.name,
    time: formatTimeOfDay(occurrence.start, now),
    duration,
    remaining,
    label: timer.label ?? '',
  };
}

export function getStartMessage(
  event: ScheduleEvent,
  category: Category | undefined,
  timer: ScheduleTimer,
  occurrence: Occurrence,
  now: Dayjs,
): string {
  const template =
    timer.messages.start ||
    category?.startMessage ||
    '{event} has started.';
  const variables = buildVariables(event, timer, occurrence, now, 0);
  const legacy = [
    variables.event,
    variables.duration,
    variables.label,
  ];

  return interpolate(legacyInterpolate(template, legacy), variables);
}

export function getReminderMessage(
  event: ScheduleEvent,
  category: Category | undefined,
  timer: ScheduleTimer,
  occurrence: Occurrence,
  now: Dayjs,
  leadSeconds?: number,
): string {
  const template =
    timer.messages.reminder ||
    category?.reminderMessage ||
    '{event} will start in {remaining}.';
  const variables = buildVariables(event, timer, occurrence, now, leadSeconds);
  const legacy = [
    variables.event,
    variables.remaining,
    variables.duration,
    variables.label,
  ];

  return interpolate(legacyInterpolate(template, legacy), variables);
}
