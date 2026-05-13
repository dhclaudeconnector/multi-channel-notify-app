import nodemailer from 'nodemailer';

const LEVEL_ICONS = {
  debug: '🔎',
  info: 'ℹ️',
  success: '✅',
  warning: '⚠️',
  error: '🚨',
};

export function env(name, fallback = '') {
  const value = process.env[name];
  return value === undefined || value === null ? fallback : String(value).trim();
}

export function hasEnv(name) {
  return env(name).length > 0;
}

export function boolEnv(name, fallback = false) {
  const value = env(name);
  if (!value) return fallback;
  return ['1', 'true', 'yes', 'y', 'on'].includes(value.toLowerCase());
}

export function intEnv(name) {
  const value = env(name);
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function uniqueNumbersFromRegex(regex) {
  const values = new Set();
  for (const key of Object.keys(process.env)) {
    const match = key.match(regex);
    if (match?.[1]) values.add(match[1]);
  }
  return [...values].sort((a, b) => Number(a) - Number(b));
}

function splitCsv(value) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function htmlEscape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function telegramEscape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export function textMessage(payload) {
  const icon = LEVEL_ICONS[payload.level] ?? LEVEL_ICONS.info;
  const metaText = payload.meta && Object.keys(payload.meta).length
    ? `\n\nMeta:\n${JSON.stringify(payload.meta, null, 2)}`
    : '';

  return [
    `${icon} ${payload.title}`,
    '',
    payload.message,
    '',
    `App: ${env('MULTI_NOTIFY_APP_NAME', 'Multi Env Notify')}`,
    `Level: ${payload.level}`,
    `Time: ${payload.timestamp}${metaText}`,
  ].join('\n');
}

export function htmlMessage(payload) {
  const icon = LEVEL_ICONS[payload.level] ?? LEVEL_ICONS.info;
  const metaHtml = payload.meta && Object.keys(payload.meta).length
    ? `<h3>Meta</h3><pre>${htmlEscape(JSON.stringify(payload.meta, null, 2))}</pre>`
    : '';

  return `
    <div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>${icon} ${htmlEscape(payload.title)}</h2>
      <p>${htmlEscape(payload.message).replaceAll('\n', '<br/>')}</p>
      <p><b>App:</b> ${htmlEscape(env('MULTI_NOTIFY_APP_NAME', 'Multi Env Notify'))}</p>
      <p><b>Level:</b> ${htmlEscape(payload.level)}</p>
      <p><b>Time:</b> ${htmlEscape(payload.timestamp)}</p>
      ${metaHtml}
    </div>`;
}

export function telegramHtmlMessage(payload) {
  const icon = LEVEL_ICONS[payload.level] ?? LEVEL_ICONS.info;
  const metaLines = payload.meta && Object.keys(payload.meta).length
    ? ['', '<b>Meta:</b>', telegramEscape(JSON.stringify(payload.meta, null, 2))]
    : [];

  return [
    `${icon} <b>${telegramEscape(payload.title)}</b>`,
    '',
    telegramEscape(payload.message),
    '',
    `<b>App:</b> ${telegramEscape(env('MULTI_NOTIFY_APP_NAME', 'Multi Env Notify'))}`,
    `<b>Level:</b> ${telegramEscape(payload.level)}`,
    `<b>Time:</b> ${telegramEscape(payload.timestamp)}`,
    ...metaLines,
  ].join('\n');
}

function addUniqueTarget(targets, target) {
  const key = `${target.provider}|${target.targetKey}`;
  if (!targets.some((item) => `${item.provider}|${item.targetKey}` === key)) {
    targets.push(target);
  }
}

export function discoverTelegramTargets() {
  const targets = [];

  const defaultToken = env('MULTI_NOTIFY_TELEGRAM_BOT_TOKEN');
  if (defaultToken) {
    const botName = env('MULTI_NOTIFY_TELEGRAM_BOT_NAME', 'default-bot');
    const parseMode = env('MULTI_NOTIFY_TELEGRAM_PARSE_MODE', 'HTML');

    if (hasEnv('MULTI_NOTIFY_TELEGRAM_CHAT_ID')) {
      addUniqueTarget(targets, {
        provider: 'telegram',
        targetKey: `${defaultToken}|${env('MULTI_NOTIFY_TELEGRAM_CHAT_ID')}|${intEnv('MULTI_NOTIFY_TELEGRAM_CHAT_ID_THREAD_ID') ?? intEnv('MULTI_NOTIFY_TELEGRAM_MESSAGE_THREAD_ID') ?? intEnv('MULTI_NOTIFY_TELEGRAM_THREAD_ID') ?? ''}`,
        botName,
        token: defaultToken,
        chatId: env('MULTI_NOTIFY_TELEGRAM_CHAT_ID'),
        chatName: env('MULTI_NOTIFY_TELEGRAM_CHAT_NAME', 'default-chat'),
        parseMode,
        threadId: intEnv('MULTI_NOTIFY_TELEGRAM_CHAT_ID_THREAD_ID') ?? intEnv('MULTI_NOTIFY_TELEGRAM_MESSAGE_THREAD_ID') ?? intEnv('MULTI_NOTIFY_TELEGRAM_THREAD_ID'),
      });
    }

    for (const no of uniqueNumbersFromRegex(/^TELEGRAM_CHAT_ID_(\d+)$/)) {
      const threadId = intEnv(`TELEGRAM_CHAT_ID_${no}_THREAD_ID`) ?? intEnv(`TELEGRAM_MESSAGE_THREAD_ID_${no}`) ?? intEnv(`TELEGRAM_THREAD_ID_${no}`);
      addUniqueTarget(targets, {
        provider: 'telegram',
        targetKey: `${defaultToken}|${env(`TELEGRAM_CHAT_ID_${no}`)}|${threadId ?? ''}`,
        botName,
        token: defaultToken,
        chatId: env(`TELEGRAM_CHAT_ID_${no}`),
        chatName: env(`TELEGRAM_CHAT_ID_${no}_NAME`, env(`TELEGRAM_CHAT_NAME_${no}`, `chat-${no}`)),
        parseMode,
        threadId,
      });
    }

    splitCsv(env('MULTI_NOTIFY_TELEGRAM_CHAT_IDS')).forEach((chatId, index) => {
      addUniqueTarget(targets, {
        provider: 'telegram',
        targetKey: `${defaultToken}|${chatId}|`,
        botName,
        token: defaultToken,
        chatId,
        chatName: `csv-chat-${index + 1}`,
        parseMode,
      });
    });
  }

  const botIndexes = new Set([
    ...uniqueNumbersFromRegex(/^MULTI_NOTIFY_TELEGRAM_BOT_(\d+)_TOKEN$/),
    ...uniqueNumbersFromRegex(/^MULTI_NOTIFY_TELEGRAM_BOT_TOKEN_(\d+)$/),
  ]);

  for (const botNo of [...botIndexes].sort((a, b) => Number(a) - Number(b))) {
    const token = env(`MULTI_NOTIFY_TELEGRAM_BOT_${botNo}_TOKEN`, env(`MULTI_NOTIFY_TELEGRAM_BOT_TOKEN_${botNo}`));
    if (!token) continue;

    const botName = env(`MULTI_NOTIFY_TELEGRAM_BOT_${botNo}_NAME`, `bot-${botNo}`);
    const parseMode = env(`TELEGRAM_BOT_${botNo}_PARSE_MODE`, env('MULTI_NOTIFY_TELEGRAM_PARSE_MODE', 'HTML'));

    if (hasEnv(`MULTI_NOTIFY_TELEGRAM_BOT_${botNo}_CHAT_ID`)) {
      const threadId = intEnv(`MULTI_NOTIFY_TELEGRAM_BOT_${botNo}_CHAT_ID_THREAD_ID`);
      addUniqueTarget(targets, {
        provider: 'telegram',
        targetKey: `${token}|${env(`MULTI_NOTIFY_TELEGRAM_BOT_${botNo}_CHAT_ID`)}|${threadId ?? ''}`,
        botName,
        token,
        chatId: env(`MULTI_NOTIFY_TELEGRAM_BOT_${botNo}_CHAT_ID`),
        chatName: env(`MULTI_NOTIFY_TELEGRAM_BOT_${botNo}_CHAT_ID_NAME`, `bot-${botNo}-chat`),
        parseMode,
        threadId,
      });
    }

    const chatIndexes = uniqueNumbersFromRegex(new RegExp(`^MULTI_NOTIFY_TELEGRAM_BOT_${botNo}_CHAT_ID_(\\d+)$`));
    for (const chatNo of chatIndexes) {
      const threadId = intEnv(`MULTI_NOTIFY_TELEGRAM_BOT_${botNo}_CHAT_ID_${chatNo}_THREAD_ID`);
      addUniqueTarget(targets, {
        provider: 'telegram',
        targetKey: `${token}|${env(`MULTI_NOTIFY_TELEGRAM_BOT_${botNo}_CHAT_ID_${chatNo}`)}|${threadId ?? ''}`,
        botName,
        token,
        chatId: env(`MULTI_NOTIFY_TELEGRAM_BOT_${botNo}_CHAT_ID_${chatNo}`),
        chatName: env(`MULTI_NOTIFY_TELEGRAM_BOT_${botNo}_CHAT_ID_${chatNo}_NAME`, `bot-${botNo}-chat-${chatNo}`),
        parseMode,
        threadId,
      });
    }

    splitCsv(env(`MULTI_NOTIFY_TELEGRAM_BOT_${botNo}_CHAT_IDS`)).forEach((chatId, index) => {
      addUniqueTarget(targets, {
        provider: 'telegram',
        targetKey: `${token}|${chatId}|`,
        botName,
        token,
        chatId,
        chatName: `bot-${botNo}-csv-chat-${index + 1}`,
        parseMode,
      });
    });
  }

  return targets;
}

function telegramTasks() {
  const targets = discoverTelegramTargets();
  if (targets.length === 0) {
    return {
      tasks: [],
      skipped: [{ provider: 'telegram', target: 'telegram', status: 'skipped', reason: 'Thiếu MULTI_NOTIFY_TELEGRAM_BOT_TOKEN + MULTI_NOTIFY_TELEGRAM_CHAT_ID hoặc MULTI_NOTIFY_TELEGRAM_BOT_<NO>_TOKEN + MULTI_NOTIFY_TELEGRAM_BOT_<NO>_CHAT_ID_<NO>.' }],
    };
  }

  return {
    tasks: targets.map((target) => ({
      provider: 'telegram',
      target: `${target.botName}/${target.chatName}`,
      async send(payload) {
        const body = {
          chat_id: target.chatId,
          text: target.parseMode.toUpperCase() === 'HTML' ? telegramHtmlMessage(payload) : textMessage(payload),
          parse_mode: target.parseMode,
          disable_web_page_preview: true,
        };
        if (target.threadId !== undefined) body.message_thread_id = target.threadId;

        const response = await fetch(`https://api.telegram.org/bot${target.token}/sendMessage`, {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(body),
        });
        const text = await response.text();
        if (!response.ok) throw new Error(`Telegram HTTP ${response.status}: ${text}`);

        try {
          const data = JSON.parse(text);
          return { provider: 'telegram', target: `${target.botName}/${target.chatName}`, status: 'sent', detail: data?.result?.message_id ? `message_id=${data.result.message_id}` : 'sent' };
        } catch {
          return { provider: 'telegram', target: `${target.botName}/${target.chatName}`, status: 'sent', detail: 'sent' };
        }
      },
    })),
    skipped: [],
  };
}

function webhookTargets(prefix, defaultUrlName, defaultName, numberedUrlPattern, nameVarForNo) {
  const targets = [];
  if (hasEnv(defaultUrlName)) {
    targets.push({ name: env(`${prefix}_NAME`, defaultName), url: env(defaultUrlName), no: 'default' });
  }
  for (const no of uniqueNumbersFromRegex(numberedUrlPattern)) {
    targets.push({ name: env(nameVarForNo(no), `${defaultName}-${no}`), url: env(`${defaultUrlName}_${no}`), no });
  }
  return targets;
}

function slackTasks() {
  const targets = webhookTargets('MULTI_NOTIFY_SLACK_WEBHOOK', 'MULTI_NOTIFY_SLACK_WEBHOOK_URL', 'slack', /^MULTI_NOTIFY_SLACK_WEBHOOK_URL_(\d+)$/, (no) => `MULTI_NOTIFY_SLACK_WEBHOOK_URL_${no}_NAME`);
  if (targets.length === 0) return { tasks: [], skipped: [{ provider: 'slack', target: 'slack', status: 'skipped', reason: 'Thiếu MULTI_NOTIFY_SLACK_WEBHOOK_URL hoặc MULTI_NOTIFY_SLACK_WEBHOOK_URL_<NO>.' }] };
  return { tasks: targets.map((target) => ({ provider: 'slack', target: target.name, async send(payload) {
    const response = await fetch(target.url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ text: `*${payload.title}*\n${payload.message}\n\nLevel: ${payload.level}\nTime: ${payload.timestamp}` }) });
    if (!response.ok) throw new Error(`Slack HTTP ${response.status}: ${await response.text()}`);
    return { provider: 'slack', target: target.name, status: 'sent', detail: `HTTP ${response.status}` };
  }})), skipped: [] };
}

