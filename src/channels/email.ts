import nodemailer from 'nodemailer';
import { boolEnv, env, missingEnv, requireAll } from '../env.js';
import { htmlText, plainText } from '../format.js';
import type { NotifyChannel, NotifyPayload } from '../types.js';

const requiredEnv = ['MULTI_NOTIFY_SMTP_HOST', 'MULTI_NOTIFY_SMTP_PORT', 'MULTI_NOTIFY_SMTP_USER', 'MULTI_NOTIFY_SMTP_PASS', 'MULTI_NOTIFY_EMAIL_FROM', 'MULTI_NOTIFY_EMAIL_TO'];

export function emailChannel(): NotifyChannel {
  return {
    name: 'email',
    requiredEnv,
    isConfigured: () => requireAll(requiredEnv),
    async send(payload: NotifyPayload) {
      if (!requireAll(requiredEnv)) {
        return {
          channel: 'email',
          status: 'skipped',
          reason: `Thiếu biến môi trường: ${missingEnv(requiredEnv).join(', ')}`,
        };
      }

      const transporter = nodemailer.createTransport({
        host: env('MULTI_NOTIFY_SMTP_HOST'),
        port: Number(env('MULTI_NOTIFY_SMTP_PORT', '587')),
        secure: boolEnv('MULTI_NOTIFY_SMTP_SECURE', false),
        auth: {
          user: env('MULTI_NOTIFY_SMTP_USER'),
          pass: env('MULTI_NOTIFY_SMTP_PASS'),
        },
      });

      const info = await transporter.sendMail({
        from: env('MULTI_NOTIFY_EMAIL_FROM'),
        to: env('MULTI_NOTIFY_EMAIL_TO'),
        subject: `[${payload.level.toUpperCase()}] ${payload.title}`,
        text: plainText(payload),
        html: htmlText(payload),
      });

      return {
        channel: 'email',
        status: 'sent',
        detail: String(info.messageId ?? 'sent'),
      };
    },
  };
}
