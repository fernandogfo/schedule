/**
 * discordService.ts
 *
 * Sends plain-text messages to Discord webhook URLs.
 * Discord webhooks accept cross-origin POST requests from the browser, so no
 * backend is required. Sends are paced through a sequential queue to stay
 * within Discord's rate limits.
 */

const MIN_SEND_INTERVAL_MS = 350;
const REQUEST_TIMEOUT_MS = 10_000;

type QueueItem = { url: string; content: string };

const queue: QueueItem[] = [];
let draining = false;
let lastSentAt = 0;

async function postWebhook(url: string, content: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) {
      console.warn('[Discord] Webhook returned', response.status);
      return false;
    }
    return true;
  } catch (err) {
    console.warn('[Discord] Webhook request failed:', err);
    return false;
  }
}

function drain() {
  if (draining) return;
  const item = queue.shift();
  if (!item) return;
  draining = true;
  const wait = Math.max(0, lastSentAt + MIN_SEND_INTERVAL_MS - Date.now());
  window.setTimeout(() => {
    lastSentAt = Date.now();
    void postWebhook(item.url, item.content).finally(() => {
      draining = false;
      drain();
    });
  }, wait);
}

/** Enqueue a message for delivery to a Discord webhook. Never throws. */
export function sendDiscordMessage(url: string, content: string): void {
  if (!url || !content) return;
  queue.push({ url, content });
  drain();
}

/** Send a one-off test message and report whether it succeeded. */
export async function sendDiscordTestMessage(url: string): Promise<boolean> {
  return postWebhook(url, 'Test message from the schedule.');
}
