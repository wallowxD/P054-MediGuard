/**
 * Toàn bộ nội dung tĩnh của cổng Vinmec mô phỏng.
 *
 * ★ Đây là dữ liệu TRÌNH DIỄN, không phải nội dung của sản phẩm MediGuard.
 *   Không có API, không có state phía server — mọi thứ là hằng số ở module scope
 *   để component chỉ còn việc render.
 *
 * Chữ và ảnh chép lại từ trang chủ vinmec.com/vie nhằm dựng đúng bố cục tham
 * chiếu cho buổi demo luồng điều hướng sang MediGuard.
 */

import { ROUTES } from "@/constants/routes";

/** Link "chết" — mọi mục điều hướng của Vinmec đều là giả, chỉ "Tính năng" là thật. */
export const DEAD_LINK = "#";

export type VinmecNavItem = {
  label: string;
  href: string;
  /** Có giá trị thì mục nav mở dropdown khi hover/focus. */
  children?: readonly string[];
  /**
   * Mục trỏ tới route THẬT trong app, không phải link `#` giả như các mục còn lại.
   *
   * Chỉ dùng để chọn cách render (dùng `<Link>` và theo dõi trạng thái active) —
   * KHÔNG phải cờ "tô nổi bật". Mục này trông y hệt các mục nav khác.
   */
  isAppRoute?: boolean;
};

/**
 * Nav chính. Sáu mục đầu chép theo bản gốc; "Tính năng" là mục được THÊM cho demo
 * và là mục duy nhất điều hướng thật — nó dẫn tới màn tra cứu an toàn thuốc ở
 * `/tinh-nang`. Logo Vinmec ở hàng trên mới là thứ trỏ về trang chủ "/".
 *
 * `Chuyên khoa` giữ nguyên dạng dropdown như bản gốc — đây là chỗ danh sách chuyên
 * khoa xuất hiện trên vinmec.com, trang chủ không có section riêng cho nó.
 */
export const VINMEC_NAV: readonly VinmecNavItem[] = [
  {
    label: "Chuyên khoa",
    href: DEAD_LINK,
    children: [
      "Cấp cứu",
      "Trung tâm Tim mạch",
      "Trung tâm Ung bướu",
      "Miễn dịch - Dị ứng",
      "Tiêu hoá - Gan mật",
      "Trung tâm Nhi",
      "Trung tâm Sức khoẻ phụ nữ",
      "Sức khoẻ tổng quát",
      "Trung tâm Vacxin",
      "Thần kinh",
      "Trung tâm Vú",
      "Khối Dược",
    ],
  },
  {
    label: "Hướng dẫn khách hàng",
    href: DEAD_LINK,
    children: [
      "Liên hệ với chúng tôi",
      "Hệ thống Vinmec",
      "Tìm bác sĩ",
      "Bảo hiểm",
      "Dịch vụ y tế",
      "Tra cứu thuốc",
      "Sử dụng thuốc an toàn",
    ],
  },
  { label: "Phát triển bền vững", href: DEAD_LINK },
  {
    label: "Về Vinmec",
    href: DEAD_LINK,
    children: [
      "Tầm nhìn và sứ mệnh",
      "Thành tựu và Giải thưởng",
      "Đối tác của Vinmec",
      "Làm việc tại Vinmec",
      "Tin tức",
      "Chuyên gia Y tế Vinmec",
    ],
  },
  {
    label: "Chuyên trang sức khoẻ",
    href: DEAD_LINK,
    children: [
      "Tra cứu bệnh",
      "Hiểu về cơ thể bạn",
      "Hỏi đáp bác sĩ",
      "Video",
    ],
  },
  { label: "Online.Vinmec", href: DEAD_LINK },
  { label: "Tính năng", href: ROUTES.FEATURE, isAppRoute: true },
];

export const VINMEC_TOPBAR_LINKS = ["Tìm bác sĩ", "Chăm sóc khách hàng"] as const;

/** Banner hero — ảnh tải về từ chính trang chủ Vinmec. */
export const VINMEC_BANNERS = [
  {
    src: "/images/vinmec/hero-timmach.webp",
    alt: "Đón chào microsite đầu tiên của chuyên khoa Tim mạch tại Hệ thống Y tế Vinmec",
  },
  {
    src: "/images/vinmec/hero-thaisan.webp",
    alt: "Chương trình chăm sóc thai sản tại Hệ thống Y tế Vinmec",
  },
  {
    src: "/images/vinmec/hero-nhi.webp",
    alt: "Chương trình chăm sóc sức khoẻ Nhi tại Hệ thống Y tế Vinmec",
  },
] as const;

/** Ba ô dịch vụ nổi trên đáy banner. `icon` là tên icon của lucide-react. */
export const VINMEC_QUICK_SERVICES = [
  {
    icon: "phone",
    name: "Gọi tổng đài",
    desc: "Tư vấn và giải đáp các vấn đề của bạn",
  },
  {
    icon: "calendar",
    name: "Đặt Lịch Hẹn",
    desc: "Đặt lịch hẹn nhanh chóng, tiện lợi",
  },
  {
    icon: "user",
    name: "Tìm bác sĩ",
    desc: "Tìm kiếm thông tin chuyên gia y tế Vinmec nhanh chóng",
  },
] as const;

