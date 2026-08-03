# Nghiên cứu và quyết định đã chấp nhận

## Thuốc–thuốc dùng bản ghi exact pair có bằng chứng

- **Quyết định:** ingestion bind qualifying leaflet passage với canonical ingredient pair;
  request-time chỉ exact repository lookup.
- **Lý do:** similarity có thể trả cặp gần nghĩa nhưng sai identity dù citation thật.
- **Loại bỏ:** vector/model knowledge làm fallback; dataset JSON đã được xóa.

## Thuốc–thực phẩm dùng semantic retrieval có phạm vi

- **Quyết định:** chỉ search passage trong leaflet của thuốc đã chọn; trả verbatim excerpt
  đạt threshold.
- **Loại bỏ:** unscoped retrieval và model-composed warning.

## Chuẩn hóa tên dùng character matching + user confirmation

- **Quyết định:** strip diacritic + rapidfuzz, giữ original text, yêu cầu xác nhận nếu mơ hồ.
- **Loại bỏ:** embedding làm primary matcher và silent auto-selection.

## API trả payload trực tiếp

- **Quyết định:** direct Pydantic payload; typed HTTP error.
- **Loại bỏ:** envelope `{ error, message, data }`.

## Leaflet extraction dùng Qwen OCR adapter

- **Quyết định:** model/region endpoint cấu hình; mọi call đi qua model-client boundary;
  qualification dựa trên quote/page/section measurement của pilot.
- **Loại bỏ:** hardcode model hoặc tin confidence tự báo.

## Một relational owner và một semantic index

- **Quyết định:** Supabase PostgreSQL sở hữu catalog/pair/citation/evidence/review; private
  Storage giữ raw OCR; Qdrant giữ vector + evidence pointer.
- **Loại bỏ:** duplicate authoritative metadata và ChromaDB production.

## Bằng chứng nguyên văn, có phiên bản và bắt buộc

- **Quyết định:** text không đổi + coordinate + stable identity; response/render enforce
  citation không rỗng.
- **Loại bỏ:** paraphrase, line clamp và warning không citation.

## Review không chặn trong read-only slice

- **Quyết định:** pending/approved hiển thị; rejected bị loại; Feature 001 chưa có mutation.
- **Loại bỏ:** approval làm điều kiện hiển thị.

## Tạm hoãn framework kiểm thử frontend

- **Quyết định:** chưa thêm dependency test frontend trong Feature 001; dùng CI build/lint và
  quickstart cho đến khi team duyệt framework ở ADR riêng.
