# Đặc tả tính năng: Luồng cốt lõi kiểm tra tương tác có dẫn nguồn

**Workspace:** `specs/001-core-interaction-check/`

**Ngày tạo:** 2026-08-03

**Trạng thái:** Sẵn sàng để leader review trước implementation

**Jira:** Project `VMEC`; branch implementation phải link ticket sở hữu

## Bối cảnh

Feature này cung cấp một vertical slice cho pilot 50 thuốc: tìm và xác nhận thuốc trong
catalog, kiểm tra mọi cặp đã xác nhận, tùy chọn kiểm tra thực phẩm và chỉ hiển thị warning
có evidence gốc cùng review state hiện tại.

GATE 1 là nguồn gốc của feature này. Baseline hiện hành và ADR chi phối implementation khi giả
định dữ liệu ban đầu đã thay đổi: ingestion tạo exact-pair record có evidence từ leaflet;
drug-food dùng leaflet retrieval. Feature tuân thủ product vision, domain model, app flow,
ADR 0012, 0005 và 0006.

## Câu chuyện người dùng và tiêu chí chấp nhận

### US1 — Tìm và xác nhận thuốc trong catalog

Patient tìm theo biệt dược/hoạt chất, xem candidate và xác nhận đúng thuốc trước khi đưa vào
basket.

1. Query rõ ràng trả catalog entry giữ nguyên brand/ingredient text và stable ID.
2. Query mơ hồ hoặc confidence thấp không tự chọn; chỉ trả candidate cần xác nhận.
3. Chọn lại cùng stable ID không tạo item trùng.

### US2 — Kiểm tra cặp thuốc có dữ liệu

Patient nhận warning cho từng exact pair đã được ghi nhận, gồm pair identity, severity,
verbatim quote, source và review status.

1. Exact structured record + evidence hợp lệ → hiển thị đúng cặp và citation.
2. `pending` → hiển thị ngay với nhãn đang chờ xác nhận chuyên môn.
3. `rejected` → không xuất hiện trong patient response.

### US3 — Trả kết quả unavailable trung thực

Patient biết lookup nào thiếu dữ liệu hiện tại thay vì nhận cảnh báo suy đoán hoặc hiểu im
lặng là an toàn.

1. Thiếu exact pair → `missing-record`; không thay bằng cặp tương tự.
2. Có record nhưng thiếu citation/source → không tạo warning; trả `missing-citation` hoặc
   `source-unavailable`.
3. Một lookup lỗi không xóa item hợp lệ của lookup khác trong cùng batch.

### US4 — Kiểm tra evidence thuốc–thực phẩm

Patient nhập food/drink phrase và nhận leaflet passage khi retrieval trong leaflet của
thuốc đã chọn vượt threshold.

1. Passage hợp lệ → hiển thị nguyên văn cùng source metadata.
2. Dưới threshold → `below-threshold`; không hạ threshold và không để model tạo claim.

## Trường hợp biên

- Một thuốc không sinh drug-drug pair nhưng vẫn có thể check food.
- Duplicate catalog ID hoặc ingredient không tạo self-pair/duplicate lookup.
- Quá 20 thuốc duy nhất bị reject trước khi pairing.
- `(A,B)` và `(B,A)` dùng cùng canonical key.
- Tên/description tương tự không thay exact drug-drug pair bị thiếu.
- Citation rỗng, bị sửa hoặc không truy vết được chặn warning.
- Severity `unknown` chỉ áp dụng record có evidence nhưng rule không phân loại được.
- Partial failure giữ mọi result độc lập hợp lệ.

## Yêu cầu chức năng

- **FR-001:** Search phải normalize query nhưng giữ nguyên brand/ingredient text để hiển thị.
- **FR-002:** Không auto-select match mơ hồ/confidence thấp; user phải xác nhận.
- **FR-003:** Check nhận 1–20 unique confirmed catalog ID và reject ID lạ; drug-drug cần ít
  nhất hai ingredient duy nhất, drug-food có thể chạy với một.
- **FR-004:** Mỗi unordered pair của ingredient duy nhất được sinh đúng một lần.
- **FR-005:** Drug-drug existence chỉ dùng normalized exact-key lookup.
- **FR-006:** Similarity không được tạo, thay hoặc phân loại drug-drug record.
- **FR-007:** Drug-drug severity được suy ra deterministic, không do LLM gán.
- **FR-008:** Mỗi warning có citation nguyên văn không rỗng, source URL, stable chunk ID và
  page khi có.
- **FR-009:** Lookup thiếu exact record/evidence trả structured unavailable, không thành
  warning item.
- **FR-010:** `severity: unknown` chỉ mô tả evidenced record chưa phân loại được, không mô
  tả missing data.
- **FR-011:** Drug-food chỉ search passage trong leaflet của thuốc đã chọn và áp threshold
  cấu hình.
- **FR-012:** Drug-food output là retrieved verbatim passage, không phải câu model tự viết.
- **FR-013:** Pending qualifying warning được trả và hiển thị ngay.
- **FR-014:** Rejected warning không được trả cho patient.
- **FR-015:** UI biểu diễn severity bằng text/icon ngoài màu.
- **FR-016:** UI/API mô tả unavailable là thiếu trong dữ liệu hiện tại, không khẳng định an
  toàn ngoài đời thực.
- **FR-017:** Không diagnosis, prescribe, đổi thuốc hoặc đưa dosing decision.
- **FR-018:** Failed lookup không loại kết quả độc lập hợp lệ trong cùng request.
- **FR-019:** Pair identity, citation, source coordinate và review state trong một item phải
  đến từ cùng immutable evidence version.

## Thực thể chính

`Drug` · `DrugSearchResult` · `DrugPair` · `Interaction` · `Citation` ·
`EvidenceVersion` · `UnavailableResult` · `InteractionCheck`.

Chi tiết: [data-model.md](data-model.md).

## Tiêu chí thành công

- **SC-001:** 100% displayed pilot warnings có quote, source URL, chunk ID và review status.
- **SC-002:** Regression Warfarin–Tamoxifen không bao giờ trả
  Acenocoumarol–Tamoxifen.
- **SC-003:** N unique ingredient luôn sinh đúng C(N,2) pair key.
- **SC-004:** 100% qualifying pending warnings hiển thị không chờ approval.
- **SC-005:** 100% missing/uncited/source-unavailable/below-threshold lookup dùng unavailable,
  không dùng `unknown` placeholder.
- **SC-006:** Pure-domain tests chạy không cần LLM, database hoặc network.
- **SC-007:** Đo normalization accuracy trên ít nhất 30 case và ghi vào eval report; không
  tự đặt target trước baseline.
- **SC-008:** Đo p50/p95 end-to-end trên ít nhất 30 run, ghi môi trường và target được leader
  chấp nhận trước delivery.

## Giả định đã duyệt

- Pilot đầu tiên dùng 50 thuốc được curate.
- Coverage có thể thiếu; unavailable là kết quả hợp lệ và hiển thị rõ.
- API success trả direct typed payload theo ADR 0011.
- Leaflet extraction dùng Qwen OCR adapter được cấu hình; endpoint/model không hardcode.
- Supabase PostgreSQL là relational truth; Qdrant chỉ giữ vector/evidence pointer.
- Feature dùng authenticated patient context có sẵn, chưa tạo auth/OCR upload/review mutation.

## Ngoài phạm vi Feature 001

Diagnosis/prescribing/dosing · drug-condition · prescription upload/OCR correction ·
pharmacist mutation API · long-term memory · full-gate review · scale quá pilot trước khi
đo coverage · clone hospital UI/private data.
