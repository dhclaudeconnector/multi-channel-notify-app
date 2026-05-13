# Task: <tên task ngắn>

## User prompt

>

- Chuyển tất cả var trong .env với prefix: `MULTI_NOTIFY_`

## Thông tin cần xác nhận

Agent điền mục này nếu prompt thiếu dữ liệu cần thiết để triển khai đúng.

- [x] Không cần hỏi thêm
- [ ] Cần hỏi user trước khi làm

Câu hỏi cần xác nhận:

-

## Checklist triển khai

Agent tự tạo checklist từ `User prompt`, rồi đánh dấu khi từng bước hoàn tất.

- [x] Đọc yêu cầu user và xác định phạm vi thay đổi
- [x] Kiểm tra rule bắt buộc trong `CLAUDE.md`
- [x] Xác định file/thư mục cần chỉnh
- [x] Triển khai thay đổi cần thiết
- [x] Kiểm tra lại thay đổi phù hợp yêu cầu
- [x] Cập nhật `.opushforce.message` đúng format trong `CLAUDE.md`
- [x] Trả lời user ngắn gọn kèm file đã chỉnh

## File liên quan

Agent cập nhật danh sách file đã đọc/chỉnh.

- `src/cli.js`
- `src/index.js`
- `src/index.ts`
- `src/channels/email.ts`
- `src/channels/slack.ts`
- `src/channels/discord.ts`
- `src/channels/telegram.ts`
- `src/channels/twilio.ts`
- `src/channels/webhook.ts`
- `src/channels/ntfy.ts`
- `.env`
- `.env.example`
- `README.md`
- `tasks/done/task-add-ntfy.md`

## Kết quả kiểm tra

Agent ghi command đã chạy hoặc lý do không chạy.

- Đã grep toàn repo để rà prefix env cũ.
- `npm run dev -- --list-targets` → pass, CLI đọc prefix `MULTI_NOTIFY_` đúng.

## Ghi chú cho lần sau

Chỉ ghi thông tin hữu ích trực tiếp cho task này, không thay cho memory dài hạn.

- Toàn bộ env app/runtime đã chuẩn hoá sang prefix `MULTI_NOTIFY_`.
