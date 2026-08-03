# Mô hình miền

Thuật ngữ dùng chung giữa backend, frontend và AI. Thay đổi ở đây phải đồng bộ domain,
schema, contract và frontend type.

## Entity

### Drug

| Field | Ý nghĩa |
|---|---|
| `brandName` | Biệt dược gốc từ catalog |
| `ingredient` | Hoạt chất + hàm lượng gốc |
| `leafletUrl` | Link PDF hướng dẫn sử dụng |

CSV dùng tên cột không dấu; catalog value và OCR có thể có dấu, casing hoặc notation khác.
Mọi so sánh đi qua `domain/normalization.py`, không so raw string.

### Interaction

| Field | Ý nghĩa |
|---|---|
| `kind` | `drug-drug` hoặc `drug-food`, quyết định lookup mechanism |
| `subject` / `object` | Thuốc thứ nhất và thuốc/thực phẩm thứ hai |
| `severity` | `contraindicated`, `major`, `moderate`, `minor`, `unknown` |
| `reviewStatus` | `pending`, `approved`, `rejected` |
| `mechanism` / `consequence` / `management` | Thông tin có nguồn, không phải lời khuyên sinh tự do |
| `citations` | Danh sách không rỗng |

Severity được tính deterministic ở backend; frontend chỉ render.

### Citation

| Field | Ràng buộc |
|---|---|
| `quote` | Nguyên văn, không paraphrase/dịch/truncate |
| `source` | Tên tài liệu/thuốc |
| `sourceUrl` | Link PDF gốc |
| `page` | Trang khi extraction cung cấp |
| `chunkId` | Stable identity để audit |

### EvidenceVersion

Version immutable gắn citation, extractor, timestamp và review state. Edit content tạo
version mới, không mutate version đã hiển thị hoặc review.

### Prescription

Danh sách Drug đã được user xác nhận. Từ N ingredient duy nhất, `domain/pairing.py` sinh
đúng C(N,2) canonical pair.

## ★ Ranh giới RAG

| Câu hỏi | Cơ chế |
|---|---|
| Drug-drug tồn tại/severity? | Canonical exact-pair repository + deterministic domain logic |
| Drug-food tồn tại? | Semantic retrieval trong leaflet của thuốc đã chọn |
| Supporting quote | Retrieval + resolve authoritative evidence |
| Drug info Q&A | Retrieval + grounded prompt |
| Gõ sai tên | Character-level fuzzy normalization |

Similarity không được quyết định drug-drug. Drug-food dùng similarity vì không có table,
nhưng output vẫn là verbatim passage. Dưới score threshold thì trả unavailable, không hạ
threshold để ép kết quả.

## Dữ liệu

| Nguồn | Nội dung |
|---|---|
| `dataset/drug_list_bv_gtvt.csv` | Catalog khoảng 1.073 thuốc |
| Leaflet PDF gốc | Candidate drug-drug, drug-food passage và mọi citation |

Không đổi tên `dataset/` thành `data/` vì `data/` bị gitignore.
