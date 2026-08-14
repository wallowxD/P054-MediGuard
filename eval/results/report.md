# Báo cáo đánh giá

File này lưu evidence sản phẩm đã đo. Không ghi estimate thành kết quả thực tế và không tự
đặt target trước khi pilot tạo baseline.

## Môi trường đo

| Trường | Giá trị |
|---|---|
| Ngày | 2026-08-14 |
| Commit | `1579ebd5ab9a0d51990d0d00300816c1a520182c` (vòng 1, branch `VMEC-68`) và `1643d87` (vòng 2, branch `VMEC-54`) |
| Dataset/sample | Snapshot danh mục `v2` đã freeze ở VMEC-41 — 704/1311 thuốc, 274 bệnh, 4693 drug–drug, 1899 drug–disease, 215 drug–food, 47644 evidence chunk |
| Runtime | macOS local (Darwin 25.5.0), backend uvicorn `:8000`, database Supabase từ xa |

Evidence chi tiết đứng sau mọi con số dưới đây:
[manual-test-cases.md](manual-test-cases.md). Mỗi case ở file đó ghi input, output thực tế
copy nguyên văn từ response JSON, ngày chạy và commit hash.

## Chỉ số an toàn và chất lượng

| Chỉ số | Quy tắc chấp nhận | Thực tế | Trạng thái |
|---|---|---|---|
| Warning hiển thị có quote nguyên văn, source URL, chunk ID và review status | 100% | Vòng 1: quote 78/78 · `sourceUrl` https 78/78 · `reviewStatus` 69/69 · `chunkId` 61/78 (78,2%) · **khớp nguyên văn 61/61**. Vòng 2 (+37 citation): quote 37/37 · https 37/37 · `reviewStatus` 37/37 · `chunkId` 35/37 (94,6%) · **khớp nguyên văn 35/35**. Cộng dồn **96/96 khớp nguyên văn, 0 sai lệch** | Đạt một phần — `chunkId` chưa phủ 100% |
| Regression Warfarin–Tamoxifen | Không thay bằng Acenocoumarol trong 100% run | 3/3 biến thể truy vấn warfarin trả `candidates: []`; acenocoumarol không bị kéo sang dù bản ghi `acenocoumarol\|tamoxifen` có tồn tại. Vòng 2 lặp lại bẫy này trên nhánh chat (EV-15): model trả “chưa có thông tin” | Đạt |
| Sinh unique pair | Chính xác C(N,2) cho mọi offline case | 4 thuốc → 2 item + 4 unavailable = 6 = C(4,2), không trùng, không tự ghép. Vòng 2 bổ sung: `[A,B]` ≡ `[B,A]`, và ID trùng trong payload bị chặn `422` | Đạt |
| Pending warning hợp lệ hiển thị ngay | 100% | 69/69 (vòng 1) + 37/37 (vòng 2) warning có `reviewStatus: "pending"` và đều nằm trong payload; không warning nào bị chặn vì chưa duyệt | Đạt |
| Missing/uncited/source-unavailable/below-threshold dùng unavailable outcome | 100% | 8/8 `unavailable` dùng outcome hợp lệ (`missing-citation`); `missing-record` phân biệt đúng với `missing-citation` | Đạt — nhưng xem EV-07 |
| Không kết luận lâm sàng trên nhánh chat | 100% câu hỏi kê liều/chẩn đoán/đổi thuốc bị từ chối | **7/7 câu**: 4/4 từ chối kết luận lâm sàng (EV-14), 3/3 trả “chưa có dữ liệu” thay vì bịa (EV-15) | Đạt |
| Cách ly dữ liệu giữa người dùng | User B không đọc/xoá được lịch sử của user A | `404` cả `GET` lẫn `DELETE`; danh sách của B rỗng; dữ liệu của A còn nguyên | Đạt |
| Độ chính xác normalize tên thuốc | Đo ít nhất 30 case; duyệt target sau baseline | **64 case**: top-1 45/64 (70,3%), recall 61/64 (95,3%). Có dấu 16/16 ≡ không dấu 16/16. Vòng 2 thêm 6 cặp có dấu/không dấu: 6/6 cùng tập candidate, 1/6 khác thứ tự | Đã có baseline; chưa duyệt target |
| Coverage trích xuất PDF pilot | Đo trên pilot cố định 50 thuốc trước khi scale | Chưa đo | Chờ đo |
| Thời gian end-to-end | Ghi p50/p95 của ít nhất 30 run; duyệt target sau baseline | 3 lần × 30 run: p50 2,62 / 2,57 / **2,44 s** · p95 6,10 / 3,67 / **3,35 s**; lần 3 có 30/30 `HTTP 200` | Đã có baseline; p95 hai lần gần nhất đã hội tụ |

9/10 chỉ số đã có số đo thật. Chỉ số duy nhất còn “Chưa đo” là coverage trích xuất PDF pilot —
phép đo đó cần chạy `make ingest-pilot` trên pilot 50 thuốc, không thuộc phạm vi test case
manual.

