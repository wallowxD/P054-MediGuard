# ADR 0005 — Human-in-the-loop không chặn hiển thị

- **Trạng thái:** Được chấp nhận
- **Ngày:** 2026-08-02

## Bối cảnh

Dữ liệu được trích xuất tự động nên cần dược sĩ duyệt. Tuy nhiên chờ duyệt trước khi hiển
thị làm mất giá trị tức thời và mâu thuẫn product flow.

## Quyết định

Cảnh báo có evidence hợp lệ ở trạng thái `pending` hoặc `approved` được trả cho người dùng
ngay. `pending` hiển thị nhãn “đang chờ xác nhận chuyên môn”. `rejected` không được trả cho
patient client. Duyệt diễn ra song song, không phải full gate.

## Hệ quả

- ✅ Người dùng nhận thông tin tham khảo ngay.
- ✅ Trạng thái duyệt minh bạch.
- ❌ UI phải truyền đạt rõ `pending` không phải xác nhận chuyên môn.
- ❌ Versioning phải tránh sửa âm thầm evidence đã hiển thị.
