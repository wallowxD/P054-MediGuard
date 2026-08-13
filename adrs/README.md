# Hồ sơ quyết định kiến trúc (ADR)

ADR lưu quyết định kỹ thuật khó đảo ngược, lý do và trade-off. Không dùng ADR để mô tả
delivery status hoặc catalog quy ước code.

## Chỉ mục

| # | Quyết định | Trạng thái |
|---|---|---|
| [0001](0001-architecture-style.md) | Kiến trúc ba tầng + backend pipeline | Bị thay thế một phần bởi 0013 |
| [0002](0002-tech-stack.md) | Technology stack ban đầu | Bị thay thế một phần bởi 0013 |
| [0003](0003-folder-structure.md) | Workspace hai ngôn ngữ | Bị thay thế một phần bởi 0010/0014 |
| [0004](0004-drug-drug-lookup-not-similarity.md) | Drug-drug exact lookup | Nguồn dữ liệu bị thay bởi 0012 |
| [0005](0005-human-in-the-loop-non-blocking.md) | Review không chặn hiển thị | Được chấp nhận |
| [0006](0006-citation-required-for-every-warning.md) | Mọi cảnh báo có citation | Được chấp nhận |
| [0007](0007-frontend-structure-and-auth.md) | Frontend structure và authorization | Được chấp nhận |
| [0008](0008-toolchain-version-pins.md) | Ghim frontend toolchain | Được chấp nhận |
| [0009](0009-coding-conventions.md) | Tách ADR khỏi code guide | Được chấp nhận |
| [0010](0010-adopt-spec-kit.md) | Áp dụng GitHub Spec Kit | Bị thay thế bởi 0014 |
| [0011](0011-direct-api-responses.md) | API trả payload trực tiếp | Được chấp nhận |
| [0012](0012-reviewed-leaflet-interaction-records.md) | Exact pair có evidence từ leaflet | Được chấp nhận |
| [0013](0013-cloud-data-and-model-topology.md) | Topology cloud/OCR/model | Được chấp nhận |
| [0014](0014-defer-spec-kit.md) | Tạm dừng Spec Kit | Được chấp nhận |
| [0015](0015-backend-owned-identity.md) | Backend tự sở hữu identity, không dùng Supabase Auth | Được chấp nhận |
| [0016](0016-google-oidc-login.md) | Đăng nhập Google OpenID Connect | Được chấp nhận |
| [0017](0017-self-reported-health-profile.md) | Hồ sơ sức khoẻ tự khai ở bảng riêng | Được chấp nhận |
| [0018](0018-dose-comparison-boundary.md) | Đối chiếu liều là trình bày bằng chứng | Được chấp nhận |
| [0019](0019-gate-1-no-longer-immutable.md) | `gate/gate_1/` không còn bất biến | Được chấp nhận |
| [0020](0020-gemini-grounded-summary.md) | Gemini tóm tắt record đã xác thực | Được chấp nhận |

## Quy tắc

- Số chỉ tăng, không tái sử dụng.
- Không xóa hoặc viết lại lịch sử quyết định; tạo ADR mới và đánh dấu bị thay thế.
- Bắt buộc nêu cả hệ quả tích cực và tiêu cực.
- “Tại sao chọn/reject” đặt trong ADR; “viết code thế nào” đặt trong `docs/`.
