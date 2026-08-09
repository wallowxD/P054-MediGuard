# ADR 0018 — Đối chiếu liều dùng là trình bày bằng chứng, không phải đưa liều

- **Trạng thái:** Được chấp nhận
- **Ngày:** 2026-08-09
- **Liên quan:** làm rõ nguyên tắc an toàn số 2 trong `AGENTS.md`; tuân thủ ADR 0006

## Bối cảnh

Bản demo được duyệt ngày 08/08/2026 có khối *"Đối chiếu liều dùng"* trên cả ba màn tra cứu
(`demo-ui/js/app.js`, `renderDoseSection`). Người dùng nhập số lượng mỗi lần và số lần mỗi
ngày cho từng thuốc; hệ thống so với ngưỡng ghi trong tờ HDSD và hiển thị:

- nhãn trạng thái (trong ngưỡng / vượt ngưỡng / chưa đủ dữ liệu),
- **trích dẫn nguyên văn** mục *Liều và cách dùng* của tờ HDSD,
- đường dẫn nguồn kèm số trang.

Nguyên tắc an toàn số 2 trong `AGENTS.md` viết: *"Không kết luận lâm sàng. Không chẩn đoán,
kê đơn, đề xuất đổi thuốc hoặc **đưa liều**."* Đọc theo nghĩa rộng nhất, câu này cấm luôn cả
khối trên. Đọc theo nghĩa hẹp, nó cấm hệ thống **tự nghĩ ra một liều** cho người dùng.

Không làm rõ thì mỗi người trong đội sẽ tự chọn một cách đọc, và tính năng sẽ hoặc bị bỏ,
hoặc bị làm quá tay.

## Quyết định

Đối chiếu liều dùng **được phép**, với bốn ràng buộc bắt buộc:

1. **Chỉ so sánh, không đề xuất.** Hệ thống được nói *"liều bạn nhập cao hơn ngưỡng ghi
   trong tờ HDSD"*. Hệ thống **không** được nói nên uống bao nhiêu, nên giảm còn bao nhiêu,
   hay nên ngừng thuốc.
2. **Con số so sánh phải trích được.** Ngưỡng dùng để đối chiếu phải lấy từ mục *Liều và
   cách dùng* của tờ HDSD, kèm trích dẫn nguyên văn và nguồn hiển thị ngay cạnh kết quả.
   Không có trích dẫn thì không đối chiếu — trả "chưa đủ dữ liệu", đúng như ADR 0006.
3. **Không suy ra ngưỡng.** Không nội suy theo cân nặng, tuổi hay chức năng thận. Tờ HDSD
   không ghi ngưỡng cho nhóm của người dùng thì trả "chưa đủ dữ liệu", không tự tính.
4. **Mọi kết quả vượt ngưỡng phải kèm lối ra chuyên môn.** Hiển thị dòng miễn trừ và nút
   gửi cho bác sĩ/dược sĩ.

## Lý do

- Đây đúng là việc sản phẩm sinh ra để làm: **truy xuất và trình bày bằng chứng có nguồn**.
  Khác biệt giữa *"tờ HDSD ghi tối đa 4g/ngày, bạn nhập 6g"* và *"bạn nên uống 3g/ngày"* là
  khác biệt giữa trích dẫn tài liệu và ra quyết định lâm sàng.
- Bỏ tính năng này không làm người dùng an toàn hơn. Người uống quá liều vẫn uống quá liều,
  chỉ là không ai chỉ cho họ đọc dòng nào trong tờ HDSD.
- Ràng buộc số 3 mới là chỗ dễ trượt nhất. Nội suy liều theo cân nặng nhìn có vẻ vô hại
  nhưng đó chính là hành vi kê đơn, và mọi phép tính đó đều nằm ngoài tài liệu gốc.

## Hệ quả

- ✅ Nguyên tắc "không bịa" áp dụng đồng nhất cho cả liều lẫn tương tác: không trích dẫn thì
  không hiển thị.
- ✅ Đội có một ranh giới kiểm tra được khi review PR, thay vì tranh luận theo cảm tính.
- ❌ Rất nhiều thuốc trong danh mục sẽ trả "chưa đủ dữ liệu" vì tờ HDSD không ghi ngưỡng ở
  dạng máy đọc được. Tỷ lệ phủ thấp là kết quả trung thực, không phải lỗi cần che.
- ❌ Ingestion phải trích thêm ngưỡng liều dạng có cấu trúc từ mục *Liều và cách dùng* — công
  việc chưa có trong pipeline hiện tại.
- ❌ Người dùng vẫn có thể tự diễn giải "vượt ngưỡng" thành "phải giảm liều". Giảm thiểu
  bằng dòng miễn trừ và nút gửi chuyên môn, không loại bỏ được hoàn toàn.

## Phương án đã xem xét

- **Bỏ hẳn đối chiếu liều.** An toàn nhất về mặt trách nhiệm và đúng cách đọc rộng của
  nguyên tắc số 2. Bị loại vì bản demo đã được duyệt có tính năng này, và vì nó chỉ trình
  bày lại nội dung tờ HDSD — đúng phạm vi sản phẩm.
- **Đối chiếu có nội suy theo cân nặng/tuổi.** Phủ được nhiều thuốc hơn, nhất là nhi khoa.
  Bị loại dứt khoát: phép nội suy không nằm trong tài liệu gốc nên không trích dẫn được, và
  đó là hành vi kê đơn.