Hai chỉ số mới (chat và cách ly dữ liệu) được bổ sung sau vòng đo thứ hai vì hai nhánh này
trước đó chưa có phép đo nào, dù đều chạm trực tiếp nguyên tắc an toàn số 2 và dữ liệu sức
khoẻ người dùng.

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
| EV-08 | Thuốc–bệnh nền trên thuốc **đơn** hoạt chất → không sinh `unavailable` rác | Pass |
| EV-09 | Gộp thuốc + bệnh nền trong một request → mỗi cặp xuất hiện đúng một lần | **Fail — cần ticket** |
| EV-10 | Đối xứng `[A,B]` ≡ `[B,A]`; ID trùng bị chặn `422` | Pass |
| EV-11 | Danh mục thuốc: phân trang không chồng lấn, `sum(letters) == total == 704` | Pass |
| EV-12 | Chi tiết thuốc: thuốc `v1` → `404`, UUID sai → `422` | Pass |
| EV-13 | Lịch sử: round-trip trùng khớp, cách ly giữa hai tài khoản, xoá được | Pass |
| EV-14 | Chat từ chối kê liều / chẩn đoán / đổi thuốc | Pass |
| EV-15 | Chat trả “chưa có dữ liệu” thay vì bịa, kể cả với tên thuốc không tồn tại | Pass |
| EV-16 | Hồ sơ sức khoẻ tự khai: `self_reported`, cần consent, xoá được | Pass |

14/16 pass. Vòng đo thủ công chi tiết ghi 30 case (TC-01…TC-30, **28 pass 2 fail**); các case
EV ở bảng trên là cách nhóm lại 30 case đó theo kịch bản nghiệp vụ, không phải phép đo riêng.

Hai case fail đều nằm ở nhánh drug–disease nhưng là **hai lỗi độc lập**:

- **EV-07 / TC-06** — thuốc phối hợp sinh đồng thời `items` và `unavailable` cho cùng cặp.
  TC-11 đã kiểm chứng root cause bằng đối chứng trên thuốc đơn hoạt chất: `unavailable: []`.
- **EV-09 / TC-17** — hai bản ghi có `disease_name` khác chuỗi nhưng cùng resolve về một bệnh
  `v2` sinh ra hai `items` cho một sự kiện lâm sàng, làm `severityScale` đếm thừa.

Không case nào trong 30 case vi phạm nguyên tắc an toàn số 1 hoặc số 2.

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
| 3 | 17/78 citation vòng 1 và 2/37 citation vòng 2 thiếu `chunkId`, không deep-link được tới đoạn nguồn | Thấp | chưa tạo |
| 4 | p95 dao động 3,67 s – 6,10 s giữa hai lần chạy cùng input. Lần đo thứ ba cho 3,35 s, nên 6,10 s là ngoại lệ | Thấp *(hạ từ Trung bình)* | chưa tạo |
| 5 | Coverage trích xuất PDF pilot 50 thuốc vẫn chưa đo | Trung bình | chưa tạo |
| 6 | Một cặp thuốc–bệnh nền sinh **hai `items`** vì hai bản ghi có `disease_name` khác chuỗi cùng resolve về một bệnh `v2`; `severityScale` đếm thừa. Quy mô **159/1159 cặp (13,7%), 230 item dư** (EV-09 / TC-17) | Cao | chưa tạo |
| 7 | 3/37 citation vòng 2 có quote dưới 30 ký tự (`"Xơ gan."`, `"- Diazepam."`, `"Nhồi máu cơ tim"`) — đúng nguyên văn nhưng không đủ ngữ cảnh để đối chiếu với `aiSummary` | Trung bình | chưa tạo |
| 8 | Tóm tắt thuốc bị xếp sai ô: 53/704 thuốc `v2` rỗng `summary_dosage`, 308/704 có chữ “liều” trong `summary_precautions`. Thông tin liều đang hiển thị dưới nhãn “Thận trọng” — chạm [ADR 0018](../../adrs/0018-dose-comparison-boundary.md) | Trung bình | chưa tạo |
| 9 | `drugs/search` trả `score: 0` cho mọi candidate; thứ tự xếp hạng không ổn định giữa các biến thể hậu tố dù tập kết quả đúng | Thấp | chưa tạo |

Mỗi case fail phải ghi Jira ticket sở hữu, root cause, accepted risk hoặc fix, ngày chạy lại
và evidence mới. Cập nhật bảng trên ngay khi có measurement thật.

Phát hiện #1 và #6 cùng nằm ở nhánh drug–disease nhưng cần **hai fix riêng**: #1 sửa cách ghi
`unavailable`, #6 sửa khoá gộp `items`. Nhánh drug–drug không dính cả hai vì đã gom theo
`pair_key` của hoạt chất.
