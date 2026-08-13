import { ImageOff } from "lucide-react";

/**
 * ★ Module ảnh đơn thuốc ở trạng thái "chưa hỗ trợ" — KHÔNG thao tác được.
 *
 * Bản trước cho chọn file và kéo thả ảnh, hiện thumbnail xong… dừng ở đó: không có
 * endpoint upload, không có OCR. Người dùng chọn ảnh đơn thuốc rồi thấy nó hiện lên
 * thì mặc định hiểu là hệ thống đã nhận và đang đọc đơn — hiểu nhầm nguy hiểm nhất
 * trong sản phẩm này, vì họ sẽ chờ một kết quả không bao giờ tới thay vì tự nhập thuốc.
 *
 * Vì vậy module không còn `<input type="file">`, không còn vùng kéo thả và không còn
 * preview. Chỉ mở lại các affordance đó cùng lúc với endpoint upload + OCR thật.
 */
export default function PrescriptionImageUpload() {
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="flex gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-foreground-muted">
          <ImageOff className="h-5 w-5" aria-hidden />
        </span>
        <div className="space-y-1.5">
          <h2 className="text-sm font-semibold text-foreground">
            Ảnh đơn thuốc — chưa hỗ trợ
          </h2>
          <p className="text-sm leading-relaxed text-foreground-secondary">
            Hiện chưa thể gửi ảnh đơn thuốc cho hệ thống. Không có ảnh nào được tải lên và
            không có đơn thuốc nào được AI đọc hay phân tích. Khi tính năng mở, bạn vẫn phải
            tự xác nhận từng tên thuốc với danh mục bệnh viện trước khi tra cứu.
          </p>
        </div>
      </div>
    </div>
  );
}
