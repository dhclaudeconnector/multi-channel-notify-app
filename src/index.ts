import { env } from './env.js';
import { sendToConfiguredChannels } from './notify.js';
import type { NotifyLevel, NotifyPayload } from './types.js';

function argValue(name: string): string | undefined {
  const prefix = `--${name}=`;
  const direct = process.argv.find((arg) => arg.startsWith(prefix));
  if (direct) return direct.slice(prefix.length);

  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0 && process.argv[index + 1]) return process.argv[index + 1];

  return undefined;
}

function normalizeLevel(value: string): NotifyLevel {
  const allowed: NotifyLevel[] = ['debug', 'info', 'success', 'warning', 'error'];
  return allowed.includes(value as NotifyLevel) ? (value as NotifyLevel) : 'info';
}

const payload: NotifyPayload = {
  title: argValue('title') ?? env('NOTIFY_TITLE', 'Thông báo hệ thống'),
  message: argValue('message') ?? env('NOTIFY_MESSAGE', 'Đây là tin nhắn thử nghiệm.'),
  level: normalizeLevel(argValue('level') ?? env('DEFAULT_LEVEL', 'info')),
  timestamp: new Date().toISOString(),
};

const results = await sendToConfiguredChannels(payload);

console.log('\nPayload:');
console.log(JSON.stringify(payload, null, 2));

console.log('\nKết quả gửi:');
for (const result of results) {
  if (result.status === 'sent') {
    console.log(`✅ ${result.channel}: sent${result.detail ? ` - ${result.detail}` : ''}`);
  } else if (result.status === 'skipped') {
    console.log(`⏭️  ${result.channel}: skipped - ${result.reason}`);
  } else {
    console.log(`❌ ${result.channel}: failed - ${result.error}`);
  }
}

const hasFailure = results.some((result) => result.status === 'failed');
process.exitCode = hasFailure ? 1 : 0;
