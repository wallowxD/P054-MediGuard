/**
 * Nội dung tĩnh của trang "Về Vinmec" (`/ve-vinmec`).
 *
 * ★ Tách khỏi `vinmec-content.ts` vì khối lượng chữ ở đây lớn hơn hẳn phần còn lại
 *   của cổng. Gộp chung thì file kia phình gấp đôi và mọi lần sửa một dòng nav lại
 *   phải cuộn qua vài trăm dòng giải thưởng.
 *
 * ★ Đây là dữ liệu TRÌNH DIỄN. Chữ chép nguyên văn từ vinmec.com/vie
 *   (`/tam-nhin-va-su-menh/`, `/thanh-tuu-va-giai-thuong/`, `/doi-tac/`) để bố cục
 *   tham chiếu đúng thật. Không suy diễn, không tự viết thêm số liệu — số nào không
 *   có trên bản gốc thì không xuất hiện ở đây.
 *
 * ★ Trên bản gốc "Về Vinmec" là NHÓM MENU 9 mục, mỗi mục một trang riêng, không
 *   phải một trang. Bản mô phỏng gộp phần nội dung chính của ba trang đầu vào một
 *   route duy nhất — xem ghi chú đầu `(public)/ve-vinmec/page.tsx`.
 */

/** Đường dẫn breadcrumb, giữ đúng thứ tự bản gốc: Trang chủ › Về Vinmec. */
export const VINMEC_ABOUT_INTRO =
  "Vinmec là hệ thống y tế không vì lợi nhuận do Tập đoàn Vingroup đầu tư phát triển, " +
  "với tầm nhìn trở thành một hệ thống y tế hàn lâm vươn tầm quốc tế thông qua những " +
  "nghiên cứu đột phá, nhằm mang lại chất lượng điều trị xuất sắc và dịch vụ chăm sóc hoàn hảo.";

export const VINMEC_VISION =
  "Vinmec hướng đến mô hình y học hàn lâm, phục vụ con người ở cả Việt Nam và trên toàn cầu, " +
  "thông qua nghiên cứu đổi mới sáng tạo và những đột phá y học, nhằm mang lại chất lượng " +
  "lâm sàng xuất sắc và giải pháp chăm sóc sức khỏe dựa trên giá trị.";

export const VINMEC_MISSION = "Chăm sóc bằng Tài năng, Y đức và Sự thấu cảm.";

/**
 * Bốn giá trị cốt lõi C.A.R.E. `letter` là chữ cái viết tắt được phóng to trong
 * thiết kế — tách riêng khỏi `title` để không phải cắt chuỗi lúc render.
 */
export const VINMEC_CARE_VALUES = [
  {
    letter: "C",
    title: "Creativity – Sáng tạo",
    desc: "Không ngừng đổi mới để mang đến cho người bệnh những giải pháp tốt nhất.",
  },
  {
    letter: "A",
    title: "Accountability – Trách nhiệm",
    desc:
      "Đặt trách nhiệm cao nhất đối với người bệnh và gia đình họ, dựa trên đạo đức nghề " +
      "nghiệp, kỹ năng, tri thức và các tiêu chuẩn chuyên môn của chúng tôi.",
  },
  {
    letter: "R",
    title: "Reliability – Tin cậy",
    desc:
      "Cam kết mang lại điều tốt nhất cho người bệnh và trở thành nhà cung cấp dịch vụ y tế " +
      "đáng tin cậy nhất cho cộng đồng.",
  },
  {
    letter: "E",
    title: "Excellence – Hoàn hảo",
    desc: "Không ngừng hướng tới chất lượng dịch vụ cao nhất và những thực hành y tế tốt nhất.",
  },
] as const;

/**
 * Số liệu "Năng lực Hệ thống". Giữ nguyên định dạng số của bản gốc — dấu chấm ngăn
 * nghìn kiểu Việt Nam ("1.505") và chữ "triệu" viết thành lời, KHÔNG đổi sang
 * "1,505" hay "8.800.000". Đây là chuỗi hiển thị, không phải số để tính toán.
 */
