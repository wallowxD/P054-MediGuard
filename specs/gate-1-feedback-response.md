# Phản hồi góp ý GATE 1

**Ngày:** 2026-08-09 · **Người tổng hợp:** Lê Nguyễn Minh Quang

Tài liệu này trả lời góp ý của leader về bộ deliverable GATE 1 và ghi lại **chính xác những
gì đã sửa** trong `Project Brief.docx` và `Product Requirements Document (PRD).docx`.

## Cách xử lý đã chọn

Leader quyết định **sửa trực tiếp vào `gate/gate_1/`** thay vì tạo bản v2 song song, để bộ
hồ sơ nộp lại là một bản duy nhất không mâu thuẫn. Ba file đã đổi nội dung:
`Project Brief.docx`, `Product Requirements Document (PRD).docx` và `README.md`.
`Diagram FLow.jpg` giữ nguyên.

Luật bất biến của `gate/gate_1/` — do chính đội đặt ra ngày 03/08/2026, không phải quy định
của BTC — đã được gỡ bằng [ADR 0019](../adrs/0019-gate-1-no-longer-immutable.md). Chi tiết
những gì bị gỡ nằm ở §E.

Bản docx trước khi sửa vẫn truy được bằng `git show 5ce5d6c:"gate/gate_1/..."`.

## Trả lời từng góp ý

| Góp ý | Xử lý | Ở đâu |
|---|---|---|
| Brief xác định rõ pain point và giữ ranh giới an toàn | Ghi nhận, không đổi nội dung | — |
| PRD thiếu Acceptance Criteria cho bảng Requirements | Viết đủ AC cho từng dòng, kèm cách đo | [`acceptance-criteria.md`](acceptance-criteria.md) và §A dưới đây |
| Rà tính nhất quán: mục tiêu phản hồi | Chốt số, tách hai đường nhập tay và OCR | §B1 |
| Rà tính nhất quán: "tra thuốc với bệnh nền" giữa PRD và UI Flow | Đã phân xử bằng [ADR 0017](../adrs/0017-self-reported-health-profile.md): đưa vào phạm vi, giới hạn bệnh nền tự khai | §B2 |
| UI Flow chưa có wireframe từng màn | Không xử lý ở tài liệu này — bản clickthrough sẽ deploy riêng | — |

---

## §A — Acceptance Criteria cho bảng Requirements của PRD

Góp ý nguyên văn: *"Bảng Requirements hiện có user story, mức ưu tiên và ghi chú nhưng chưa
quy định cách xác nhận từng tính năng đã hoàn thành và hoạt động đúng."*

Đã làm: thêm **một cột `Acceptance Criteria`** vào bảng Requirements của PRD, đặt giữa cột
*Importance* và cột *Notes*. Mã `Fx.y` trỏ về
[`specs/acceptance-criteria.md`](acceptance-criteria.md), nơi có tiêu chí đầy đủ và cách đo.

