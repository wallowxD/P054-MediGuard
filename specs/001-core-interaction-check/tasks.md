# Công việc: Luồng cốt lõi kiểm tra tương tác có dẫn nguồn

Input: [spec](spec.md), [plan](plan.md), [research](research.md),
[data model](data-model.md), [contract](contracts/interaction-check.openapi.yaml) và
[safety checklist](checklists/safety.md).

Jira sở hữu owner/priority/sprint/status/branch. File này chỉ chứa execution task có
traceability; không task nào cho phép đổi contract/architecture hoặc sửa GATE.

## Giai đoạn 1 — Thiết lập pilot có thể tái lập

- [ ] T001 Tạo manifest 50 thuốc cố định tại `eval/fixtures/pilot-50.csv`, gồm stable ID và leaflet URL (SC-001, SC-008)
- [ ] T002 [P] Thêm ≥30 normalization case vào `backend/tests/unit/domain/test_normalization.py` và định nghĩa measurement trong eval report (FR-001, FR-002, SC-007)
- [ ] T003 [P] Thêm offline fixture: evidenced pair, missing evidence, rejected, wrong pair; không lấy từ JSON đã xóa (FR-005–010, FR-013, FR-014, SC-002)
- [ ] T004 Parse/validate accepted OpenAPI contract: direct response, citation cardinality, evidence identity và unavailable schema (FR-003, FR-008, FR-009)

## Giai đoạn 2 — Nền tảng domain và lưu trữ

- [ ] T005 [P] Viết failing tests cho diacritic, case, ingredient extraction, ambiguity, confidence (FR-001, FR-002, SC-006/007)
- [ ] T006 [P] Viết failing tests cho limits, dedup, canonical pair và C(N,2) (FR-003/004, SC-003/006)
- [ ] T007 [P] Viết deterministic severity tests, gồm `unknown` chỉ cho evidenced record (FR-007/010, SC-006)
- [ ] T008 Implement normalization và làm T002/T005 pass offline (FR-001/002, SC-006/007)
- [ ] T009 [P] Hoàn thiện validation/canonical pairing và làm T006 pass (FR-003/004, SC-003/006)
- [ ] T010 [P] Implement source-text severity rules và làm T007 pass (FR-007/010, SC-006)
- [ ] T011 [P] Thêm Pydantic v2 schema cho search/check/citation/unavailable/error theo contract (FR-001–003, FR-008–010, FR-018/019)
- [ ] T012 [P] Thêm SQLAlchemy models cho catalog/evidence/citation/interaction, giữ immutable identity/review (FR-008, FR-013/014/019)
- [ ] T013 Thêm catalog và canonical exact-pair repositories; route/retriever không query DB trực tiếp (FR-003/005/006/019)
- [ ] T014 Thêm regression chứng minh Warfarin–Tamoxifen không trả Acenocoumarol–Tamoxifen (FR-005/006, SC-002/006)

## Giai đoạn 3 — Ingestion dựa trên bằng chứng

- [ ] T015 Implement versioned catalog loading, reviewed refresh, PDF cache và private raw-artifact boundary; xử lý source lỗi rõ ràng (FR-008/009/019)
- [ ] T016 [P] Viết verbatim chunk/source-coordinate tests (FR-008/019, SC-001)
- [ ] T017 Implement section-aware chunking với stable chunk ID (FR-008/019, SC-001)
- [ ] T018 [P] Định nghĩa bounded extraction schema và prompt chuyên biệt (FR-005–008/017)
- [ ] T019 Implement configured Qwen OCR qua single model-client boundary với mocked tests (FR-005/006/008/017)
- [ ] T020 [P] Implement embeddings + Qdrant adapter, required payload và config-driven tuning (FR-011/012/019)
- [ ] T021 Implement pair validation, PostgreSQL evidence persistence, raw-artifact identity và PostgreSQL/Qdrant reconciliation (FR-005–010/019, SC-001/002/005)
- [ ] T022 Chạy pilot cố định và ghi download/extraction/citation/rejection/failure coverage (SC-001/007)

## Giai đoạn 4 — US1: Tìm và xác nhận catalog

- [ ] T023 [P] [US1] Viết API tests cho exact/diacritic/ambiguous/low-confidence/invalid query (FR-001/002)
- [ ] T024 [US1] Implement thin async `GET /api/v1/drugs/search` qua catalog repository (FR-001/002)
- [ ] T025 [US1] Sinh OpenAPI và `types.gen.ts`; không sửa generated file (FR-001/002)
- [ ] T026 [US1] Bật direct-payload search service/query (FR-001/002)
- [ ] T027 [US1] Implement explicit selection và basket dedup theo stable ID (FR-001–003)

## Giai đoạn 5 — US2: Cặp thuốc có bằng chứng

