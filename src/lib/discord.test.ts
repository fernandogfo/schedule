import { describe, expect, it } from 'vitest';
import {
  EMPTY_DISCORD_WEBHOOKS,
  hasDiscordWebhooks,
  isDiscordWebhookUrl,
  normalizeDiscordWebhooks,
  normalizeWebhookUrl,
  resolveWebhookUrls,
  type DiscordWebhooks,
} from './discord';

const DISCORD_URL = 'https://discord.com/api/webhooks/12345/token';
const LEGACY_URL = 'https://discordapp.com/api/webhooks/999/abc';
const OTHER_URL = 'https://discord.com/api/webhooks/67890/other';

describe('discord webhook url validation', () => {
  it('accepts both Discord webhook hosts', () => {
    expect(isDiscordWebhookUrl(DISCORD_URL)).toBe(true);
    expect(isDiscordWebhookUrl(LEGACY_URL)).toBe(true);
  });

  it('rejects non-webhook URLs', () => {
    expect(isDiscordWebhookUrl('')).toBe(false);
    expect(isDiscordWebhookUrl('https://example.com/webhook')).toBe(false);
    expect(isDiscordWebhookUrl('http://discord.com/api/webhooks/123/t')).toBe(false);
    expect(isDiscordWebhookUrl('discord.com/api/webhooks/123/token')).toBe(false);
  });

  it('trims and drops invalid values when normalizing', () => {
    expect(normalizeWebhookUrl(`  ${DISCORD_URL}  `)).toBe(DISCORD_URL);
    expect(normalizeWebhookUrl('not a url')).toBe('');
  });
});

describe('discord webhooks normalization', () => {
  it('returns empty defaults for invalid values', () => {
    expect(normalizeDiscordWebhooks(null)).toEqual(EMPTY_DISCORD_WEBHOOKS);
    expect(normalizeDiscordWebhooks('x')).toEqual(EMPTY_DISCORD_WEBHOOKS);
    expect(normalizeDiscordWebhooks([])).toEqual(EMPTY_DISCORD_WEBHOOKS);
  });

  it('keeps valid URLs and drops invalid entries', () => {
    const normalized = normalizeDiscordWebhooks({
      global: ` ${DISCORD_URL} `,
      categories: { boss: LEGACY_URL, bad: 'nope', '': DISCORD_URL },
      events: { event: DISCORD_URL },
    });

    expect(normalized).toEqual({
      global: DISCORD_URL,
      categories: { boss: LEGACY_URL },
      events: { event: DISCORD_URL },
    });
  });

  it('removes entries cleared to an empty string', () => {
    const normalized = normalizeDiscordWebhooks({
      global: '',
      categories: { cargo: '' },
      events: { event: '  ' },
    });

    expect(normalized).toEqual(EMPTY_DISCORD_WEBHOOKS);
  });
});

describe('discord webhook detection', () => {
  it('reports whether any URL is configured', () => {
    expect(hasDiscordWebhooks(EMPTY_DISCORD_WEBHOOKS)).toBe(false);
    expect(hasDiscordWebhooks({ ...EMPTY_DISCORD_WEBHOOKS, global: DISCORD_URL })).toBe(true);
    expect(
      hasDiscordWebhooks({
        global: '',
        categories: { cargo: DISCORD_URL },
        events: {},
      }),
    ).toBe(true);
    expect(
      hasDiscordWebhooks({
        global: '',
        categories: {},
        events: { event: DISCORD_URL },
      }),
    ).toBe(true);
  });
});

describe('discord webhook resolution', () => {
  const base: DiscordWebhooks = {
    global: 'https://discord.com/api/webhooks/global/token',
    categories: { boss: DISCORD_URL },
    events: { event: DISCORD_URL },
  };

  it('combines event, category, and global URLs from most to least specific', () => {
    expect(
      resolveWebhookUrls(
        { ...base, categories: { boss: OTHER_URL } },
        'event',
        'boss',
      ),
    ).toEqual([DISCORD_URL, OTHER_URL, base.global]);
  });

  it('deduplicates identical URLs across levels', () => {
    expect(resolveWebhookUrls(base, 'event', 'boss')).toEqual([
      DISCORD_URL,
      base.global,
    ]);
  });

  it('falls back to the global URL only', () => {
    expect(resolveWebhookUrls(base, 'unknown', '')).toEqual([base.global]);
    expect(resolveWebhookUrls(base, 'unknown', 'unknown')).toEqual([base.global]);
  });

  it('returns nothing when no URL is configured', () => {
    expect(resolveWebhookUrls(EMPTY_DISCORD_WEBHOOKS, 'event', 'boss')).toEqual([]);
  });

  it('ignores the category level when no category key is given', () => {
    expect(
      resolveWebhookUrls(
        { ...base, events: {} },
        'event',
        '',
      ),
    ).toEqual([base.global]);
  });
});