| Requirement | Acceptance Criteria đã thêm |
|---|---|
| Pilot trích xuất 50 thuốc bằng vision model | Chạy xong 50/50 thuốc và ghi tỷ lệ có dữ liệu tương tác hữu ích vào `eval/results/report.md` kèm ngày đo, trước khi chạy phần còn lại của danh mục. **[F10.1]** |
| Pipeline trích xuất dữ liệu tương tác từ PDF | Đoạn text lưu xuống khớp từng ký tự với PDF gốc; mỗi bản ghi có đường dẫn leaflet, số trang và chunk ID; leaflet ghi "chưa có thông tin" được lưu là không có dữ liệu chứ không thành cảnh báo rỗng; chạy lại tạo version mới, không ghi đè bản đang phục vụ. **[F10.2, F10.3, F10.5, F10.6]** |
| Con người review và gán severity | Bản ghi chưa có người duyệt luôn ở trạng thái `pending`; pipeline không tự đặt `approved`; dược sĩ sửa nội dung thì sinh evidence version mới, bản cũ vẫn truy vết được. **[F10.4, F9.2]** |
| Bảng dữ liệu tương tác có cấu trúc | Thiếu bất kỳ trường nguồn nào thì bản ghi không được nạp; cặp không có bản ghi trả `missing-record` có cấu trúc, không dùng `severity: unknown` để lấp. **[F10.3, F3.5]** |
| UI nhập thuốc kiểu tag-based search | Mỗi thuốc đã xác nhận là một thẻ xoá được riêng; thêm lại cùng một thuốc không tạo thẻ lặp. **[F1.7, F1.8]** |
| Upload ảnh đơn thuốc (OCR) | Ảnh JPG/PNG ra danh sách thuốc **đề xuất**; không có đường nào đưa thẳng kết quả OCR vào lượt kiểm tra khi người dùng chưa xác nhận; ảnh lưu ở storage private, URL không token bị từ chối. **[F11.1, F11.2, F11.6]** |
| Upload PDF đơn thuốc | Cùng một đơn ở dạng ảnh và dạng PDF ra cùng danh sách; file sai định dạng hoặc quá dung lượng bị chặn kèm thông báo rõ. **[F11.1, F11.5]** |
| Chuẩn hoá tên thuốc về danh mục 1073 thuốc | Gõ không dấu khớp tên có dấu; sai một ký tự vẫn khớp đúng thuốc; chuỗi không khớp gì trả rỗng chứ không đoán thuốc gần giống. **[F1.1, F1.3, F1.4, F1.5]** |
| Giải thích cảnh báo kèm nguồn | Không có trích dẫn nguyên văn và đường dẫn nguồn thì không có cảnh báo trên màn hình — đúng cho cả ba loại thuốc–thuốc, thuốc–thực phẩm và thuốc–bệnh nền. **[F3.1, F4.1, F5.2]** |
| Hiển thị cảnh báo ngay, không chặn bởi duyệt | Cảnh báo `pending` hợp lệ hiển thị ngay ở 100% trường hợp; người dùng thấy cảnh báo trước khi dược sĩ thao tác. **[F3.3, F9.1]** |
| Nhãn "chờ xác nhận chuyên môn" cho mức nặng | Cảnh báo nặng hiển thị đủ nội dung kèm nhãn chờ xác nhận, không bị ẩn hay che mờ; cảnh báo `rejected` không xuất hiện với người dùng. **[F3.3, F3.4]** |
| Dược sĩ xem và sửa kết quả OCR/mapping | Hàng đợi hiển thị cả ảnh gốc lẫn danh sách đã nhận diện; chỉ tài khoản `PHARMACIST` vào được; sửa thì sinh version mới. **[F11.7, F9.2, F9.3]** |
| Disclaimer an toàn nổi bật | Đủ 6 màn tra cứu đều có dòng miễn trừ, kể cả màn "chưa có dữ liệu"; rà toàn bộ chuỗi hiển thị không có câu mệnh lệnh về đổi, ngưng hay giảm thuốc. **[F12.1, F12.2]** |
| Phân quyền theo role | Gọi thẳng API duyệt bằng token `PATIENT` trả 403; frontend guard chỉ phục vụ UX. **[F12.4]** |
| Cảnh báo liều ngoài phạm vi | Chỉ so với ngưỡng ghi trong tờ HDSD kèm trích dẫn hiển thị cạnh kết quả; không đề xuất liều thay thế; không nội suy theo cân nặng, tuổi hay chức năng thận; kết quả vượt ngưỡng luôn kèm miễn trừ và nút gửi chuyên môn. **[F7.1–F7.4, ADR 0018]** |
| Đọc nhiều đơn thuốc cùng lúc | Nhiều đơn trong một lượt gộp thành một danh sách, thuốc trùng chỉ ra một dòng. **[F11.4]** |
| Branding "Hệ thống y tế X" | Repo không chứa asset hay chuỗi thương hiệu thật của bệnh viện tham chiếu. **[F12.5]** |
| Đa ngôn ngữ Việt/Anh | Đổi ngôn ngữ không đổi nội dung trích dẫn nguyên văn; chỉ nhãn giao diện đổi. **[F12.6]** |
| Admin quản lý danh mục thuốc và nguồn | Cập nhật danh mục đi qua catalog version có review diff; không có đường sửa thẳng bảng production. **[F13.1]** |
| Autocomplete khi nhập thuốc | Gõ một ký tự đã ra gợi ý theo tiền tố tên biệt dược; gợi ý chỉ đến từ danh mục bệnh viện. **[F1.2, F1.3]** |
| Sửa kết quả OCR thủ công | Sửa hoặc xoá được từng dòng OCR đọc sai ngay trên màn xác nhận, trước khi vào danh sách kiểm tra. **[F11.3]** |
| Admin audit log và báo cáo cảnh báo sai | Mọi thao tác duyệt hoặc sửa evidence ghi lại người, thời điểm và bản trước; báo cáo cảnh báo sai gắn được về đúng một evidence version. **[F13.2, F13.3]** |