export const VINMEC_CAPACITY_STATS = [
  { value: "85 %", label: "NES (Điểm xuất sắc ròng)" },
  { value: "1.505", label: "Giường bệnh" },
  { value: "8.8 triệu", label: "Khách hàng được phục vụ" },
  { value: "5.7 triệu", label: "Lượt khách hàng ngoại trú" },
  { value: "917 triệu", label: "Lượt phẫu thuật, thủ thuật" },
  { value: "17", label: "Bệnh viện và Phòng khám" },
  { value: "3.782", label: "Nhân sự" },
  { value: "597", label: "Bác sĩ" },
  { value: "1.626", label: "Điều dưỡng" },
  { value: "135", label: "Dược sĩ" },
] as const;

/**
 * Giải thưởng và chứng nhận quốc tế.
 *
 * `subtitle` là dòng mô tả tiêu chuẩn nằm ngay dưới tên giải trên bản gốc; `desc`
 * là đoạn tóm tắt đầu tiên của mỗi mục — bản gốc còn 2–4 đoạn nữa cho mỗi giải,
 * lược bớt vì trang gộp không có chỗ, không phải vì nội dung sai.
 */
export const VINMEC_AWARDS = [
  {
    logo: "/images/vinmec/award-deloitte.jpg",
    name: "Giải thưởng “Công ty được quản lý tốt nhất” của Deloitte",
    subtitle: "Giải thưởng quốc tế về quản lý kinh doanh",
    desc:
      "Hệ thống Y tế Vinmec đã được trao giải “Công ty được quản lý tốt nhất” tại Việt Nam " +
      "trong 2 năm liên tiếp 2022 và 2023 nhờ mô hình và chiến lược độc đáo, bao trùm hiệu " +
      "quả cả thực hành lâm sàng và hoạt động kinh doanh.",
  },
  {
    logo: "/images/vinmec/award-jci.jpg",
    name: "JCI – Joint Commission International",
    subtitle: "Tiêu chuẩn quốc tế về chất lượng bệnh viện",
    desc:
      "Vinmec Times City là bệnh viện đầu tiên ở Việt Nam được tổ chức Joint Commission " +
      "International công nhận. Đến nay, Vinmec Times City và Vinmec Central Park đã được " +
      "tái công nhận lần thứ 3 và 2 liên tiếp, và Vinmec là hệ thống y tế duy nhất có 2 " +
      "bệnh viện được JCI công nhận.",
  },
  {
    logo: "/images/vinmec/award-acc.png",
    name: "ACC – American College of Cardiology",
    subtitle: "Tiêu chuẩn về quản lý và điều trị bệnh lý tim mạch",
    desc:
      "Năm 2022, Vinmec Times City và Vinmec Central Park là 2 bệnh viện đầu tiên ở châu Á " +
      "được ACC công nhận cho cả bệnh suy tim và Cath-lab tim. Trung tâm Tim mạch cũng được " +
      "công nhận là Trung tâm Xuất sắc (CoE) đầu tiên ở châu Á về tim mạch.",
  },
  {
    logo: "/images/vinmec/award-cap.png",
    name: "CAP – College of American Pathologists",
    subtitle: "Tiêu chuẩn chất lượng xét nghiệm của Hội bệnh học Hoa Kỳ",
    desc:
      "Năm 2022, Phòng thí nghiệm của Vinmec Times City được CAP công nhận là bệnh viện đầu " +
      "tiên và duy nhất tại Việt Nam đạt cả chứng nhận JCI và CAP, cho 4 hoạt động chính " +
      "theo 13 bộ tiêu chuẩn với 1.000 yêu cầu rất khắt khe.",
  },
  {
    logo: "/images/vinmec/award-aabb.jpg",
    name: "AABB – Association for the Advancement of Blood & Biotherapies",
    subtitle: "Tiêu chuẩn về liệu pháp tế bào và y học truyền máu",
    desc:
      "Năm 2022, Biobank của Vinmec trở thành một trong 26 ngân hàng sinh học được AABB trên " +
      "toàn thế giới công nhận trong cả dịch vụ Lấy máu và Truyền máu, nhờ sự đầu tư cơ bản " +
      "vào tế bào gốc và công nghệ gen ngay từ đầu.",
  },
  {
    logo: "/images/vinmec/award-rtac.jpg",
    name: "RTAC – Reproductive Technology Accreditation Committee",
    subtitle: "Tiêu chuẩn hỗ trợ sinh sản của Hiệp hội sinh sản Úc và New Zealand",
    desc:
      "Năm 2022, Vinmec Times City được RTAC công nhận vì những nỗ lực vượt trội và chất " +
      "lượng về sinh sản, với tỷ lệ mang thai tương đương các tiêu chuẩn và tổ chức quốc tế.",
  },
  {
    logo: "/images/vinmec/award-hma.png",
    name: "Hospital Management Asia (HMA)",
    subtitle: "Tiêu chuẩn quốc tế về chất lượng và quản lý bệnh viện",
    desc:
      "Năm 2015, Vinmec Times City lần đầu được trao giải “Bệnh viện tiến bộ nhất Việt Nam” " +
      "nhờ dự án “Nâng cao việc tuân thủ vệ sinh tay”. Bệnh viện được trao giải lần thứ hai " +
      "năm 2019, kèm “Giải thưởng Xuất sắc về An toàn Người bệnh”.",
  },
  {
    logo: "/images/vinmec/award-esg.jpg",
    name: "Global CSR & ESG Summit and Awards",
    subtitle: "Giải thưởng về trách nhiệm xã hội và phát triển bền vững",
    desc:
      "Vinmec được vinh danh 4 hạng mục với 4 giải Bạch kim: Doanh nghiệp tốt nhất tại Việt " +
      "Nam, Doanh nghiệp vì cộng đồng tốt nhất, Doanh nghiệp trao quyền cho phụ nữ và Nơi " +
      "làm việc tốt nhất.",
  },
] as const;

