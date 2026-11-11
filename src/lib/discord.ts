export interface DiscordWebhooks {
  global: string;
  categories: Record<string, string>;
  events: Record<string, string>;
}

export const CARGO_PANEL_KEY = 'cargo';
export const VYRAVA_PANEL_KEY = 'vyrava';

const DISCORD_WEBHOOK_PREFIXES = [
  'https://discord.com/api/webhooks/',
  'https://discordapp.com/api/webhooks/',
];

export const EMPTY_DISCORD_WEBHOOKS: DiscordWebhooks = {
  global: '',
  categories: {},
  events: {},
};

export function isDiscordWebhookUrl(url: string): boolean {
  return DISCORD_WEBHOOK_PREFIXES.some((prefix) => url.startsWith(prefix));
}

export function normalizeWebhookUrl(url: string): string {
  const trimmed = url.trim();
  return isDiscordWebhookUrl(trimmed) ? trimmed : '';
}

function normalizeWebhookMap(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const entries = Object.entries(value as Record<string, unknown>).filter(
    (entry): entry is [string, string] =>
      entry[0].length > 0 && typeof entry[1] === 'string',
  );
  return Object.fromEntries(
    entries
      .map(([key, url]) => [key, normalizeWebhookUrl(url)] as const)
      .filter(([, url]) => url.length > 0),
  );
}

export function normalizeDiscordWebhooks(value: unknown): DiscordWebhooks {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { global: '', categories: {}, events: {} };
  }
  const candidate = value as Partial<DiscordWebhooks>;
  return {
    global:
      typeof candidate.global === 'string'
        ? normalizeWebhookUrl(candidate.global)
        : '',
    categories: normalizeWebhookMap(candidate.categories),
    events: normalizeWebhookMap(candidate.events),
  };
}

export function hasDiscordWebhooks(webhooks: DiscordWebhooks): boolean {
  return Boolean(
    webhooks.global ||
      Object.keys(webhooks.categories).length > 0 ||
      Object.keys(webhooks.events).length > 0,
  );
}

export function resolveWebhookUrls(
  webhooks: DiscordWebhooks,
  alertKey: string,
  categoryKey = '',
): string[] {
  const candidates = [
    webhooks.events[alertKey],
    categoryKey ? webhooks.categories[categoryKey] : undefined,
    webhooks.global,
  ];
  const seen = new Set<string>();
  return candidates.filter((url): url is string => {
    if (typeof url !== 'string' || url.length === 0) return false;
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });
}
