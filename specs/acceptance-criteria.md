# Sổ tiêu chí chấp nhận

Trả lời góp ý gate 1 của mentor: *"Bảng Requirements hiện có user story, mức ưu tiên và ghi
chú nhưng chưa quy định cách xác nhận từng tính năng đã hoàn thành và hoạt động đúng."*

## Quan hệ với PRD

PRD nằm trong [`gate/gate_1/Product Requirements Document (PRD).docx`](../gate/gate_1/). Bản
ngày 09/08/2026 đã có cột *Acceptance Criteria* rút gọn cho từng dòng Requirements; file này
là sổ AC sống, giữ tiêu chí đầy đủ, cách đo và trạng thái. Mã `Fx.y` trong PRD trỏ về đây.
Sửa AC thì sửa file này trước, rồi đồng bộ lại PRD trong cùng pull request.

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
| F1.7 | Thuốc đã xác nhận hiển thị dạng thẻ, xoá được từng thẻ | Bấm x trên một thẻ chỉ xoá thẻ đó |
| F1.8 | Thêm lại thuốc đã có không tạo thẻ lặp | Chọn cùng một catalog ID hai lần vẫn ra 1 thẻ |

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

**Trạng thái:** chưa đạt — ADR 0018 đã được chấp nhận 09/08/2026; chặn còn lại là ingestion
chưa trích ngưỡng liều dạng có cấu trúc.

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

### F10 — Trích xuất dữ liệu tương tác từ tờ HDSD

Nhóm này phủ các yêu cầu phía dữ liệu của PRD: pilot 50 thuốc, pipeline vision model, người
duyệt severity và bảng tương tác có cấu trúc.

| # | Tiêu chí chấp nhận | Đo bằng gì |
|---|---|---|
| F10.1 | Pilot 50 thuốc chạy xong và báo cáo tỷ lệ có dữ liệu hữu ích **trước khi** scale | `eval/results/report.md` có số coverage kèm ngày đo, không còn "Chưa đo" |
| F10.2 | Đoạn text trích xuất được lưu nguyên văn, không paraphrase ở bước lưu trữ | So chuỗi trong `evidence_chunks` với text PDF gốc: khớp từng ký tự |
| F10.3 | Mỗi bản ghi có đủ nguồn: đường dẫn leaflet, số trang, chunk ID | Thiếu một trường thì bản ghi không được đưa vào bảng tương tác |
| F10.4 | Severity do vision model đề xuất không tự vào hệ thống chính thức | Bản ghi chưa có người duyệt luôn ở `pending`; pipeline không tự đặt `approved` |
| F10.5 | Chạy lại ingestion tạo version mới, không ghi đè evidence đang phục vụ | Bản cũ vẫn resolve được sau khi refresh |
| F10.6 | Leaflet ghi "chưa có thông tin về tương tác" được lưu là **không có dữ liệu** | Thuốc kiểu SOLPIVIN 50 trả `missing-record`, không tạo cảnh báo rỗng |

**Trạng thái:** chưa đạt — pilot chưa chạy.

### F11 — Nhận diện thuốc từ ảnh hoặc PDF đơn thuốc

| # | Tiêu chí chấp nhận | Đo bằng gì |
|---|---|---|
| F11.1 | Upload ảnh (JPG/PNG) và PDF đều ra danh sách thuốc đề xuất | Cùng một đơn ở hai định dạng ra cùng danh sách |
| F11.2 | Kết quả OCR luôn là **đề xuất**, phải người dùng xác nhận mới vào danh sách | Không có đường nào đưa thẳng OCR vào lượt kiểm tra |
| F11.3 | Người dùng sửa hoặc xoá được từng dòng OCR đọc sai trước khi xác nhận | Sửa "Panadl" thành "Panadol" ngay trên màn xác nhận |
| F11.4 | Upload nhiều đơn trong một lượt gộp thành một danh sách, không dòng trùng | Hai đơn cùng chứa Paracetamol ra một dòng |
| F11.5 | File sai định dạng hoặc quá dung lượng bị chặn kèm thông báo rõ | Upload `.exe` báo lỗi, không im lặng |
| F11.6 | Ảnh đơn thuốc lưu ở storage private | Mở URL không kèm token bị từ chối |
| F11.7 | Dược sĩ xem và sửa được kết quả nhận diện của lượt đã gửi lên | Hàng đợi hiển thị cả ảnh gốc lẫn danh sách đã nhận diện |

**Trạng thái:** chưa đạt — cần spec riêng cho prescription OCR (xem `app-flow.md`).

### F12 — Ràng buộc an toàn hiển thị, phân quyền và bối cảnh

| # | Tiêu chí chấp nhận | Đo bằng gì |
|---|---|---|
| F12.1 | Mọi màn kết quả có dòng miễn trừ, kể cả màn "chưa có dữ liệu" | Rà đủ 6 màn tra cứu, không màn nào thiếu |
| F12.2 | Không màn nào có câu ở thể mệnh lệnh về đổi, ngưng hay giảm thuốc | Rà toàn bộ chuỗi hiển thị và template prompt |
| F12.3 | Severity biểu diễn bằng chữ và icon, không chỉ bằng màu | Xem ở chế độ grayscale vẫn phân biệt được ba mức |
| F12.4 | Backend chặn `PATIENT` gọi endpoint duyệt, không chỉ ẩn nút ở frontend | Gọi thẳng API bằng token patient trả 403 |
| F12.5 | Bối cảnh "Hệ thống y tế X" chỉ dùng tên và logo giả lập | Repo không chứa asset hay chuỗi thương hiệu thật của bệnh viện tham chiếu |
| F12.6 | Đổi ngôn ngữ Việt/Anh không đổi nội dung trích dẫn nguyên văn | Quote giữ nguyên tiếng của leaflet; chỉ nhãn giao diện đổi |

