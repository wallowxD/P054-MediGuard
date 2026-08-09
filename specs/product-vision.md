# Tầm nhìn sản phẩm — Trợ lý An toàn Thuốc

> Nguồn gốc: Project Brief và PRD tại `gate/gate_1/`, bản sửa ngày 09/08/2026. Tài liệu này
> là baseline làm việc dễ đọc cho thành viên và AI; lệch nhau thì sửa cả hai trong cùng
> pull request.

## Một câu mô tả

Người bệnh đang phải tự đọc leaflet và đối chiếu từng cặp thuốc → một AI agent tra cứu
tương tác thuốc–thuốc, thuốc–thực phẩm và thuốc–bệnh nền có dẫn nguồn trong hệ thống bệnh
viện.

## Bài toán

Danh mục bệnh viện chưa gắn dữ liệu tương tác. Người dùng phải tra từng thuốc, đọc PDF và
tự cross-check mọi cặp. Quy trình chậm, dễ bỏ sót và khó đánh giá với người không có chuyên
môn. Công cụ bên ngoài thường không khớp biệt dược Việt Nam hoặc không đưa nguồn.

Baseline hiện hành giữ leaflet gốc làm nguồn, nhưng tách cơ chế:

- drug-drug: ingestion tạo exact-pair record có evidence; request-time tra exact key;
- drug-food: scoped semantic retrieval trên nội dung leaflet.

Xem [domains.md](domains.md), [app-flow.md](app-flow.md), ADR 0012 và ADR 0013.

## Người dùng

| Nhóm | Nhu cầu |
|---|---|
| Patient/carer | Tra nhanh từ danh sách thuốc hoặc candidate OCR đã xác nhận |
| Doctor/pharmacist | Kiểm tra quote, source và xác nhận/reject evidence |

## Định vị

Agent nằm trong hệ thống bệnh viện, cung cấp thông tin tham khảo có nguồn và trạng thái
review. Agent không kết luận lâm sàng và không thay thế bác sĩ.

## Ba nguyên tắc an toàn hiện hành

1. **Không bịa cảnh báo:** warning bắt buộc có verbatim quote + source URL; thiếu evidence
   thì trả “chưa có dữ liệu”.
2. **Không kết luận lâm sàng:** không chẩn đoán, kê đơn, đổi thuốc hoặc đưa liều. Nguyên
   tắc này cấm hệ thống **tự nghĩ ra** một liều; trích lại ngưỡng liều đã ghi trong tờ HDSD
   và đối chiếu với liều người dùng nhập thì được, theo ranh giới của
   [ADR 0018](../adrs/0018-dose-comparison-boundary.md).
3. **Review không chặn:** pending warning hợp lệ hiển thị ngay với nhãn chờ xác nhận.

## Chỉ số thành công

Cột *Mục tiêu* là **target demo do Project Brief đặt ra, chưa phải kết quả đo**. Số đo thật
chỉ nằm ở [`eval/results/report.md`](../eval/results/report.md); không chép target sang đó.

| Chỉ số | Mục tiêu | Đo ở đâu |
|---|---|---|
| Tỷ lệ hoàn thành tra cứu end-to-end | ≥ 90% người dùng test | Phiên test có người dùng |
| Độ chính xác chuẩn hoá tên thuốc | ≥ 90% | Bộ ≥ 30 case, SC-007 feature 001 |
| Tỷ lệ cảnh báo được dược sĩ approve | ≥ 80% | Hàng đợi duyệt trong pilot |
| Coverage trích xuất leaflet | Đo trên pilot 50 thuốc trước khi scale | Báo cáo pilot |
| Thời gian phản hồi, đường nhập tay | p95 ≤ 5 giây tới cảnh báo đầu tiên | ≥ 30 run, SC-008 feature 001 |
| Thời gian phản hồi, đường ảnh/PDF | p95 ≤ 15 giây tới màn xác nhận thuốc | ≥ 30 run, cùng phép đo |
| Cảnh báo hợp lệ hiển thị không chờ duyệt | 100% | Test tự động |

Hai mốc thời gian tách đôi vì đường ảnh/PDF phải gọi thêm OCR; gộp chung một con số 5 giây
như Project Brief là không đo được. Xem
[gate-1-feedback-response.md](gate-1-feedback-response.md).

## Giả định

- Nguồn catalog: `dataset/drug_list_bv_gtvt.csv`, khoảng 1.073 dòng.
- Drug-drug existence đến từ exact-pair evidence record theo ADR 0012.
- Drug-food và citation đến từ qualifying leaflet passage.
- Model không approve evidence hoặc lấp missing interaction.
- Source text được giữ nguyên văn và có version.

## Ngoài phạm vi

Diagnosis/prescribing · AI tự đổi thuốc · agent long-term memory · full-gate review ·
clone UI hoặc private data của bệnh viện tham chiếu.

*Drug-condition interaction* từng nằm trong danh sách này theo mục Out of Scope của PRD
gate 1, nhưng sơ đồ UI Flow trong cùng file gate 1 lại vẽ màn *"Tra thuốc với bệnh nền"*.
[ADR 0017](../adrs/0017-self-reported-health-profile.md) phân xử mâu thuẫn đó theo hướng
đưa vào phạm vi, giới hạn ở **bệnh nền do người dùng tự khai**. Hệ thống không chẩn đoán,
không suy luận bệnh và không tự thêm bệnh nền cho ai.

*Agent long-term memory* vẫn ngoài phạm vi và không bị ADR 0017 nới lỏng: hồ sơ sức khoẻ
là dữ liệu người dùng chủ động nhập, nhìn thấy và xoá được, không phải thứ agent tự ghi nhớ
giữa các phiên.
