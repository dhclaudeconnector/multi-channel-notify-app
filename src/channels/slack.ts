import { env, missingEnv, requireAll } from '../env.js';
import type { NotifyChannel, NotifyPayload } from '../types.js';

const requiredEnv = ['SLACK_WEBHOOK_URL'];

export function slackChannel(): NotifyChannel {
  return {
    name: 'slack',
    requiredEnv,
    isConfigured: () => requireAll(requiredEnv),
    async send(payload: NotifyPayload) {
      if (!requireAll(requiredEnv)) {
        return {
          channel: 'slack',
          status: 'skipped',
          reason: `Thiếu biến môi trường: ${missingEnv(requiredEnv).join(', ')}`,
        };
      }

      const response = await fetch(env('SLACK_WEBHOOK_URL'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          text: `*${payload.title}*\n${payload.message}\n\nLevel: ${payload.level}\nTime: ${payload.timestamp}`,
        }),
      });

      if (!response.ok) {
        throw new Error(`Slack HTTP ${response.status}: ${await response.text()}`);
      }

      return { channel: 'slack', status: 'sent', detail: `HTTP ${response.status}` };
    },
  };
}
