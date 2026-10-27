import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { describe, expect, it } from 'vitest';
import type { CargoShip } from '../schemas/schedule';
import { getCargoPlan } from './cargo';

dayjs.extend(utc);

const cargoShip: CargoShip = {
  enabled: true,
  defaultServerId: '1',
  ports: { solis: 'Solis', tc: 'Two Crowns' },
  route: [
    {
      id: 'solis',
      text: 'docked in Solis',
      next: 'Depart Solis',
      port: 'solis',
      durationSeconds: 1200,
      reverse: false,
      sailing: false,
    },
    {
      id: 'sail-tc',
      text: 'sailing to Two Crowns',
      next: 'Arrive TC',
      toPort: 'tc',
      durationSeconds: 600,
      reverse: true,
      sailing: true,
    },
    {
      id: 'tc',
      text: 'docked in Two Crowns',
      next: 'Depart TC',
      port: 'tc',
      durationSeconds: 1200,
      reverse: true,
      sailing: false,
    },
    {
      id: 'sail-solis',
      text: 'sailing to Solis',
      next: 'Arrive Solis',
      toPort: 'solis',
      durationSeconds: 600,
      reverse: false,
      sailing: true,
    },
  ],
  alerts: [],
  servers: [
    {
      id: '1',
      name: 'Test',
      region: 'NA',
      unchained: false,
      timer: {
        port: 'solis',
        remainingSeconds: 600,
        updatedAt: '2026-10-26T00:00:00.000Z',
        noLinkedUpdate: false,
      },
    },
  ],
  maintenance: {
    NA: { day: 'THURSDAY', time: '12:00' },
  },
};

describe('cargo plan', () => {
  it('tracks the current step and fast-forwards old updates', () => {
    const now = dayjs.utc('2026-10-26T00:30:00Z');
    const plan = getCargoPlan(cargoShip, cargoShip.servers[0], now);

    expect(plan.current?.step.id).toBe('tc');
    expect(plan.remainingSeconds).toBe(600);
    expect(plan.stale).toBe(false);
    expect(plan.steps).toHaveLength(4);
  });

  it('marks timers older than maintenance as stale', () => {
    const now = dayjs.utc('2026-10-26T00:00:00Z');
    const server = {
      ...cargoShip.servers[0],
      timer: {
        ...cargoShip.servers[0].timer!,
        updatedAt: '2026-10-20T00:00:00.000Z',
      },
    };
    const plan = getCargoPlan(cargoShip, server, now);

    expect(plan.stale).toBe(true);
  });
});