/**
 * "Những cột mốc quan trọng" — dòng thời gian giảm dần đúng thứ tự bản gốc.
 *
 * Bản gốc không có mốc 2020; khoảng trống đó là thật, đừng "sửa" bằng cách chèn
 * thêm năm cho liền mạch.
 */
export const VINMEC_MILESTONES = [
  {
    year: "2026",
    events: [
      "7 bệnh viện thuộc Hệ thống Y tế Vinmec đồng loạt đạt chứng nhận 4 sao từ tổ chức xếp hạng uy tín toàn cầu Global Hospital Rating",
      "Khai trương Bệnh viện Đa khoa Quốc tế Vinmec Ocean Park 2",
      "Vinmec ghi dấu ấn với 3 giải thưởng y tế danh giá châu Á",
      "Vinmec lần thứ 3 được vinh danh tại HR Asia Awards",
    ],
  },
  {
    year: "2025",
    events: [
      "Trung tâm Dị ứng & Miễn dịch lâm sàng Vinmec Times City được công nhận là Trung tâm xuất sắc (Center of Excellence – CoE)",
      "Vinmec được Healthcare Asia Awards vinh danh với hai giải thưởng: “Tập đoàn Bệnh viện của năm” và “Đổi mới công nghệ của năm”",
      "Vinmec được xếp hạng số 1 tại Việt Nam trong lĩnh vực “Dịch vụ y tế dành cho người nước ngoài”",
      "Vinmec – Đại diện Việt Nam được vinh danh tại ASOCIO 2025 với hạng mục Công nghệ số",
      "Vinmec góp mặt trong danh sách “Fortune 100 – Best Companies to Work For in Southeast Asia 2025”",
    ],
  },
  {
    year: "2024",
    events: [
      "Bệnh viện Vinmec Times City được công nhận đạt chuẩn JCI theo tiêu chuẩn Trung tâm Y học Hàn lâm (Academic Medical Center)",
      "Bệnh viện Vinmec Central Park được tái công nhận JCI lần thứ ba với số điểm 9,96/10",
      "Bệnh viện Vinmec Central Park chính thức trở thành thành viên của mạng lưới Cleveland Clinic Connected",
      "Hệ thống Y tế Vinmec được vinh danh với các giải thưởng “Best Companies to Work for in Asia” và “Most Caring Company” do HR Asia Awards bình chọn",
    ],
  },
  {
    year: "2023",
    events: [
      "Vinmec Times City trở thành thành viên chính thức của Phòng khám Cleveland Connected",
      "Trung tâm Tim mạch Vinmec Times City được công nhận là Trung tâm Tim mạch xuất sắc (CoE) ở châu Á",
    ],
  },
  {
    year: "2022",
    events: [
      "Giải thưởng Công ty được quản lý tốt nhất của Deloitte",
      "Vinmec được ACC công nhận cho Trung tâm Tim mạch (Vinmec Times City & Vinmec Central Park)",
      "Vinmec được RTAC công nhận cho Trung tâm Hỗ trợ Sinh sản (Vinmec Times City)",
      "Vinmec nhận chứng nhận AABB cho Biobank",
      "Vinmec nhận chứng chỉ CAP và ISO15189:2012 cho Phòng Thí nghiệm",
    ],
  },
  {
    year: "2021",
    events: [
      "Vinmec Times City và Vinmec Central Park lần lượt được JCI công nhận ở vị trí thứ 3 và thứ 2",
    ],
  },
  {
    year: "2019",
    events: [
      "Khai trương Phòng khám đa khoa Quốc tế Vinmec Times City",
      "Vinmec nhận Giải Vàng cho Bệnh viện địa phương có tiến bộ nhất và Giải Xuất sắc về An toàn Người bệnh trong Hội nghị Quản lý Bệnh viện châu Á (HMA)",
    ],
  },
  {
    year: "2018",
    events: [
      "Khai trương Bệnh viện Quốc tế Vinmec Hải Phòng",
      "Trung tâm công nghệ cao Vinmec được thành lập",
      "Vinmec Times City được tổ chức Joint Commission International (JCI) công nhận lần thứ 2",
      "Vinmec Central Park là bệnh viện đầu tiên trên thế giới thực hiện phẫu thuật tim hở thông qua ứng dụng ESP thay thuốc giảm đau Opioid",
    ],
  },
  {
    year: "2017",
    events: [
      "Khai trương Bệnh viện Quốc tế Vinmec Đà Nẵng",
      "Vinmec Central Park được công nhận lần đầu tiên bởi Joint Commission International (JCI)",
      "Vinmec Central Park được công nhận là phòng khám TAVI solo đầu tiên tại Việt Nam",
      "Ca ghép tế bào gốc điều trị bệnh xơ phổi thành công đầu tiên trên thế giới được thực hiện tại Vinmec",
    ],
  },
  {
    year: "2016",
    events: [
      "Khai trương Bệnh viện Quốc tế Vinmec Nha Trang",
      "Khai trương Bệnh viện Quốc tế Vinmec Hạ Long",
      "Thành lập Viện nghiên cứu tế bào gốc và Công nghệ Gen Vinmec (VRISG)",
      "Vinmec nhận Giải Vàng cho Bệnh viện địa phương có tiến bộ nhất trong Hội nghị Quản lý Bệnh viện châu Á (HMA)",
    ],
  },
  {
    year: "2015",
    events: [
      "Khai trương Bệnh viện Đa khoa Quốc tế Vinmec Phú Quốc",
      "Khai trương Bệnh viện Đa khoa Quốc tế Vinmec Central Park",
      "Vinmec Times City được tổ chức Joint Commission International (JCI) công nhận lần thứ nhất",
    ],
  },
  { year: "2014", events: ["Khai trương Phòng Khám Quốc tế Sài Gòn"] },
  { year: "2013", events: ["Khai trương Phòng khám Quốc tế Royal City"] },
  { year: "2012", events: ["Khai trương Bệnh viện Đa khoa Quốc tế Vinmec Times City"] },
] as const;