function discordTasks() {
  const targets = webhookTargets('MULTI_NOTIFY_DISCORD_WEBHOOK', 'MULTI_NOTIFY_DISCORD_WEBHOOK_URL', 'discord', /^MULTI_NOTIFY_DISCORD_WEBHOOK_URL_(\d+)$/, (no) => `MULTI_NOTIFY_DISCORD_WEBHOOK_URL_${no}_NAME`);
  if (targets.length === 0) return { tasks: [], skipped: [{ provider: 'discord', target: 'discord', status: 'skipped', reason: 'Thiếu MULTI_NOTIFY_DISCORD_WEBHOOK_URL hoặc MULTI_NOTIFY_DISCORD_WEBHOOK_URL_<NO>.' }] };
  const colors = { debug: 8421504, info: 3447003, success: 5763719, warning: 16776960, error: 15548997 };
  return { tasks: targets.map((target) => ({ provider: 'discord', target: target.name, async send(payload) {
    const response = await fetch(target.url, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ username: env('MULTI_NOTIFY_APP_NAME', 'Multi Env Notify'), embeds: [{ title: payload.title, description: payload.message, color: colors[payload.level] ?? colors.info, fields: [{ name: 'Level', value: payload.level, inline: true }, { name: 'Time', value: payload.timestamp, inline: true }] }] }) });
    if (!response.ok) throw new Error(`Discord HTTP ${response.status}: ${await response.text()}`);
    return { provider: 'discord', target: target.name, status: 'sent', detail: `HTTP ${response.status}` };
  }})), skipped: [] };
}

