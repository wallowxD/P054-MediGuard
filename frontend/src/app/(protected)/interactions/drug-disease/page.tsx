import type { Metadata } from "next";
import FeatureUnavailable from "@/components/FeatureUnavailable";
import { buildPrivateMetadata } from "@/utils/metadata-utils";

export const metadata: Metadata = buildPrivateMetadata(
  "Tra cứu thuốc – bệnh nền",
  "Tra cứu thuốc–bệnh nền đang được phát triển, chưa khả dụng."
);

/**
 * Tính năng ĐÃ trong phạm vi theo ADR 0017, nhưng CHƯA có backend: bảng
 * `drug_disease_interactions` chưa tồn tại trong database (xem VMEC-72) và hồ sơ
 * bệnh nền của người dùng chưa có API (VMEC-71).
 *
 * Trang này CHỦ ĐÍCH là Server Component tĩnh, không dựng form disabled: một form
 * đầy đủ ô nhập nhưng khoá cứng vẫn khiến người dùng tin luồng sắp chạy được, trong
 * khi thứ họ cần biết là hiện chưa tra cứu được và nên hỏi ai.
 */
export default function DrugDiseaseInteractionsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Tra cứu thuốc – bệnh nền</h1>
        <p className="text-sm text-foreground-secondary">
          Thông tin tham khảo, không thay thế đánh giá của bác sĩ.
        </p>
      </header>

      <FeatureUnavailable
        title="Tra cứu thuốc – bệnh nền đang được phát triển, chưa khả dụng"
        description="Bạn chưa thể hoàn tất một lượt tra cứu tương tác giữa thuốc và bệnh nền. Hệ thống chỉ đối chiếu bệnh nền do bạn tự khai và không tự suy luận bệnh, nên phần khai báo hồ sơ phải có trước khi mở màn hình này."
        missing={[
          "Hồ sơ sức khoẻ tự khai để bạn chọn bệnh nền của mình",
          "Dữ liệu tương tác thuốc–bệnh nền kèm trích dẫn nguyên văn từ tờ hướng dẫn sử dụng",
          "Tải ảnh đơn thuốc để nhận diện tên thuốc tự động",
        ]}
      />
    </div>
  );
}
