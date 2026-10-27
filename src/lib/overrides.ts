import type {
  CargoServer,
  CargoShip,
  CargoTimer,
  EventWithTimers,
  ScheduleData,
  ScheduleEvent,
} from '../schemas/schedule';
import { mergeCargoServers } from './cargo';

export interface ScheduleOverrides {
  version: 1;
  events: Record<string, EventWithTimers>;
  deletedEventIds: string[];
  cargoServers: Record<string, CargoServer>;
}

export function emptyOverrides(): ScheduleOverrides {
  return {
    version: 1,
    events: {},
    deletedEventIds: [],
    cargoServers: {},
  };
}

export function normalizeOverrides(value: unknown): ScheduleOverrides {
  if (!value || typeof value !== 'object') return emptyOverrides();
  const candidate = value as Partial<ScheduleOverrides>;
  if (candidate.version !== 1) return emptyOverrides();

  return {
    version: 1,
    events:
      candidate.events && typeof candidate.events === 'object'
        ? candidate.events
        : {},
    deletedEventIds: Array.isArray(candidate.deletedEventIds)
      ? candidate.deletedEventIds.filter((id): id is string => typeof id === 'string')
      : [],
    cargoServers:
      candidate.cargoServers && typeof candidate.cargoServers === 'object'
        ? candidate.cargoServers
        : {},
  };
}

export function mergeEvents(
  baseEvents: ScheduleEvent[],
  baseTimers: ScheduleData['timers'],
  overrides: ScheduleOverrides,
): EventWithTimers[] {
  const timersByEvent = new Map<string, ScheduleData['timers']>();
  baseTimers.forEach((timer) => {
    const list = timersByEvent.get(timer.eventId) ?? [];
    list.push(timer);
    timersByEvent.set(timer.eventId, list);
  });

  const deleted = new Set(overrides.deletedEventIds);
  const baseIds = new Set(baseEvents.map((event) => event.id));
  const merged = baseEvents
    .filter((event) => !deleted.has(event.id))
    .map((event) => {
      if (overrides.events[event.id]) return overrides.events[event.id];
      return {
        ...event,
        timers: timersByEvent.get(event.id) ?? [],
      };
    });

  Object.values(overrides.events).forEach((event) => {
    if (!baseIds.has(event.id) && !deleted.has(event.id)) {
      merged.push(event);
    }
  });

  return merged;
}

export function mergeCargo(
  cargoShip: CargoShip,
  overrides: ScheduleOverrides,
): { cargoShip: CargoShip; servers: CargoServer[] } {
  const servers = mergeCargoServers(cargoShip.servers, overrides.cargoServers);
  return {
    cargoShip: {
      ...cargoShip,
      servers,
    },
    servers,
  };
}

export function applyCargoTimer(
  overrides: ScheduleOverrides,
  cargoShip: CargoShip,
  serverId: string,
  timer: CargoTimer,
): ScheduleOverrides {
  const servers = mergeCargoServers(cargoShip.servers, overrides.cargoServers);
  const target = servers.find((server) => server.id === serverId);
  if (!target) return overrides;

  const updated = { ...overrides.cargoServers };
  const linked = !timer.noLinkedUpdate && target.linkedGroup
    ? servers.filter((server) => server.linkedGroup === target.linkedGroup)
    : [target];

  linked.forEach((server) => {
    updated[server.id] = {
      ...server,
      timer: { ...timer },
    };
  });

  return { ...overrides, cargoServers: updated };
}
