# ADR 0020 — Gemini cho tóm tắt dữ liệu tương tác đã xác thực

- Trạng thái: Được chấp nhận
- Ngày: 13/08/2026
- Thay thế: phần LLM trình bày bám nguồn của ADR 0013

## Bối cảnh

Màn tra cứu tổng hợp cần diễn đạt ngắn gọn nhiều record nhưng model tuyệt đối không được
quyết định tương tác, severity hoặc nguồn. Provider/model trong ADR 0013 không còn khớp
runtime được chọn cho delivery VMEC-40.

## Quyết định

Dùng Google GenAI async với model `gemini-3.5-flash-lite` và Pydantic structured output.
Model chỉ nhận record đã qua citation validation, trả summary keyed theo record ID. Batch
40, concurrency 3, timeout 5 giây, không retry trên request path. Output thiếu/thừa ID,
sai schema hoặc lỗi provider đều fallback về raw database fields.

## Hệ quả

Tích cực: latency bị chặn, output có schema, model không nằm trên truth boundary. Tiêu
cực: một lượt có thể trộn summary generated/fallback và người dùng sẽ thấy nhãn fallback.
Raw fields/citation phải luôn được giữ để kiểm chứng độc lập với provider.

