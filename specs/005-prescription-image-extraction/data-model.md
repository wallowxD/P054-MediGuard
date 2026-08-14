# Data model — trích xuất ảnh đơn thuốc

Không có bảng mới và không persist ảnh/output.

- `PrescriptionImageInput`: byte đã upload + declared MIME, chỉ sống trong request.
- `ExtractedDrug`: raw text, tên thuốc, hoạt chất, uncertain và danh sách catalog candidate.
- `ExtractedDisease`: raw text, uncertain và danh sách canonical disease candidate.
- `CatalogCandidate`: stable UUID, tên hiển thị và confidence; chỉ trở thành input tra cứu sau thao tác xác nhận.

Invariant: model output không chứa stable ID; stable ID chỉ do repository catalog và deterministic matcher tạo.