function ntfyTasks() {
  if (!hasEnv('MULTI_NOTIFY_NTFY_TOPIC')) return { tasks: [], skipped: [{ provider: 'ntfy', target: 'ntfy', status: 'skipped', reason: 'Thiếu MULTI_NOTIFY_NTFY_TOPIC.' }] };
  const target = {
    name: env('MULTI_NOTIFY_NTFY_NAME', env('MULTI_NOTIFY_NTFY_TOPIC')),
    topic: env('MULTI_NOTIFY_NTFY_TOPIC'),
    serverUrl: `${env('MULTI_NOTIFY_NTFY_SERVER_URL', 'https://ntfy.sh').replace(/\/+$/, '')}/`,
  };

  return { tasks: [{ provider: 'ntfy', target: target.name, async send(payload) {
    const body = {
      topic: target.topic,
      title: payload.title,
      message: textMessage(payload),
      priority: Number(env('MULTI_NOTIFY_NTFY_PRIORITY', payload.level === 'error' ? '4' : '3')),
    };
    if (hasEnv('MULTI_NOTIFY_NTFY_TAGS')) body.tags = env('MULTI_NOTIFY_NTFY_TAGS').split(',').map((item) => item.trim()).filter(Boolean);
    if (hasEnv('MULTI_NOTIFY_NTFY_CLICK_URL')) body.click = env('MULTI_NOTIFY_NTFY_CLICK_URL');

    const headers = { 'content-type': 'application/json' };
    if (hasEnv('MULTI_NOTIFY_NTFY_TOKEN')) headers.authorization = `Bearer ${env('MULTI_NOTIFY_NTFY_TOKEN')}`;

    const response = await fetch(target.serverUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) throw new Error(`ntfy HTTP ${response.status}: ${await response.text()}`);
    return { provider: 'ntfy', target: target.name, status: 'sent', detail: `HTTP ${response.status}` };
  }}], skipped: [] };
}

