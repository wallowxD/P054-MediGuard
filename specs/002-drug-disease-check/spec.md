# Đặc tả tính năng: Tra cứu thuốc – bệnh nền có dẫn nguồn

**Workspace:** `specs/002-drug-disease-check/`

**Ngày tạo:** 2026-08-09

**Trạng thái:** Sẵn sàng để leader review trước implementation

**Jira:** Project `VMEC`; branch implementation phải link ticket sở hữu

**Nguồn luồng:** [`demo-ui/interactions-disease.html`](../../demo-ui/interactions-disease.html)
— bản demo HTML/CSS đã được duyệt ngày 08/08/2026. Mọi mô tả màn hình dưới đây bám theo
demo đó; khác demo thì phải sửa spec này trước, không sửa thẳng code.

## Bối cảnh

Nhiều thuốc trong danh mục chống chỉ định hoặc cần thận trọng với người có bệnh nền nhất
định. Không có tính năng này, người dùng tra được tương tác thuốc–thuốc và thuốc–thực phẩm
nhưng vẫn bỏ lọt nhóm rủi ro phổ biến nhất trên thực tế.

[ADR 0017](../../adrs/0017-self-reported-health-profile.md) đã đưa thuốc–bệnh nền vào phạm
vi, giới hạn ở **bệnh nền do người dùng tự khai**. Feature này hiện thực hoá quyết định đó
và tuân thủ nguyên vẹn ADR 0005 (review không chặn hiển thị), ADR 0006 (mọi cảnh báo phải
có trích dẫn) và ADR 0012 (bản ghi có evidence).

Tra cứu thuốc–bệnh nền dùng **exact lookup theo cặp (hoạt chất, bệnh nền)**, cùng lý do đã
áp cho thuốc–thuốc ở ADR 0004: similarity search có thể trả bản ghi của một bệnh gần nghĩa,
nguồn và trích dẫn đều thật nhưng sai cặp.

## Câu chuyện người dùng và tiêu chí chấp nhận

### US1 — Khai báo hồ sơ sức khoẻ

Người dùng nhập tuổi, cân nặng, chiều cao, giới tính; tích hai tình trạng đặc biệt (đang
mang thai, đang cho con bú); và chọn nhiều bệnh nền từ danh mục gợi ý để dùng lại ở các
lần tra cứu sau.

1. Hồ sơ trống → form mở sẵn; hồ sơ đã có → thu gọn thành một dòng tóm tắt, bấm để mở lại.
2. Sửa và lưu hồ sơ không làm mất danh sách thuốc hoặc bệnh nền đang nhập dở trên màn hình.
3. Người dùng xoá được từng trường và xoá được toàn bộ hồ sơ; xoá hồ sơ không ảnh hưởng tài
   khoản đăng nhập.
4. Hồ sơ **không** tự sinh cảnh báo. Nó được hiển thị lại cho người dùng và đính kèm khi
   gửi cho bác sĩ/dược sĩ; mọi cảnh báo vẫn phải xuất phát từ trích dẫn tờ HDSD.
5. Tuổi lưu dưới dạng ngày sinh; màn hình hiển thị tuổi được tính ra, không lưu số tuổi.
6. Bệnh nền không nhập text tự do: người dùng gõ để tìm, rồi chọn stable disease ID từ
   danh mục. Một người có thể lưu nhiều bệnh và không tạo dòng trùng.

### US2 — Nhập thuốc đang dùng

Người dùng thêm thuốc bằng ảnh đơn thuốc (OCR) hoặc gõ tay có gợi ý, giống hệt luồng của
Feature 001.

1. Gợi ý chỉ đến từ danh mục bệnh viện; không nhận text tự do vào danh sách.
2. Thuốc nhận diện từ ảnh phải được người dùng xác nhận trước khi vào danh sách.
3. Danh sách gộp cả thuốc từ ảnh và thuốc nhập tay, xoá được từng dòng.

### US3 — Nhập bệnh nền

Người dùng gõ tên bệnh nền, chọn từ gợi ý trong danh mục bệnh rồi thêm vào danh sách của
lượt tra cứu.

1. Gợi ý chỉ đến từ danh mục bệnh đã được duyệt; không nhận text tự do.
2. Gõ không dấu vẫn tìm được tên có dấu ("suy than" → "Suy thận mạn").
3. Thêm trùng một bệnh nền không tạo dòng lặp.
4. Nút kiểm tra chỉ bật khi có **tối thiểu 1 thuốc và 1 bệnh nền**; trước đó hiển thị dòng
   hướng dẫn nêu rõ còn thiếu gì.

### US4 — Nhận cảnh báo thuốc – bệnh nền có dẫn nguồn

Với mỗi cặp (thuốc, bệnh nền), người dùng nhận cảnh báo gồm mức nghiêm trọng, trích dẫn
nguyên văn, nguồn và trạng thái duyệt.

1. Có bản ghi exact-pair kèm evidence hợp lệ → hiển thị đúng cặp, kèm trích dẫn nguyên văn
   và đường dẫn nguồn.
2. `pending` → **hiển thị ngay** với nhãn đang chờ xác nhận chuyên môn (ADR 0005).
3. `rejected` → không bao giờ xuất hiện trong response của người dùng.
4. Không có bản ghi cho cặp đó → trả `missing-record`; **không** thay bằng bệnh gần nghĩa.
5. Có bản ghi nhưng thiếu trích dẫn hoặc nguồn → không tạo cảnh báo, trả `missing-citation`
   hoặc `source-unavailable`.
