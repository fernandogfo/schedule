import { describe, expect, it } from 'vitest';
import type { CargoServer, CargoShip, CargoTimer } from '../schemas/schedule';
import {
  applyCargoTimer,
  emptyOverrides,
  mergeEvents,
} from './overrides';

function server(id: string, linkedGroup?: string): CargoServer {
  return {
    id,
    name: `Server ${id}`,
    region: 'NA',
    unchained: false,
    linkedGroup,
  };
}

const cargoShip: CargoShip = {
  enabled: true,
  defaultServerId: '1',
  ports: { solis: 'Solis' },
  route: [],
  alerts: [],
  servers: [server('1', 'na'), server('2', 'na'), server('3', 'eu')],
  maintenance: {},
};

const timer: CargoTimer = {
  port: 'solis',
  remainingSeconds: 600,
  updatedAt: '2026-10-26T00:00:00.000Z',
  noLinkedUpdate: false,
};

describe('local overrides', () => {
  it('updates linked cargo realms unless disabled', () => {
    const linked = applyCargoTimer(
      emptyOverrides(),
      cargoShip,
      '1',
      timer,
    );
    expect(Object.keys(linked.cargoServers).sort()).toEqual(['1', '2']);

    const isolated = applyCargoTimer(
      emptyOverrides(),
      cargoShip,
      '1',
      { ...timer, noLinkedUpdate: true },
    );
    expect(Object.keys(isolated.cargoServers)).toEqual(['1']);
  });

  it('merges deleted and edited events', () => {
    const events = [
      {
        id: 'event-1',
        name: 'One',
        categoryId: 'instances',
        icon: 'event',
        disabled: false,
      },
      {
        id: 'event-2',
        name: 'Two',
        categoryId: 'instances',
        icon: 'event',
        disabled: false,
      },
    ];
    const timers = [
      {
        id: 'timer-2',
        eventId: 'event-2',
        time: '12:00:00',
        days: [],
        messages: {},
      },
    ];

    const merged = mergeEvents(events, timers, {
      ...emptyOverrides(),
      deletedEventIds: ['event-1'],
      events: {
        'event-2': {
          ...events[1],
          name: 'Two (edited)',
          timers: [],
        },
      },
    });

    expect(merged).toHaveLength(1);
    expect(merged[0]?.name).toBe('Two (edited)');
  });
});
