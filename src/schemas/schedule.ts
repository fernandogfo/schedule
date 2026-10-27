import { z } from 'zod';
import { DAYS, REGIONS } from '../lib/constants';

const daySchema = z.enum(DAYS);
const regionSchema = z.enum(REGIONS);

const clockTimeSchema = z
  .string()
  .regex(
    /^([01]?\d|2[0-3]):[0-5]\d(?::[0-5]\d)?$/,
    'Expected a HH:mm or HH:mm:ss time.',
  );

const durationTimeSchema = z
  .string()
  .regex(
    /^\d{1,3}:[0-5]\d(?::[0-5]\d)?$/,
    'Expected a duration in HH:mm or HH:mm:ss format.',
  );

const optionalString = z.preprocess(
  (value) => (value === null || value === '' ? undefined : value),
  z.string().optional(),
);

const optionalClockTime = z.preprocess(
  (value) => (value === null || value === '' ? undefined : value),
  clockTimeSchema.optional(),
);

const optionalDurationTime = z.preprocess(
  (value) => (value === null || value === '' ? undefined : value),
  durationTimeSchema.optional(),
);

const optionalRegion = z.preprocess(
  (value) => (value === null || value === '' ? undefined : value),
  regionSchema.optional(),
);

const optionalDays = z.preprocess(
  (value) => (value === null ? undefined : value),
  z.array(daySchema).default([]),
);

const dateTimeString = z.string().refine(
  (value) => !Number.isNaN(Date.parse(value)),
  'Expected an ISO date string.',
);

const decimal = z.number().finite();

export const messageOverridesSchema = z
  .object({
    start: optionalString,
    reminder: optionalString,
  })
  .default({});

export const timerSchema = z.object({
  id: z.string().min(1),
  eventId: z.string().min(1),
  region: optionalRegion,
  time: clockTimeSchema,
  duration: optionalDurationTime,
  days: optionalDays,
  label: optionalString,
  inGameTime: optionalClockTime,
  reminderTime: optionalDurationTime,
  messages: messageOverridesSchema,
});

export const eventSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  categoryId: z.string().min(1),
  icon: z.string().min(1).default('event'),
  description: optionalString,
  link: optionalString,
  disabled: z.boolean().default(false),
});

export const categorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  icon: z.string().min(1),
  color: z.string().min(1),
  startMessage: optionalString,
  reminderMessage: optionalString,
  startCueId: optionalString,
  reminderCueId: optionalString,
});

export const alertOptionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(['start', 'reminder']),
  leadSeconds: z.number().int().min(0).default(0),
  cueId: optionalString,
});

export const alertConfigSchema = z.object({
  defaultLeadSeconds: z.number().int().min(0).default(900),
  options: z.array(alertOptionSchema).default([]),
});

export const cueSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  file: z.string().min(1),
  priority: z.number().int().default(0),
});

export const maintenanceSchema = z.object({
  day: daySchema,
  time: optionalClockTime,
});

export const cargoStepSchema = z
  .object({
    id: z.string().min(1),
    text: z.string().min(1),
    next: z.string().min(1),
    durationSeconds: z.number().positive(),
    port: optionalString,
    toPort: optionalString,
    reverse: z.boolean().default(false),
    sailing: z.boolean().default(false),
  })
  .refine(
    (step) => Boolean(step.port) !== Boolean(step.sailing),
    'A cargo step must either be docked at a port or sailing.',
  );

export const cargoTimerSchema = z.object({
  port: z.string().min(1),
  remainingSeconds: z.number().int().min(0),
  updatedAt: dateTimeString,
  noLinkedUpdate: z.boolean().default(false),
});

export const cargoServerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  region: regionSchema,
  linkedGroup: optionalString,
  unchained: z.boolean().default(false),
  timer: z.preprocess(
    (value) => (value === null || value === undefined ? undefined : value),
    cargoTimerSchema.optional(),
  ),
});

export const cargoAlertSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  stepId: z.string().min(1),
  trigger: z.enum(['start', 'end']),
  offsetSeconds: z.number().int().default(0),
  speech: optionalString,
  cueId: optionalString,
});

export const cargoShipSchema = z.object({
  enabled: z.boolean().default(true),
  defaultServerId: optionalString,
  ports: z.record(z.string(), z.string()).default({}),
  route: z.array(cargoStepSchema).default([]),
  alerts: z.array(cargoAlertSchema).default([]),
  servers: z.array(cargoServerSchema).default([]),
  maintenance: z.partialRecord(regionSchema, maintenanceSchema).default({}),
  notes: optionalString,
});

export const settingsSchema = z.object({
  defaultRegion: regionSchema.default('NA'),
  defaultVolume: z.number().min(0).max(100).default(70),
  inGame: z
    .object({
      offsetHours: decimal.default(2),
      offsetMinutes: decimal.default(20),
      cycleHours: decimal.default(4),
      hourMinutes: decimal.default(10),
    })
    .default({
      offsetHours: 2,
      offsetMinutes: 20,
      cycleHours: 4,
      hourMinutes: 10,
    }),
  refreshMinutes: z.number().int().positive().default(30),
});

