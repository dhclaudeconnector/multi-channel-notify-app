import { env, missingEnv, requireAll } from '../env.js';
import { telegramHtml } from '../format.js';
import type { NotifyChannel, NotifyPayload } from '../types.js';

const requiredEnv = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID'];

export function telegramChannel(): NotifyChannel {
  return {
    name: 'telegram',
    requiredEnv,
    isConfigured: () => requireAll(requiredEnv),
    async send(payload: NotifyPayload) {
      if (!requireAll(requiredEnv)) {
        return {
          channel: 'telegram',
          status: 'skipped',
          reason: `Thiếu biến môi trường: ${missingEnv(requiredEnv).join(', ')}`,
        };
      }

      const url = `https://api.telegram.org/bot${env('TELEGRAM_BOT_TOKEN')}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          chat_id: env('TELEGRAM_CHAT_ID'),
          text: telegramHtml(payload),
          parse_mode: env('TELEGRAM_PARSE_MODE', 'HTML'),
          disable_web_page_preview: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Telegram HTTP ${response.status}: ${await response.text()}`);
      }

      const data = (await response.json()) as { result?: { message_id?: number } };

      return {
        channel: 'telegram',
        status: 'sent',
        detail: data.result?.message_id ? `message_id=${data.result.message_id}` : 'sent',
      };
    },
  };
}
