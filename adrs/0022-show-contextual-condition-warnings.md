# ADR 0022 — Hiển thị cảnh báo bệnh cụ thể từ lựa chọn canonical rộng

- Trạng thái: Được chấp nhận
- Ngày: 13/08/2026
- Thay thế một phần: ADR 0021

## Bối cảnh

Người dùng chọn bệnh nền ở mức canonical để autocomplete không chứa hàng nghìn biến thể gần trùng nhau.
Trong khi đó, tờ HDSD thường ghi điều kiện cụ thể hơn như `suy thận nặng`, hoặc một cụm như
`suy thận nặng, xơ gan`. ADR 0021 ban đầu loại mọi alias có qualifier hoặc nhiều thành phần khi request
chưa thu qualifier. Cách làm này tránh suy diễn nhưng khiến toàn bộ cảnh báo có thật, có quote và nguồn
bị ẩn; một lượt chọn `Suy giảm chức năng thận` có thể trả rỗng dù database có nhiều bản ghi liên quan.

## Quyết định

Tra cứu vẫn bắt buộc join equality giữa `drug_disease_interactions.disease_name_unaccent` và
`disease_aliases.raw_name_unaccent`; không dùng fuzzy hoặc similarity. Alias `rejected` và interaction
`rejected` vẫn bị loại.

Khóa hoạt chất được mở rộng duy nhất qua tập alias đóng đã kiểm soát trong domain. Trường hợp hiện hành là
`tenofovir`, `tenofovir disoproxil fumarat` và `tenofovir disoproxil fumarate`, vì corpus dùng cả ba cách
ghi cho cùng chế phẩm TDF. Tên ngoài tập này vẫn chỉ tra đúng một exact key; không dùng similarity để thay
thế hoạt chất gần nghĩa.

Alias có severity, criteria hoặc nhiều thành phần được phép tham gia lookup như một cảnh báo liên quan tới
canonical condition đã chọn. API không được đổi điều kiện cụ thể thành kết luận rộng: item phải giữ nguyên
raw condition mention trong nhãn hiển thị, ví dụ `Suy thận nặng — thuộc nhóm Suy giảm chức năng thận`.
Quote nguyên văn và nguồn xác định vẫn là điều kiện bắt buộc để item được hiển thị.

Nếu cùng một raw interaction map tới nhiều canonical condition đã chọn, response chỉ trả interaction đó một
lần để tránh trùng cảnh báo và trùng DOM ID. Đây là tra cứu thông tin liên quan, không khẳng định người dùng
đang có mức độ hoặc tiêu chí cụ thể ghi trong nguồn.

## Hệ quả

Tích cực: cảnh báo có thật không còn biến mất chỉ vì nguồn ghi bệnh cụ thể hơn tên autocomplete; người dùng
vẫn nhìn thấy nguyên điều kiện áp dụng và có thể đối chiếu quote/PDF.

Tiêu cực: lựa chọn canonical rộng có thể trả cảnh báo chỉ phù hợp với một phân nhóm nặng hoặc tiêu chí cụ thể.
UI vì vậy phải giữ raw condition trong tiêu đề; hệ thống không được rút gọn item đó về canonical name hoặc
coi đây là xác nhận tình trạng lâm sàng.