### Bốn dòng **đã thêm mới** vào bảng Requirements

Bốn tính năng này đã có trong UI Flow gate 1 hoặc đã được ADR duyệt sau đó, nhưng bảng
Requirements của PRD chưa có dòng nào cho chúng. Đã chèn vào nhóm HIGH, ngay sau dòng
*Đọc nhiều đơn thuốc cùng lúc*.

| Requirement | User Story | Importance | Acceptance Criteria |
|---|---|---|---|
| Duyệt danh mục thuốc theo chữ cái | Là bệnh nhân, tôi muốn xem danh mục thuốc theo A–Z để tìm thuốc mà không cần nhớ chính xác tên | HIGH | Thanh chữ cái đủ 27 nhóm, nhóm rỗng bị disable chứ không ẩn; số đếm khớp tuyệt đối với tổng của danh sách; phân trang không lặp không sót; trang vượt phạm vi trả danh sách rỗng chứ không phải lỗi. **[F2.1–F2.5]** |
| Hồ sơ sức khoẻ tự khai | Là bệnh nhân, tôi muốn khai tuổi, cân nặng và tình trạng đặc biệt một lần để lần tra cứu sau không phải nhập lại | HIGH | Tải lại trang vẫn còn hồ sơ; xoá được từng trường và cả hồ sơ mà không ảnh hưởng tài khoản; hồ sơ không nằm trong JWT; tuổi lưu dạng ngày sinh. **[F6.1–F6.4, ADR 0017]** |
| Tra cứu tương tác thuốc–bệnh nền | Là bệnh nhân có bệnh nền, tôi muốn biết thuốc đang dùng có chống chỉ định với bệnh của mình không | HIGH | Nút kiểm tra chỉ bật khi có ≥1 thuốc **và** ≥1 bệnh nền; cảnh báo có trích dẫn nguyên văn đúng cặp (thuốc, bệnh), không trả bệnh gần nghĩa; bệnh nền khai trong hồ sơ **không** tự đưa vào lượt tra cứu; danh mục bệnh là tập đóng. **[F5.1–F5.4, ADR 0017]** |
| Gửi lượt tra cứu cho bác sĩ/dược sĩ | Là bệnh nhân, tôi muốn gửi kết quả có cảnh báo cho chuyên môn để được tư vấn xử trí | HIGH | Lối gửi chỉ hiện khi lượt tra cứu có ít nhất một cảnh báo; nội dung gửi gồm thuốc, bệnh nền, hồ sơ và toàn bộ cảnh báo kèm trích dẫn; không gửi trùng cùng một lượt. **[F8.1–F8.3]** |

---

## §B — Các mâu thuẫn đã xử lý

Mỗi dòng dưới đây là một chỗ hai tài liệu nói khác nhau, hoặc một tài liệu tự nói ngược
chính nó. Cột *Sửa thành* là nội dung đã áp vào file.

### B1 — Mục tiêu phản hồi (góp ý trực tiếp của leader)

