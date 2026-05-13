import dotenv from 'dotenv';
import { existsSync } from 'node:fs';
import { collectTasks, sendNotification } from './index.js';

function readArg(name) {
  const prefix = `--${name}=`;
  const direct = process.argv.find((arg) => arg.startsWith(prefix));
  if (direct) return direct.slice(prefix.length);

  const index = process.argv.indexOf(`--${name}`);
  if (index >= 0 && process.argv[index + 1] && !process.argv[index + 1].startsWith('--')) {
    return process.argv[index + 1];
  }
  return undefined;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function readRepeated(name) {
  const values = [];
  const prefix = `--${name}=`;

  for (let index = 0; index < process.argv.length; index += 1) {
    const arg = process.argv[index];
    if (arg.startsWith(prefix)) {
      values.push(arg.slice(prefix.length));
      continue;
    }
    if (arg === `--${name}` && process.argv[index + 1] && !process.argv[index + 1].startsWith('--')) {
      values.push(process.argv[index + 1]);
      index += 1;
    }
  }
  return values;
}

function parseMeta() {
  const meta = {};
  for (const item of readRepeated('meta')) {
    const [key, ...rest] = item.split('=');
    if (!key || rest.length === 0) continue;
    meta[key] = rest.join('=');
  }
  return meta;
}

function parseLevel(value) {
  const level = value ?? process.env.DEFAULT_LEVEL ?? 'info';
  const allowed = ['debug', 'info', 'success', 'warning', 'error'];
  return allowed.includes(level) ? level : 'info';
}

function loadEnvFile() {
  const envFile = readArg('env-file');
  if (envFile) {
    if (!existsSync(envFile)) throw new Error(`Không tìm thấy env file: ${envFile}`);
    dotenv.config({ path: envFile });
  } else {
    dotenv.config();
  }
}

function printHelp() {
  console.log(`
Multi Env Notify CLI

Usage:
  multi-notify --title "Deploy OK" --message "Production đã deploy xong" --level success

Options:
  --title <text>             Tiêu đề tin nhắn
  --message <text>           Nội dung tin nhắn
  --level <level>            debug | info | success | warning | error
  --meta key=value           Metadata, có thể dùng nhiều lần
  --env-file <path>          Load env file tùy chọn
  --only telegram,slack      Chỉ gửi một số provider
  --dry-run                  Không gửi thật, chỉ in target hợp lệ
  --list-targets             Liệt kê target detect được từ env
  --json                     In kết quả JSON
  --help                     Hiện hướng dẫn
`);
}

function printResults(results, json) {
  if (json) {
    console.log(JSON.stringify(results, null, 2));
    return;
  }

  console.log('\nKết quả:');
  for (const result of results) {
    const name = `${result.provider}/${result.target}`;
    if (result.status === 'sent') {
      console.log(`✅ ${name}: sent${result.detail ? ` - ${result.detail}` : ''}`);
    } else if (result.status === 'skipped') {
      console.log(`⏭️  ${name}: skipped - ${result.reason}`);
    } else {
      console.log(`❌ ${name}: failed - ${result.error}`);
    }
  }
}

export async function runCli() {
  if (hasFlag('help') || hasFlag('h')) {
    printHelp();
    return;
  }

  loadEnvFile();

  const onlyProviders = readArg('only')
    ?.split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (hasFlag('list-targets')) {
    const { tasks, skipped } = collectTasks({ onlyProviders });
    const rows = [
      ...tasks.map((task) => ({ provider: task.provider, target: task.target, status: 'configured' })),
      ...skipped.map((item) => item),
    ];

    if (hasFlag('json')) {
      console.log(JSON.stringify(rows, null, 2));
    } else {
      console.log('\nTargets:');
      for (const row of rows) {
        const reason = row.reason ? ` - ${row.reason}` : '';
        console.log(`- ${row.provider}/${row.target}: ${row.status}${reason}`);
      }
    }
    return;
  }

  const payload = {
    title: readArg('title') ?? process.env.NOTIFY_TITLE ?? 'Thông báo hệ thống',
    message: readArg('message') ?? process.env.NOTIFY_MESSAGE ?? 'Đây là tin nhắn thử nghiệm.',
    level: parseLevel(readArg('level')),
    timestamp: new Date().toISOString(),
    meta: parseMeta(),
  };

  const results = await sendNotification(payload, {
    onlyProviders,
    dryRun: hasFlag('dry-run'),
  });

  printResults(results, hasFlag('json'));

  const hasFailure = results.some((result) => result.status === 'failed');
  process.exitCode = hasFailure ? 1 : 0;
}