export const themeSchema = z.object({
  primary: z.string().default('#009688'),
  primaryContrast: z.string().default('#ffffff'),
  backgroundImage: optionalString,
  fontFamily: z
    .string()
    .default('"Flareserif821BT-Roman", "Helvetica", "Arial", sans-serif'),
});

export const metaSchema = z.object({
  title: z.string().default('Event Schedule'),
  description: optionalString,
  updatedAt: dateTimeString.optional(),
  eventIcons: z.array(z.string()).default([]),
  source: optionalString,
});

export const scheduleDataSchema = z
  .object({
    version: z.literal(1),
    meta: metaSchema.default({
      title: 'Event Schedule',
      eventIcons: [],
    }),
    theme: themeSchema.default({
      primary: '#009688',
      primaryContrast: '#ffffff',
      fontFamily: '"Flareserif821BT-Roman", "Helvetica", "Arial", sans-serif',
    }),
    settings: settingsSchema.default({
      defaultRegion: 'NA',
      defaultVolume: 70,
      inGame: {
        offsetHours: 2,
        offsetMinutes: 20,
        cycleHours: 4,
        hourMinutes: 10,
      },
      refreshMinutes: 30,
    }),
    notice: optionalString,
    categories: z.array(categorySchema),
    events: z.array(eventSchema),
    timers: z.array(timerSchema),
    alerts: alertConfigSchema.default({ defaultLeadSeconds: 900, options: [] }),
    cues: z.array(cueSchema).default([]),
    cargoShip: cargoShipSchema.default({
      enabled: true,
      ports: {},
      route: [],
      alerts: [],
      servers: [],
      maintenance: {},
    }),
    pronunciations: z.record(z.string(), z.string()).default({}),
  })
  .superRefine((data, context) => {
    const categoryIds = new Set(data.categories.map((category) => category.id));
    const eventIds = new Set(data.events.map((event) => event.id));
    const timerIds = new Set<string>();

    data.events.forEach((event, index) => {
      if (!categoryIds.has(event.categoryId)) {
        context.addIssue({
          code: 'custom',
          path: ['events', index, 'categoryId'],
          message: `Unknown category "${event.categoryId}".`,
        });
      }
    });

    data.timers.forEach((timer, index) => {
      if (!eventIds.has(timer.eventId)) {
        context.addIssue({
          code: 'custom',
          path: ['timers', index, 'eventId'],
          message: `Unknown event "${timer.eventId}".`,
        });
      }
      if (timerIds.has(timer.id)) {
        context.addIssue({
          code: 'custom',
          path: ['timers', index, 'id'],
          message: `Duplicate timer id "${timer.id}".`,
        });
      }
      timerIds.add(timer.id);
    });

    const ports = new Set(Object.keys(data.cargoShip.ports));
    data.cargoShip.route.forEach((step, index) => {
      if (step.port && !ports.has(step.port)) {
        context.addIssue({
          code: 'custom',
          path: ['cargoShip', 'route', index, 'port'],
          message: `Unknown cargo port "${step.port}".`,
        });
      }
      if (step.toPort && !ports.has(step.toPort)) {
        context.addIssue({
          code: 'custom',
          path: ['cargoShip', 'route', index, 'toPort'],
          message: `Unknown cargo port "${step.toPort}".`,
        });
      }
    });

    data.cargoShip.servers.forEach((server, index) => {
      if (server.timer && !ports.has(server.timer.port)) {
        context.addIssue({
          code: 'custom',
          path: ['cargoShip', 'servers', index, 'timer', 'port'],
          message: `Unknown cargo port "${server.timer.port}".`,
        });
      }
    });
  });

export type Day = z.infer<typeof daySchema>;
export type Region = z.infer<typeof regionSchema>;
export type ScheduleData = z.infer<typeof scheduleDataSchema>;
export type ScheduleEvent = z.infer<typeof eventSchema>;
export type ScheduleTimer = z.infer<typeof timerSchema>;
export type Category = z.infer<typeof categorySchema>;
export type AlertOption = z.infer<typeof alertOptionSchema>;
export type Cue = z.infer<typeof cueSchema>;
export type CargoShip = z.infer<typeof cargoShipSchema>;
export type CargoStep = z.infer<typeof cargoStepSchema>;
export type CargoServer = z.infer<typeof cargoServerSchema>;
export type CargoTimer = z.infer<typeof cargoTimerSchema>;
export type CargoAlert = z.infer<typeof cargoAlertSchema>;
export type ScheduleTheme = z.infer<typeof themeSchema>;
export type ScheduleSettings = z.infer<typeof settingsSchema>;
export type EventWithTimers = ScheduleEvent & { timers: ScheduleTimer[] };
