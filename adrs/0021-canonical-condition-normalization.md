# ADR 0021 — Chuẩn hóa mention bệnh thành canonical condition có human review

- Trạng thái: Bị thay thế một phần bởi 0022
- Ngày: 13/08/2026
- Bổ sung: ADR 0017

## Bối cảnh

`drug_disease_interactions.disease_name` hiện chứa nguyên cụm do AI trích từ HDSD. Một cụm có
thể là tên đồng nghĩa, bệnh kèm mức độ, ngưỡng xét nghiệm hoặc biểu thức gồm nhiều bệnh. Đưa
thẳng các cụm này vào `diseases` làm autocomplete tạo hơn một nghìn lựa chọn gần trùng nhau và
không thể hiện đúng nghĩa lâm sàng của dữ liệu nguồn.

## Quyết định

Tách hai khái niệm:

- raw condition mention là nguyên văn đã trích, không sửa và tiếp tục truy vết về interaction;
- canonical condition là khái niệm ổn định dùng cho autocomplete và exact lookup sau này.

AI chỉ đề xuất mapping có cấu trúc từ mention đã tồn tại; không đọc lại HDSD, không tự merge và
không ghi production. Mọi đề xuất được xuất thành artifact `needs_review`. Exact alias đã được
duyệt mới có thể dùng để tự động map ở các lần ingestion sau. Mức độ, diễn tiến, giai đoạn, lọc
máu và ngưỡng xét nghiệm là qualifier, không được ghép vào preferred name như một bệnh mới.

Pilot đầu tiên chỉ bao phủ nhóm thận/gan và không có migration. Sau pilot, batch được mở rộng theo yêu cầu
sản phẩm để đọc toàn bộ corpus, nhưng vẫn giữ nguyên ranh giới an toàn: rule chỉ map alias/thuật ngữ xác
định, mention mơ hồ mang trạng thái `unmapped`, mọi dòng đều cần human review và không có thao tác ghi
database. Kết quả phải được con người duyệt trước khi thiết kế backfill hoặc đổi lookup từ chuỗi sang
stable ID.

Theo quyết định tiếp theo của chủ sản phẩm, schema v2 được triển khai nhưng không phá hủy v1:

- canonical concept nằm trong `diseases` với `version=v2` và stable `concept_code`;
- raw mention nối tới canonical concept qua bảng `disease_aliases`, cũng mang `version=v2`;
- API chỉ đọc catalog v2 và exact lookup qua alias; dữ liệu interaction/raw mention không bị viết lại;
- mapping rule vào trạng thái `pending_review`, được hiển thị theo cơ chế review không chặn nhưng có thể
  bị loại bằng `rejected`;
- qualifier không có trong request không được tự suy diễn. Alias compound, có severity hoặc criteria chỉ
  được dùng khi contract tương lai thu đủ thông tin tương ứng.

## Hệ quả

Tích cực: autocomplete có thể gọn, raw evidence không bị mất và mapping sai không đi thẳng vào
luồng cảnh báo. Tiêu cực: cần hàng đợi duyệt, một mention có thể tạo nhiều mapping và lookup hiện
tại vẫn dùng chuỗi cho tới khi migration/backfill riêng được phê duyệt.
