import dayjs, { type Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import type {
  CargoAlert,
  CargoServer,
  CargoShip,
  CargoTimer,
} from '../schemas/schedule';
import { getMaintenanceStart, type CargoPlan, type CargoPlanStep } from './time';

dayjs.extend(utc);

export interface CargoPlanDisplay {
  plan: CargoPlan;
  server: CargoServer;
}

export function getServer(
  cargoShip: CargoShip,
  serverId: string | undefined,
): CargoServer | undefined {
  if (!serverId) return cargoShip.servers[0];
  return cargoShip.servers.find((server) => server.id === serverId);
}

export function getCargoPlan(
  cargoShip: CargoShip,
  server: CargoServer | undefined,
  now: Dayjs,
): CargoPlan {
  const empty: CargoPlan = {
    current: null,
    previous: null,
    steps: [],
    remainingSeconds: 0,
    progress: 0,
    stale: true,
    updatedAt: null,
  };

  if (!server?.timer || cargoShip.route.length === 0) return empty;

  const timer = server.timer;
  const route = cargoShip.route;
  const startIndex = route.findIndex((step) => step.port === timer.port);
  if (startIndex < 0) return empty;

  const maintenance = cargoShip.maintenance[server.region];
  const lastMaintenance = maintenance
    ? getMaintenanceStart(maintenance.day, maintenance.time, now)
    : null;
  const updatedAt = dayjs(timer.updatedAt).utc();
  const stale = Boolean(lastMaintenance && updatedAt.isBefore(lastMaintenance));

  let stepIndex = startIndex;
  let stepStart = updatedAt;
  let stepEnd = updatedAt.add(timer.remainingSeconds, 'second');
  let safety = 0;

  while (!stepEnd.isAfter(now) && safety < 1000) {
    stepIndex = (stepIndex + 1) % route.length;
    const step = route[stepIndex];
    stepStart = stepEnd;
    stepEnd = stepStart.add(step.durationSeconds, 'second');
    safety += 1;
  }

  const current: CargoPlanStep = {
    step: route[stepIndex],
    index: stepIndex,
    start: stepStart,
    end: stepEnd,
  };

  const previousIndex = (stepIndex - 1 + route.length) % route.length;
  const previous: CargoPlanStep = {
    step: route[previousIndex],
    index: previousIndex,
    start: stepStart.subtract(route[previousIndex].durationSeconds, 'second'),
    end: stepStart,
  };

  const steps: CargoPlanStep[] = [current];
  for (let index = 1; index < route.length; index += 1) {
    const nextIndex = (stepIndex + index) % route.length;
    const previousStep = steps[steps.length - 1];
    steps.push({
      step: route[nextIndex],
      index: nextIndex,
      start: previousStep.end,
      end: previousStep.end.add(route[nextIndex].durationSeconds, 'second'),
    });
  }

  const total = Math.max(1, current.end.diff(current.start, 'second', true));
  const elapsed = now.diff(current.start, 'second', true);
  const progress = Math.min(1, Math.max(0, elapsed / total));

  return {
    current,
    previous,
    steps,
    remainingSeconds: Math.max(0, current.end.diff(now, 'second', true)),
    progress,
    stale,
    updatedAt,
  };
}

export function getCargoTargetTime(
  alert: CargoAlert,
  step: CargoPlanStep,
): Dayjs {
  return alert.trigger === 'start'
    ? step.start.add(alert.offsetSeconds, 'second')
    : step.end.add(alert.offsetSeconds, 'second');
}

export function createCargoTimer(
  port: string,
  minutes: number,
  seconds: number,
  noLinkedUpdate: boolean,
  now: Dayjs,
): CargoTimer {
  return {
    port,
    remainingSeconds: Math.max(0, minutes * 60 + seconds),
    updatedAt: now.utc().toISOString(),
    noLinkedUpdate,
  };
}

export function mergeCargoServers(
  servers: CargoServer[],
  overrides: Record<string, CargoServer>,
): CargoServer[] {
  return servers.map((server) => overrides[server.id] ?? server);
}

export function getSelectedCargoServer(
  cargoShip: CargoShip,
  overrideServers: Record<string, CargoServer>,
  serverId: string | undefined,
): CargoServer | undefined {
  const servers = mergeCargoServers(cargoShip.servers, overrideServers);
  return getServer({ ...cargoShip, servers }, serverId);
}

export function getCargoShipPosition(plan: CargoPlan): {
  reverse: boolean;
  progress: number;
  docked: boolean;
} {
  const step = plan.current?.step;
  if (!step) return { reverse: false, progress: 0, docked: false };
  return {
    reverse: step.reverse,
    progress: step.sailing ? plan.progress : 0,
    docked: Boolean(step.port),
  };
}
