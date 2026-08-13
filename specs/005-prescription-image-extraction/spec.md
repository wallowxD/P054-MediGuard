# Đặc tả trích xuất ảnh đơn thuốc — VMEC-40

## Mục tiêu

Người dùng tải ảnh đơn thuốc lên màn tra cứu tổng hợp, nhận candidate tên thuốc, hoạt chất và bệnh/chẩn đoán
được ghi rõ trên ảnh, chỉnh sửa kết quả rồi xác nhận các mục có stable catalog ID trước khi tra cứu tương tác.

## Yêu cầu chức năng

- Nhận 1–5 ảnh JPEG, PNG hoặc WEBP; tối đa 10 MB mỗi ảnh và 25 MB toàn request.
- UI preview cục bộ và chỉ gửi ảnh khi người dùng bấm `Phân tích ảnh với Gemini`.
- UI thông báo ảnh được gửi tới Gemini để nhận diện và ứng dụng không lưu ảnh.
- Gemini 3.5 Flash-Lite chép chuỗi thuốc nhìn thấy, tách tên thuốc/hoạt chất nếu có, đánh dấu `uncertain` khi
  mờ và chỉ lấy bệnh/chẩn đoán được ghi rõ. Không suy bệnh từ danh sách thuốc.
- Backend không lưu ảnh, filename hoặc output model; ảnh được bỏ metadata trước khi gửi provider.
- Mỗi thuốc/bệnh trích xuất đi kèm tối đa năm candidate từ catalog. Candidate không phải kết quả đã xác nhận.
- Người dùng sửa được tên thuốc, hoạt chất hoặc tên bệnh; sau khi sửa, UI tìm lại catalog.
- Chỉ candidate được người dùng bấm chọn mới được áp dụng vào danh sách thuốc/bệnh của lượt tra cứu. Chống
  trùng theo stable ID và không xóa các mục người dùng đã nhập tay.
- Model timeout, sai schema, ảnh hỏng/giả MIME, vượt giới hạn và không nhận diện được nội dung có state riêng,
  không tự chuyển thành kết quả hợp lệ.
- Provider trả quota/quá tải phải hiện lỗi `503` đúng nguyên nhân; không để retry ngầm của SDK kéo dài rồi
  biến thành `504`. Timeout thực mới dùng `504`.
- Không trích xuất hoặc trả về họ tên, địa chỉ, số điện thoại, mã bệnh nhân, chữ ký hay dữ liệu nhận dạng khác.

## Ngoài phạm vi

PDF đơn thuốc, lưu ảnh, lưu bản OCR, đối chiếu liều, nhận dạng chữ ký, xác minh đơn thật/giả, chẩn đoán và tự
động tra cứu khi người dùng chưa xác nhận candidate.

## Acceptance criteria

1. Ảnh hợp lệ tạo response structured gồm `drugs`, `diseases`, `model` và cảnh báo xác nhận.
2. Ảnh sai signature, MIME không hỗ trợ, quá 10 MB, quá năm ảnh hoặc tổng quá 25 MB bị từ chối trước khi gọi model.
3. Gemini timeout/sai schema trả lỗi có thông điệp an toàn và không mất danh sách nhập tay hiện tại.
4. Candidate thuốc được xếp hạng bằng catalog v2; model không thể tự đặt `drugId`/`diseaseId`.
5. Bệnh chỉ lấy từ chẩn đoán/tình trạng ghi rõ trên ảnh, không suy luận từ thuốc.
6. Sửa text làm chạy lại autocomplete; chỉ candidate được xác nhận mới vào giỏ.
7. Nhiều ảnh có cùng thuốc/bệnh không tạo candidate OCR trùng sau chuẩn hóa.
8. Ảnh và filename không được persist hoặc ghi log.
9. Luồng dùng được bằng bàn phím, responsive và dark mode.
