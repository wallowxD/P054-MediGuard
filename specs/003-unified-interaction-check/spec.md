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
- Thuốc–thuốc và thuốc–bệnh dùng exact lookup. Với thuốc–bệnh, người dùng chọn canonical disease v2;
  backend join exact qua `disease_aliases.raw_name_unaccent`, không so canonical name trực tiếp với raw
  mention và không dùng similarity. Alias có qualifier hoặc nhiều thành phần được trả như cảnh báo liên quan,
  nhưng item phải giữ nguyên điều kiện cụ thể trong nguồn và ghi canonical group đã chọn; không được biến nó
  thành kết luận rộng. Một raw interaction map tới nhiều bệnh đã chọn chỉ hiển thị một lần.
  `pending_review` được hiển thị với nhãn
  chờ xác nhận; `rejected` bị loại.
- Exact ingredient lookup cho phép tập alias đóng đã kiểm soát để xử lý khác biệt chính tả/danh pháp có thật
  trong corpus. TDF tra đồng thời `tenofovir`, `tenofovir disoproxil fumarat` và
  `tenofovir disoproxil fumarate`; không dùng fuzzy hoặc tự suy ra hoạt chất tương tự.
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
- Khi cùng `canonical_ingredient + tên thực phẩm chuẩn hóa` tồn tại trong cả `drug_food_interactions` và
  `drug_supplement_interactions`, response chỉ có một note. Dòng đã phân loại qua `supplements.category`
  là nguồn chính; dòng food legacy bổ sung `effect_description`, `management` hoặc citation khác còn thiếu.
  Nội dung và citation trùng sau khi bỏ bullet/khoảng trắng không được hiển thị lặp.
- Không hiển thị danh sách các cặp `unavailable` trên màn kết quả patient.
- Mỗi lượt được lưu thành snapshot. Mở lịch sử không gọi Gemini và không tra lại bảng
  interaction.
- Upload ảnh gọi Gemini 3.5 Flash-Lite theo đặc tả 005; output chỉ là candidate cần chỉnh sửa và xác nhận
  stable catalog ID trước khi tham gia lượt tra cứu.
- Điều hướng bệnh nhân chỉ hiển thị một mục `Tra cứu tương tác thuốc` cho màn tổng hợp;
  không tách thuốc–thực phẩm hoặc thuốc–bệnh nền thành mục sidebar riêng.
- Sidebar hiển thị tối đa ba snapshot gần nhất từ cùng nguồn dữ liệu với `/history`; trạng
  thái rỗng chỉ xuất hiện khi tài khoản thực sự chưa có lịch sử.
- Toàn bộ hàng người dùng ở chân sidebar mở trang hồ sơ cá nhân. Theme, đăng xuất, thông
  tin tài khoản và form chỉnh sửa hồ sơ sức khoẻ nằm trong trang này, không tách thành các
  icon action ở sidebar.
- Trang hồ sơ hiển thị `Mang thai` và `Cho con bú` dưới dạng checkbox. Các bệnh nền khác
  được tìm bằng cùng autocomplete canonical với màn tra cứu và lưu nhiều giá trị qua
  bảng nối `patient_diseases`; dữ liệu đã lưu chỉ gợi ý, không tự đi vào request tra cứu.

## Ngoài phạm vi

Đối chiếu liều, chẩn đoán, kê đơn, đổi thuốc và gửi chuyên môn.

## Acceptance criteria

1. Warfarin–Tamoxifen không bao giờ trả Acenocoumarol–Tamoxifen.
2. `ASPIRIN - 100` + `SavNopain 500` có thể hiển thị bản ghi `moderate`, kể cả khi
   `pending_review`, nếu citation resolve được.
3. Severity scale lấy distinct non-rejected từ database theo thứ tự
   `contraindicated → major → moderate → minor → unknown`; count chỉ đếm primary item.
4. Citation thiếu quote hoặc nguồn xác định không được render thành cảnh báo.
5. Lỗi lưu lịch sử trả `checkId: null`, `historyStatus: not-saved` nhưng giữ nguyên kết quả.
6. UI dùng được bằng bàn phím, responsive, dark mode; quote không line-clamp.
7. Sidebar không còn mục thuốc–thực phẩm/thuốc–bệnh nền riêng, hiển thị lịch sử thật và
   chỉ dùng một target hồ sơ ở chân sidebar.
8. Chọn `Suy giảm chức năng thận` với `KETOPROXIN` phải trả bản ghi `Suy thận nặng` có severity
   `contraindicated`, quote và PDF nguồn; tiêu đề không được rút gọn thành bệnh thận chung.
9. UUID thuốc `TENOFOVIR` có canonical ingredient `tenofovir disoproxil fumarate` vẫn phải tìm được bản ghi
   lưu dưới exact alias `tenofovir disoproxil fumarat` hoặc `tenofovir`, không mở rộng sang hoạt chất khác.
10. `felodipine + Nước ép bưởi` tồn tại ở cả hai bảng interaction chỉ hiển thị một note, vẫn giữ nội dung,
    severity, trạng thái review và PDF nguồn hợp lệ.
