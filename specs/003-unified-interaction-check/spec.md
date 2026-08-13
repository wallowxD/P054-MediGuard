# Đặc tả tra cứu tương tác tổng hợp — VMEC-40

## Mục tiêu

Một màn hình cho phép người dùng xác nhận thuốc từ danh mục, chọn bệnh nền từ bảng
`diseases`, xác nhận lại tình trạng đặc biệt và nhận kết quả thuốc–thuốc/thuốc–bệnh nền
có trích dẫn. Thông tin hồ sơ đã lưu không tự động trở thành đầu vào tra cứu.

## Yêu cầu chức năng

- `DrugCatalogPicker` chỉ nhận ứng viên có stable drug ID; không nhận tên thuốc tự do.
- Giao diện tình trạng đặc biệt chỉ gồm `Mang thai` và `Phụ nữ cho con bú`, chỉ hiển thị
  khi giới tính đang chọn là nữ. Đổi sang giới tính khác phải gỡ các xác nhận này khỏi
  lượt hiện tại. `Suy thận` và `Suy gan` vẫn có thể chọn từ autocomplete bệnh nền.
- Chỉ cho tra khi có ít nhất hai thuốc, hoặc một thuốc kèm ít nhất một bệnh/tình trạng
  được xác nhận trong lượt hiện tại.
- Thuốc–thuốc và thuốc–bệnh dùng exact lookup. `pending_review` được hiển thị với nhãn
  chờ xác nhận; `rejected` bị loại.
- Mọi item phải có quote nguyên văn, URL nguồn và `evidenceId`. Không resolve được nguồn
  thì trả `unavailable`, không suy đoán.
- Gemini 3.5 Flash-Lite chỉ tóm tắt record đã qua citation validation. Lỗi model phải
  fallback về raw database fields mà không làm mất kết quả. Summary dùng ngôn ngữ phổ
  thông, câu ngắn và không chép lại nguyên cấu trúc hàn lâm trong database.
- Notes gồm mọi thuốc–thực phẩm và thuốc–TPCN đủ nguồn của thuốc đã chọn. Bệnh nền tham
  chiếu lại primary item, không nhân đôi payload. Nội dung note luôn hiển thị; citation
  mở theo yêu cầu. Nguồn food/supplement phải là PDF tờ HDSD trên Google Drive, không
  phải artifact Markdown của OCR.
- Note lấy từ `drug_supplement_interactions` phải resolve category qua bảng `supplements`: ưu tiên
  `supplement_id`, fallback bằng exact `supplement_name_unaccent` khi category không mơ hồ.
  `food`, `beverage`, `fruit` hiển thị ở nhóm thực phẩm và đồ uống; `supplement`, `herb` hiển thị
  ở nhóm TPCN. Category thiếu, lạ hoặc mơ hồ không được tự suy đoán.
- Không hiển thị danh sách các cặp `unavailable` trên màn kết quả patient.
- Mỗi lượt được lưu thành snapshot. Mở lịch sử không gọi Gemini và không tra lại bảng
  interaction.
- Upload ảnh chỉ chọn và preview cục bộ; chưa upload/OCR trong delivery này.

## Ngoài phạm vi

OCR đơn thuốc, đối chiếu liều, chẩn đoán, kê đơn, đổi thuốc và gửi chuyên môn.

## Acceptance criteria

1. Warfarin–Tamoxifen không bao giờ trả Acenocoumarol–Tamoxifen.
2. `ASPIRIN - 100` + `SavNopain 500` có thể hiển thị bản ghi `moderate`, kể cả khi
   `pending_review`, nếu citation resolve được.
3. Severity scale lấy distinct non-rejected từ database theo thứ tự
   `contraindicated → major → moderate → minor → unknown`; count chỉ đếm primary item.
4. Citation thiếu quote hoặc nguồn xác định không được render thành cảnh báo.
5. Lỗi lưu lịch sử trả `checkId: null`, `historyStatus: not-saved` nhưng giữ nguyên kết quả.
6. UI dùng được bằng bàn phím, responsive, dark mode; quote không line-clamp.
