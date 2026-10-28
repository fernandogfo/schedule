import { describe, expect, it } from 'vitest';
import type { SponsorStream } from '../schemas/schedule';
import {
  buildSponsorEmbedUrl,
  buildTwitchEmbedUrl,
  buildYouTubeEmbedUrl,
  pickSponsorStream,
} from './sponsors';

const twitchStream: SponsorStream = {
  id: 'sponsor-twitch',
  name: 'Twitch channel',
  provider: 'twitch',
  channel: 'channel_name',
};

const youtubeStream: SponsorStream = {
  id: 'sponsor-youtube',
  name: 'YouTube channel',
  provider: 'youtube',
  channel: 'UC1234567890',
};

describe('sponsor selection', () => {
  it('returns null when no sponsors are configured', () => {
    expect(pickSponsorStream([], () => 0.5)).toBeNull();
  });

  it('returns the only configured sponsor', () => {
    expect(pickSponsorStream([twitchStream], () => 0.99)).toBe(twitchStream);
  });

  it('selects a sponsor using the provided random value', () => {
    expect(
      pickSponsorStream([twitchStream, youtubeStream], () => 0),
    ).toBe(twitchStream);
    expect(
      pickSponsorStream([twitchStream, youtubeStream], () => 0.99),
    ).toBe(youtubeStream);
  });
});

describe('sponsor embed URLs', () => {
  it('builds a Twitch embed with the current hostname', () => {
    const url = new URL(buildTwitchEmbedUrl('channel_name', 'example.com'));

    expect(url.origin).toBe('https://player.twitch.tv');
    expect(url.searchParams.get('channel')).toBe('channel_name');
    expect(url.searchParams.get('parent')).toBe('example.com');
  });

  it('builds a YouTube channel live embed', () => {
    const url = new URL(buildYouTubeEmbedUrl('UC1234567890'));

    expect(url.origin).toBe('https://www.youtube.com');
    expect(url.pathname).toBe('/embed/live_stream');
    expect(url.searchParams.get('channel')).toBe('UC1234567890');
  });

  it('prefers a YouTube video id when provided', () => {
    const url = new URL(buildYouTubeEmbedUrl('UC1234567890', 'video-id'));

    expect(url.pathname).toBe('/embed/video-id');
  });

  it('dispatches by provider', () => {
    expect(
      new URL(buildSponsorEmbedUrl(twitchStream, 'localhost')).origin,
    ).toBe('https://player.twitch.tv');
    expect(
      new URL(buildSponsorEmbedUrl(youtubeStream, 'localhost')).origin,
    ).toBe('https://www.youtube.com');
  });
});
