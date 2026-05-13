# Multi Env Notify CLI

CLI gửi thông báo đa kênh theo nguyên tắc:

> Kênh nào đủ cấu hình `.env` thì gửi. Kênh nào thiếu cấu hình thì tự bỏ qua.

Bản này được cấu trúc theo hướng dễ public lên npmjs: không cần build TypeScript, chạy trực tiếp bằng Node.js ESM, có `bin` command.

## Kênh hỗ trợ

- Telegram: nhiều bot, nhiều group/chat, topic/thread.
- Email SMTP: một hoặc nhiều cấu hình SMTP.
- Slack Incoming Webhook.
- Discord Incoming Webhook.
- Twilio SMS.
- Generic Webhook.

## Cài đặt dev

```bash
pnpm install
cp .env.example .env
pnpm dev -- --title "Test" --message "Xin chào" --level success
```

## Chạy CLI

```bash
node bin/multi-notify.js --title "Deploy OK" --message "Production đã deploy xong" --level success
```

Sau khi publish npm:

```bash
npx multi-env-notify-cli --title "Deploy OK" --message "Production đã deploy xong" --level success
```

Hoặc cài global:

```bash
npm i -g multi-env-notify-cli
multi-notify --title "Hello" --message "Tin nhắn từ CLI"
```

## Quy tắc Telegram

### 1 bot gửi 1 group/chat

```env
TELEGRAM_BOT_TOKEN=123456:ABC
TELEGRAM_CHAT_ID=-1001111111111
TELEGRAM_PARSE_MODE=HTML
```

### 1 bot gửi nhiều group/chat

```env
TELEGRAM_BOT_TOKEN=123456:ABC

TELEGRAM_CHAT_ID_1=-1001111111111
TELEGRAM_CHAT_ID_1_NAME=ops-group

TELEGRAM_CHAT_ID_2=-1002222222222
TELEGRAM_CHAT_ID_2_NAME=dev-group
```

### Nhiều bot, mỗi bot gửi nhiều group/chat

```env
TELEGRAM_BOT_1_NAME=ops-bot
TELEGRAM_BOT_1_TOKEN=111111:AAA
TELEGRAM_BOT_1_CHAT_ID_1=-1001111111111
TELEGRAM_BOT_1_CHAT_ID_1_NAME=ops-group
TELEGRAM_BOT_1_CHAT_ID_2=-1002222222222
TELEGRAM_BOT_1_CHAT_ID_2_NAME=dev-group

TELEGRAM_BOT_2_NAME=business-bot
TELEGRAM_BOT_2_TOKEN=222222:BBB
TELEGRAM_BOT_2_CHAT_ID_1=-1003333333333
TELEGRAM_BOT_2_CHAT_ID_1_NAME=business-group
```

### Gửi vào topic/forum của Telegram group

```env
TELEGRAM_BOT_1_TOKEN=111111:AAA
TELEGRAM_BOT_1_CHAT_ID_1=-1001111111111
TELEGRAM_BOT_1_CHAT_ID_1_THREAD_ID=12345
```

### Dạng danh sách nhanh

```env
TELEGRAM_BOT_3_TOKEN=333333:CCC
TELEGRAM_BOT_3_CHAT_IDS=-1001111111111,-1002222222222
```

## CLI options

```bash
multi-notify \
  --title "Cảnh báo" \
  --message "Dung lượng ổ đĩa vượt 90%" \
  --level warning \
  --meta server=prod-01 \
  --meta disk=92%
```

| Option | Mô tả |
|---|---|
| `--title` | Tiêu đề tin nhắn |
| `--message` | Nội dung tin nhắn |
| `--level` | `debug`, `info`, `success`, `warning`, `error` |
| `--meta key=value` | Thêm metadata, dùng được nhiều lần |
| `--env-file .env.prod` | Load file env tùy chọn |
| `--json` | In kết quả dạng JSON |
| `--only telegram,slack` | Chỉ gửi một số provider |
| `--dry-run` | Chỉ hiển thị target sẽ gửi, không gửi thật |
| `--list-targets` | Liệt kê target đang detect được từ env |

## Kiểm tra target trước khi gửi

```bash
multi-notify --list-targets
```

Chỉ kiểm tra Telegram:

```bash
multi-notify --only telegram --list-targets
```

Dry-run:

```bash
multi-notify --only telegram --dry-run --title "Test" --message "Không gửi thật"
```

## Publish npm

1. Sửa `name` trong `package.json` nếu tên `multi-env-notify-cli` đã bị dùng.
2. Login npm:

```bash
npm login
```

3. Kiểm tra gói publish:

```bash
npm pack --dry-run
```

4. Publish:

```bash
npm publish --access public
```

## Bảo mật

- Không commit `.env`.
- Không đưa token thật vào README, test, fixture hoặc `.env.example`.
- Token Telegram/Twilio/Slack/Discord nếu lộ phải rotate ngay.
