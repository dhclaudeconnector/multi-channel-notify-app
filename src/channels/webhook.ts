import { env, missingEnv, requireAll } from '../env.js';
import type { NotifyChannel, NotifyPayload } from '../types.js';

const requiredEnv = ['NOTIFY_WEBHOOK_URL'];

export function genericWebhookChannel(): NotifyChannel {
  return {
    name: 'webhook',
    requiredEnv,
    isConfigured: () => requireAll(requiredEnv),
    async send(payload: NotifyPayload) {
      if (!requireAll(requiredEnv)) {
        return {
          channel: 'webhook',
          status: 'skipped',
          reason: `Thiếu biến môi trường: ${missingEnv(requiredEnv).join(', ')}`,
        };
      }

      const response = await fetch(env('NOTIFY_WEBHOOK_URL'), {
        method: env('NOTIFY_WEBHOOK_METHOD', 'POST'),
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook HTTP ${response.status}: ${await response.text()}`);
      }

      return { channel: 'webhook', status: 'sent', detail: `HTTP ${response.status}` };
    },
  };
}