| Tài liệu | Đang ghi | Sửa thành |
|---|---|---|
| PRD → Success Metrics → *Tốc độ phản hồi* | "Thời gian từ nhập/upload đến khi có cảnh báo **< X giây (cần chốt số)**" | "Đường nhập tay/tag: p95 ≤ 5 giây từ lúc bấm Kiểm tra đến cảnh báo đầu tiên. Đường ảnh/PDF: p95 ≤ 15 giây từ lúc upload đến màn xác nhận thuốc, sau đó áp mốc 5 giây như trên. Đo trên ≥ 30 run, ghi vào `eval/results/report.md`." |
| Brief → mục 6 → *Tốc độ phản hồi* | "≤ 5 giây từ lúc nhập/upload đến khi hiển thị kết quả trong điều kiện demo" | Dùng đúng hai mốc ở trên. Gộp OCR vào cùng ngưỡng 5 giây là không đo được vì đường ảnh phải gọi thêm vision model. |
| PRD → Success Metrics → 4 dòng đầu | Chỉ mô tả cách đo, **không có ngưỡng** | Chép ngưỡng từ Brief cho khớp: hoàn thành tra cứu ≥ 90%, chuẩn hoá tên thuốc ≥ 90%, cảnh báo được duyệt ≥ 80%. Coverage pilot giữ nguyên "đo trước khi scale", không đặt ngưỡng trước baseline. |
| Brief → mục 6 | Ghi các con số như chỉ tiêu đã cam kết | Thêm một dòng dưới bảng: "Đây là mục tiêu demo, chưa phải kết quả đo. Số đo thật nằm ở `eval/results/report.md`." Nếu không ghi câu này thì bảng Brief mâu thuẫn với SC-007/SC-008 của feature 001, vốn cấm chốt target trước khi có baseline. |

### B2 — Chức năng "tra thuốc với bệnh nền" (góp ý trực tiếp của leader)

Mâu thuẫn nằm **bên trong chính gate 1**: mục *Out of Scope* của PRD loại
*"Tương tác thuốc–bệnh lý"*, trong khi sơ đồ UI Flow cùng bộ hồ sơ lại vẽ
*"Tra thuốc với bệnh nền"* là một trong ba chức năng của bệnh nhân. Tệ hơn, chính bảng
Requirements của PRD cũng nhắc "thuốc với bệnh nền" ở dòng pipeline trích xuất.

Đã phân xử bằng [ADR 0017](../adrs/0017-self-reported-health-profile.md) (chấp nhận
09/08/2026): **đưa vào phạm vi**, giới hạn ở bệnh nền do người dùng tự khai; hệ thống không
chẩn đoán, không suy luận bệnh, không tự thêm bệnh nền cho ai.

| Tài liệu | Đang ghi | Sửa thành |
|---|---|---|
| PRD → Out of Scope | "Tương tác thuốc–bệnh lý." | Xoá dòng này. Thay bằng: "Chẩn đoán bệnh hoặc suy luận bệnh nền từ triệu chứng — bệnh nền chỉ đến từ khai báo của người dùng, chọn trong danh mục đóng." |
| PRD → Objective, câu 1 | "tra cứu tương tác thuốc–thuốc và tương tác thuốc–thực phẩm" | "tra cứu tương tác thuốc–thuốc, thuốc–thực phẩm và thuốc–bệnh nền tự khai" |
| PRD → Requirements | Thiếu dòng cho hồ sơ sức khoẻ và tra cứu thuốc–bệnh nền | Thêm hai dòng ở §A phần *Bốn dòng cần thêm mới* |
| Brief → tiêu đề phụ | "AI Agent tra cứu tương tác thuốc - thuốc và thuốc - thực phẩm có nguồn" | "…thuốc - thuốc, thuốc - thực phẩm và thuốc - bệnh nền tự khai, có nguồn" |
| Brief → mục 1 *Bức tranh tổng quan* và mục 7 *Phạm vi MVP* | Chỉ liệt kê hai loại tương tác | Bổ sung loại thứ ba, kèm câu giới hạn: bệnh nền do người dùng tự khai, không phải hồ sơ bệnh án |
| Brief → mục 4 bảng Agent | Cột *Tools/dữ liệu* chưa có danh mục bệnh | Thêm "danh mục bệnh nền đã duyệt" vào hàng *Tools* |

### B3 — PRD tự mâu thuẫn về nguồn dữ liệu