6. Một cặp lỗi không làm mất kết quả hợp lệ của các cặp còn lại trong cùng lượt.
7. Màn hình kết quả luôn kèm dòng miễn trừ: đây là cảnh báo tham khảo, không phải kết luận
   lâm sàng.

### US5 — Gửi kết quả cho bác sĩ hoặc dược sĩ

Khi có cảnh báo đáng lưu ý, người dùng gửi nguyên lượt tra cứu cho chuyên môn để nhận
khuyến nghị xử trí.

1. Banner gửi đối chiếu chỉ xuất hiện khi lượt tra cứu có ít nhất một cảnh báo.
2. Người dùng chọn người nhận và nhập ghi chú không bắt buộc.
3. Gửi xong đổi sang trạng thái "đã gửi" và không cho gửi trùng cùng một lượt.
4. Nội dung gửi đi gồm: danh sách thuốc, danh sách bệnh nền, hồ sơ sức khoẻ và toàn bộ
   cảnh báo kèm trích dẫn — đủ để người duyệt không phải hỏi lại.

## Trường hợp biên

- Người dùng thêm bệnh nền nhưng chưa thêm thuốc nào, hoặc ngược lại → nút kiểm tra vẫn
  khoá, không gọi API.
- Cặp (thuốc, bệnh nền) có nhiều bản ghi evidence → hiển thị tất cả, không tự chọn bản
  nghiêm trọng nhất.
- Bệnh nền có trong hồ sơ (suy thận, suy gan) nhưng người dùng không thêm vào danh sách tra
  cứu → **không** tự thêm hộ; hệ thống chỉ nhắc người dùng.
- Người dùng xoá hết thuốc sau khi đã có kết quả → kết quả cũ phải bị dọn, không để lại
  cảnh báo mồ côi trên màn hình.
- Danh mục bệnh rỗng hoặc lỗi tải → báo lỗi rõ ràng, không để ô nhập im lặng không gợi ý.

## Yêu cầu chức năng

| # | Yêu cầu | Ghi chú |
|---|---|---|
| FR1 | Lưu hồ sơ sức khoẻ tự khai theo tài khoản | Bảng riêng, không nằm trong `users` — ADR 0017 |
| FR2 | Danh mục bệnh nền có chuẩn hoá không dấu | Dùng lại `domain/normalization.py` |
| FR3 | Exact lookup theo cặp (hoạt chất chuẩn hoá, tên bệnh chuẩn hoá) | Cấm similarity search làm cơ sở kết luận |
| FR4 | Mỗi cảnh báo bắt buộc có `verbatim_quote` và nguồn | Đã được enforce bằng `NOT NULL` ở schema |
| FR5 | Trả `unavailable` có cấu trúc khi thiếu dữ liệu | Không dùng `severity: unknown` thay thế |
| FR6 | Gửi lượt tra cứu cho chuyên môn kèm hồ sơ | Tái dùng hàng đợi duyệt của ADR 0005 |

## Thực thể chính

| Thực thể | Vai trò |
|---|---|
| `patient_profiles` | Hồ sơ sức khoẻ tự khai, 1-1 với `users` |
| `patient_conditions` | Hai tình trạng đặc biệt mang thai/cho con bú của hồ sơ, 1-n |
| `patient_diseases` | Bảng nối nhiều bệnh nền tự khai với một người dùng |
| `diseases` | Danh mục bệnh nền được duyệt, có cột không dấu |
| `drug_disease_interactions` | Bản ghi cặp thuốc–bệnh kèm trích dẫn (**bảng đã có schema nhưng chưa tồn tại trong database — xem VMEC-72**) |

## Tiêu chí thành công

1. 100% cảnh báo thuốc–bệnh nền hiển thị kèm trích dẫn nguyên văn và nguồn truy vết được.
2. 0 trường hợp trả cảnh báo của một cặp bệnh khác với cặp người dùng hỏi.
3. Cảnh báo `pending` hiển thị ngay, không chờ duyệt.
4. Người dùng nhập hồ sơ một lần, các lần tra cứu sau không phải nhập lại.

## Giả định đã duyệt

- Bệnh nền do người dùng tự khai, không phải hồ sơ bệnh án do cơ sở y tế lập.
- Danh mục bệnh nền là tập đóng do đội duyệt, không cho người dùng tự tạo bệnh mới.
- Hồ sơ sức khoẻ không tham gia suy luận cảnh báo ở phiên bản này.

## Ngoài phạm vi Feature 002

- Chẩn đoán, kê đơn, đề xuất đổi thuốc hoặc đổi liều.
- Suy luận cảnh báo từ hồ sơ (ví dụ tự cảnh báo vì người dùng khai đang mang thai).
- Tự động đồng bộ tình trạng đặc biệt trong hồ sơ vào danh sách bệnh nền của lượt tra cứu.

## Câu hỏi còn mở — cần leader quyết trước khi implement

1. **Nguồn dữ liệu thuốc–bệnh nền.** Bản demo dùng dữ liệu minh hoạ và tự ghi nhãn *"chưa
   có nguồn trích dẫn cụ thể"*. Điều đó vi phạm nguyên tắc số 1 nếu bê nguyên lên
   production. Cần chốt nguồn thật: trích từ mục *Chống chỉ định* / *Thận trọng* của tờ
   HDSD đã ingest, hay nhập tay có dược sĩ duyệt?
2. **Đối chiếu liều dùng.** Demo có khối *"Đối chiếu liều dùng"* so liều người dùng nhập
   với ngưỡng ghi trong tờ HDSD. Xem [ADR 0018](../../adrs/0018-dose-comparison-boundary.md).
