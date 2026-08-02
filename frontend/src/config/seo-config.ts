export const SEO_CONFIG = {
  appName: "Medication Safety Copilot",
  shortName: "MedSafe",
  /** Tên hiển thị của hệ thống y tế bao quanh sản phẩm (theo Brief/PRD) */
  brandName: "Hệ thống y tế X",
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
