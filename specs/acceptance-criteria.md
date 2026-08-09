# Sổ tiêu chí chấp nhận

Trả lời góp ý gate 1 của mentor: *"Bảng Requirements hiện có user story, mức ưu tiên và ghi
chú nhưng chưa quy định cách xác nhận từng tính năng đã hoàn thành và hoạt động đúng."*

## Vì sao là file này, không sửa PRD

PRD nằm trong [`gate/gate_1/Product Requirements Document (PRD).docx`](../gate/gate_1/) —
đã nộp và **bất biến**, không được sửa, xoá hay đổi tên. File này là sổ AC sống, bổ sung
cho PRD chứ không thay thế. Mỗi yêu cầu trong PRD được nối tới AC kiểm chứng được ở đây.

## Cách viết một AC trong dự án này

Một AC hợp lệ phải **kiểm chứng được bởi người khác mà không cần hỏi lại tác giả**. Cụ thể:

- Nói về hành vi quan sát được, không nói về code. *"Trả `missing-record`"* thay vì *"gọi
  đúng repository"*.
- Nêu rõ đầu vào và đầu ra mong đợi, gồm cả trường hợp không có dữ liệu.
- Với sản phẩm này, mọi AC hiển thị cảnh báo đều phải nói tới **trích dẫn và nguồn** — một
  tính năng hiển thị đúng nội dung nhưng thiếu nguồn là chưa đạt, không phải đạt một phần.

## Bảng AC theo tính năng

Cột *Đo bằng gì* là cách kiểm chứng thực tế khi review, không phải mô tả lại yêu cầu.

### F1 — Tra cứu và xác nhận thuốc trong danh mục

| # | Tiêu chí chấp nhận | Đo bằng gì |
|---|---|---|
| F1.1 | Gõ tên biệt dược hoặc hoạt chất trả về ứng viên từ danh mục bệnh viện, giữ nguyên văn tên | Gõ "Hapacol" ra `Hapacol Caplet 500 [Paracetamol 500mg]` |
| F1.2 | Gõ một ký tự đã ra gợi ý theo tiền tố tên biệt dược | Gõ `H` ra thuốc vần H, không ra thuốc chứa chữ h ở giữa |
| F1.3 | Gõ không dấu vẫn khớp tên có dấu | "vien sui" ra "Panadol Viên Sủi" |
| F1.4 | Gõ sai một ký tự vẫn khớp đúng thuốc | "panadl" ra "Panadol Viên Sủi" |
| F1.5 | Chuỗi không khớp gì trả rỗng, KHÔNG đoán thuốc gần giống | "xyzkhongcothat" trả `candidates: []` |
| F1.6 | Hệ thống không tự chọn hộ trừ khi khớp tuyệt đối và duy nhất | `requiresConfirmation = false` chỉ khi có đúng 1 ứng viên điểm 100 |

**Trạng thái:** đã đạt — `GET /api/v1/drugs/search`, VMEC-29.

### F2 — Duyệt danh mục thuốc

| # | Tiêu chí chấp nhận | Đo bằng gì |
|---|---|---|
| F2.1 | Danh mục duyệt được theo chữ cái A–Z | `GET /api/v1/drugs?letter=H` chỉ trả thuốc vần H |
| F2.2 | Thanh chữ cái hiển thị đủ 27 nhóm, nhóm rỗng bị disable chứ không ẩn | `/drugs/letters` trả 27 phần tử kể cả `count = 0` |
| F2.3 | Số đếm của thanh chữ cái khớp tuyệt đối với tổng của danh sách | `count` vần A = `total` của `?letter=A`, đúng cho cả 26 vần |
| F2.4 | Phân trang không lặp và không sót bản ghi | Quét hết một vần qua mọi trang: đủ số dòng, không id trùng |
| F2.5 | Trang vượt phạm vi trả 200 kèm danh sách rỗng, không phải lỗi | `?page=9999` trả `items: []`, `total` giữ nguyên |

**Trạng thái:** đã đạt — VMEC-29, VMEC-22.

### F3 — Tra cứu tương tác thuốc – thuốc

| # | Tiêu chí chấp nhận | Đo bằng gì |
|---|---|---|
| F3.1 | Mỗi cảnh báo hiển thị trích dẫn nguyên văn + nguồn + trạng thái duyệt | Không có citation thì không có cảnh báo trên màn hình |
| F3.2 | Tra đúng cặp, không bao giờ trả cặp gần nghĩa | "Warfarin + Tamoxifen" không ra bản ghi "Acenocoumarol + Tamoxifen" |
| F3.3 | Cảnh báo `pending` hiển thị NGAY kèm nhãn chờ xác nhận | Không có trạng thái nào chặn hiển thị |
| F3.4 | Cảnh báo `rejected` không xuất hiện với người dùng | Response của patient không chứa bản ghi rejected |
| F3.5 | Thiếu dữ liệu trả `unavailable` có cấu trúc, không dùng `severity: unknown` | Cặp không có bản ghi trả `missing-record` |
| F3.6 | Một cặp lỗi không xoá kết quả hợp lệ của cặp khác | Batch có 1 cặp hỏng vẫn trả đủ cặp còn lại |

**Trạng thái:** chưa đạt — `POST /api/v1/interactions/check` chưa mở.

### F4 — Tra cứu tương tác thuốc – thực phẩm