| Tài liệu | Đang ghi | Sửa thành |
|---|---|---|
| PRD → Objective | "dựa trên các dataset đã có sẵn (**191.5k dòng thuốc–thuốc**, dataset thuốc–thực phẩm)" | "dựa trên dữ liệu tương tác trích xuất từ tờ HDSD của danh mục thuốc bệnh viện GTVT (~1073 thuốc)". Câu cũ là nguồn dữ liệu đã bị thay và mâu thuẫn thẳng với mục Assumptions ngay bên dưới trong cùng PRD |
| PRD → Milestones → M1 | "Clean & join **3 dataset** (thuốc, tương tác thuốc–thuốc, tương tác thuốc–thực phẩm)" | "Chuẩn hoá danh mục thuốc bệnh viện; dựng schema DB; LangGraph skeleton; UI khung nhập tag-based" — bỏ phần join 3 dataset vì đã đổi nguồn |

### B4 — PRD vừa xếp LOW vừa xếp Out of Scope

Bốn tính năng đang xuất hiện ở **cả hai chỗ** trong cùng một PRD.

| Tính năng | Đề xuất chốt | Lý do |
|---|---|---|
| Autocomplete khi nhập thuốc | **Trong phạm vi**, giữ dòng LOW, xoá khỏi Out of Scope | Đã implement và đang chạy (`GET /api/v1/drugs/search`) |
| Sửa kết quả OCR thủ công | **Trong phạm vi**, giữ dòng LOW, xoá khỏi Out of Scope | Là điều kiện bắt buộc của luồng xác nhận sau OCR |
| Phân loại thuốc | **Ngoài phạm vi**, xoá dòng LOW | Không nằm trong luồng demo |
| Nhận diện thực phẩm chức năng | **Ngoài phạm vi**, xoá dòng LOW | Không nằm trong luồng demo |

### B5 — Từ vựng trạng thái lệch giữa Brief và phần còn lại

| Tài liệu | Đang ghi | Sửa thành |
|---|---|---|
| Brief → mục 5 USP và mục 2 bảng vai trò | "đã xác minh có tương tác / không đủ thông tin / cần bổ sung dữ liệu" | Dùng đúng bộ từ đang được implement: trạng thái duyệt là `pending` / `approved` / `rejected`; trường hợp thiếu dữ liệu là `unavailable` (`missing-record`, `missing-citation`, `source-unavailable`, `below-threshold`). Giữ ba cụm cũ làm nhãn tiếng Việt hiển thị thì được, nhưng phải nói rõ nó ánh xạ sang trạng thái nào |

### B6 — Ranh giới liều dùng chưa được ghi vào PRD

| Tài liệu | Đang ghi | Sửa thành |
|---|---|---|
| PRD → Requirements → *Cảnh báo liều ngoài phạm vi*, cột Notes | "—" | "Theo [ADR 0018]: chỉ đối chiếu liều người dùng nhập với ngưỡng **trích được** từ tờ HDSD, kèm trích dẫn nguyên văn. Không đề xuất liều, không nội suy theo cân nặng/tuổi/chức năng thận." Không ghi câu này thì dòng yêu cầu đọc như đang vi phạm nguyên tắc an toàn số 2 |

### B7 — Mốc thời gian: chưa sửa, đã ghi vào Open Questions

| Tài liệu | Đang ghi | Vấn đề |
|---|---|---|
| PRD → Target date và Milestones | "Core xong cuối tuần 4 (**23/8**)"; M4 Polish cuối tuần 6 | Lệch với mốc nộp GATE 2 ngày **16/08/2026**. Chưa tự sửa vì phải leader quyết: hoặc kéo core về trước 16/8, hoặc ghi rõ phần nào của core nằm ngoài phạm vi GATE 2 |

### B8 — Bảng Open Questions của PRD đang là "N/A"

Bảng *Open Questions* trước đây chỉ có một dòng `N/A | N/A | N/A`, trong khi PRD có ít nhất
năm câu hỏi thật đã hoặc chưa được trả lời. Đã thay bằng năm dòng: mốc thời gian phản hồi,
phạm vi thuốc–bệnh nền, ranh giới đối chiếu liều (ba dòng đã có câu trả lời và ngày), cùng
nguồn dữ liệu thuốc–bệnh nền và mốc 23/8 (hai dòng còn để "Chưa chốt").

---