/**
 * Đối tác — gộp logo đã có sẵn trong repo với các logo tải thêm từ trang `/doi-tac/`.
 * Bản gốc chia thành đối tác học thuật và đối tác doanh nghiệp; bản mô phỏng để một
 * lưới chung vì trang gộp không tách hai khu.
 */
export const VINMEC_ABOUT_PARTNERS = [
  { src: "/images/vinmec/partner-cleveland.webp", alt: "Cleveland Clinic" },
  { src: "/images/vinmec/partner-macquarie.webp", alt: "Macquarie University" },
  { src: "/images/vinmec/partner-sydney.webp", alt: "University of Sydney" },
  { src: "/images/vinmec/partner-penn-state.png", alt: "Penn State University" },
  { src: "/images/vinmec/partner-paris-descartes.png", alt: "Paris Descartes University" },
  { src: "/images/vinmec/partner-montreal.png", alt: "Université de Montréal" },
  { src: "/images/vinmec/partner-metropolitan.webp", alt: "Metropolitan" },
  { src: "/images/vinmec/partner-astrazeneca.webp", alt: "AstraZeneca" },
  { src: "/images/vinmec/partner-roche.webp", alt: "Roche" },
  { src: "/images/vinmec/partner-ge.webp", alt: "GE HealthCare" },
] as const;
