import type { NotifyPayload } from './types.js';

const levelIcon: Record<string, string> = {
  debug: '🔎',
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '🚨',
};

export function plainText(payload: NotifyPayload): string {
  const icon = levelIcon[payload.level] ?? 'ℹ️';
  const metaText =
    payload.meta && Object.keys(payload.meta).length > 0
      ? `\n\nMeta:\n${JSON.stringify(payload.meta, null, 2)}`
      : '';

  return `${icon} ${payload.title}\n\n${payload.message}\n\nLevel: ${payload.level}\nTime: ${payload.timestamp}${metaText}`;
}

export function htmlText(payload: NotifyPayload): string {
  const icon = levelIcon[payload.level] ?? 'ℹ️';
  const safe = (value: string) =>
    value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#039;');

  const metaHtml =
    payload.meta && Object.keys(payload.meta).length > 0
      ? `<h3>Meta</h3><pre>${safe(JSON.stringify(payload.meta, null, 2))}</pre>`
      : '';

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>${icon} ${safe(payload.title)}</h2>
      <p>${safe(payload.message).replaceAll('\n', '<br/>')}</p>
      <p><b>Level:</b> ${safe(payload.level)}</p>
      <p><b>Time:</b> ${safe(payload.timestamp)}</p>
      ${metaHtml}
    </div>
  `;
}

export function telegramHtml(payload: NotifyPayload): string {
  const icon = levelIcon[payload.level] ?? 'ℹ️';
  const safe = (value: string) =>
    value
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;');

  return [
    `${icon} <b>${safe(payload.title)}</b>`,
    '',
    safe(payload.message),
    '',
    `<b>Level:</b> ${safe(payload.level)}`,
    `<b>Time:</b> ${safe(payload.timestamp)}`,
  ].join('\n');
}
