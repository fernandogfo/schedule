import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  eventMetadata,
  legacyDetailAliases,
  legacyEventAliases,
  scheduleEntries,
} from './schedule-source.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const legacyDir =
  process.env.LEGACY_DIR ??
  path.resolve(root, '..', 'archeage-tools-master', 'archeage-tools-master');

const colors = {
  RED: '#f93a2f',
  GREEN: '#0ec268',
  BLUE: '#0099ee',
  DEEPPURPLE: '#834bff',
  GOLD: '#e8b600',
  PURPLE: '#a652bb',
  ORANGE: '#e67e22',
  CYAN: '#0fcdd2',
  GREENFORUM: '#01bd48',
};

const categoryMessages = {
  instances: {
    start: '{event} is now available for {duration}.',
    reminder: '{event} will be available in {remaining} for {duration}.',
  },
  zonewar: {
    start: '{event} has fallen into a state of war for {duration}.',
    reminder: '{event} will fall into a state of war in {remaining}.',
  },
};

const cueFiles = {
  test: 'empty.mp3',
  reminder: 'battlefield_count.mp3',
  start: 'quest_accept_2.mp3',
  start_other: 'interaction_unpack_launch.mp3',
  ship_leaving: 'auction_bidding.mp3',
  other: 'mail_alarm.mp3',
};

const cueLabels = {
  test: 'Test',
  reminder: 'Reminder',
  start: 'Event start',
  start_other: 'Other event start',
  ship_leaving: 'Cargo ship leaving',
  other: 'Other alert',
};

const cuePriorities = {
  test: 0,
  reminder: 1,
  start: 2,
  start_other: 3,
  ship_leaving: 4,
  other: 99,
};

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function minutesSecondsToSeconds(value) {
  if (!value) return 0;
  const [minutes = '0', seconds = '0'] = String(value).split(':');
  return Number(minutes) * 60 + Number(seconds);
}