export const VINMEC_WHY_US = [
  {
    icon: "/images/vinmec/whyus-01.svg",
    title: "Chuyên gia giàu kinh nghiệm",
    desc:
      "Vinmec quy tụ đội ngũ chuyên gia, bác sĩ, dược sĩ và điều dưỡng có trình độ " +
      "chuyên môn cao, tay nghề giỏi, tận tâm và chuyên nghiệp. Luôn đặt người bệnh " +
      "làm trung tâm, Vinmec cam kết đem đến dịch vụ chăm sóc sức khỏe tốt cho khách hàng.",
  },
  {
    icon: "/images/vinmec/whyus-02.svg",
    title: "Chất lượng quốc tế",
    desc:
      "Hệ thống Y tế Vinmec được quản lý và vận hành dưới sự giám sát của những nhà " +
      "quản lý y tế giàu kinh nghiệm, cùng với sự hỗ trợ của phương tiện kỹ thuật hiện " +
      "đại, nhằm đảm bảo cung cấp dịch vụ chăm sóc sức khỏe toàn diện và hiệu quả.",
  },
  {
    icon: "/images/vinmec/whyus-03.svg",
    title: "Công nghệ tiên tiến",
    desc:
      "Vinmec cung cấp cơ sở chất lượng và dịch vụ 5 sao bằng cách sử dụng các công " +
      "nghệ tiên tiến được quản lý bởi các bác sĩ lâm sàng lành nghề để đảm bảo dịch " +
      "vụ chăm sóc sức khỏe toàn diện và hiệu quả cao",
  },
  {
    icon: "/images/vinmec/whyus-01.svg",
    title: "Nghiên cứu & Đổi mới",
    desc:
      "Vinmec liên tục thúc đẩy y học hàn lâm dựa trên nghiên cứu có phương pháp và sự " +
      "phát triển y tế được chia sẻ từ quan hệ đối tác toàn cầu với các hệ thống chăm " +
      "sóc sức khỏe trên thế giới nhằm cung cấp các phương pháp điều trị mang tính cách " +
      "mạng và sáng tạo cho tiêu chuẩn chăm sóc bệnh nhân.",
  },
] as const;

export const VINMEC_CERTIFICATIONS = [
  { src: "/images/vinmec/cert-jci.jpg", alt: "Joint Commission International — Quality Approval" },
  { src: "/images/vinmec/cert-aabb.webp", alt: "Association for the Advancement of Blood & Biotherapies" },
  { src: "/images/vinmec/cert-cap.webp", alt: "CAP Accredited — College of American Pathologists" },
] as const;

/** Ảnh lớn + dải thumbnail của khu "Hệ thống phòng khám và trung tâm". */
export const VINMEC_FACILITIES = [
  {
    large: "/images/vinmec/facility-times-city-large.webp",
    thumb: "/images/vinmec/facility-times-city.webp",
    name: "Bệnh viện Đa khoa Quốc tế Vinmec Times City",
  },
  {
    large: "/images/vinmec/facility-central-park.webp",
    thumb: "/images/vinmec/facility-central-park.webp",
    name: "Bệnh viện Đa khoa Quốc tế Vinmec Central Park",
  },
  {
    large: "/images/vinmec/facility-da-nang.webp",
    thumb: "/images/vinmec/facility-da-nang.webp",
    name: "Bệnh viện Đa khoa Quốc tế Vinmec Đà Nẵng",
  },
  {
    large: "/images/vinmec/facility-nha-trang.webp",
    thumb: "/images/vinmec/facility-nha-trang.webp",
    name: "Bệnh viện Đa khoa Quốc tế Vinmec Nha Trang",
  },
  {
    large: "/images/vinmec/facility-ha-long.webp",
    thumb: "/images/vinmec/facility-ha-long.webp",
    name: "Bệnh viện Đa khoa Quốc tế Vinmec Hạ Long",
  },
] as const;

export const VINMEC_PARTNERS = [
  { src: "/images/vinmec/partner-macquarie.webp", alt: "Macquarie University" },
  { src: "/images/vinmec/partner-astrazeneca.webp", alt: "AstraZeneca" },
  { src: "/images/vinmec/partner-ge.webp", alt: "GE HealthCare" },
] as const;

export const VINMEC_FOOTER_COLUMNS = [
  {
    title: "Hệ thống Vinmec",
    links: ["Tầm nhìn sứ mệnh", "Hệ thống cơ sở y tế", "Tìm bác sĩ", "Làm việc tại Vinmec"],
  },
  {
    title: "Dịch vụ",
    links: ["Chuyên khoa", "Gói dịch vụ", "Bảo hiểm", "Đặt lịch hẹn"],
  },
] as const;

export const VINMEC_LEGAL_LINKS = [
  "Chính sách bảo vệ dữ liệu cá nhân của Vinmec",
  "GR Privacy",
  "GR Terms",
] as const;

export const VINMEC_COPYRIGHT =
  "Bản quyền © 2026 thuộc về Công ty Cổ phần Bệnh viện Đa khoa Quốc tế Vinmec";