**Trạng thái:** một phần — F12.3 đã có ở demo; còn lại chưa nghiệm thu.

### F13 — Quản trị danh mục và truy vết

| # | Tiêu chí chấp nhận | Đo bằng gì |
|---|---|---|
| F13.1 | Cập nhật danh mục thuốc đi qua catalog version có review diff | Không có đường sửa thẳng bảng production |
| F13.2 | Mọi thao tác duyệt hoặc sửa evidence ghi lại người, thời điểm và bản trước | Truy được ai đổi gì, lúc nào |
| F13.3 | Báo cáo cảnh báo sai gắn được về đúng evidence version | Ticket truy vết chỉ tới một `EvidenceVersion` cụ thể |

**Trạng thái:** chưa đạt — mức ưu tiên MEDIUM/LOW, sau core flow.

## Truy vết từ bảng Requirements của PRD

Bảng dưới trả lời trực tiếp góp ý gate 1: **mỗi dòng Requirements trong PRD có cách xác nhận
đã hoàn thành**. Cột *AC* là mã trong tài liệu này; cột *Ghi chú phạm vi* nêu chỗ yêu cầu
trong PRD đã bị ADR sau đó sửa lại.

| Yêu cầu trong PRD | Mức | AC | Ghi chú phạm vi |
|---|---|---|---|
| Pilot trích xuất 50 thuốc bằng vision model | HIGH | F10.1 | — |
| Pipeline trích xuất tương tác từ PDF | HIGH | F10.2, F10.3, F10.5, F10.6 | User story trong PRD có nhắc "thuốc với bệnh nền" trong khi Out of Scope lại loại — ADR 0017 phân xử: giữ, đưa vào phạm vi |
| Con người review và gán severity | HIGH | F10.4, F9.2 | — |
| Bảng dữ liệu tương tác có cấu trúc | HIGH | F10.3, F3.5 | — |
| UI nhập thuốc kiểu tag-based search | HIGH | F1.7, F1.8 | — |
| Upload ảnh đơn thuốc (OCR) | HIGH | F11.1, F11.2, F11.6 | — |
| Upload PDF đơn thuốc | HIGH | F11.1, F11.5 | — |
| Chuẩn hoá tên thuốc về danh mục | HIGH | F1.1, F1.3, F1.4, F1.5 | — |
| Giải thích cảnh báo kèm nguồn | HIGH | F3.1, F4.1, F5.2 | — |
| Hiển thị cảnh báo ngay, không chặn bởi duyệt | HIGH | F3.3, F9.1 | — |
| Nhãn "chờ xác nhận chuyên môn" cho mức nặng | HIGH | F3.3, F3.4 | — |
| Dược sĩ xem và sửa kết quả OCR/mapping | HIGH | F11.7, F9.2, F9.3 | — |
| Disclaimer an toàn nổi bật | HIGH | F12.1, F12.2 | — |
| Phân quyền theo role | HIGH | F12.4 | — |
| Cảnh báo liều ngoài phạm vi | HIGH | F7.1–F7.4 | Ranh giới do ADR 0018 quy định: chỉ đối chiếu, không đề xuất liều |
| Đọc nhiều đơn thuốc cùng lúc | HIGH | F11.4 | — |
| Duyệt danh mục thuốc A–Z | — | F2.1–F2.5 | Có trong UI Flow gate 1 nhưng **thiếu dòng trong bảng Requirements**; đã implement |
| Hồ sơ sức khoẻ tự khai | — | F6.1–F6.4 | Yêu cầu mới theo ADR 0017; PRD chưa có dòng |
| Tra cứu thuốc–bệnh nền | — | F5.1–F5.4 | Yêu cầu mới theo ADR 0017; PRD chưa có dòng |
| Gửi lượt tra cứu cho bác sĩ/dược sĩ | — | F8.1–F8.3 | Có trong UI Flow gate 1, **thiếu dòng trong bảng Requirements** |
| Branding "Hệ thống y tế X" | MEDIUM | F12.5 | — |
| Đa ngôn ngữ Việt/Anh | MEDIUM | F12.6 | — |
| Admin quản lý danh mục và nguồn | MEDIUM | F13.1 | — |
| Autocomplete khi nhập thuốc | LOW | F1.2, F1.3 | PRD vừa xếp LOW vừa xếp Out of Scope; thực tế đã implement → giữ trong phạm vi |
| Sửa kết quả OCR thủ công | LOW | F11.3 | Mâu thuẫn tương tự; là điều kiện bắt buộc của F11.2 → giữ trong phạm vi |
| Phân loại thuốc | LOW | — | PRD vừa xếp LOW vừa xếp Out of Scope; đề nghị chốt hẳn **ngoài phạm vi** |
| Nhận diện thực phẩm chức năng | LOW | — | Như trên, đề nghị chốt hẳn **ngoài phạm vi** |
| Admin audit log và báo cáo cảnh báo sai | LOW | F13.2, F13.3 | — |

## Quy tắc dùng sổ này

- Ticket Jira triển khai một tính năng phải trỏ tới mã AC tương ứng trong phần mô tả.
- PR chỉ được merge khi mọi AC của tính năng đó có cách kiểm chứng thật — test tự động,
  hoặc các bước bấm tay ghi trong PR. "Đã chạy thử thấy chạy" không phải bằng chứng.
- AC thay đổi thì sửa file này trong cùng PR với code, đúng quy tắc cập nhật tài liệu của
  `AGENTS.md`.