function genericWebhookTasks() {
  const targets = [];
  if (hasEnv('MULTI_NOTIFY_WEBHOOK_URL')) targets.push({ name: env('MULTI_NOTIFY_WEBHOOK_NAME', 'webhook'), url: env('MULTI_NOTIFY_WEBHOOK_URL'), method: env('MULTI_NOTIFY_WEBHOOK_METHOD', 'POST') });
  for (const no of uniqueNumbersFromRegex(/^MULTI_NOTIFY_WEBHOOK_URL_(\d+)$/)) targets.push({ name: env(`MULTI_NOTIFY_WEBHOOK_URL_${no}_NAME`, `webhook-${no}`), url: env(`MULTI_NOTIFY_WEBHOOK_URL_${no}`), method: env(`MULTI_NOTIFY_WEBHOOK_METHOD_${no}`, 'POST') });
  if (targets.length === 0) return { tasks: [], skipped: [{ provider: 'webhook', target: 'webhook', status: 'skipped', reason: 'Thiếu MULTI_NOTIFY_WEBHOOK_URL hoặc MULTI_NOTIFY_WEBHOOK_URL_<NO>.' }] };
  return { tasks: targets.map((target) => ({ provider: 'webhook', target: target.name, async send(payload) {
    const response = await fetch(target.url, { method: target.method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error(`Webhook HTTP ${response.status}: ${await response.text()}`);
    return { provider: 'webhook', target: target.name, status: 'sent', detail: `HTTP ${response.status}` };
  }})), skipped: [] };
}

function emailTasks() {
  const targets = [];
  const defaultRequired = ['MULTI_NOTIFY_SMTP_HOST', 'MULTI_NOTIFY_SMTP_PORT', 'MULTI_NOTIFY_SMTP_USER', 'MULTI_NOTIFY_SMTP_PASS', 'MULTI_NOTIFY_EMAIL_FROM', 'MULTI_NOTIFY_EMAIL_TO'];
  if (defaultRequired.every(hasEnv)) {
    targets.push({ name: env('MULTI_NOTIFY_EMAIL_NAME', 'email'), host: env('MULTI_NOTIFY_SMTP_HOST'), port: Number(env('MULTI_NOTIFY_SMTP_PORT', '587')), secure: boolEnv('MULTI_NOTIFY_SMTP_SECURE'), user: env('MULTI_NOTIFY_SMTP_USER'), pass: env('MULTI_NOTIFY_SMTP_PASS'), from: env('MULTI_NOTIFY_EMAIL_FROM'), to: env('MULTI_NOTIFY_EMAIL_TO') });
  }
  const indexes = new Set([...uniqueNumbersFromRegex(/^MULTI_NOTIFY_SMTP_(\d+)_HOST$/), ...uniqueNumbersFromRegex(/^MULTI_NOTIFY_EMAIL_(\d+)_TO$/)]);
  for (const no of [...indexes].sort((a, b) => Number(a) - Number(b))) {
    const required = [`MULTI_NOTIFY_SMTP_${no}_HOST`, `MULTI_NOTIFY_SMTP_${no}_PORT`, `MULTI_NOTIFY_SMTP_${no}_USER`, `MULTI_NOTIFY_SMTP_${no}_PASS`, `MULTI_NOTIFY_EMAIL_${no}_FROM`, `MULTI_NOTIFY_EMAIL_${no}_TO`];
    if (required.every(hasEnv)) targets.push({ name: env(`MULTI_NOTIFY_EMAIL_${no}_NAME`, `email-${no}`), host: env(`MULTI_NOTIFY_SMTP_${no}_HOST`), port: Number(env(`MULTI_NOTIFY_SMTP_${no}_PORT`, '587')), secure: boolEnv(`MULTI_NOTIFY_SMTP_${no}_SECURE`), user: env(`MULTI_NOTIFY_SMTP_${no}_USER`), pass: env(`MULTI_NOTIFY_SMTP_${no}_PASS`), from: env(`MULTI_NOTIFY_EMAIL_${no}_FROM`), to: env(`MULTI_NOTIFY_EMAIL_${no}_TO`) });
  }
  if (targets.length === 0) return { tasks: [], skipped: [{ provider: 'email', target: 'email', status: 'skipped', reason: 'Thiếu MULTI_NOTIFY_SMTP_HOST, MULTI_NOTIFY_SMTP_PORT, MULTI_NOTIFY_SMTP_USER, MULTI_NOTIFY_SMTP_PASS, MULTI_NOTIFY_EMAIL_FROM, MULTI_NOTIFY_EMAIL_TO hoặc MULTI_NOTIFY_SMTP_<NO>_* + MULTI_NOTIFY_EMAIL_<NO>_*.' }] };
  return { tasks: targets.map((target) => ({ provider: 'email', target: target.name, async send(payload) {
    const transporter = nodemailer.createTransport({ host: target.host, port: target.port, secure: target.secure, auth: { user: target.user, pass: target.pass } });
    const info = await transporter.sendMail({ from: target.from, to: target.to, subject: `[${payload.level.toUpperCase()}] ${payload.title}`, text: textMessage(payload), html: htmlMessage(payload) });
    return { provider: 'email', target: target.name, status: 'sent', detail: String(info.messageId ?? 'sent') };
  }})), skipped: [] };
}

function twilioTasks() {
  const targets = [];
  const defaultRequired = ['MULTI_NOTIFY_TWILIO_ACCOUNT_SID', 'MULTI_NOTIFY_TWILIO_AUTH_TOKEN', 'MULTI_NOTIFY_TWILIO_FROM_NUMBER', 'MULTI_NOTIFY_TWILIO_TO_NUMBER'];
  if (defaultRequired.every(hasEnv)) targets.push({ name: env('MULTI_NOTIFY_TWILIO_NAME', 'twilio'), sid: env('MULTI_NOTIFY_TWILIO_ACCOUNT_SID'), token: env('MULTI_NOTIFY_TWILIO_AUTH_TOKEN'), from: env('MULTI_NOTIFY_TWILIO_FROM_NUMBER'), to: env('MULTI_NOTIFY_TWILIO_TO_NUMBER') });
  const indexes = new Set([...uniqueNumbersFromRegex(/^MULTI_NOTIFY_TWILIO_(\d+)_ACCOUNT_SID$/), ...uniqueNumbersFromRegex(/^MULTI_NOTIFY_TWILIO_(\d+)_TO_NUMBER$/)]);
  for (const no of [...indexes].sort((a, b) => Number(a) - Number(b))) {
    const required = [`MULTI_NOTIFY_TWILIO_${no}_ACCOUNT_SID`, `MULTI_NOTIFY_TWILIO_${no}_AUTH_TOKEN`, `MULTI_NOTIFY_TWILIO_${no}_FROM_NUMBER`, `MULTI_NOTIFY_TWILIO_${no}_TO_NUMBER`];
    if (required.every(hasEnv)) targets.push({ name: env(`MULTI_NOTIFY_TWILIO_${no}_NAME`, `twilio-${no}`), sid: env(`MULTI_NOTIFY_TWILIO_${no}_ACCOUNT_SID`), token: env(`MULTI_NOTIFY_TWILIO_${no}_AUTH_TOKEN`), from: env(`MULTI_NOTIFY_TWILIO_${no}_FROM_NUMBER`), to: env(`MULTI_NOTIFY_TWILIO_${no}_TO_NUMBER`) });
  }
  if (targets.length === 0) return { tasks: [], skipped: [{ provider: 'twilio', target: 'twilio', status: 'skipped', reason: 'Thiếu MULTI_NOTIFY_TWILIO_ACCOUNT_SID, MULTI_NOTIFY_TWILIO_AUTH_TOKEN, MULTI_NOTIFY_TWILIO_FROM_NUMBER, MULTI_NOTIFY_TWILIO_TO_NUMBER hoặc MULTI_NOTIFY_TWILIO_<NO>_*.' }] };
  return { tasks: targets.map((target) => ({ provider: 'twilio', target: target.name, async send(payload) {
    const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${target.sid}/Messages.json`, { method: 'POST', headers: { authorization: `Basic ${Buffer.from(`${target.sid}:${target.token}`).toString('base64')}`, 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ From: target.from, To: target.to, Body: textMessage(payload).slice(0, 1500) }) });
    const text = await response.text();
    if (!response.ok) throw new Error(`Twilio HTTP ${response.status}: ${text}`);
    try { const data = JSON.parse(text); return { provider: 'twilio', target: target.name, status: 'sent', detail: data?.sid ?? 'sent' }; } catch { return { provider: 'twilio', target: target.name, status: 'sent', detail: 'sent' }; }
  }})), skipped: [] };
}

export function buildPlans() {
  return [telegramTasks(), emailTasks(), slackTasks(), discordTasks(), twilioTasks(), ntfyTasks(), genericWebhookTasks()];
}

export function collectTasks(options = {}) {
  const only = options.onlyProviders?.map((item) => item.toLowerCase());
  const tasks = [];
  const skipped = [];

  for (const plan of buildPlans()) {
    tasks.push(...plan.tasks);
    skipped.push(...plan.skipped);
  }

  if (!only || only.length === 0) return { tasks, skipped };

  return {
    tasks: tasks.filter((task) => only.includes(task.provider.toLowerCase())),
    skipped: skipped.filter((item) => only.includes(item.provider.toLowerCase())),
  };
}

export async function sendNotification(payload, options = {}) {
  const { tasks, skipped } = collectTasks(options);

  if (options.dryRun) {
    return [
      ...tasks.map((task) => ({ provider: task.provider, target: task.target, status: 'skipped', reason: 'dry-run: target hợp lệ, chưa gửi thật' })),
      ...skipped,
    ];
  }

  const results = await Promise.all(tasks.map(async (task) => {
    try {
      return await task.send(payload);
    } catch (error) {
      return { provider: task.provider, target: task.target, status: 'failed', error: error instanceof Error ? error.message : String(error) };
    }
  }));

  return [...results, ...skipped];
}
