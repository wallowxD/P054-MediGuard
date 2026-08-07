/* Demo UI — dữ liệu minh hoạ (mock), không lấy từ nguồn thật.
   Dùng để dựng giao diện trước khi có backend. */

const DRUG_CATALOG = [
  "Paracetamol 500mg",
  "Aspirin 81mg",
  "Ibuprofen 400mg",
  "Amoxicillin 500mg",
  "Metformin 850mg",
  "Losartan 50mg",
  "Amlodipine 5mg",
  "Atorvastatin 20mg",
  "Simvastatin 20mg",
  "Omeprazole 20mg",
  "Clopidogrel 75mg",
  "Warfarin 5mg",
  "Digoxin 0.25mg",
  "Levothyroxine 50mcg",
  "Sertraline 50mg",
  "Fluoxetine 20mg",
  "Ciprofloxacin 500mg",
  "Furosemide 40mg",
  "Rifampicin 300mg",
  "Tamoxifen 20mg",
  "Prednisolone 5mg",
  "Salbutamol 2mg",
  "Loratadine 10mg",
  "Clarithromycin 500mg",
  "Insulin Glargine",
  "Vitamin C 500mg",
];

// Mô phỏng kết quả OCR từ ảnh đơn thuốc (cố định cho demo)
const RECOGNIZED_MOCK = ["Amlodipine 5mg", "Atorvastatin 20mg", "Aspirin 81mg"];

// Thông tin thuốc minh hoạ, khoá theo tên gốc (không kèm hàm lượng)
const DRUG_INFO = {
  "Paracetamol": { group: "Giảm đau, hạ sốt", desc: "Thuốc giảm đau, hạ sốt thông dụng, thường dùng đường uống." },
  "Aspirin": { group: "Chống kết tập tiểu cầu / giảm đau", desc: "Liều thấp dùng dự phòng huyết khối; liều cao có tác dụng giảm đau, hạ sốt." },
  "Ibuprofen": { group: "Kháng viêm không steroid (NSAID)", desc: "Giảm đau, hạ sốt, kháng viêm." },
  "Amoxicillin": { group: "Kháng sinh nhóm beta-lactam", desc: "Điều trị nhiễm khuẩn đường hô hấp, tai mũi họng." },
  "Metformin": { group: "Hạ đường huyết (biguanide)", desc: "Điều trị đái tháo đường type 2." },
  "Losartan": { group: "Ức chế thụ thể angiotensin II", desc: "Điều trị tăng huyết áp." },
  "Amlodipine": { group: "Chẹn kênh calci", desc: "Điều trị tăng huyết áp, đau thắt ngực." },
  "Atorvastatin": { group: "Statin (hạ lipid máu)", desc: "Giảm cholesterol LDL, dự phòng tim mạch." },
  "Simvastatin": { group: "Statin (hạ lipid máu)", desc: "Giảm cholesterol LDL, dự phòng tim mạch." },
  "Omeprazole": { group: "Ức chế bơm proton (PPI)", desc: "Điều trị viêm loét dạ dày, trào ngược dạ dày thực quản." },
  "Clopidogrel": { group: "Chống kết tập tiểu cầu", desc: "Dự phòng huyết khối ở bệnh nhân tim mạch." },
  "Warfarin": { group: "Chống đông máu kháng vitamin K", desc: "Dự phòng và điều trị huyết khối tĩnh mạch." },
  "Digoxin": { group: "Glycosid tim", desc: "Điều trị suy tim, rung nhĩ." },
  "Levothyroxine": { group: "Hormon tuyến giáp", desc: "Điều trị suy giáp." },
  "Sertraline": { group: "Chống trầm cảm (SSRI)", desc: "Điều trị trầm cảm, rối loạn lo âu." },
  "Fluoxetine": { group: "Chống trầm cảm (SSRI)", desc: "Điều trị trầm cảm, rối loạn ám ảnh cưỡng chế." },
  "Ciprofloxacin": { group: "Kháng sinh nhóm quinolone", desc: "Điều trị nhiễm khuẩn tiết niệu, tiêu hoá." },
  "Furosemide": { group: "Lợi tiểu quai", desc: "Điều trị phù, tăng huyết áp." },
  "Rifampicin": { group: "Kháng sinh nhóm rifamycin", desc: "Điều trị lao, một số nhiễm khuẩn khác." },
  "Tamoxifen": { group: "Nội tiết kháng estrogen", desc: "Điều trị ung thư vú có thụ thể nội tiết dương tính." },
  "Prednisolone": { group: "Corticosteroid", desc: "Kháng viêm, ức chế miễn dịch." },
  "Salbutamol": { group: "Đồng vận beta-2", desc: "Giãn phế quản, điều trị hen suyễn." },
  "Loratadine": { group: "Kháng histamin H1", desc: "Điều trị dị ứng, viêm mũi dị ứng." },
  "Clarithromycin": { group: "Kháng sinh nhóm macrolide", desc: "Điều trị nhiễm khuẩn hô hấp." },
  "Insulin Glargine": { group: "Insulin nền tác dụng kéo dài", desc: "Điều trị đái tháo đường type 1 và type 2." },
  "Vitamin C": { group: "Vitamin", desc: "Bổ sung vitamin C." },
};