| # | Tiêu chí chấp nhận | Đo bằng gì |
|---|---|---|
| F4.1 | Kết quả là đoạn nguyên văn từ tờ HDSD của đúng thuốc đã chọn | Trích dẫn resolve được về `evidence_chunks` của thuốc đó |
| F4.2 | Dưới ngưỡng retrieval trả `below-threshold`, KHÔNG hạ ngưỡng để ép ra kết quả | `retrieval.score_threshold` trong config không bị sửa để test đạt |

**Trạng thái:** chưa đạt.

### F5 — Tra cứu thuốc – bệnh nền

AC đầy đủ nằm ở [`specs/002-drug-disease-check/spec.md`](002-drug-disease-check/spec.md),
mục *Câu chuyện người dùng và tiêu chí chấp nhận*. Tóm tắt điểm nghiệm thu:

| # | Tiêu chí chấp nhận | Đo bằng gì |
|---|---|---|
| F5.1 | Nút kiểm tra chỉ bật khi có ≥1 thuốc **và** ≥1 bệnh nền | Thiếu một vế thì nút khoá, không gọi API |
| F5.2 | Cảnh báo có trích dẫn nguyên văn + nguồn, đúng cặp (thuốc, bệnh) | Không ra cảnh báo của bệnh gần nghĩa |
| F5.3 | Bệnh nền trong hồ sơ KHÔNG tự đưa vào lượt tra cứu | Khai "suy thận" ở hồ sơ không tự sinh cảnh báo |
| F5.4 | Danh mục bệnh là tập đóng, không nhận text tự do | Gõ bệnh không có trong danh mục không thêm được |

**Trạng thái:** chưa đạt — VMEC-73, VMEC-74, VMEC-75.

### F6 — Hồ sơ sức khoẻ tự khai

| # | Tiêu chí chấp nhận | Đo bằng gì |
|---|---|---|
| F6.1 | Nhập một lần, lần tra cứu sau không phải nhập lại | Tải lại trang vẫn còn hồ sơ |
| F6.2 | Xoá được từng trường và xoá được cả hồ sơ | Xoá hồ sơ không ảnh hưởng tài khoản đăng nhập |
| F6.3 | Hồ sơ không nằm trong JWT | Giải mã cookie phiên không thấy trường sức khoẻ nào |
| F6.4 | Tuổi lưu dạng ngày sinh, hiển thị là tuổi tính ra | Đổi năm hệ thống thì tuổi hiển thị đổi theo |

**Trạng thái:** chưa đạt — VMEC-73, VMEC-74, VMEC-75.

### F7 — Đối chiếu liều dùng

Ranh giới do [ADR 0018](../adrs/0018-dose-comparison-boundary.md) quy định.

| # | Tiêu chí chấp nhận | Đo bằng gì |
|---|---|---|
| F7.1 | Chỉ so sánh với ngưỡng ghi trong tờ HDSD, kèm trích dẫn nguyên văn | Mỗi kết quả đối chiếu đều có quote + nguồn hiển thị cạnh nó |
| F7.2 | KHÔNG đề xuất liều thay thế, không nói nên giảm còn bao nhiêu | Rà toàn bộ chuỗi hiển thị: không có câu nào ở thể mệnh lệnh về liều |
| F7.3 | Không nội suy ngưỡng theo cân nặng, tuổi hay chức năng thận | Tờ HDSD không ghi ngưỡng cho nhóm đó thì trả "chưa đủ dữ liệu" |
| F7.4 | Kết quả vượt ngưỡng luôn kèm miễn trừ và lối gửi chuyên môn | Màn hình vượt ngưỡng có cả hai thành phần |

**Trạng thái:** chưa đạt — chờ ADR 0018 được duyệt.

### F8 — Gửi kết quả cho bác sĩ / dược sĩ

| # | Tiêu chí chấp nhận | Đo bằng gì |
|---|---|---|
| F8.1 | Chỉ hiện lối gửi khi lượt tra cứu có ít nhất một cảnh báo | Lượt không có cảnh báo không hiện banner |
| F8.2 | Nội dung gửi đủ để duyệt mà không phải hỏi lại | Gồm thuốc, bệnh nền, hồ sơ và toàn bộ cảnh báo kèm trích dẫn |
| F8.3 | Không gửi trùng cùng một lượt | Gửi lần hai bị chặn, hiển thị trạng thái đã gửi |

**Trạng thái:** chưa đạt.

### F9 — Hàng đợi duyệt của dược sĩ

| # | Tiêu chí chấp nhận | Đo bằng gì |
|---|---|---|
| F9.1 | Duyệt song song, không chặn hiển thị phía người dùng | Người dùng thấy cảnh báo trước khi dược sĩ thao tác |
| F9.2 | Dược sĩ sửa nội dung tạo phiên bản evidence mới, không ghi đè bản cũ | Bản cũ vẫn truy vết được sau khi sửa |
| F9.3 | Chỉ tài khoản `PHARMACIST` vào được khu vực duyệt | Tài khoản `PATIENT` gọi API duyệt bị từ chối ở backend |

**Trạng thái:** chưa đạt.

## Quy tắc dùng sổ này

- Ticket Jira triển khai một tính năng phải trỏ tới mã AC tương ứng trong phần mô tả.
- PR chỉ được merge khi mọi AC của tính năng đó có cách kiểm chứng thật — test tự động,
  hoặc các bước bấm tay ghi trong PR. "Đã chạy thử thấy chạy" không phải bằng chứng.
- AC thay đổi thì sửa file này trong cùng PR với code, đúng quy tắc cập nhật tài liệu của
  `AGENTS.md`.
