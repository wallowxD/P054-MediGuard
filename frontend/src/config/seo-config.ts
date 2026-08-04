export const SEO_CONFIG = {
  appName: "MediGuard",
  shortName: "MediGuard",
  /** Tên thương hiệu hiển thị xuyên suốt landing page và metadata. */
  brandName: "MediGuard",
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
