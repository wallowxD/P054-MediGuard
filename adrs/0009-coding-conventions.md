# ADR 0009 — Phân tách quyết định và quy ước code

- **Trạng thái:** Được chấp nhận
- **Ngày:** 2026-08-02

## Bối cảnh

ADR phải giải thích quyết định bền vững; guide phải mô tả catalog quy ước thay đổi thường
xuyên. Ghi cùng một fact ở cả hai nơi làm tài liệu drift.

## Quyết định

- “Tại sao chọn/reject công nghệ hoặc boundary” → ADR.
- “Dùng thư viện nào cho trách nhiệm nào, đặt tên và viết code ra sao” →
  `docs/code-style.md`.
- Rule repository và protected path → `AGENTS.md`.
- Không sao chép cùng một fact sang nhiều nguồn; dùng link.

## Hệ quả

- ✅ ADR ngắn, giữ lịch sử quyết định.
- ✅ Guide có thể cập nhật cùng code mà không viết lại lịch sử.
- ❌ Reviewer phải kiểm tra đúng owner của từng loại thông tin.
