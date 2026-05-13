# Task: Thêm channel ntfy

## User prompt

> Triển khai thêm channel theo repo: https://github.com/binwiederhier/ntfy

## Thông tin cần xác nhận

Agent điền mục này nếu prompt thiếu dữ liệu cần thiết để triển khai đúng.

- [x] Không cần hỏi thêm
- [ ] Cần hỏi user trước khi làm

Câu hỏi cần xác nhận:

- Không có

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

- `CLAUDE.md`
- `src/notify.ts`
- `src/channels/ntfy.ts`
- `src/format.ts`
- `src/env.ts`
- `src/types.ts`
- `.env.example`
- `README.md`
- `.opushforce.message`
- `tasks/task-add-ntfy.md`

## Kết quả kiểm tra

Agent ghi command đã chạy hoặc lý do không chạy.

- `npx tsc --noEmit` → pass.

## Ghi chú cho lần sau

Chỉ ghi thông tin hữu ích trực tiếp cho task này, không thay cho memory dài hạn.

- ntfy dùng HTTP publish, bật bằng `NTFY_TOPIC`; mặc định server là `https://ntfy.sh`.