## §C — Đã sửa trong repo

Các file sống trong repo đã được đồng bộ trong cùng đợt này:

| File | Sửa gì |
|---|---|
| [`specs/acceptance-criteria.md`](acceptance-criteria.md) | Thêm nhóm AC F10–F13 (ingestion, OCR đơn thuốc, an toàn/phân quyền, quản trị), thêm F1.7–F1.8, thêm bảng truy vết từ bảng Requirements của PRD |
| [`specs/product-vision.md`](product-vision.md) | Chỉ số thành công đổi thành bảng có ngưỡng cụ thể và tách hai mốc thời gian phản hồi; câu mô tả sản phẩm bổ sung thuốc–bệnh nền |
| [`specs/user-roles.md`](user-roles.md) | Bỏ câu "drug-condition ngoài phạm vi", thay bằng luồng tra thuốc–bệnh nền theo ADR 0017 |
| [`specs/app-flow.md`](app-flow.md) | Đối chiếu liều chuyển từ "chờ duyệt ADR 0018" sang "trong phạm vi", nêu rõ chặn kỹ thuật còn lại |
| [`adrs/README.md`](../adrs/README.md) | Trạng thái ADR 0018 sửa từ *Đề xuất* thành *Được chấp nhận*, khớp với nội dung ADR |
| [`gate/gate_1/README.md`](../gate/gate_1/README.md) | Mục tóm tắt PRD cập nhật theo bản đã sửa: Objective có thuốc–bệnh nền, Success Metrics có ngưỡng, Requirements nêu cột AC, Out of Scope bỏ dòng "tương tác thuốc–bệnh lý" |
| [`docs/project_context/T054_Project_Brief.docx`](../docs/project_context/T054_Project_Brief.docx) | Đồng bộ y hệt bản Brief trong `gate/gate_1/` (trước đó hai file trùng checksum) |

## §D — Còn mở

1. **Mốc 23/8 so với GATE 2 ngày 16/8** — §B7, đã ghi vào Open Questions của PRD.
2. **Nguồn dữ liệu thuốc–bệnh nền** — câu hỏi còn mở số 1 trong
   [`specs/002-drug-disease-check/spec.md`](002-drug-disease-check/spec.md): trích từ mục
   *Chống chỉ định* / *Thận trọng* của tờ HDSD, hay nhập tay có dược sĩ duyệt.

Hai mốc thời gian phản hồi (§B1) và bốn dòng LOW/Out of Scope (§B4) đã được chốt theo
phương án đề xuất và áp thẳng vào PRD; muốn đổi thì sửa lại cả PRD lẫn
[`product-vision.md`](product-vision.md).

## §E — Luật bất biến đã được gỡ

Ba tầng enforcement của luật cũ đều bị gỡ theo
[ADR 0019](../adrs/0019-gate-1-no-longer-immutable.md):

| Chỗ | Việc nó làm | Trạng thái |
|---|---|---|
| `.github/workflows/gate-integrity.yml` | Fail vô điều kiện mọi PR đụng `gate/gate_1/`, cộng verify SHA-256 | Xoá |
| `.github/gate-1.sha256` | Manifest checksum của 4 file | Xoá |
| Job `gate-integrity` trong `.github/workflows/ci.yml` | Bắt thư mục phải có đúng 4 file | Xoá |

Sáu file tài liệu chép lại luật này cũng đã được sửa: `AGENTS.md`, `README.md`,
`.cursor/rules/project.mdc`, `.github/copilot-instructions.md`,
`.claude/agents/gate-reviewer.md`, `.claude/commands/gate-check.md`, cùng
`docs/workflow.md` và `specs/001-core-interaction-check/checklists/requirements.md`.

Ràng buộc thay thế còn lại — nhẹ hơn nhưng bắt buộc: mỗi lần sửa `gate/gate_1/` phải ghi lý
do vào một tài liệu phản hồi trong `specs/` (chính là file này) và ghi chú ở đầu
`gate/gate_1/README.md`. Bản nộp gốc truy được bằng lịch sử git.

Từ đây đợt sửa 09/08/2026 đi qua pull request bình thường, không cần push thẳng lên `main`.
