import FeatureUnavailable from "@/components/FeatureUnavailable";

/**
 * Trang CHỦ ĐÍCH là Server Component tĩnh, không state và không control giả.
 *
 * Trước đây trang dựng đủ ô tìm thuốc + nút "Tra cứu tương tác", nhưng
 * `POST /api/v1/interactions/check` chưa tồn tại và catalog cũng chưa có bước xác
 * nhận thuốc vào giỏ, nên nút luôn disabled và không lượt tra cứu nào hoàn tất được.
 * Một màn tra cứu không bao giờ trả kết quả dễ bị đọc thành "không có tương tác" —
 * với sản phẩm cảnh báo an toàn thuốc thì đó là hiểu nhầm nguy hiểm nhất.
 *
 * TODO(API): khôi phục luồng đầy đủ (DrugCatalogPicker + SelectedDrugList +
 * useCheckInteractions) khi backend mở exact-pair repository theo ADR 0012.
 */
export default function DrugDrugInteractionsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Tra cứu thuốc – thuốc</h1>
        <p className="text-sm text-foreground-secondary">
          Thông tin tham khảo, không thay thế đánh giá của bác sĩ.
        </p>
      </header>

      <FeatureUnavailable
        title="Tra cứu thuốc – thuốc đang được phát triển, chưa khả dụng"
        description="Bạn chưa thể hoàn tất một lượt tra cứu tương tác thuốc–thuốc. Danh mục thuốc của bệnh viện đã tra cứu được, nhưng các bước còn lại của luồng chưa sẵn sàng nên màn hình này chưa mở."
        missing={[
          "Bước xác nhận thuốc từ danh mục vào danh sách tra cứu",
          "Dịch vụ đối chiếu từng cặp thuốc và trả về cảnh báo kèm trích dẫn nguyên văn",
          "Tải ảnh đơn thuốc để nhận diện tên thuốc tự động",
        ]}
      />
    </div>
  );
}
