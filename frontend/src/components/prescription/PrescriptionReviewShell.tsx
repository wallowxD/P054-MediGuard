import FeatureUnavailable from "@/components/FeatureUnavailable";
import PrescriptionImageUpload from "./PrescriptionImageUpload";

/**
 * Nội dung `/prescriptions/review` — màn xác nhận thuốc nhận diện từ ảnh đơn thuốc.
 *
 * Luồng OCR chưa tồn tại: chưa có endpoint upload ảnh, chưa có adapter OCR chạy thật,
 * và `specs/app-flow.md` còn xếp "Prescription OCR" vào phần cần spec + privacy rule
 * riêng. Vì vậy trang không dựng danh sách candidate rỗng cùng nút "Tiếp tục" khoá
 * cứng — người dùng cần biết ảnh đơn thuốc chưa được hệ thống xử lý, không phải đoán.
 *
 * TODO(API): khôi phục ba vùng (candidate OCR → xác nhận từ danh mục → danh sách đã
 * xác nhận) khi có endpoint OCR thật; candidate luôn phải được người dùng xác nhận
 * sang `IDrugItem` của danh mục, không dùng thẳng text OCR thô.
 */
export default function PrescriptionReviewShell() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Xác nhận danh sách thuốc</h1>
        <p className="text-sm text-foreground-secondary">
          Tên thuốc nhận diện từ ảnh luôn phải được bạn xác nhận lại với danh mục bệnh viện
          trước khi tra cứu.
        </p>
      </header>

      <PrescriptionImageUpload />

      <FeatureUnavailable
        title="Nhận diện đơn thuốc từ ảnh đang được phát triển, chưa khả dụng"
        description="Hệ thống chưa nhận và chưa phân tích ảnh đơn thuốc, nên màn xác nhận danh sách thuốc chưa có gì để xác nhận."
        missing={[
          "Nơi tải ảnh đơn thuốc lên có kiểm soát quyền riêng tư",
          "Dịch vụ đọc tên thuốc từ ảnh và đề xuất thuốc tương ứng trong danh mục bệnh viện",
          "Bước xác nhận từng tên thuốc nhận diện được với danh mục bệnh viện",
        ]}
      />
    </div>
  );
}
