# Đặc tả chuẩn hóa toàn bộ condition mention

## Mục tiêu

Tạo danh sách đề xuất canonical condition từ toàn bộ tên đã có trong
`drug_disease_interactions`. Autocomplete sau này dùng tên chuẩn ngắn gọn, trong khi raw mention và
interaction gốc vẫn được giữ nguyên để truy vết.

## Yêu cầu chức năng

- Batch chỉ đọc distinct `disease_name` từ Supabase; không đọc lại PDF, không OCR và không ghi database.
- Mặc định đọc tối đa 5.000 mention, đủ bao phủ corpus hiện tại; thứ tự theo số interaction giảm dần rồi
  theo tên không dấu để kết quả tất định.
- Rule chạy trên chuỗi bỏ dấu, viết thường và gọn khoảng trắng. Chỉ alias hoặc thuật ngữ xác định mới
  được map; không dùng fuzzy similarity làm căn cứ gộp bệnh.
- Taxonomy bao phủ tình trạng đặc biệt và các hệ thận-tiết niệu, gan-mật, tim mạch, hô hấp, nội tiết,
  chuyển hóa-điện giải, tiêu hóa, thần kinh-tâm thần, huyết học, nhiễm trùng-miễn dịch, mắt, da, cơ xương,
  sản khoa, ung bướu và các trạng thái thủ thuật thường gặp trong corpus.
- Một mention ghép có thể tạo nhiều component. Canonical name không chứa mức độ, diễn tiến, giai đoạn,
  lọc máu hoặc ngưỡng xét nghiệm; các giá trị này nằm ở qualifier.
- Generic concept bị loại khi cùng mention đã có concept cụ thể trong cùng hệ, ví dụ `Bệnh thận mạn`
  không sinh thêm `Bệnh thận`.
- Mention chưa đủ chắc chắn vẫn có một dòng `match_status=unmapped`; không bị mất và không bị ép gộp.
- Output luôn có raw mention, tần suất, canonical code/name, nhóm cơ quan, qualifier, phương thức xử lý và
  cột review. Mọi dòng mang `mapping_status=needs_review`.
- CSV dùng UTF-8 BOM để mở đúng tiếng Việt trong Excel.
- `--no-ai` chạy hoàn toàn bằng rule và đặt `ai_status=not_requested`. Chế độ có Gemini chỉ là tùy chọn,
  chỉ dùng catalog kiểm soát và vẫn phải qua human review.

## Catalog v2 và API

- `diseases.version='v1'` giữ nguyên catalog cũ để rollback/audit; API không trả các dòng này.
- `diseases.version='v2'` chứa một dòng cho mỗi canonical concept, gồm `concept_code`, `body_system` và
  `concept_type`.
- `disease_aliases.version='v2'` nối exact `raw_name_unaccent` với canonical disease. Một raw compound
  có thể nối tới nhiều canonical disease.
- API `/api/v1/diseases` chỉ tìm trong catalog active v2.
- Tra cứu thuốc–bệnh join interaction raw với `disease_aliases` bằng equality; cấm fuzzy/similarity.
- API dùng alias có qualifier hoặc nhiều thành phần như một cảnh báo liên quan, nhưng phải giữ nguyên raw
  condition mention trong item để người dùng thấy phạm vi cụ thể; không được suy diễn qualifier thành tình
  trạng đã xác nhận. Một raw interaction map tới nhiều bệnh đã chọn chỉ được hiển thị một lần.
- Mapping rule được import với `review_status=pending_review`; non-blocking review giống nguyên tắc cảnh
  báo hiện hành. Alias `rejected` bị loại khỏi lookup.

## Ngoài phạm vi

- Xóa hoặc ghi đè dữ liệu interaction/raw mention v1.
- Tự động đánh dấu mapping rule là `approved`.
- Dùng độ tương đồng chuỗi để tự động gộp hai condition.
- Gọi Gemini khi chưa có chấp thuận truyền raw mention ra provider bên ngoài.

## Acceptance criteria

1. Batch không phát sinh `INSERT`, `UPDATE`, `DELETE` hoặc DDL.
2. Toàn bộ distinct mention được xuất; số dòng có thể lớn hơn số mention do cụm ghép.
3. `Đái tháo đường`, `tiểu đường` và `Bệnh nhân bị tiểu đường` cùng đề xuất `diabetes_mellitus`.
4. `Suy thận nặng` giữ `severity=severe`; `Suy gan hoặc suy thận nặng` tạo hai component nhưng không gán
   mức độ mơ hồ cho cả hai.
5. `Bệnh thần kinh` không bị nhận nhầm là `Bệnh thận`; `bị tiểu đường` không bị nhận nhầm là `bí tiểu`.
6. Generic concept bị suppress khi đã có concept cụ thể.
7. Mention không có rule vẫn xuất dưới dạng `unmapped` và có raw text nguyên vẹn.
8. Model lỗi, sai schema, sai ID hoặc trả code ngoài catalog phải fallback cả batch sang rule mà không mất
   mention.
9. `--no-ai` không gọi model và báo rõ số đã map/chưa map.
10. Import v2 là idempotent, mặc định dry-run, có cờ `--apply` rõ ràng và chạy trong một transaction.
11. Catalog/API chỉ đọc v2; exact lookup đi qua alias. Alias có qualifier vẫn trả raw condition đầy đủ, không
    được rút gọn thành kết luận trên canonical condition rộng.
