# Kế hoạch kỹ thuật — trích xuất ảnh đơn thuốc

## Backend

`POST /api/v1/prescriptions/extract` nhận multipart `images`. Route xác thực user rồi chuyển byte/mime vào
`PrescriptionExtractionService`. Domain dùng Pillow kiểm tra signature, dimension/pixel và re-encode bỏ EXIF.
`LLMClient.generate_structured_with_images` là cửa duy nhất gọi Google GenAI async.

Service nhận structured model output, deduplicate text và batch nạp catalog thuốc/bệnh. Drug matching dùng
`search_catalog`; disease matching dùng cùng scorer trên catalog đóng. Response không chứa dữ liệu nhận dạng,
không lưu database và không tạo history.

## Frontend

`PrescriptionImageUpload` gọi mutation qua `queries/interactions.ts`, hiển thị processing/error/empty state và
danh sách editor. Mỗi editor dùng hook catalog hiện có khi text thay đổi. Nút áp dụng chỉ chuyển candidate đã
chọn thành `IDrugItem`/`IDiseaseItem`; parent hợp nhất theo stable ID vào input hiện tại.

## Kiểm thử

Unit test validation ảnh, dedup, catalog matching và model failure bằng fake LLM. Integration test multipart
override service, xác minh auth/contract/validation. Frontend được kiểm tra bằng lint/build vì project chưa chốt
test framework frontend.