- [ ] T028 [P] [US2] Viết API tests cho pending/approved/rejected, citation, evidence identity, severity và direct payload (FR-005–010/013–015/019, SC-001/004)
- [ ] T029 [US2] Implement interaction workflow compose exact record, severity, evidence và review state (FR-003–010/013/014/017/019)
- [ ] T030 [US2] Implement thin async `POST /api/v1/interactions/check` và typed errors (FR-003/008–010/013/014/017)
- [ ] T031 [US2] Regenerate OpenAPI/types; xóa handwritten response type bị thay thế (FR-008–010/019)
- [ ] T032 [US2] Bật direct response service và React Query mutation (FR-003/008–010)
- [ ] T033 [US2] Nối result UI: full citation, pending, rejected filter, safety notice, dark/responsive/non-color severity (FR-008/013–017, SC-001/004)

## Giai đoạn 6 — US3: Không có dữ liệu và kết quả một phần

- [ ] T034 [P] [US3] Test missing-record/citation/source, wrong-pair và partial result (FR-005/006/009/010/016/018, SC-002/005)
- [ ] T035 [US3] Implement unavailable aggregation, giữ valid item và không tạo unknown placeholder (FR-009/010/016/018, SC-005)
- [ ] T036 [US3] Render unavailable/partial copy chỉ mô tả coverage hiện tại (FR-016/018, SC-005)

## Giai đoạn 7 — US4: Bằng chứng thuốc–thực phẩm

- [ ] T037 [P] [US4] Test selected-leaflet scope, qualifying passage, below threshold và no composed claim (FR-011/012/017, SC-005)
- [ ] T038 [US4] Implement thresholded food retrieval trả verbatim coordinate excerpt (FR-011/012/017)
- [ ] T039 [US4] Nối food input vào workflow và trả evidenced/below-threshold outcome (FR-003/008–012/018, SC-005)
- [ ] T040 [US4] Nối food basket và cited result UI, không clinical conclusion (FR-011/012/016–018)

## Giai đoạn 8 — Kiểm chứng và bàn giao

- [ ] T041 Chạy mọi scenario trong `quickstart.md` và hoàn thành CHK001–019 bằng evidence thật (SC-001–008)
- [ ] T042 Ghi normalization, extraction, citation, wrong-pair, pending rate, unavailable và p50/p95 (SC-001–008)
- [ ] T043 Cập nhật architecture/backend/frontend docs và Jira bằng implemented behavior/evidence (FR-001–019, SC-001–008)
- [ ] T044 Chạy `make check`, `make web-lint`, `make web-build`, contract validation và quickstart; sửa mọi lỗi liên quan (SC-001–008)
- [ ] T045 Leader/reviewer đối chiếu thủ công spec–plan–tasks–contract–code, bổ sung task thiếu, hoàn thành rồi review lại đến khi không còn CRITICAL/HIGH gap (FR-001–019, SC-001–008)

## Quan hệ phụ thuộc

T001–004 setup · T005–007 failing tests trước T008–010 · T011/012 trước repository ·
T015–021 theo pipeline · US1 phụ thuộc catalog · US2/3 phụ thuộc exact pair/evidence · US4
phụ thuộc leaflet chunks · T041–045 là completion gate bắt buộc.

## Ma trận truy vết yêu cầu

| Yêu cầu | Công việc triển khai/kiểm chứng chính |
|---|---|
| FR-001 | T002, T005, T008, T011, T023–T027 |
| FR-002 | T002, T005, T008, T011, T023–T027 |
| FR-003 | T004, T006, T009, T011, T013, T027, T029, T030, T032, T039 |
| FR-004 | T006, T009 |
| FR-005 | T003, T013, T014, T018, T019, T021, T028, T029, T034 |
| FR-006 | T003, T013, T014, T018, T019, T021, T028, T029, T034 |
| FR-007 | T003, T007, T010, T018, T021, T028, T029 |
| FR-008 | T003, T004, T011, T012, T015–T021, T028–T033, T039 |
| FR-009 | T003, T004, T011, T015, T021, T028–T031, T034, T035 |
| FR-010 | T003, T007, T010, T011, T021, T028–T035 |
| FR-011 | T020, T037–T040 |
| FR-012 | T020, T037–T040 |
| FR-013 | T003, T012, T028–T030, T033 |
| FR-014 | T003, T012, T028–T030, T033 |
| FR-015 | T028, T033 |
| FR-016 | T033–T036, T040 |
| FR-017 | T018, T019, T029, T030, T033, T037, T038, T040 |
| FR-018 | T011, T034–T040 |
| FR-019 | T011–T021, T028, T029, T031 |
| SC-001 | T001, T016, T017, T021, T022, T028, T033, T041–T045 |
| SC-002 | T003, T014, T021, T034, T041–T045 |
| SC-003 | T006, T009, T041–T045 |
| SC-004 | T028, T033, T041–T045 |
| SC-005 | T021, T034–T040, T041–T045 |
| SC-006 | T005–T010, T014, T041–T045 |
| SC-007 | T002, T005, T008, T022, T041–T045 |
| SC-008 | T001, T041–T045 |

## Hoàn thành khi

Mọi task có evidence trong Jira; acceptance/safety checklist pass; không warning thiếu
citation hoặc sai cặp; pending hiển thị, rejected bị loại; spec/plan/model/contract/code/test
và Jira thống nhất; manual convergence không còn việc thiếu mức CRITICAL/HIGH.