// Tương tác thuốc - thuốc minh hoạ
const INTERACTIONS_DB = [
  {
    a: "Warfarin",
    b: "Aspirin",
    severity: "nghiem-trong",
    severityLabel: "Nghiêm trọng",
    citation:
      "\"Phối hợp Warfarin với Aspirin làm tăng nguy cơ chảy máu do tác dụng cộng gộp trên quá trình đông máu và chức năng tiểu cầu.\"",
    source: "Tờ hướng dẫn sử dụng Warfarin — mục Tương tác thuốc, trang 3",
    status: "pending",
  },
  {
    a: "Simvastatin",
    b: "Clarithromycin",
    severity: "nghiem-trong",
    severityLabel: "Nghiêm trọng",
    citation:
      "\"Sử dụng đồng thời Simvastatin với thuốc ức chế CYP3A4 mạnh như Clarithromycin làm tăng nồng độ Simvastatin trong huyết tương, tăng nguy cơ bệnh cơ và tiêu cơ vân.\"",
    source: "Tờ hướng dẫn sử dụng Simvastatin — mục Chống chỉ định phối hợp, trang 2",
    status: "confirmed",
  },
  {
    a: "Clopidogrel",
    b: "Omeprazole",
    severity: "trung-binh",
    severityLabel: "Trung bình",
    citation:
      "\"Omeprazole có thể làm giảm tác dụng chống kết tập tiểu cầu của Clopidogrel do ức chế chuyển hoá qua CYP2C19.\"",
    source: "Tờ hướng dẫn sử dụng Clopidogrel — mục Tương tác thuốc, trang 4",
    status: "pending",
  },
  {
    a: "Losartan",
    b: "Furosemide",
    severity: "nhe",
    severityLabel: "Nhẹ",
    citation:
      "\"Phối hợp với thuốc lợi tiểu có thể làm tăng tác dụng hạ huyết áp của Losartan, cần theo dõi huyết áp khi bắt đầu điều trị.\"",
    source: "Tờ hướng dẫn sử dụng Losartan — mục Tương tác thuốc, trang 3",
    status: "confirmed",
  },
  {
    a: "Digoxin",
    b: "Furosemide",
    severity: "trung-binh",
    severityLabel: "Trung bình",
    citation:
      "\"Furosemide có thể gây hạ kali máu, làm tăng nguy cơ ngộ độc Digoxin.\"",
    source: "Tờ hướng dẫn sử dụng Digoxin — mục Thận trọng khi phối hợp, trang 2",
    status: "pending",
  },
];

// Tương tác thuốc - thực phẩm minh hoạ
const FOOD_INTERACTIONS_DB = [
  {
    drug: "Warfarin",
    food: "Rau lá xanh đậm (giàu vitamin K)",
    severity: "trung-binh",
    severityLabel: "Trung bình",
    citation:
      "\"Thực phẩm giàu vitamin K có thể làm giảm tác dụng chống đông của Warfarin, cần duy trì lượng ăn ổn định trong quá trình điều trị.\"",
    source: "Tờ hướng dẫn sử dụng Warfarin — mục Tương tác với thực phẩm, trang 4",
    status: "pending",
  },
  {
    drug: "Atorvastatin",
    food: "Bưởi và nước ép bưởi",
    severity: "trung-binh",
    severityLabel: "Trung bình",
    citation:
      "\"Nước ép bưởi ức chế CYP3A4 ở ruột, có thể làm tăng nồng độ Atorvastatin trong huyết tương.\"",
    source: "Tờ hướng dẫn sử dụng Atorvastatin — mục Tương tác với thực phẩm, trang 3",
    status: "confirmed",
  },
  {
    drug: "Ciprofloxacin",
    food: "Sữa và chế phẩm từ sữa",
    severity: "nhe",
    severityLabel: "Nhẹ",
    citation:
      "\"Canxi trong sữa tạo phức với Ciprofloxacin làm giảm hấp thu thuốc qua đường tiêu hoá, nên uống cách xa bữa ăn có sữa.\"",
    source: "Tờ hướng dẫn sử dụng Ciprofloxacin — mục Tương tác với thực phẩm, trang 2",
    status: "pending",
  },
];

/** Cắt bỏ phần hàm lượng phía sau tên thuốc, ví dụ "Atorvastatin 20mg" -> "Atorvastatin" */
function baseDrugName(name) {
  return name.replace(/\s+[\d.].*$/, "").trim();
}

/** Đối chiếu một danh sách thuốc với INTERACTIONS_DB / FOOD_INTERACTIONS_DB. */
function computeInteractionSummary(drugs) {
  const baseNames = new Set(drugs.map(baseDrugName));
  const drugDrug = INTERACTIONS_DB.filter((it) => baseNames.has(it.a) && baseNames.has(it.b));
  const drugFood = FOOD_INTERACTIONS_DB.filter((it) => baseNames.has(it.drug));
  return { total: drugDrug.length + drugFood.length, drugDrug, drugFood };
}

/** Đối chiếu danh sách thuốc + bệnh nền với DISEASE_INTERACTIONS_DB. */
function computeDiseaseInteractions(drugs, diseases) {
  const drugNames = new Set(drugs.map(baseDrugName));
  const diseaseNames = new Set(diseases);
  return DISEASE_INTERACTIONS_DB.filter((it) => drugNames.has(it.drug) && diseaseNames.has(it.disease));
}

