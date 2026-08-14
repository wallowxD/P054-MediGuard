import FeatureUnavailable from "@/components/FeatureUnavailable";

/**
 * Cùng lý do với `/interactions/drug-drug`: giỏ thuốc chưa xác nhận được thuốc thật
 * và `POST /api/v1/interactions/check` chưa tồn tại, nên không dựng form tra cứu
 * chỉ để nút luôn disabled. Xem ghi chú đầy đủ ở trang thuốc–thuốc.
 *
 * TODO(API): khôi phục luồng đầy đủ (DrugCatalogPicker + BasketInputField +
 * useCheckInteractions cho kind "drug-food") khi backend mở scoped retrieval.
 */
export default function DrugFoodInteractionsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Tra cứu thuốc – thực phẩm</h1>
        <p className="text-sm text-foreground-secondary">
          Thông tin tham khảo, không thay thế đánh giá của bác sĩ. Chỉ nội dung có trích dẫn
          nguồn từ tờ hướng dẫn sử dụng mới được hiển thị.
        </p>
      </header>

      <FeatureUnavailable
        title="Tra cứu thuốc – thực phẩm đang được phát triển, chưa khả dụng"
        description="Bạn chưa thể hoàn tất một lượt tra cứu tương tác thuốc–thực phẩm. Danh mục thuốc của bệnh viện đã tra cứu được, nhưng các bước còn lại của luồng chưa sẵn sàng nên màn hình này chưa mở."
        missing={[
          "Bước xác nhận thuốc từ danh mục vào danh sách tra cứu",
          "Dịch vụ tìm đoạn nói về thực phẩm trong tờ hướng dẫn sử dụng của thuốc đã chọn",
          "Tải ảnh đơn thuốc để nhận diện tên thuốc tự động",
        ]}
      />
    </div>
  );
}
