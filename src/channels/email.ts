import nodemailer from 'nodemailer';
import { boolEnv, env, missingEnv, requireAll } from '../env.js';
import { htmlText, plainText } from '../format.js';
import type { NotifyChannel, NotifyPayload } from '../types.js';

const requiredEnv = ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM', 'EMAIL_TO'];

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
        host: env('SMTP_HOST'),
        port: Number(env('SMTP_PORT', '587')),
        secure: boolEnv('SMTP_SECURE', false),
        auth: {
          user: env('SMTP_USER'),
          pass: env('SMTP_PASS'),
        },
      });

      const info = await transporter.sendMail({
        from: env('EMAIL_FROM'),
        to: env('EMAIL_TO'),
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