/** Slug ổn định cho URL trang chi tiết thuốc, ví dụ "Insulin Glargine" -> "insulin-glargine" */
function slugifyDrugName(name) {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Thông tin chi tiết từng thuốc cho màn "Tra cứu thông tin thuốc" (kiểu tờ HDSD rút gọn)
const DRUG_DETAILS = {
  "Paracetamol": {
    dangBaoChe: "Viên nén 500mg, viên sủi 500mg, gói bột pha uống, siro cho trẻ em, dạng đặt hậu môn.",
    chiDinh: "Giảm đau mức độ nhẹ đến vừa (đau đầu, đau cơ, đau răng), hạ sốt trong các bệnh lý sốt do nhiễm khuẩn, nhiễm virus.",
    chongChiDinh: "Suy gan nặng, mẫn cảm với paracetamol.",
    thanTrong: "Thận trọng ở người suy gan, suy thận, nghiện rượu; tránh dùng đồng thời nhiều chế phẩm chứa paracetamol để không vượt liều tối đa/ngày.",
    tacDungPhu: "Hiếm gặp: phát ban da, buồn nôn; quá liều có thể gây độc gan nghiêm trọng.",
    lieuDung: "Người lớn: 500-1000mg mỗi 4-6 giờ, tối đa 4g/ngày. Trẻ em tính theo cân nặng, theo hướng dẫn của bác sĩ/dược sĩ.",
    chuY: "Không dùng quá liều tối đa khuyến cáo; đọc kỹ thành phần các thuốc phối hợp để tránh trùng paracetamol.",
    taiLieuThamKhao: "Dược thư Quốc gia Việt Nam; tờ hướng dẫn sử dụng do nhà sản xuất công bố.",
  },
  "Aspirin": {
    dangBaoChe: "Viên nén 81mg (liều thấp), 325mg, 500mg; viên bao tan trong ruột.",
    chiDinh: "Liều thấp: dự phòng biến cố tim mạch do huyết khối. Liều cao hơn: giảm đau, hạ sốt, kháng viêm.",
    chongChiDinh: "Loét dạ dày tá tràng tiến triển, rối loạn đông máu, mẫn cảm với salicylate, trẻ em dưới 16 tuổi có sốt do virus (nguy cơ hội chứng Reye).",
    thanTrong: "Thận trọng ở người có tiền sử xuất huyết tiêu hoá, hen suyễn, đang dùng thuốc chống đông khác.",
    tacDungPhu: "Kích ứng dạ dày, tăng nguy cơ chảy máu, ù tai khi dùng liều cao kéo dài.",
    lieuDung: "Dự phòng tim mạch: 75-100mg/ngày. Giảm đau/hạ sốt: 325-650mg mỗi 4-6 giờ theo chỉ định.",
    chuY: "Ngừng thuốc trước phẫu thuật theo hướng dẫn của bác sĩ do nguy cơ chảy máu.",
    taiLieuThamKhao: "Dược thư Quốc gia Việt Nam; tờ hướng dẫn sử dụng do nhà sản xuất công bố.",
  },
  "Ibuprofen": {
    dangBaoChe: "Viên nén 200mg, 400mg; siro cho trẻ em; gel bôi ngoài da.",
    chiDinh: "Giảm đau, hạ sốt, kháng viêm trong đau cơ xương khớp, đau bụng kinh, sốt.",
    chongChiDinh: "Loét dạ dày tá tràng đang tiến triển, suy tim nặng, suy thận nặng, ba tháng cuối thai kỳ.",
    thanTrong: "Thận trọng ở người cao tuổi, bệnh tim mạch, hen suyễn, đang dùng thuốc chống đông hoặc lợi tiểu.",
    tacDungPhu: "Rối loạn tiêu hoá, đau thượng vị, tăng huyết áp, giữ nước; nguy cơ tim mạch khi dùng kéo dài.",
    lieuDung: "Người lớn: 200-400mg mỗi 4-6 giờ, tối đa 1200mg/ngày (không kê đơn) trừ khi có chỉ định khác.",
    chuY: "Uống sau ăn để giảm kích ứng dạ dày; không phối hợp với NSAID khác.",
    taiLieuThamKhao: "Dược thư Quốc gia Việt Nam; tờ hướng dẫn sử dụng do nhà sản xuất công bố.",
  },
  "Amoxicillin": {
    dangBaoChe: "Viên nang 250mg, 500mg; bột pha hỗn dịch uống cho trẻ em.",
    chiDinh: "Nhiễm khuẩn đường hô hấp trên/dưới, tai mũi họng, tiết niệu, da mô mềm do vi khuẩn nhạy cảm.",
    chongChiDinh: "Tiền sử dị ứng với penicillin hoặc kháng sinh nhóm beta-lactam.",
    thanTrong: "Thận trọng ở người suy thận (cần chỉnh liều), tiền sử dị ứng nhiều loại thuốc.",
    tacDungPhu: "Tiêu chảy, buồn nôn, phát ban da; hiếm gặp phản ứng dị ứng nghiêm trọng.",
    lieuDung: "Người lớn: 250-500mg mỗi 8 giờ, tuỳ mức độ nhiễm khuẩn và chỉ định của bác sĩ.",
    chuY: "Dùng đủ liệu trình dù đã đỡ triệu chứng để tránh kháng thuốc.",
    taiLieuThamKhao: "Dược thư Quốc gia Việt Nam; tờ hướng dẫn sử dụng do nhà sản xuất công bố.",
  },
  "Metformin": {
    dangBaoChe: "Viên nén 500mg, 850mg, 1000mg; viên phóng thích kéo dài.",
    chiDinh: "Điều trị đái tháo đường type 2, đơn độc hoặc phối hợp với thuốc hạ đường huyết khác.",
    chongChiDinh: "Suy thận nặng, nhiễm toan chuyển hoá, suy gan nặng, suy tim mất bù.",
    thanTrong: "Ngừng tạm thời trước khi chụp X-quang có thuốc cản quang chứa iod hoặc phẫu thuật lớn.",
    tacDungPhu: "Rối loạn tiêu hoá (buồn nôn, tiêu chảy), vị kim loại trong miệng; hiếm gặp nhiễm toan lactic.",
    lieuDung: "Khởi đầu 500mg 1-2 lần/ngày, tăng dần theo đáp ứng, uống cùng bữa ăn.",
    chuY: "Theo dõi chức năng thận định kỳ trong quá trình điều trị.",
    taiLieuThamKhao: "Dược thư Quốc gia Việt Nam; tờ hướng dẫn sử dụng do nhà sản xuất công bố.",
  },
  "Losartan": {
    dangBaoChe: "Viên nén 25mg, 50mg, 100mg.",
    chiDinh: "Điều trị tăng huyết áp, bảo vệ thận ở bệnh nhân đái tháo đường type 2 có bệnh thận.",
    chongChiDinh: "Phụ nữ có thai, mẫn cảm với losartan.",
    thanTrong: "Thận trọng ở người hẹp động mạch thận hai bên, suy gan, đang dùng lợi tiểu liều cao.",
    tacDungPhu: "Chóng mặt, hạ huyết áp tư thế, tăng kali máu.",
    lieuDung: "Khởi đầu 50mg/ngày, có thể điều chỉnh 25-100mg/ngày theo đáp ứng huyết áp.",
    chuY: "Theo dõi huyết áp và kali máu định kỳ.",
    taiLieuThamKhao: "Dược thư Quốc gia Việt Nam; tờ hướng dẫn sử dụng do nhà sản xuất công bố.",
  },
  "Amlodipine": {
    dangBaoChe: "Viên nén 5mg, 10mg.",
    chiDinh: "Điều trị tăng huyết áp, đau thắt ngực ổn định và đau thắt ngực co thắt mạch vành.",
    chongChiDinh: "Hạ huyết áp nặng, sốc tim, mẫn cảm với dihydropyridine.",
    thanTrong: "Thận trọng ở người suy gan, hẹp động mạch chủ nặng.",
    tacDungPhu: "Phù mắt cá chân, đỏ bừng mặt, nhức đầu, chóng mặt.",
    lieuDung: "Khởi đầu 5mg/ngày, có thể tăng đến 10mg/ngày sau 1-2 tuần theo đáp ứng.",
    chuY: "Không ngừng thuốc đột ngột mà không hỏi ý kiến bác sĩ.",
    taiLieuThamKhao: "Dược thư Quốc gia Việt Nam; tờ hướng dẫn sử dụng do nhà sản xuất công bố.",
  },
  "Atorvastatin": {
    dangBaoChe: "Viên nén bao phim 10mg, 20mg, 40mg, 80mg.",
    chiDinh: "Giảm cholesterol LDL, dự phòng biến cố tim mạch ở người rối loạn lipid máu hoặc nguy cơ tim mạch cao.",
    chongChiDinh: "Bệnh gan hoạt động, phụ nữ có thai và cho con bú.",
    thanTrong: "Thận trọng ở người có tiền sử bệnh gan, uống nhiều rượu, dùng đồng thời thuốc ức chế CYP3A4.",
    tacDungPhu: "Đau cơ, tăng men gan; hiếm gặp bệnh cơ hoặc tiêu cơ vân.",
    lieuDung: "Khởi đầu 10-20mg/ngày, uống buổi tối, điều chỉnh theo mục tiêu LDL-C.",
    chuY: "Xét nghiệm men gan trước và trong quá trình điều trị; báo bác sĩ nếu đau cơ bất thường.",
    taiLieuThamKhao: "Dược thư Quốc gia Việt Nam; tờ hướng dẫn sử dụng do nhà sản xuất công bố.",
  },
  "Simvastatin": {
    dangBaoChe: "Viên nén bao phim 10mg, 20mg, 40mg.",
    chiDinh: "Giảm cholesterol LDL, dự phòng biến cố tim mạch ở người rối loạn lipid máu.",
    chongChiDinh: "Bệnh gan hoạt động, phụ nữ có thai, dùng đồng thời thuốc ức chế CYP3A4 mạnh.",
    thanTrong: "Thận trọng ở người suy giáp chưa điều trị, tiền sử bệnh cơ.",
    tacDungPhu: "Đau cơ, rối loạn tiêu hoá; hiếm gặp tiêu cơ vân.",
    lieuDung: "Khởi đầu 10-20mg/ngày uống buổi tối, tối đa 40mg/ngày.",
    chuY: "Tránh phối hợp với thuốc ức chế CYP3A4 mạnh (một số kháng sinh macrolide, thuốc kháng nấm).",
    taiLieuThamKhao: "Dược thư Quốc gia Việt Nam; tờ hướng dẫn sử dụng do nhà sản xuất công bố.",
  },
  "Omeprazole": {
    dangBaoChe: "Viên nang tan trong ruột 20mg, 40mg; dạng tiêm tĩnh mạch.",
    chiDinh: "Viêm loét dạ dày tá tràng, trào ngược dạ dày thực quản, hội chứng Zollinger-Ellison.",
    chongChiDinh: "Mẫn cảm với omeprazole hoặc nhóm ức chế bơm proton.",
    thanTrong: "Dùng dài ngày có thể tăng nguy cơ gãy xương, thiếu vitamin B12, nhiễm khuẩn đường ruột.",
    tacDungPhu: "Đau đầu, đầy hơi, tiêu chảy hoặc táo bón.",
    lieuDung: "20-40mg/ngày, uống trước ăn sáng 30-60 phút, thời gian điều trị theo chỉ định.",
    chuY: "Có thể làm giảm hiệu quả của clopidogrel; báo bác sĩ nếu đang dùng đồng thời.",
    taiLieuThamKhao: "Dược thư Quốc gia Việt Nam; tờ hướng dẫn sử dụng do nhà sản xuất công bố.",
  },
  "Clopidogrel": {
    dangBaoChe: "Viên nén bao phim 75mg.",
    chiDinh: "Dự phòng biến cố huyết khối ở bệnh nhân nhồi máu cơ tim, đột quỵ, bệnh động mạch ngoại biên, sau đặt stent mạch vành.",
    chongChiDinh: "Xuất huyết nội tiến triển (loét dạ dày, xuất huyết nội sọ), suy gan nặng.",
    thanTrong: "Thận trọng khi phối hợp với thuốc chống đông, NSAID; ngừng trước phẫu thuật theo chỉ định bác sĩ.",
    tacDungPhu: "Chảy máu (bầm tím, chảy máu cam), rối loạn tiêu hoá.",
    lieuDung: "75mg/ngày, có thể dùng liều nạp 300-600mg trong một số tình huống cấp theo chỉ định.",
    chuY: "Không tự ý ngừng thuốc, đặc biệt sau đặt stent mạch vành, vì nguy cơ huyết khối cấp.",
    taiLieuThamKhao: "Dược thư Quốc gia Việt Nam; tờ hướng dẫn sử dụng do nhà sản xuất công bố.",
  },
  "Warfarin": {
    dangBaoChe: "Viên nén 1mg, 2mg, 5mg.",
    chiDinh: "Dự phòng và điều trị huyết khối tĩnh mạch, thuyên tắc phổi, rung nhĩ có nguy cơ đột quỵ, van tim cơ học.",
    chongChiDinh: "Phụ nữ có thai, xuất huyết đang tiến triển, rối loạn đông máu nặng.",
    thanTrong: "Cần theo dõi chỉ số INR định kỳ; nhiều thuốc và thực phẩm ảnh hưởng đến tác dụng.",
    tacDungPhu: "Chảy máu là tác dụng phụ chính, từ bầm tím nhẹ đến xuất huyết nghiêm trọng.",
    lieuDung: "Liều khởi đầu và duy trì cá thể hoá dựa trên chỉ số INR mục tiêu, theo dõi sát bởi bác sĩ.",
    chuY: "Giữ chế độ ăn ổn định về lượng vitamin K; báo ngay cho bác sĩ khi có dấu hiệu chảy máu bất thường.",
    taiLieuThamKhao: "Dược thư Quốc gia Việt Nam; tờ hướng dẫn sử dụng do nhà sản xuất công bố.",
  },
  "Digoxin": {
    dangBaoChe: "Viên nén 0.125mg, 0.25mg; dạng tiêm tĩnh mạch.",
    chiDinh: "Suy tim, kiểm soát tần số thất trong rung nhĩ.",
    chongChiDinh: "Block nhĩ thất độ cao chưa đặt máy tạo nhịp, rung thất.",
    thanTrong: "Khoảng điều trị hẹp — dễ ngộ độc khi rối loạn điện giải (đặc biệt hạ kali máu) hoặc suy thận.",
    tacDungPhu: "Buồn nôn, rối loạn thị giác (nhìn vàng), loạn nhịp tim khi quá liều.",
    lieuDung: "Liều duy trì cá thể hoá theo cân nặng, chức năng thận và nồng độ thuốc trong máu.",
    chuY: "Theo dõi nồng độ digoxin và điện giải đồ định kỳ, đặc biệt khi phối hợp thuốc lợi tiểu.",
    taiLieuThamKhao: "Dược thư Quốc gia Việt Nam; tờ hướng dẫn sử dụng do nhà sản xuất công bố.",
  },
  "Levothyroxine": {
    dangBaoChe: "Viên nén 25mcg, 50mcg, 100mcg.",
    chiDinh: "Điều trị thay thế hormone giáp trong suy giáp.",
    chongChiDinh: "Nhiễm độc giáp chưa kiểm soát, nhồi máu cơ tim cấp chưa ổn định.",
    thanTrong: "Thận trọng ở người bệnh mạch vành, cao tuổi — khởi đầu liều thấp.",
    tacDungPhu: "Khi quá liều: hồi hộp, run tay, mất ngủ, sụt cân (dấu hiệu cường giáp).",
    lieuDung: "Liều cá thể hoá theo cân nặng và xét nghiệm TSH, uống buổi sáng lúc đói.",
    chuY: "Uống cách xa canxi, sắt, thuốc kháng acid ít nhất 4 giờ để không giảm hấp thu.",
    taiLieuThamKhao: "Dược thư Quốc gia Việt Nam; tờ hướng dẫn sử dụng do nhà sản xuất công bố.",
  },
  "Sertraline": {
    dangBaoChe: "Viên nén 50mg, 100mg.",
    chiDinh: "Trầm cảm, rối loạn lo âu lan toả, rối loạn hoảng sợ, rối loạn ám ảnh cưỡng chế.",
    chongChiDinh: "Đang dùng thuốc ức chế MAO trong vòng 14 ngày.",
    thanTrong: "Thận trọng ở người có tiền sử rối loạn lưỡng cực, nguy cơ tự sát ở người trẻ tuổi khi mới bắt đầu điều trị.",
    tacDungPhu: "Buồn nôn, mất ngủ hoặc buồn ngủ, khô miệng, rối loạn chức năng tình dục.",
    lieuDung: "Khởi đầu 50mg/ngày, điều chỉnh theo đáp ứng, tối đa 200mg/ngày.",
    chuY: "Không ngừng thuốc đột ngột; giảm liều từ từ theo hướng dẫn bác sĩ.",
    taiLieuThamKhao: "Dược thư Quốc gia Việt Nam; tờ hướng dẫn sử dụng do nhà sản xuất công bố.",
  },
  "Fluoxetine": {
    dangBaoChe: "Viên nang 20mg.",
    chiDinh: "Trầm cảm, rối loạn ám ảnh cưỡng chế, chứng ăn vô độ tâm căn.",
    chongChiDinh: "Đang dùng thuốc ức chế MAO.",
    thanTrong: "Thời gian bán thải dài — thận trọng khi chuyển đổi sang thuốc chống trầm cảm khác.",
    tacDungPhu: "Buồn nôn, mất ngủ, lo âu, giảm cân nhẹ.",
    lieuDung: "Khởi đầu 20mg/ngày vào buổi sáng, có thể tăng theo đáp ứng lâm sàng.",
    chuY: "Theo dõi tâm trạng trong những tuần đầu điều trị, đặc biệt ở người trẻ tuổi.",
    taiLieuThamKhao: "Dược thư Quốc gia Việt Nam; tờ hướng dẫn sử dụng do nhà sản xuất công bố.",
  },
  "Ciprofloxacin": {
    dangBaoChe: "Viên nén 250mg, 500mg; dung dịch tiêm truyền; dung dịch nhỏ mắt/tai.",
    chiDinh: "Nhiễm khuẩn tiết niệu, tiêu hoá, hô hấp, xương khớp do vi khuẩn nhạy cảm nhóm quinolone.",
    chongChiDinh: "Trẻ em đang tuổi phát triển xương (trừ chỉ định đặc biệt), tiền sử viêm gân do quinolone.",
    thanTrong: "Thận trọng ở người cao tuổi, đang dùng corticosteroid do tăng nguy cơ đứt gân.",
    tacDungPhu: "Buồn nôn, tiêu chảy, đau/viêm gân, nhạy cảm ánh sáng.",
    lieuDung: "250-750mg mỗi 12 giờ tuỳ mức độ và vị trí nhiễm khuẩn.",
    chuY: "Uống cách xa sữa, thuốc kháng acid chứa canxi/nhôm ít nhất 2 giờ để không giảm hấp thu.",
    taiLieuThamKhao: "Dược thư Quốc gia Việt Nam; tờ hướng dẫn sử dụng do nhà sản xuất công bố.",
  },
  "Furosemide": {
    dangBaoChe: "Viên nén 40mg; dung dịch tiêm.",
    chiDinh: "Phù do suy tim, suy gan, suy thận; tăng huyết áp phối hợp.",
    chongChiDinh: "Vô niệu, hôn mê gan, hạ natri/kali máu nặng chưa điều chỉnh.",
    thanTrong: "Theo dõi điện giải đồ và chức năng thận định kỳ, đặc biệt khi phối hợp digoxin.",
    tacDungPhu: "Hạ kali máu, chóng mặt do hạ huyết áp, mất nước.",
    lieuDung: "Khởi đầu 20-40mg/ngày, điều chỉnh theo đáp ứng lâm sàng.",
    chuY: "Bổ sung kali hoặc thực phẩm giàu kali theo hướng dẫn bác sĩ nếu cần.",
    taiLieuThamKhao: "Dược thư Quốc gia Việt Nam; tờ hướng dẫn sử dụng do nhà sản xuất công bố.",
  },
  "Rifampicin": {
    dangBaoChe: "Viên nang 150mg, 300mg; dạng phối hợp cố định liều điều trị lao.",
    chiDinh: "Điều trị lao phối hợp với thuốc kháng lao khác; dự phòng viêm màng não do não mô cầu.",
    chongChiDinh: "Vàng da tắc mật, mẫn cảm với rifamycin.",
    thanTrong: "Theo dõi chức năng gan định kỳ; là chất cảm ứng enzym gan mạnh, tương tác với nhiều thuốc.",
    tacDungPhu: "Nước tiểu, mồ hôi, nước mắt màu đỏ cam (vô hại), rối loạn tiêu hoá, độc gan.",
    lieuDung: "10mg/kg/ngày (tối đa 600mg/ngày), uống lúc đói, theo phác đồ chống lao.",
    chuY: "Có thể làm giảm hiệu quả thuốc tránh thai nội tiết; cần biện pháp tránh thai bổ sung.",
    taiLieuThamKhao: "Dược thư Quốc gia Việt Nam; tờ hướng dẫn sử dụng do nhà sản xuất công bố.",
  },
  "Tamoxifen": {
    dangBaoChe: "Viên nén 10mg, 20mg.",
    chiDinh: "Điều trị ung thư vú có thụ thể nội tiết dương tính, dự phòng ở nhóm nguy cơ cao.",
    chongChiDinh: "Phụ nữ có thai, tiền sử huyết khối tĩnh mạch sâu hoặc thuyên tắc phổi.",
    thanTrong: "Tăng nguy cơ huyết khối tĩnh mạch và ung thư nội mạc tử cung khi dùng kéo dài.",
    tacDungPhu: "Bốc hoả, kinh nguyệt không đều, buồn nôn nhẹ.",
    lieuDung: "20mg/ngày, thời gian điều trị thường 5-10 năm theo phác đồ ung thư.",
    chuY: "Khám phụ khoa định kỳ; báo bác sĩ ngay nếu ra máu âm đạo bất thường.",
    taiLieuThamKhao: "Dược thư Quốc gia Việt Nam; tờ hướng dẫn sử dụng do nhà sản xuất công bố.",
  },
  "Prednisolone": {
    dangBaoChe: "Viên nén 5mg; dung dịch uống.",
    chiDinh: "Kháng viêm, ức chế miễn dịch trong bệnh tự miễn, dị ứng nặng, hen suyễn đợt cấp.",
    chongChiDinh: "Nhiễm nấm toàn thân chưa điều trị, mẫn cảm với corticosteroid.",
    thanTrong: "Dùng kéo dài có thể gây loãng xương, tăng đường huyết, ức chế trục thượng thận.",
    tacDungPhu: "Tăng cân, giữ nước, tăng huyết áp, tăng nguy cơ nhiễm khuẩn.",
    lieuDung: "Liều cá thể hoá theo bệnh lý, thường giảm liều dần khi ngừng thuốc sau dùng kéo dài.",
    chuY: "Không ngừng thuốc đột ngột sau khi dùng dài ngày — cần giảm liều từ từ theo chỉ định.",
    taiLieuThamKhao: "Dược thư Quốc gia Việt Nam; tờ hướng dẫn sử dụng do nhà sản xuất công bố.",
  },
  "Salbutamol": {
    dangBaoChe: "Bình xịt định liều 100mcg/liều; dung dịch khí dung; viên nén 2mg, 4mg.",
    chiDinh: "Cắt cơn co thắt phế quản trong hen suyễn, bệnh phổi tắc nghẽn mạn tính.",
    chongChiDinh: "Mẫn cảm với salbutamol; thận trọng đặc biệt ở người loạn nhịp tim nặng.",
    thanTrong: "Thận trọng ở người bệnh tim mạch, cường giáp, đái tháo đường.",
    tacDungPhu: "Run tay, hồi hộp, nhịp tim nhanh, đau đầu.",
    lieuDung: "Xịt 1-2 nhát khi có triệu chứng hoặc theo lịch dự phòng bác sĩ chỉ định.",
    chuY: "Nếu phải dùng thuốc cắt cơn quá thường xuyên, cần tái khám vì có thể hen chưa kiểm soát tốt.",
    taiLieuThamKhao: "Dược thư Quốc gia Việt Nam; tờ hướng dẫn sử dụng do nhà sản xuất công bố.",
  },
  "Loratadine": {
    dangBaoChe: "Viên nén 10mg; siro cho trẻ em.",
    chiDinh: "Viêm mũi dị ứng, mày đay, các triệu chứng dị ứng khác.",
    chongChiDinh: "Mẫn cảm với loratadine.",
    thanTrong: "Thận trọng ở người suy gan nặng — có thể cần chỉnh liều.",
    tacDungPhu: "Đau đầu, khô miệng, buồn ngủ nhẹ (ít hơn kháng histamin thế hệ 1).",
    lieuDung: "10mg/ngày, uống một lần, không phụ thuộc bữa ăn.",
    chuY: "Thuốc thế hệ 2, ít gây buồn ngủ hơn nhưng vẫn nên thận trọng khi lái xe nếu nhạy cảm.",
    taiLieuThamKhao: "Dược thư Quốc gia Việt Nam; tờ hướng dẫn sử dụng do nhà sản xuất công bố.",
  },
  "Clarithromycin": {
    dangBaoChe: "Viên nén 250mg, 500mg; viên phóng thích kéo dài.",
    chiDinh: "Nhiễm khuẩn hô hấp, da mô mềm; phối hợp điều trị diệt Helicobacter pylori.",
    chongChiDinh: "Mẫn cảm với macrolide, dùng đồng thời một số thuốc chuyển hoá qua CYP3A4 có nguy cơ tương tác nghiêm trọng.",
    thanTrong: "Thận trọng ở người bệnh gan, kéo dài khoảng QT trên điện tâm đồ.",
    tacDungPhu: "Rối loạn tiêu hoá, vị đắng miệng, tăng men gan.",
    lieuDung: "250-500mg mỗi 12 giờ, thời gian điều trị theo chỉ định.",
    chuY: "Là chất ức chế CYP3A4 mạnh — kiểm tra tương tác trước khi phối hợp với statin, thuốc chống đông.",
    taiLieuThamKhao: "Dược thư Quốc gia Việt Nam; tờ hướng dẫn sử dụng do nhà sản xuất công bố.",
  },
  "Insulin Glargine": {
    dangBaoChe: "Dung dịch tiêm dưới da 100 đơn vị/mL, dạng bút tiêm hoặc lọ.",
    chiDinh: "Điều trị đái tháo đường type 1 và type 2 cần insulin nền tác dụng kéo dài.",
    chongChiDinh: "Hạ đường huyết, mẫn cảm với insulin glargine.",
    thanTrong: "Không pha trộn với các loại insulin khác trong cùng một ống tiêm.",
    tacDungPhu: "Hạ đường huyết, phản ứng tại chỗ tiêm (đỏ, ngứa), tăng cân nhẹ.",
    lieuDung: "Liều cá thể hoá theo đường huyết, tiêm dưới da một lần/ngày vào giờ cố định.",
    chuY: "Luân phiên vị trí tiêm để tránh loạn dưỡng mô mỡ; theo dõi đường huyết định kỳ.",
    taiLieuThamKhao: "Dược thư Quốc gia Việt Nam; tờ hướng dẫn sử dụng do nhà sản xuất công bố.",
  },
  "Vitamin C": {
    dangBaoChe: "Viên nén 500mg, viên sủi, dạng tiêm.",
    chiDinh: "Bổ sung vitamin C trong chế độ ăn thiếu hụt, hỗ trợ tăng sức đề kháng.",
    chongChiDinh: "Tiền sử sỏi thận oxalat (thận trọng liều cao), mẫn cảm với thành phần thuốc.",
    thanTrong: "Liều cao kéo dài có thể tăng nguy cơ sỏi thận ở người có cơ địa nhạy cảm.",
    tacDungPhu: "Rối loạn tiêu hoá nhẹ (đầy hơi, tiêu chảy) khi dùng liều cao.",
    lieuDung: "60-1000mg/ngày tuỳ mục đích sử dụng, không vượt quá liều khuyến cáo kéo dài.",
    chuY: "Không thay thế chế độ ăn cân đối rau củ quả tươi.",
    taiLieuThamKhao: "Dược thư Quốc gia Việt Nam; tờ hướng dẫn sử dụng do nhà sản xuất công bố.",
  },
};

// Danh sách bệnh nền minh hoạ cho màn "Tra cứu thuốc và bệnh nền"
const DISEASE_CATALOG = [
  "Tăng huyết áp",
  "Đái tháo đường type 2",
  "Suy thận mạn",
  "Suy gan",
  "Suy tim",
  "Hen suyễn",
  "Loét dạ dày - tá tràng",
  "Gout",
  "Cường giáp",
  "Rung nhĩ",
  "Trầm cảm",
  "Bệnh phổi tắc nghẽn mạn tính (COPD)",
];

// Tương tác thuốc - bệnh nền minh hoạ. Tính năng đang được phát triển thêm ngoài 3 tính
// năng chính (thông tin thuốc, thuốc-thuốc, thuốc-thực phẩm) — dữ liệu dưới đây vẫn chỉ
// là nội dung minh hoạ cho bản demo, không phải trích dẫn nguyên văn từ tờ HDSD nên
// dùng nhãn nguồn tổng quát thay vì số trang cụ thể.
const DISEASE_INTERACTIONS_DB = [
  {
    drug: "Metformin",
    disease: "Suy thận mạn",
    severity: "nghiem-trong",
    severityLabel: "Nghiêm trọng",
    citation: "Metformin có thể tích luỹ ở người suy thận, làm tăng nguy cơ nhiễm toan lactic — một biến chứng hiếm nhưng nghiêm trọng.",
    source: "Tổng hợp minh hoạ theo dược lý học đại cương — chưa có nguồn trích dẫn cụ thể",
    status: "pending",
  },
  {
    drug: "Aspirin",
    disease: "Loét dạ dày - tá tràng",
    severity: "nghiem-trong",
    severityLabel: "Nghiêm trọng",
    citation: "Aspirin ức chế bảo vệ niêm mạc dạ dày, làm tăng nguy cơ xuất huyết tiêu hoá ở người có tiền sử loét.",
    source: "Tổng hợp minh hoạ theo dược lý học đại cương — chưa có nguồn trích dẫn cụ thể",
    status: "confirmed",
  },
  {
    drug: "Ibuprofen",
    disease: "Suy tim",
    severity: "trung-binh",
    severityLabel: "Trung bình",
    citation: "NSAID như ibuprofen có thể gây giữ nước và làm nặng thêm tình trạng suy tim.",
    source: "Tổng hợp minh hoạ theo dược lý học đại cương — chưa có nguồn trích dẫn cụ thể",
    status: "pending",
  },
  {
    drug: "Prednisolone",
    disease: "Đái tháo đường type 2",
    severity: "trung-binh",
    severityLabel: "Trung bình",
    citation: "Corticosteroid làm tăng đường huyết, có thể cần điều chỉnh liều thuốc hạ đường huyết đang dùng.",
    source: "Tổng hợp minh hoạ theo dược lý học đại cương — chưa có nguồn trích dẫn cụ thể",
    status: "pending",
  },
  {
    drug: "Furosemide",
    disease: "Gout",
    severity: "nhe",
    severityLabel: "Nhẹ",
    citation: "Thuốc lợi tiểu quai có thể làm tăng acid uric máu, khởi phát cơn gout cấp.",
    source: "Tổng hợp minh hoạ theo dược lý học đại cương — chưa có nguồn trích dẫn cụ thể",
    status: "confirmed",
  },
  {
    drug: "Digoxin",
    disease: "Suy thận mạn",
    severity: "nghiem-trong",
    severityLabel: "Nghiêm trọng",
    citation: "Suy thận làm giảm thải trừ digoxin, tăng nguy cơ tích luỹ và ngộ độc.",
    source: "Tổng hợp minh hoạ theo dược lý học đại cương — chưa có nguồn trích dẫn cụ thể",
    status: "pending",
  },
  {
    drug: "Levothyroxine",
    disease: "Cường giáp",
    severity: "nghiem-trong",
    severityLabel: "Nghiêm trọng",
    citation: "Bổ sung hormone giáp khi cường giáp chưa kiểm soát có thể làm nặng thêm triệu chứng nhiễm độc giáp.",
    source: "Tổng hợp minh hoạ theo dược lý học đại cương — chưa có nguồn trích dẫn cụ thể",
    status: "pending",
  },
  {
    drug: "Atorvastatin",
    disease: "Suy gan",
    severity: "nghiem-trong",
    severityLabel: "Nghiêm trọng",
    citation: "Statin chống chỉ định ở người bệnh gan đang hoạt động do nguy cơ tăng độc tính trên gan.",
    source: "Tổng hợp minh hoạ theo dược lý học đại cương — chưa có nguồn trích dẫn cụ thể",
    status: "confirmed",
  },
  {
    drug: "Aspirin",
    disease: "Hen suyễn",
    severity: "trung-binh",
    severityLabel: "Trung bình",
    citation: "Một số người bệnh hen nhạy cảm với aspirin có thể khởi phát co thắt phế quản nặng.",
    source: "Tổng hợp minh hoạ theo dược lý học đại cương — chưa có nguồn trích dẫn cụ thể",
    status: "pending",
  },
  {
    drug: "Ibuprofen",
    disease: "Tăng huyết áp",
    severity: "nhe",
    severityLabel: "Nhẹ",
    citation: "NSAID có thể làm giảm hiệu quả của một số thuốc hạ huyết áp và gây giữ natri.",
    source: "Tổng hợp minh hoạ theo dược lý học đại cương — chưa có nguồn trích dẫn cụ thể",
    status: "pending",
  },
];

// Danh sách người nhận minh hoạ cho tính năng "Gửi cho bác sĩ"
const DOCTORS_MOCK = [
  { id: "d1", name: "BS. Nguyễn Văn An", role: "Nội tim mạch" },
  { id: "d2", name: "DS. Trần Thị Bích", role: "Dược lâm sàng" },
  { id: "d3", name: "BS. Lê Minh Châu", role: "Nội tổng quát" },
];

// Lịch sử tra cứu minh hoạ, hiển thị ở sidebar và trang chủ
const HISTORY_MOCK = [
  {
    id: "h1",
    date: "07/08/2026 · 14:32",
    drugs: ["Amlodipine 5mg", "Atorvastatin 20mg", "Aspirin 81mg", "Clopidogrel 75mg", "Omeprazole 20mg"],
  },
  {
    id: "h2",
    date: "05/08/2026 · 09:10",
    drugs: ["Warfarin 5mg", "Aspirin 81mg"],
  },
  {
    id: "h3",
    date: "02/08/2026 · 16:45",
    drugs: ["Digoxin 0.25mg", "Furosemide 40mg", "Losartan 50mg"],
  },
  {
    id: "h4",
    date: "30/07/2026 · 11:05",
    drugs: ["Paracetamol 500mg", "Vitamin C 500mg"],
  },
];
