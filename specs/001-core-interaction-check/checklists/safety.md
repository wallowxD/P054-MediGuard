# Checklist an toàn: Feature 001

**Phạm vi:** Warning path từ ingestion/evidence đến API và patient UI.

**Nguyên tắc:** Không citation thì không warning; không kết luận lâm sàng; review không chặn.

- [ ] CHK001 Mọi warning có quote nguyên văn, source URL, stable chunk ID và review status.
- [ ] CHK002 Quote hiển thị khớp byte/normalized source slice theo quy tắc ingestion đã duyệt.
- [ ] CHK003 Drug–drug existence chỉ đến từ canonical exact-pair repository lookup.
- [ ] CHK004 Similarity search không tạo, thay thế hoặc phân loại drug–drug record.
- [ ] CHK005 Regression Warfarin–Tamoxifen không trả Acenocoumarol–Tamoxifen.
- [ ] CHK006 Drug–food chỉ retrieval trong leaflet của thuốc đã chọn và tôn trọng threshold.
- [ ] CHK007 Drug–food warning giữ nguyên passage, không dùng câu model tự soạn.
- [ ] CHK008 Missing record/citation/source và below-threshold đều trả structured unavailable.
- [ ] CHK009 `severity: unknown` chỉ xuất hiện ở evidenced record hợp lệ.
- [ ] CHK010 Severity được tính bằng deterministic domain rule, không do request-time LLM gán.
- [ ] CHK011 Pending warning hiển thị ngay với nhãn chờ xác nhận chuyên môn.
- [ ] CHK012 Rejected evidence không xuất hiện trong patient response.
- [ ] CHK013 Pair identity, evidence version, citation và review state cùng một immutable version.
- [ ] CHK014 Partial failure không loại bỏ lookup hợp lệ độc lập.
- [ ] CHK015 Output không diagnosis, prescribe, dosing hoặc đề nghị tự đổi/ngừng thuốc.
- [ ] CHK016 UI không dùng riêng màu để truyền đạt severity và có safety notice.
- [ ] CHK017 Domain test chạy không LLM, database hoặc network; LLM test dùng mock fixture.
- [ ] CHK018 GATE checksum pass; không sửa `gate/`, `scripts/`, `.ai-log/` hoặc generated API type.
- [ ] CHK019 Leader/reviewer đã đối chiếu spec–plan–tasks–contract–model–code–test và không còn
      CRITICAL/HIGH finding.

## Bằng chứng bắt buộc

- Commit SHA và CI run:
- Pilot manifest/version:
- Citation coverage:
- Wrong-pair regression:
- Hành vi pending/rejected:
- Normalization accuracy:
- p50/p95 và môi trường đo:
- Reviewer/kết quả:
