# Báo cáo đánh giá

File này lưu evidence sản phẩm đã đo. Không ghi estimate thành kết quả thực tế và không tự
đặt target trước khi pilot tạo baseline.

## Môi trường đo

| Trường | Giá trị |
|---|---|
| Ngày | 2026-08-14 |
| Commit | `1579ebd5ab9a0d51990d0d00300816c1a520182c`, branch `VMEC-68` |
| Dataset/sample | Snapshot danh mục `v2` đã freeze ở VMEC-41 — 704/1311 thuốc, 274 bệnh, 4693 drug–drug, 1899 drug–disease, 215 drug–food, 47644 evidence chunk |
| Runtime | macOS local (Darwin 25.5.0), backend uvicorn `:8000`, database Supabase từ xa |

Evidence chi tiết đứng sau mọi con số dưới đây:
[manual-test-cases.md](manual-test-cases.md). Mỗi case ở file đó ghi input, output thực tế
copy nguyên văn từ response JSON, ngày chạy và commit hash.

## Chỉ số an toàn và chất lượng

| Chỉ số | Quy tắc chấp nhận | Thực tế | Trạng thái |
|---|---|---|---|
| Warning hiển thị có quote nguyên văn, source URL, chunk ID và review status | 100% | Quote 78/78 · `sourceUrl` https 78/78 · `reviewStatus` 69/69 · `chunkId` 61/78 (78,2%). **Quote khớp nguyên văn `evidence_chunks.content`: 61/61, 0 sai lệch** | Đạt một phần — `chunkId` chưa phủ 100% |
| Regression Warfarin–Tamoxifen | Không thay bằng Acenocoumarol trong 100% run | 3/3 biến thể truy vấn warfarin trả `candidates: []`; acenocoumarol không bị kéo sang dù bản ghi `acenocoumarol\|tamoxifen` có tồn tại | Đạt |
| Sinh unique pair | Chính xác C(N,2) cho mọi offline case | 4 thuốc → 2 item + 4 unavailable = 6 = C(4,2), không trùng, không tự ghép | Đạt |
| Pending warning hợp lệ hiển thị ngay | 100% | 69/69 warning có `reviewStatus: "pending"` và đều nằm trong payload; không warning nào bị chặn vì chưa duyệt | Đạt |
| Missing/uncited/source-unavailable/below-threshold dùng unavailable outcome | 100% | 8/8 `unavailable` dùng outcome hợp lệ (`missing-citation`); `missing-record` phân biệt đúng với `missing-citation` | Đạt — nhưng xem EV-07 |
| Độ chính xác normalize tên thuốc | Đo ít nhất 30 case; duyệt target sau baseline | **64 case**: top-1 45/64 (70,3%), recall 61/64 (95,3%). Có dấu 16/16 ≡ không dấu 16/16 | Đã có baseline; chưa duyệt target |
| Coverage trích xuất PDF pilot | Đo trên pilot cố định 50 thuốc trước khi scale | Chưa đo | Chờ đo |
| Thời gian end-to-end | Ghi p50/p95 của ít nhất 30 run; duyệt target sau baseline | 2 lần × 30 run: p50 2,62 s / 2,57 s · p95 6,10 s / 3,67 s | Đã có baseline; p95 chưa ổn định |

7/8 chỉ số đã có số đo thật. Chỉ số duy nhất còn “Chưa đo” là coverage trích xuất PDF pilot —
phép đo đó cần chạy `make ingest-pilot` trên pilot 50 thuốc, không thuộc phạm vi test case
manual.

## Test case manual — Gate 2

| ID | Kịch bản | Trạng thái |
|---|---|---|
| EV-01 | Cặp có bằng chứng, severity `major` → quote + source URL + badge chờ duyệt | Pass |
| EV-02 | Warfarin + Tamoxifen không trả bản ghi Acenocoumarol + Tamoxifen | Pass |
| EV-03 | Cặp không có trong database → “chưa có dữ liệu”, không bịa cảnh báo | Pass |
| EV-04 | Thuốc–thực phẩm (nước ép bưởi, rượu) → đoạn nguyên văn từ HDSD | Pass |
| EV-05 | Gõ sai tên, có dấu và không dấu → fuzzy match đúng candidate | Pass |
| EV-06 | Sinh unique pair `C(4,2)` | Pass |
| EV-07 | Thuốc–bệnh nền trên thuốc phối hợp | **Fail — `VMEC-72`** |

6/7 pass. Vòng đo trước đó trên cùng commit ghi thêm 10 case (TC-01…TC-10, 9 pass 1 fail);
cả hai vòng cùng phát hiện một lỗi duy nhất và đó là cùng một lỗi.

## Bằng chứng kiểm thử hiện có

| Kiểm tra | Lệnh/quy trình | Kết quả gần nhất | Evidence |
|---|---|---|---|
| Backend lint, format, test | `make check` | Pass; 4 test hiện có đang skip | 37 file format; pytest exit 0 |
| Frontend lint | `make web-lint` | Pass | ESLint exit 0 |
| Frontend build/type check | `make web-build` | Pass | Next.js 16.2.12 và TypeScript hoàn tất |
| Pure-domain isolation | `uv run pytest backend/tests/unit/domain -q` | Exit 0; 4 test đang skip | Chưa đo behavior domain |
| Feature quickstart | `specs/001-core-interaction-check/quickstart.md` | Chưa chạy | — |
| Review artifact trước code | Đối chiếu spec/plan/tasks/contract/model | Pass tại thời điểm ghi; 0 CRITICAL/HIGH | 19 FR và 8 SC map vào 45 task |
| Tính toàn vẹn GATE | Đọc diff của `gate/` khi review PR | Không còn đo tự động | Guard checksum đã gỡ theo ADR 0019 |

## Phát hiện và xử lý tiếp theo

| # | Phát hiện | Mức | Ticket |
|---|---|---|---|
| 1 | Thuốc phối hợp sinh đồng thời `items` và `unavailable` cho cùng cặp drug–disease (EV-07 / TC-06) | Cao | `VMEC-72` — cần tạo |
| 2 | 632/4693 bản ghi `national_database` không trỏ về tờ HDSD nào nên không bao giờ hiển thị được | Cao | chưa tạo |
| 3 | 17/78 citation thiếu `chunkId`, không deep-link được tới đoạn nguồn | Thấp | chưa tạo |
| 4 | p95 dao động 3,67 s – 6,10 s giữa hai lần chạy cùng input | Trung bình | chưa tạo |
| 5 | Coverage trích xuất PDF pilot 50 thuốc vẫn chưa đo | Trung bình | chưa tạo |

Mỗi case fail phải ghi Jira ticket sở hữu, root cause, accepted risk hoặc fix, ngày chạy lại
và evidence mới. Cập nhật bảng trên ngay khi có measurement thật.
