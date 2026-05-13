import { env, missingEnv, requireAll } from '../env.js';
import { plainText } from '../format.js';
import type { NotifyChannel, NotifyPayload } from '../types.js';

const requiredEnv = ['TWILIO_ACCOUNT_SID', 'TWILIO_AUTH_TOKEN', 'TWILIO_FROM_NUMBER', 'TWILIO_TO_NUMBER'];

export function twilioSmsChannel(): NotifyChannel {
  return {
    name: 'twilio_sms',
    requiredEnv,
    isConfigured: () => requireAll(requiredEnv),
    async send(payload: NotifyPayload) {
      if (!requireAll(requiredEnv)) {
        return {
          channel: 'twilio_sms',
          status: 'skipped',
          reason: `Thiếu biến môi trường: ${missingEnv(requiredEnv).join(', ')}`,
        };
      }

      const sid = env('TWILIO_ACCOUNT_SID');
      const token = env('TWILIO_AUTH_TOKEN');
      const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;

      const body = new URLSearchParams({
        From: env('TWILIO_FROM_NUMBER'),
        To: env('TWILIO_TO_NUMBER'),
        Body: plainText(payload).slice(0, 1500),
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body,
      });

      const text = await response.text();

      if (!response.ok) {
        throw new Error(`Twilio HTTP ${response.status}: ${text}`);
      }

      try {
        const data = JSON.parse(text) as { sid?: string };
        return { channel: 'twilio_sms', status: 'sent', detail: data.sid ?? 'sent' };
      } catch {
        return { channel: 'twilio_sms', status: 'sent', detail: 'sent' };
      }
    },
  };
}