function translateMessage(template, kind) {
  if (!template) return undefined;
  const tokens =
    kind === 'start'
      ? ['{event}', '{duration}', '{label}']
      : ['{event}', '{remaining}', '{duration}', '{label}'];

  return template
    .replace(/\$(\d+)/g, (_, index) => tokens[Number(index)] ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

const dayNames = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
];

function normalizeDays(days) {
  if (!Array.isArray(days)) return [];
  const unique = [...new Set(days)].sort((left, right) => left - right);
  return unique.length === 7 ? [] : unique.map((day) => dayNames[day]);
}

function formatTime(hours, minutes) {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

function formatDuration(startHour, startMinute, endHour, endMinute) {
  const start = startHour * 60 + startMinute;
  const end = endHour * 60 + endMinute;
  const totalMinutes = end - start;
  if (totalMinutes <= 0) {
    throw new Error(
      `Invalid schedule range ${formatTime(startHour, startMinute)}-${formatTime(
        endHour,
        endMinute,
      )}.`,
    );
  }
  return formatTime(Math.floor(totalMinutes / 60), totalMinutes % 60);
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

function createCargoAlerts() {
  return [
    {
      id: 'arrive-solis-3',
      name: 'Arriving in Solis in 3 min',
      stepId: 'two-crowns-solis',
      trigger: 'end',
      offsetSeconds: -180,
      speech:
        'The cargo ship will arrive at the Solis Headlands port in 3 minutes.',
      cueId: 'reminder',
    },
    {
      id: 'arrived-solis',
      name: 'Arrived in Solis',
      stepId: 'two-crowns-solis',
      trigger: 'end',
      offsetSeconds: 0,
      speech: 'The cargo ship has arrived at the Solis Headlands port.',
      cueId: 'ship_leaving',
    },
    {
      id: 'leave-solis-10',
      name: 'Leaving Solis in 10 min',
      stepId: 'solis-docked',
      trigger: 'end',
      offsetSeconds: -600,
      speech: 'The cargo ship will leave the Solis Headlands port in 10 minutes.',
      cueId: 'reminder',
    },
    {
      id: 'leave-solis-5',
      name: 'Leaving Solis in 5 min',
      stepId: 'solis-docked',
      trigger: 'end',
      offsetSeconds: -300,
      speech: 'The cargo ship will leave the Solis Headlands port in 5 minutes.',
      cueId: 'reminder',
    },
    {
      id: 'leave-solis-2',
      name: 'Leaving Solis in 2 min',
      stepId: 'solis-docked',
      trigger: 'end',
      offsetSeconds: -120,
      speech: 'The cargo ship will leave the Solis Headlands port in 2 minutes.',
      cueId: 'reminder',
    },
    {
      id: 'leaving-solis',
      name: 'Leaving Solis Port',
      stepId: 'solis-docked',
      trigger: 'end',
      offsetSeconds: 0,
      speech: 'The cargo ship is leaving the Solis Headlands port.',
      cueId: 'ship_leaving',
    },
    {
      id: 'arrive-tc-3',
      name: 'Arriving in Two Crowns in 3 min',
      stepId: 'solis-two-crowns',
      trigger: 'end',
      offsetSeconds: -180,
      speech: 'The cargo ship will arrive at the Two Crowns port in 3 minutes.',
      cueId: 'reminder',
    },
    {
      id: 'arrived-tc',
      name: 'Arrived in Two Crowns',
      stepId: 'solis-two-crowns',
      trigger: 'end',
      offsetSeconds: 0,
      speech: 'The cargo ship has arrived at the Two Crowns port.',
      cueId: 'ship_leaving',
    },
    {
      id: 'leave-tc-10',
      name: 'Leaving Two Crowns in 10 min',
      stepId: 'two-crowns-docked',
      trigger: 'end',
      offsetSeconds: -600,
      speech: 'The cargo ship will leave the Two Crowns port in 10 minutes.',
      cueId: 'reminder',
    },
    {
      id: 'leave-tc-5',
      name: 'Leaving Two Crowns in 5 min',
      stepId: 'two-crowns-docked',
      trigger: 'end',
      offsetSeconds: -300,
      speech: 'The cargo ship will leave the Two Crowns port in 5 minutes.',
      cueId: 'reminder',
    },
    {
      id: 'leave-tc-2',
      name: 'Leaving Two Crowns in 2 min',
      stepId: 'two-crowns-docked',
      trigger: 'end',
      offsetSeconds: -120,
      speech: 'The cargo ship will leave the Two Crowns port in 2 minutes.',
      cueId: 'reminder',
    },
    {
      id: 'leaving-tc',
      name: 'Leaving Two Crowns Port',
      stepId: 'two-crowns-docked',
      trigger: 'end',
      offsetSeconds: 0,
      speech: 'The cargo ship is leaving the Two Crowns port.',
      cueId: 'ship_leaving',
    },
  ];
}

async function main() {
  const [types, legacyServers, legacyCargoTimers, legacyEvents] =
    await Promise.all([
      readJson(path.join(legacyDir, 'static', 'service', 'types.json')),
      readJson(path.join(legacyDir, 'static', 'service', 'servers.json')),
      readJson(path.join(legacyDir, 'static', 'service', 'cargo-ship.json')),
      readJson(path.join(legacyDir, 'static', 'service', 'events.json')),
    ]);

  const categoryIdByLegacyType = new Map(
    types.map((type) => [type.id, slugify(type.name)]),
  );
  const legacyEventByName = new Map(
    legacyEvents.map((event) => [event.name, event]),
  );
  const resolvedMetadata = new Map();
  const usedCategoryIds = new Set();

  scheduleEntries.forEach((entry, index) => {
    const legacyName = legacyEventAliases[entry.title];
    let metadata;

    if (legacyName) {
      const legacyEvent = legacyEventByName.get(legacyName);
      if (!legacyEvent) {
        throw new Error(
          `Unknown legacy event "${legacyName}" for schedule entry ${
            index + 1
          }: "${entry.title}".`,
        );
      }
      const categoryId = categoryIdByLegacyType.get(legacyEvent.eventType);
      if (!categoryId) {
        throw new Error(
          `Unknown legacy type "${legacyEvent.eventType}" for event "${legacyName}".`,
        );
      }
      metadata = {
        name: legacyEvent.name,
        categoryId,
        icon: legacyEvent.icon || 'event',
        link: legacyEvent.link || undefined,
        description: legacyEvent.description || undefined,
      };
    } else {
      const sourceMetadata = eventMetadata[entry.title];
      if (!sourceMetadata) {
        throw new Error(
          `Missing metadata for schedule entry ${index + 1}: "${entry.title}".`,
        );
      }
      const detailSource = legacyDetailAliases[entry.title];
      const detailEvent = detailSource
        ? legacyEventByName.get(detailSource)
        : undefined;
      if (detailSource && !detailEvent) {
        throw new Error(
          `Unknown legacy detail event "${detailSource}" for schedule entry ${
            index + 1
          }: "${entry.title}".`,
        );
      }
      metadata = {
        name: entry.title,
        categoryId: sourceMetadata.categoryId,
        icon: sourceMetadata.icon,
        link: sourceMetadata.link ?? detailEvent?.link ?? undefined,
        description:
          sourceMetadata.description ?? detailEvent?.description ?? undefined,
      };
    }

    resolvedMetadata.set(entry.title, metadata);
    usedCategoryIds.add(metadata.categoryId);
  });
  const categories = types
    .map((category) => {
      const messages = categoryMessages[category.id === 1 ? 'instances' : 'zonewar'];
      const translatedStart = translateMessage(category.startMessage, 'start');
      const translatedReminder = translateMessage(
        category.reminderMessage,
        'reminder',
      );

      return {
        id: slugify(category.name),
        name: category.name,
        icon: category.icon,
        color: colors[category.color] ?? '#009688',
        startMessage:
          category.id === 1
            ? messages.start
            : category.id === 7
              ? messages.start
              : translatedStart,
        reminderMessage:
          category.id === 1
            ? messages.reminder
            : category.id === 7
              ? messages.reminder
              : translatedReminder,
        startCueId: category.icon === 'instance' ? 'start_other' : 'start',
        reminderCueId: 'reminder',
      };
    })
    .filter((category) => usedCategoryIds.has(category.id));

  const availableCategoryIds = new Set(categories.map((category) => category.id));
  resolvedMetadata.forEach((metadata, title) => {
    if (!availableCategoryIds.has(metadata.categoryId)) {
      throw new Error(
        `Unknown category "${metadata.categoryId}" for event "${title}".`,
      );
    }
  });

  const events = [];
  const timers = [];
  const eventIcons = new Set();
  const eventByName = new Map();
  const timerCounts = new Map();

  scheduleEntries.forEach((entry) => {
    const metadata = resolvedMetadata.get(entry.title);

    let event = eventByName.get(metadata.name);
    if (!event) {
      const eventId = `event-${slugify(metadata.name)}`;
      event = {
        id: eventId,
        name: metadata.name,
        categoryId: metadata.categoryId,
        icon: metadata.icon,
        ...(metadata.description ? { description: metadata.description } : {}),
        ...(metadata.link ? { link: metadata.link } : {}),
        disabled: false,
      };
      eventByName.set(metadata.name, event);
      events.push(event);
      eventIcons.add(metadata.icon);
    }

    const timerNumber = (timerCounts.get(event.id) ?? 0) + 1;
    timerCounts.set(event.id, timerNumber);
    timers.push({
      id: `${event.id}-timer-${timerNumber}`,
      eventId: event.id,
      time: formatTime(entry.startHour, entry.startMinute),
      duration: formatDuration(
        entry.startHour,
        entry.startMinute,
        entry.endHour,
        entry.endMinute,
      ),
      days: normalizeDays(entry.daysOfWeek),
    });
  });

  const portMap = {
    4: 'solis-headlands',
    8: 'two-crowns',
  };

  const cargoServers = legacyServers.map((server) => {
    const legacyTimer = legacyCargoTimers.find(
      (timer) => timer.serverId === server.id,
    );
    const mapped = {
      id: String(server.id),
      name: server.name,
      region: server.region,
      unchained: Boolean(server.unchained),
    };

    if (legacyTimer && portMap[legacyTimer.port]) {
      mapped.timer = {
        port: portMap[legacyTimer.port],
        remainingSeconds: minutesSecondsToSeconds(legacyTimer.duration),
        updatedAt: new Date(legacyTimer.timestamp).toISOString(),
        noLinkedUpdate: Boolean(legacyTimer.noLinkedUpdate),
      };
    }

    return mapped;
  });

  const cargoShip = {
    enabled: true,
    defaultServerId: '1',
    ports: {
      'solis-headlands': 'Solis Headlands',
      'two-crowns': 'Two Crowns',
    },
    route: [
      {
        id: 'solis-docked',
        text: 'docked in Solis Headlands',
        next: 'Depart Solis',
        port: 'solis-headlands',
        durationSeconds: 1200,
      },
      {
        id: 'solis-two-crowns',
        text: 'sailing to Two Crowns',
        next: 'Arrive TC',
        toPort: 'two-crowns',
        durationSeconds: 621.2,
        reverse: true,
        sailing: true,
      },
      {
        id: 'two-crowns-docked',
        text: 'docked in Two Crowns',
        next: 'Depart TC',
        port: 'two-crowns',
        durationSeconds: 1200,
        reverse: true,
      },
      {
        id: 'two-crowns-solis',
        text: 'sailing to Solis Headlands',
        next: 'Arrive Solis',
        toPort: 'solis-headlands',
        durationSeconds: 647.25,
        sailing: true,
      },
    ],
    alerts: createCargoAlerts(),
    servers: cargoServers,
    maintenance: {
      NA: { day: 'THURSDAY', time: '12:00' },
      EU: { day: 'THURSDAY', time: '08:00' },
      SEA: { day: 'WEDNESDAY', time: '22:00' },
    },
    notes:
      'The cargo ship is docked for 20 minutes and takes about 10 minutes to cross the sea.',
  };

  const data = {
    version: 1,
    meta: {
      title: 'ArcheAge Event Schedule',
      description:
        'World bosses, rifts, PvP events, festivals and cargo ship timers for ArcheAge.',
      updatedAt: new Date().toISOString(),
      eventIcons: [...eventIcons].sort(),
      source: 'Current ArcheAge weekly schedule',
    },
    theme: {
      primary: '#009688',
      primaryContrast: '#ffffff',
      backgroundImage: '/assets/images/background.png',
      fontFamily:
        '"Flareserif821BT-Roman", "Helvetica", "Arial", sans-serif',
    },
    settings: {
      defaultRegion: 'NA',
      defaultVolume: 70,
      inGame: {
        offsetHours: 2,
        offsetMinutes: 20,
        cycleHours: 4,
        hourMinutes: 10,
      },
      refreshMinutes: 30,
    },
    categories,
    events,
    timers,
    alerts: {
      defaultLeadSeconds: 900,
      options: [
        {
          id: 'start',
          name: 'Start of Event',
          kind: 'start',
          leadSeconds: 0,
        },
        {
          id: 'pre-1',
          name: '1 minute before',
          kind: 'reminder',
          leadSeconds: 60,
          cueId: 'reminder',
        },
        {
          id: 'pre-8',
          name: '7.5 minutes before',
          kind: 'reminder',
          leadSeconds: 450,
          cueId: 'reminder',
        },
        {
          id: 'pre-15',
          name: '15 minutes before',
          kind: 'reminder',
          leadSeconds: 900,
          cueId: 'reminder',
        },
        {
          id: 'pre-30',
          name: '30 minutes before',
          kind: 'reminder',
          leadSeconds: 1800,
          cueId: 'reminder',
        },
      ],
    },
    cues: Object.entries(cueFiles).map(([id, file]) => ({
      id,
      label: cueLabels[id],
      file: `/assets/audio/${file}`,
      priority: cuePriorities[id],
    })),
    cargoShip,
    pronunciations: {
      Akasch: 'Uh kawsh',
      Arche: 'ark',
      Grimghast: 'Grim ghast',
    },
  };

  await mkdir(path.join(root, 'public', 'data'), { recursive: true });
  await writeFile(
    path.join(root, 'public', 'data', 'schedule.json'),
    `${JSON.stringify(data, null, 2)}\n`,
    'utf8',
  );

  console.log(
    `Imported ${events.length} events, ${timers.length} timers and ${categories.length} categories.`,
  );
  console.log(`Cargo Ship servers: ${cargoServers.length}.`);
  console.log(`Output: ${path.join(root, 'public', 'data', 'schedule.json')}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
