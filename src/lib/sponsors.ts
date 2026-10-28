import type { SponsorStream } from '../schemas/schedule';

export function pickSponsorStream(
  streams: readonly SponsorStream[],
  random: () => number = Math.random,
): SponsorStream | null {
  if (streams.length === 0) return null;
  const index = Math.min(
    streams.length - 1,
    Math.max(0, Math.floor(random() * streams.length)),
  );
  return streams[index] ?? null;
}

export function buildTwitchEmbedUrl(channel: string, hostname: string): string {
  const params = new URLSearchParams({
    channel,
    parent: hostname,
    autoplay: 'true',
    muted: 'true',
  });
  return `https://player.twitch.tv/?${params.toString()}`;
}

export function buildYouTubeEmbedUrl(channel: string, videoId?: string): string {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    rel: '0',
  });

  if (videoId) {
    return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?${params.toString()}`;
  }

  params.set('channel', channel);
  return `https://www.youtube.com/embed/live_stream?${params.toString()}`;
}

export function buildSponsorEmbedUrl(
  stream: SponsorStream,
  hostname: string,
): string {
  return stream.provider === 'twitch'
    ? buildTwitchEmbedUrl(stream.channel, hostname)
    : buildYouTubeEmbedUrl(stream.channel, stream.videoId);
}
