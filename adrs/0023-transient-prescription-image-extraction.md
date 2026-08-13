# ADR 0023 — Trích xuất ảnh đơn thuốc tạm thời và xác nhận catalog

- Trạng thái: Được chấp nhận
- Ngày: 13/08/2026
- Bổ sung: ADR 0013 và ADR 0017

## Bối cảnh

Người bệnh thường có ảnh đơn thuốc thay vì danh sách thuốc dạng text. OCR thuần ký tự không đủ phân biệt
tên biệt dược, hoạt chất và chẩn đoán trong bố cục đơn thuốc tiếng Việt. Tuy nhiên ảnh có thể chứa dữ liệu
sức khỏe và thông tin nhận dạng; output của model cũng không phải định danh catalog đáng tin cậy.

## Quyết định

Backend nhận tối đa năm ảnh JPEG/PNG/WEBP, kiểm tra signature, giới hạn từng ảnh 10 MB, tổng 25 MB và giới
hạn số pixel. Ảnh được sửa orientation, re-encode trong RAM để bỏ metadata, gửi một lần tới Google GenAI
qua `LLMClient`, rồi giải phóng khi request kết thúc. Không ghi ảnh, filename hay output model vào database,
object storage hoặc application log.

Gemini 3.5 Flash-Lite dùng structured output để chép tên thuốc, hoạt chất nhìn thấy và bệnh/chẩn đoán được ghi
rõ trên đơn. Model không được suy bệnh từ thuốc, không được tạo liều hoặc tự chọn catalog ID. Backend dùng
normalization hiện hành để trả các candidate thuốc/bệnh có stable ID. Người dùng phải chỉnh sửa và xác nhận
từng candidate trước khi chúng được thêm vào input của `POST /api/v1/interactions/check`.

Upload là hành động chủ động đồng ý gửi ảnh tới provider. UI phải nói rõ ảnh được gửi cho Gemini và không
được lưu bởi ứng dụng. Lỗi model, ảnh không đọc được hoặc không có candidate không được âm thầm biến thành
danh sách thuốc trống đã xác nhận.

Google GenAI SDK phải được cấu hình `HttpRetryOptions(attempts=1)` trên request path. SDK mặc định retry
429/5xx nhiều lần, có thể che lỗi Gemini quá tải thành timeout 504. Quota và quá tải được trả `503` với
thông báo phân biệt để người dùng chủ động thử lại; timeout thực mới trả `504`.

## Hệ quả

Tích cực: người dùng nhập nhanh đơn thuốc nhưng exact interaction lookup vẫn chỉ nhận stable catalog ID; ảnh
nhạy cảm không tạo thêm kho lưu trữ cần quản trị vòng đời.

Tiêu cực: provider bên ngoài xử lý ảnh trong thời gian request và kết quả phụ thuộc chất lượng ảnh. Người dùng
phải thực hiện thêm bước xác nhận; ảnh không được lưu nên khi request lỗi phải tải lại.
