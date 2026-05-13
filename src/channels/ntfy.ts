import { env, missingEnv, requireAll } from '../env.js';
import { plainText } from '../format.js';
import type { NotifyChannel, NotifyPayload } from '../types.js';

const requiredEnv = ['NTFY_TOPIC'];

function ntfyUrl(): string {
  const server = env('NTFY_SERVER_URL', 'https://ntfy.sh').replace(/\/+$/, '');
  const topic = encodeURIComponent(env('NTFY_TOPIC'));
  return `${server}/${topic}`;
}

function headers(payload: NotifyPayload): Record<string, string> {
  const values: Record<string, string> = {
    'content-type': 'text/plain; charset=utf-8',
    title: payload.title,
    priority: env('NTFY_PRIORITY', payload.level === 'error' ? 'high' : 'default'),
  };

  const token = env('NTFY_TOKEN');
  if (token) values.authorization = `Bearer ${token}`;

  const tags = env('NTFY_TAGS');
  if (tags) values.tags = tags;

  const click = env('NTFY_CLICK_URL');
  if (click) values.click = click;

  return values;
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

      const response = await fetch(ntfyUrl(), {
        method: 'POST',
        headers: headers(payload),
        body: plainText(payload),
      });

      if (!response.ok) {
        throw new Error(`ntfy HTTP ${response.status}: ${await response.text()}`);
      }

      return { channel: 'ntfy', status: 'sent', detail: `HTTP ${response.status}` };
    },
  };
}
