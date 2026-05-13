import { env, missingEnv, requireAll } from '../env.js';
import type { NotifyChannel, NotifyPayload } from '../types.js';

const requiredEnv = ['DISCORD_WEBHOOK_URL'];

const colorByLevel: Record<string, number> = {
  debug: 8421504,
  info: 3447003,
  success: 5763719,
  warning: 16776960,
  error: 15548997,
};

export function discordChannel(): NotifyChannel {
  return {
    name: 'discord',
    requiredEnv,
    isConfigured: () => requireAll(requiredEnv),
    async send(payload: NotifyPayload) {
      if (!requireAll(requiredEnv)) {
        return {
          channel: 'discord',
          status: 'skipped',
          reason: `Thiếu biến môi trường: ${missingEnv(requiredEnv).join(', ')}`,
        };
      }

      const response = await fetch(env('DISCORD_WEBHOOK_URL'), {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          username: env('APP_NAME', 'Multi Channel Notify'),
          embeds: [
            {
              title: payload.title,
              description: payload.message,
              color: colorByLevel[payload.level] ?? colorByLevel.info,
              fields: [
                { name: 'Level', value: payload.level, inline: true },
                { name: 'Time', value: payload.timestamp, inline: true },
              ],
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Discord HTTP ${response.status}: ${await response.text()}`);
      }

      return { channel: 'discord', status: 'sent', detail: `HTTP ${response.status}` };
    },
  };
}
