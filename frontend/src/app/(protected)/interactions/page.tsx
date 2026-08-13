import FeatureUnavailable from "@/components/FeatureUnavailable";

/**
 * Trang gốc `/interactions` — không có trong điều hướng chính (người dùng đi thẳng vào
 * `/interactions/drug-drug` hoặc `/interactions/drug-food`), nhưng vẫn gõ URL tới được.
 *
 * Cả hai luồng con đều chưa có backend nên trang này nói đúng một điều đó, thay vì
 * dựng giỏ thuốc rỗng trông như đang chờ người dùng thao tác.
 */
export default function InteractionsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold text-foreground">Tra tương tác</h1>
        <p className="text-sm text-foreground-secondary">
          Thông tin tham khảo, không thay thế đánh giá của bác sĩ.
        </p>
      </header>

      <FeatureUnavailable
        title="Tra cứu tương tác đang được phát triển, chưa khả dụng"
        description="Cả tra cứu thuốc–thuốc, thuốc–thực phẩm và thuốc–bệnh nền đều chưa hoàn tất được một lượt tra cứu. Phần đang chạy thật là tra cứu thông tin thuốc theo danh mục bệnh viện."
        missing={[
          "Bước xác nhận thuốc từ danh mục vào danh sách tra cứu",
          "Dịch vụ đối chiếu và trả về cảnh báo kèm trích dẫn nguyên văn",
        ]}
      />
    </div>
  );
}
