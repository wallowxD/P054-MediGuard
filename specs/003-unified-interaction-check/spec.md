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
- Màn tra cứu ưu tiên luồng `Chọn thuốc` rồi `Thêm bệnh nền` nếu có. Tóm tắt số thuốc,
  số bệnh và action tra cứu phải xuất hiện cạnh vùng nhập trên desktop, ngay sau vùng nhập
  trên mobile; không đặt action ở cuối khối OCR dài.
- `Nhập tên thuốc` và `Ảnh đơn thuốc` là hai phương thức nhập ngang hàng trong cùng
  workspace. Người dùng chuyển qua lại bằng tab mà không làm mất ảnh hoặc kết quả OCR
  đang xác nhận; OCR không được đặt trong cột tóm tắt hẹp hoặc dưới action tra cứu.
- Màn kết quả phải ưu tiên kết luận có giới hạn và cảnh báo có bằng chứng trước các nội
  dung bổ sung. Không dùng màu xanh hoặc câu chữ khiến trạng thái không tìm thấy dữ liệu
  bị hiểu là xác nhận an toàn. Không render dải thang màu tổng hợp cạnh tranh với kết luận;
  mức độ được đặt trực tiếp trên từng cảnh báo. Nhóm thực phẩm, đồ uống hoặc TPCN không có
  dữ liệu phải được ẩn thay vì tạo cột rỗng. Một cảnh báo nổi
  bật không được lặp lại trong danh sách chi tiết và citation mặc định ở trạng thái thu gọn.
  Cảnh báo nổi bật tách thuốc và đối tượng tương tác thành hai vùng có nhãn, không nối mọi
  dữ liệu thành một tiêu đề dài. Mỗi mục chỉ hiển thị tên, mức độ và tóm tắt ở lớp đầu;
  cơ chế, hướng xử trí và citation nằm chung trong disclosure `Hướng dẫn và tài liệu nguồn`.
  Khi mở, citation hiển thị trực tiếp cạnh hướng dẫn, không tạo accordion lồng nhau. Trạng
  thái `pending` dùng metadata ngắn `Dược sĩ đang duyệt` trong disclosure nguồn, không đặt
  dưới badge mức độ và không dùng chip dài làm cạnh tranh với nội dung cảnh báo.
- Hồ sơ sức khoẻ là thông tin hỗ trợ nên mặc định hiển thị dạng thu gọn, có nhãn và nút
  mở rõ ràng. Tình trạng mang thai hoặc cho con bú vẫn phải cho phép chủ động áp dụng vào
  lượt hiện tại mà không tự thêm từ hồ sơ đã lưu.
- Điều hướng bệnh nhân chỉ hiển thị một mục `Tra cứu tương tác thuốc` cho màn tổng hợp;
  không tách thuốc–thực phẩm hoặc thuốc–bệnh nền thành mục sidebar riêng.
- Sidebar chỉ hiển thị một mục điều hướng `Lịch sử tra cứu`; không tải hoặc hiển thị các
  snapshot gần nhất. Danh sách đầy đủ chỉ xuất hiện tại `/history`.
- Nhóm hệ thống ở chân sidebar có action riêng cho `Cài đặt`, chuyển dark mode và `Đăng xuất`.
  Hàng người dùng chỉ hiển thị danh tính; thông tin tài khoản và form chỉnh sửa hồ sơ sức
  khoẻ vẫn nằm trong trang `/settings`.
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
7. Sidebar không còn mục thuốc–thực phẩm/thuốc–bệnh nền riêng; chỉ có một target mở
   `/history`, một target mở `/settings`, action dark mode và action đăng xuất. Sidebar
   không tải hoặc hiển thị snapshot gần nhất; hàng người dùng chỉ hiển thị danh tính.
8. Chọn `Suy giảm chức năng thận` với `KETOPROXIN` phải trả bản ghi `Suy thận nặng` có severity
   `contraindicated`, quote và PDF nguồn; tiêu đề không được rút gọn thành bệnh thận chung.
9. UUID thuốc `TENOFOVIR` có canonical ingredient `tenofovir disoproxil fumarate` vẫn phải tìm được bản ghi
   lưu dưới exact alias `tenofovir disoproxil fumarat` hoặc `tenofovir`, không mở rộng sang hoạt chất khác.
10. `felodipine + Nước ép bưởi` tồn tại ở cả hai bảng interaction chỉ hiển thị một note, vẫn giữ nội dung,
    severity, trạng thái review và PDF nguồn hợp lệ.
11. Ở trạng thái ban đầu, người dùng nhìn thấy cả hai phương thức `Nhập tên thuốc` và
    `Ảnh đơn thuốc`, hướng dẫn điều kiện đủ và action tra cứu mà không cần mở form hồ sơ.
    Bố cục chuyển thành một cột theo đúng thứ tự thao tác trên mobile; vùng OCR dùng toàn
    bộ chiều rộng workspace khi được chọn.
12. Ở màn kết quả, trạng thái không có primary item phải nói rõ giới hạn của dữ liệu và
    không được trình bày như xác nhận an toàn. Chỉ nhóm note có nội dung được render; note
    đơn lẻ dùng toàn bộ chiều rộng đọc, không bị ép vào một trong ba cột cố định.
