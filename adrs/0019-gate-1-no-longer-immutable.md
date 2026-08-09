# ADR 0019 — `gate/gate_1/` không còn bất biến

- **Trạng thái:** Được chấp nhận
- **Ngày:** 2026-08-09
- **Liên quan:** thay thế điều khoản bất biến trong `AGENTS.md`; ảnh hưởng tới mục *Bối
  cảnh* của [ADR 0017](0017-self-reported-health-profile.md)

## Bối cảnh

Từ 03/08/2026, repository tự đặt cho mình một luật: bốn file trong `gate/gate_1/` là bất
biến. Luật đó được cài ở ba tầng:

- văn bản trong `AGENTS.md`, `README.md`, `.cursor/rules/project.mdc`,
  `.github/copilot-instructions.md` và hai file trong `.claude/`;
- workflow `.github/workflows/gate-integrity.yml` — từ chối **mọi** pull request đụng vào
  `gate/gate_1/`, cộng thêm kiểm tra SHA-256 theo manifest `.github/gate-1.sha256`;
- một job trong `.github/workflows/ci.yml` bắt thư mục phải có đúng 4 file.

Luật này không đến từ BTC. Nó do chính đội đặt ra để tự bảo vệ hồ sơ đã nộp.

Ngày 09/08/2026 leader phản hồi góp ý gate 1 bằng cách sửa thẳng Brief, PRD và README trong
`gate/gate_1/`. Đó là lựa chọn có chủ đích: bộ hồ sơ chấm điểm nên là một bản duy nhất
không tự mâu thuẫn, thay vì một bản gốc sai cộng một bản v2 đính kèm.

Giữ luật cũ trong tình huống này gây hại thật chứ không chỉ gây phiền:

- Workflow chặn PR **không thể pass** với đợt sửa đó — step *Reject* không đọc checksum nên
  không có cách nào làm nó xanh, buộc phải push thẳng lên `main` và bỏ qua review.
- Sáu file tài liệu nói repo có một vùng bất biến, trong khi thực tế không còn.
  [ADR 0017](0017-self-reported-health-profile.md) đã phải viết hẳn một đoạn để lách điều
  khoản này — dấu hiệu rõ ràng là luật đang cản việc đúng.

## Quyết định

Bỏ luật bất biến của `gate/gate_1/`. Cụ thể:

1. Xoá workflow `.github/workflows/gate-integrity.yml` và manifest
   `.github/gate-1.sha256`.
2. Xoá job `gate-integrity` trong `.github/workflows/ci.yml`.
3. Gỡ câu "không sửa, xoá, đổi tên, di chuyển" khỏi mọi tài liệu quy tắc.

`gate/gate_1/` từ nay là tài liệu bình thường của repository: sửa được, nhưng theo đúng quy
tắc áp cho mọi tài liệu khác — đổi hành vi sản phẩm thì cập nhật spec trong cùng pull
request, quyết định khó đảo ngược thì viết ADR mới.

Ràng buộc thay thế, nhẹ hơn nhưng đủ dùng:

- Mỗi lần sửa nội dung `gate/gate_1/` phải ghi lý do vào một tài liệu phản hồi trong
  `specs/`, ví dụ [`specs/gate-1-feedback-response.md`](../specs/gate-1-feedback-response.md).
- `gate/gate_1/README.md` phải có dòng nêu rõ bản đang đọc đã được sửa ngày nào và vì sao.

## Lý do

- Lịch sử git đã là cơ chế bảo vệ đúng cho việc này. Bản đã nộp vẫn truy được bằng
  `git show 5ce5d6c:"gate/gate_1/..."`; thêm một manifest checksum song song chỉ nhân đôi
  công việc mà không thêm bảo đảm nào.
- Một luật mà người viết ra nó phải lách ngay lần đầu áp dụng thì là luật sai, không phải
  người dùng sai.
- Việc sửa hồ sơ gate theo góp ý của mentor là hoạt động bình thường của dự án, không phải
  ngoại lệ cần cơ chế đặc biệt.

## Hệ quả

- ✅ Bộ hồ sơ gate 1 chấm điểm là một bản duy nhất, không còn mâu thuẫn nội bộ.
- ✅ Đợt sửa 09/08/2026 và các đợt sau đi qua pull request bình thường, có review.
- ✅ Bớt một workflow phải bảo trì và một manifest phải sinh lại sau mỗi lần sửa.
- ❌ Mất lớp chặn tự động: từ nay một thay đổi ngoài ý muốn trong `gate/gate_1/` chỉ bị phát
  hiện khi có người đọc diff. Giảm thiểu bằng ràng buộc thay thế ở trên.
- ❌ Ai đọc lại `gate/gate_1/` sau này sẽ thấy bản đã sửa chứ không phải bản nộp đúng ngày
  hạn. Dòng ghi chú đầu README và lịch sử git là nơi phân biệt hai bản.

## Phương án đã xem xét

- **Giữ luật, để bản v2 ở `gate/gate_2/`.** Đây là phương án ban đầu và vẫn hợp lý về mặt
  hồ sơ. Bị loại vì người chấm sẽ đọc bản trong `gate/gate_1/` trước, và bản đó vẫn chứa
  đúng những mâu thuẫn mentor đã chỉ ra.
- **Giữ workflow, chỉ nới step *Reject* bằng label.** Vẫn phải sinh lại checksum sau mỗi
  lần sửa, đổi lại được một lớp chặn mà lịch sử git đã cung cấp. Không đáng.
