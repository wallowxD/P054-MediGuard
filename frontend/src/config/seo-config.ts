/**
 * ★ Sản phẩm được khoác thương hiệu Vinmec cho bản trình diễn.
 *
 * Tên nội bộ của sản phẩm vẫn là MediGuard (xem AGENTS.md và specs/); chỉ phần
 * HIỂN THỊ đổi sang Vinmec để cả cổng bệnh viện lẫn tính năng tra cứu thuốc trông
 * như một thương hiệu duy nhất trong buổi demo. Muốn quay lại tên cũ thì sửa đúng
 * ba trường dưới đây cùng `components/ui/Logo.tsx`, không phải đi sửa từng màn.
 */
export const SEO_CONFIG = {
  appName: "Vinmec",
  shortName: "Vinmec",
  /** Tên thương hiệu hiển thị xuyên suốt landing page và metadata. */
  brandName: "Vinmec",
  description:
    "Tra cứu tương tác thuốc–thuốc và thuốc–thực phẩm có trích dẫn nguồn. " +
    "Thông tin tham khảo, không thay thế quyết định của bác sĩ.",
  locale: "vi_VN",
  url: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  keywords: [
    "tương tác thuốc",
    "tra cứu thuốc",
    "an toàn dùng thuốc",
    "medication safety",
    "drug interaction",
  ],
} as const;
