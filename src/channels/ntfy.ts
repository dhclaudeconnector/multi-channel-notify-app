import { env, missingEnv, requireAll } from '../env.js';
import { plainText } from '../format.js';
import type { NotifyChannel, NotifyPayload } from '../types.js';

const requiredEnv = ['MULTI_NOTIFY_NTFY_TOPIC'];

function ntfyServerUrl(): string {
  return `${env('MULTI_NOTIFY_NTFY_SERVER_URL', 'https://ntfy.sh').replace(/\/+$/, '')}/`;
}

function ntfyHeaders(): Record<string, string> {
  const values: Record<string, string> = { 'content-type': 'application/json' };
  const token = env('MULTI_NOTIFY_NTFY_TOKEN');
  if (token) values.authorization = `Bearer ${token}`;
  return values;
}

function ntfyBody(payload: NotifyPayload): string {
  const body: Record<string, unknown> = {
    topic: env('MULTI_NOTIFY_NTFY_TOPIC'),
    title: payload.title,
    message: plainText(payload),
    priority: Number(env('MULTI_NOTIFY_NTFY_PRIORITY', payload.level === 'error' ? '4' : '3')),
  };

  const tags = env('MULTI_NOTIFY_NTFY_TAGS')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (tags.length) body.tags = tags;

  const click = env('MULTI_NOTIFY_NTFY_CLICK_URL');
  if (click) body.click = click;

  return JSON.stringify(body);
}

export function ntfyChannel(): NotifyChannel {
  return {
    name: 'ntfy',
    requiredEnv,
    isConfigured: () => requireAll(requiredEnv),
    async send(payload: NotifyPayload) {
      if (!requireAll(requiredEnv)) {
        return {
          channel: 'ntfy',
          status: 'skipped',
          reason: `Thiếu biến môi trường: ${missingEnv(requiredEnv).join(', ')}`,
        };
      }

      const response = await fetch(ntfyServerUrl(), {
        method: 'POST',
        headers: ntfyHeaders(),
        body: ntfyBody(payload),
      });

      if (!response.ok) {
        throw new Error(`ntfy HTTP ${response.status}: ${await response.text()}`);
      }

      return { channel: 'ntfy', status: 'sent', detail: `HTTP ${response.status}` };
    },
  };
}
