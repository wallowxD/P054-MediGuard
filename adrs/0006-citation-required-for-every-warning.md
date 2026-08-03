# ADR 0006 — Mỗi cảnh báo bắt buộc có citation

- **Trạng thái:** Được chấp nhận
- **Ngày:** 2026-08-02

## Bối cảnh

Một câu cảnh báo không truy được về leaflet gốc không thể được người dùng hoặc dược sĩ
kiểm chứng, kể cả nội dung có vẻ hợp lý.

## Quyết định

Mọi warning item phải có ít nhất một trích dẫn nguyên văn không rỗng, source URL và stable
evidence/chunk identity; page được cung cấp khi có. Không có evidence hợp lệ thì không tạo
warning, mà trả structured unavailable result. Không paraphrase, dịch lại hoặc line-clamp
trích dẫn gốc.

## Hệ quả

- ✅ Mọi cảnh báo có audit trail.
- ✅ Model không thể lấp evidence gap.
- ❌ Coverage thấp hơn khi leaflet thiếu hoặc extraction lỗi.
- ❌ Schema, backend và UI đều phải enforce citation invariant.
