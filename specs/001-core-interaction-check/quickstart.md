# Hướng dẫn kiểm chứng nhanh Feature 001

Tài liệu này là acceptance runbook cho leader và reviewer. Chỉ đánh dấu hoàn thành khi đã
chạy trên code hiện tại và lưu evidence vào Jira hoặc `eval/results/report.md`.

## 1. Điều kiện đầu vào

- Đang đứng tại repository root `P-054/`.
- Jira ticket thuộc project `VMEC` đã link branch và feature workspace này.
- `spec.md`, `plan.md`, `tasks.md`, `data-model.md` và contract đã được leader duyệt.
- Biến môi trường dùng giá trị test/local; không dùng secret production.
- Pilot manifest có đúng 50 thuốc và mỗi dòng có stable catalog ID.

## 2. Kiểm tra tính toàn vẹn tài liệu

```bash
test -f specs/001-core-interaction-check/spec.md
test -f specs/001-core-interaction-check/plan.md
test -f specs/001-core-interaction-check/tasks.md
test -f specs/001-core-interaction-check/data-model.md
test -f specs/001-core-interaction-check/contracts/interaction-check.openapi.yaml
test -f specs/001-core-interaction-check/checklists/requirements.md
test -f specs/001-core-interaction-check/checklists/safety.md
shasum -a 256 -c .github/gate-1.sha256
```

Sau đó reviewer đối chiếu thủ công:

1. Mọi `FR-*` trong spec có acceptance criterion và task tương ứng.
2. Plan không vi phạm cấu trúc backend/frontend hoặc ADR hiện hành.
3. Data model và OpenAPI dùng cùng field, enum, cardinality và nullability.
4. Task không chứa assumption chưa được duyệt hoặc sao chép owner/priority/sprint từ Jira.

## 3. Chạy kiểm tra tự động

```bash
make check
make web-lint
make web-build
docker compose config --quiet
```

Các domain test phải chạy offline, không truy cập LLM, database hoặc network.

## 4. Kịch bản chấp nhận bắt buộc

### Kịch bản A — Tìm và xác nhận thuốc

1. Tìm bằng biệt dược và hoạt chất, gồm input có/không dấu.
2. Xác nhận kết quả giữ nguyên text catalog và có stable ID.
3. Xác nhận query mơ hồ không tự chọn thuốc.
4. Thêm cùng stable ID hai lần và xác nhận basket không trùng.

### Kịch bản B — Cặp thuốc có bằng chứng

1. Gửi hai thuốc có exact-pair record.
2. Xác nhận response có đúng pair, deterministic severity, `evidenceVersionId`, ít nhất
   một citation nguyên văn, source URL, chunk ID và review status.
3. Xác nhận record `pending` hiển thị ngay với nhãn chờ xác nhận chuyên môn.
4. Xác nhận record `rejected` không xuất hiện trong patient response.

### Kịch bản C — Cặp sai tương tự

Gửi Warfarin–Tamoxifen khi chỉ có evidence của Acenocoumarol–Tamoxifen. Kết quả phải là
`missing-record`, tuyệt đối không trả warning của cặp tương tự.

### Kịch bản D — Trích dẫn không hợp lệ

Kiểm tra lần lượt record thiếu quote, source URL, chunk ID hoặc source không truy cập được.
Không trường hợp nào tạo warning; response phải dùng đúng unavailable reason.

### Kịch bản E — Thuốc–thực phẩm

1. Passage trong leaflet vượt threshold phải trả nguyên văn và đúng source coordinate.
2. Passage dưới threshold phải trả `below-threshold`.
3. Không output nào được là claim do model tự soạn.

### Kịch bản F — Lỗi một phần

Gửi batch gồm lookup hợp lệ và lookup thiếu dữ liệu. Response phải giữ item hợp lệ đồng
thời trả unavailable outcome độc lập cho lookup còn lại.

### Kịch bản G — Giao diện

Xác nhận loading, empty, partial, error, pending và citation ở cả light/dark mode; desktop
và mobile; severity luôn có text/icon, không phụ thuộc riêng vào màu.

## 5. Ghi bằng chứng

Ghi tối thiểu: commit SHA, môi trường, pilot manifest version, số case normalization,
normalization accuracy, citation coverage, wrong-pair regression, pending visibility,
unavailable coverage và p50/p95 của ít nhất 30 run.

Feature chỉ sẵn sàng merge khi hai checklist hoàn thành, mọi scenario pass, CI pass và
reviewer không còn finding mức CRITICAL/HIGH.
