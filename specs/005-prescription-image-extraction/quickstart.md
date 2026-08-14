# Quickstart — trích xuất ảnh đơn thuốc

1. Chạy backend/frontend từ repository root và đăng nhập.
2. Mở `/interactions/drug-drug`, chọn một ảnh JPG/PNG/WEBP dưới 10 MB.
3. Bấm `Phân tích ảnh với Gemini`; xác minh processing state và privacy notice.
4. Sửa một tên thuốc, chọn lại candidate catalog, xác nhận một bệnh nếu có.
5. Bấm áp dụng; xác minh stable ID xuất hiện trong danh sách thuốc/bệnh hiện tại mà không xóa mục nhập tay.
6. Bấm tra cứu và xác minh request chỉ chứa `drugIds`/`diseaseIds` đã xác nhận.
7. Thử file text đổi đuôi JPG, ảnh trên 10 MB và sáu ảnh; model không được gọi.
