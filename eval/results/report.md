# Báo cáo đánh giá

File này lưu evidence sản phẩm đã đo. Không ghi estimate thành kết quả thực tế và không tự
đặt target trước khi pilot tạo baseline.

## Môi trường đo

| Trường | Giá trị |
|---|---|
| Ngày | 2026-08-03 |
| Commit | Working tree `VMEC-37`, base `563852a` |
| Dataset/sample | Chưa đo product metric |
| Runtime | Môi trường phát triển macOS local |

## Chỉ số an toàn và chất lượng

| Chỉ số | Quy tắc chấp nhận | Thực tế | Trạng thái |
|---|---|---|---|
| Warning hiển thị có quote nguyên văn, source URL, chunk ID và review status | 100% | Chưa đo | Chờ đo |
| Regression Warfarin–Tamoxifen | Không thay bằng Acenocoumarol trong 100% run | Chưa đo | Chờ đo |
| Sinh unique pair | Chính xác C(N,2) cho mọi offline case | Chưa đo | Chờ đo |
| Pending warning hợp lệ hiển thị ngay | 100% | Chưa đo | Chờ đo |
| Missing/uncited/source-unavailable/below-threshold dùng unavailable outcome | 100% | Chưa đo | Chờ đo |
| Độ chính xác normalize tên thuốc | Đo ít nhất 30 case; duyệt target sau baseline | Chưa đo | Chờ đo |
| Coverage trích xuất PDF pilot | Đo trên pilot cố định 50 thuốc trước khi scale | Chưa đo | Chờ đo |
| Thời gian end-to-end | Ghi p50/p95 của ít nhất 30 run; duyệt target sau baseline | Chưa đo | Chờ đo |

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

Mỗi case fail phải ghi Jira ticket sở hữu, root cause, accepted risk hoặc fix, ngày chạy lại
và evidence mới. Cập nhật bảng trên ngay khi có measurement thật.
