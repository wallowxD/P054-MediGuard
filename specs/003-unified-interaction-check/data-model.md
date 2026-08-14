# Data model — tra cứu tương tác tổng hợp

## Snapshot history

`interaction_checks` thuộc đúng một `users.id`, chứa snapshot thuốc/bệnh, severity count
và tổng item. `interaction_check_entries` thuộc một check, có `entryType`, `ordinal` và
`payload` JSONB bất biến theo response contract.

Không lưu liên kết động tới interaction hiện hành vì lịch sử phải tái hiện đúng nội dung,
summary và citation mà người dùng đã nhìn thấy tại thời điểm tra cứu.

## Invariant

- `drugSnapshot` và `diseaseSnapshot` dùng stable UUID từ catalog.
- Entry chỉ thuộc một trong `interaction`, `note`, `unavailable`.
- `ordinal` duy nhất trong mỗi check.
- Không có policy PostgREST; backend là security boundary và lọc `user_id`.
- Không migration hoặc sửa dữ liệu ở các bảng interaction hiện hữu.

