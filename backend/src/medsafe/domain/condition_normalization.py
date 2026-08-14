"""Logic thuần để chuẩn hóa toàn bộ condition mention bằng taxonomy và rule tất định."""

import hashlib
import re
from dataclasses import dataclass
from typing import Literal

from medsafe.domain.normalization import remove_vietnamese_accents

ConditionConceptCode = str
SeverityQualifier = Literal["mild", "moderate", "severe", "unknown"]
CourseQualifier = Literal["acute", "chronic", "unknown"]
StageQualifier = Literal["end_stage", "unknown"]
ExpressionOperator = Literal["single", "and", "or", "mixed", "unclear"]
Confidence = Literal["high", "medium", "low"]
NormalizationMethod = Literal["generated", "fallback", "not_requested"]


@dataclass(frozen=True, slots=True)
class ConceptDefinition:
    preferred_name_vi: str
    concept_type: str
    body_system: str


@dataclass(frozen=True, slots=True)
class ConditionRule:
    code: ConditionConceptCode
    preferred_name_vi: str
    concept_type: str
    body_system: str
    patterns: tuple[str, ...]
    generic: bool = False


@dataclass(frozen=True, slots=True)
class MentionInput:
    record_id: str
    raw_mention: str
    normalized_mention: str
    interaction_count: int


@dataclass(frozen=True, slots=True)
class Qualifiers:
    severity: SeverityQualifier | None = None
    course: CourseQualifier | None = None
    stage: StageQualifier | None = None
    dialysis: bool | None = None
    criteria_text: tuple[str, ...] = ()


@dataclass(frozen=True, slots=True)
class Component:
    concept_code: ConditionConceptCode
    qualifiers: Qualifiers
    source_fragment: str


@dataclass(frozen=True, slots=True)
class MentionMapping:
    record_id: str
    components: tuple[Component, ...]
    expression: ExpressionOperator
    is_compound: bool
    confidence: Confidence
    reason: str
    ai_status: NormalizationMethod


def _rule(
    code: str,
    name: str,
    concept_type: str,
    body_system: str,
    *patterns: str,
    generic: bool = False,
) -> ConditionRule:
    return ConditionRule(code, name, concept_type, body_system, tuple(patterns), generic)


# Các pattern chạy trên chuỗi tiếng Việt đã bỏ dấu, viết thường và gọn khoảng trắng. Chúng nhận diện
# thuật ngữ/alias xác định, không dùng fuzzy similarity để tránh gộp hai bệnh chỉ tình cờ giống chữ.
CONDITION_RULES: tuple[ConditionRule, ...] = (
    # Tình trạng đặc biệt
    _rule("pregnancy", "Mang thai", "special_condition", "special", r"\b(?:mang thai|co thai|thai ky)\b"),
    _rule("breastfeeding", "Cho con bú", "special_condition", "special", r"\b(?:cho con bu|phu nu cho con bu)\b"),
    _rule("older_adult", "Người cao tuổi", "population", "special", r"\b(?:nguoi|benh nhan) cao tuoi\b"),
    _rule("organ_transplant", "Ghép tạng", "procedure_state", "special", r"\b(?:cay )?ghep (?:tang|co quan|than)\b"),
    _rule("immobility", "Bất động kéo dài", "procedure_state", "special", r"\b(?:nam|bi) bat dong\b"),
    _rule(
        "anticoagulant_use",
        "Đang dùng thuốc chống đông",
        "treatment_state",
        "special",
        r"\bdang (?:dieu tri voi|dung) thuoc chong dong\b",
    ),
    _rule(
        "central_venous_catheter",
        "Đặt catheter tĩnh mạch trung ương",
        "procedure_state",
        "special",
        r"\bdat catheter tinh mach trung uong\b",
    ),
    _rule(
        "vascular_anastomosis", "Mới nối thông mạch máu", "procedure_state", "special", r"\bmoi noi thong mach mau\b"
    ),
    _rule(
        "post_cabg_surgery",
        "Sau phẫu thuật bắc cầu động mạch vành",
        "procedure_state",
        "special",
        r"\bphau thuat bac cau dong mach vanh\b",
        r"\bcabg\b",
    ),
    _rule("intestinal_anastomosis", "Mới nối ruột", "procedure_state", "special", r"\bmoi noi ruot\b"),
    _rule(
        "critical_illness",
        "Tình trạng bệnh nặng cần hồi sức tích cực",
        "clinical_state",
        "special",
        r"\bbenh nhan nang[^.;]{0,35}dieu tri tich cuc\b",
    ),
    _rule("severe_debilitation", "Suy nhược nặng", "clinical_state", "special", r"\bsuy nhuoc nang\b"),
    # Thận - tiết niệu
    _rule(
        "acute_kidney_injury", "Tổn thương thận cấp", "disease", "renal", r"\b(?:suy than cap|ton thuong than cap)\b"
    ),
    _rule("chronic_kidney_disease", "Bệnh thận mạn tính", "disease", "renal", r"\b(?:benh than man|suy than man)\b"),
    _rule(
        "end_stage_kidney_disease",
        "Bệnh thận giai đoạn cuối",
        "disease",
        "renal",
        r"\b(?:benh than|suy than)[^.;]{0,35}\bgiai doan cuoi\b",
        r"\besrd\b",
    ),
    _rule("polycystic_kidney_disease", "Bệnh thận đa nang", "disease", "renal", r"\bbenh than da nang\b"),
    _rule("nephrotic_syndrome", "Hội chứng thận hư", "disease", "renal", r"\b(?:hoi chung )?than hu\b"),
    _rule(
        "renal_artery_stenosis",
        "Hẹp động mạch thận",
        "disease",
        "renal",
        r"\bhep(?: dang ke)? (?:dong mach|mach) than\b",
    ),
    _rule("kidney_stone", "Sỏi thận", "disease", "renal", r"\bsoi (?:calci )?than\b", r"\blang dong calci o than\b"),
    _rule(
        "renal_impairment",
        "Suy giảm chức năng thận",
        "organ_impairment",
        "renal",
        r"\bsuy than\b",
        r"\bsuy (?:giam )?chuc nang than\b",
        r"\bchuc nang than suy giam\b",
        r"\broi loan chuc nang than\b",
        r"\bimpaired renal function\b",
        r"\bton thuong than\b",
    ),
    _rule("anuria", "Vô niệu", "clinical_finding", "renal", r"\bvo nieu\b"),
    _rule("oliguria", "Thiểu niệu", "clinical_finding", "renal", r"\bthieu nieu\b"),
    _rule(
        "dialysis",
        "Đang điều trị thay thế thận/lọc máu",
        "procedure_state",
        "renal",
        r"\b(?:tham phan|tham tach mau|loc mau|loc than nhan tao|chay than nhan tao)\b",
    ),
    _rule("hematuria", "Tiểu máu", "clinical_finding", "renal", r"\b(?:huyet nieu|tieu mau)\b"),
    _rule(
        "urinary_retention",
        "Bí tiểu",
        "clinical_finding",
        "urologic",
        r"\bbi tieu(?: tien)?\b(?! duong)",
        r"\bu nuoc tieu\b",
    ),
    _rule(
        "urinary_obstruction",
        "Tắc nghẽn đường tiết niệu",
        "disease",
        "urologic",
        r"\b(?:tac nghen duong tieu|tac duong tiet nieu|tac bang quang|tac co bang quang)\b",
    ),
    _rule(
        "benign_prostatic_hyperplasia",
        "Phì đại lành tính tuyến tiền liệt",
        "disease",
        "urologic",
        r"\bphi dai (?:lanh tinh )?(?:tuyen )?tien liet\b",
    ),
    _rule(
        "kidney_disease",
        "Bệnh thận",
        "disease",
        "renal",
        r"\bbenh (?:ly )?than\b(?! kinh)",
        r"\bvan de ve than\b",
        generic=True,
    ),
    # Gan - mật
    _rule("acute_liver_disease", "Bệnh gan cấp tính", "disease", "hepatic", r"\bbenh gan cap\b"),
    _rule("chronic_liver_disease", "Bệnh gan mạn tính", "disease", "hepatic", r"\bbenh gan man\b"),
    _rule(
        "active_liver_disease",
        "Bệnh gan đang hoạt động",
        "disease",
        "hepatic",
        r"\bbenh gan (?:dang )?(?:hoat dong|tien trien)\b",
    ),
    _rule("cirrhosis", "Xơ gan", "disease", "hepatic", r"\bxo gan\b"),
    _rule("cholestasis", "Ứ mật", "disease", "hepatic", r"\bu mat\b"),
    _rule(
        "biliary_obstruction",
        "Tắc nghẽn đường mật",
        "disease",
        "hepatic",
        r"\b(?:tac mat|tac nghen mat|tac nghen duong mat|tac duong dan mat|tac ong mat)\b",
        r"\bong mat tac nghen\b",
    ),
    _rule("hepatitis", "Viêm gan", "disease", "hepatic", r"\bviem gan\b"),
    _rule(
        "hepatic_encephalopathy",
        "Bệnh não gan",
        "disease",
        "hepatic",
        r"\b(?:benh nao gan|benh nao do gan|hon me gan)\b",
    ),
    _rule("gilbert_syndrome", "Hội chứng Gilbert", "disease", "hepatic", r"\bgilbert\b"),
    _rule(
        "elevated_liver_enzymes",
        "Tăng men gan/transaminase",
        "clinical_finding",
        "hepatic",
        r"\b(?:tang (?:enzym|men) gan|transaminase[^.;]{0,20}(?:tang|cao))\b",
    ),
    _rule("portal_hypertension", "Tăng áp lực tĩnh mạch cửa", "disease", "hepatic", r"\btang ap luc tinh mach cua\b"),
    _rule(
        "alcohol_related_liver_disease",
        "Bệnh gan liên quan đến rượu",
        "disease",
        "hepatic",
        r"\bbenh gan (?:do|lien quan den) ruou\b",
    ),
    _rule(
        "hepatic_impairment",
        "Suy giảm chức năng gan",
        "organ_impairment",
        "hepatic",
        r"\b(?:suy gan|suy chuc nang gan|suy giam (?:dang ke )?chuc nang gan|roi loan chuc nang gan|giam chuc nang gan|thieu nang gan|suy te bao gan|ton thuong (?:chuc nang|nhu mo)? ?gan|hepatic impairment)\b",
    ),
    _rule("esophageal_varices", "Giãn tĩnh mạch thực quản", "disease", "hepatic", r"\bgian tinh mach thuc quan\b"),
    _rule(
        "gallbladder_disease",
        "Bệnh túi mật",
        "disease",
        "hepatic",
        r"\bbenh (?:o )?tui mat\b",
        r"\bviem tui mat\b",
        r"\bsoi mat\b",
    ),
    _rule("liver_disease", "Bệnh gan", "disease", "hepatic", r"\b(?:benh|van de) (?:ly )?(?:ve )?gan\b", generic=True),
    # Tim mạch - mạch máu não
    _rule("heart_failure", "Suy tim", "disease", "cardiovascular", r"\bsuy tim\b", r"\bsuy co tim\b"),
    _rule("cardiogenic_shock", "Sốc tim", "disease", "cardiovascular", r"\b(?:soc|shock) (?:do )?tim\b"),
    _rule(
        "hypertension", "Tăng huyết áp", "disease", "cardiovascular", r"\b(?:tang|cao) huyet ap\b", r"\bhuyet ap cao\b"
    ),
    _rule(
        "hypotension",
        "Hạ huyết áp",
        "clinical_finding",
        "cardiovascular",
        r"\b(?:ha|giam|tut) huyet ap\b",
        r"\bhuyet ap thap\b",
    ),
    _rule("myocardial_infarction", "Nhồi máu cơ tim", "disease", "cardiovascular", r"\bnhoi mau co tim\b"),
    _rule(
        "ischemic_heart_disease",
        "Bệnh tim thiếu máu cục bộ",
        "disease",
        "cardiovascular",
        r"\b(?:benh )?(?:tim|co tim) (?:do )?thieu mau cuc bo\b",
        r"\bbenh thieu mau co tim cuc bo\b",
        r"\bthieu mau cuc bo (?:do [^.;]{0,20})?(?:dong mach vanh|tim)\b",
        r"\bbenh (?:dong )?mach vanh\b",
        r"\bsuy (?:dong|mach) vanh\b",
    ),
    _rule(
        "ischemia",
        "Thiếu máu cục bộ",
        "clinical_finding",
        "cardiovascular",
        r"\b(?:nghi ngo )?thieu mau cuc bo\b",
        r"\broi loan mach thieu mau cuc bo\b",
        r"\bthieu mau (?:co tim|nao)\b",
    ),
    _rule("intestinal_ischemia", "Thiếu máu ruột", "disease", "cardiovascular", r"\bthieu mau (?:duong )?ruot\b"),
    _rule("angina", "Đau thắt ngực", "disease", "cardiovascular", r"\bdau that nguc\b"),
    _rule(
        "arrhythmia",
        "Rối loạn nhịp tim",
        "disease",
        "cardiovascular",
        r"\b(?:roi loan|loan) nhip tim\b",
        r"\bloan nhip\b",
        r"\bnghen nhip tim\b",
    ),
    _rule(
        "tachycardia",
        "Nhịp tim nhanh",
        "clinical_finding",
        "cardiovascular",
        r"\b(?:nhip tim nhanh|tim dap nhanh|con nhip tim nhanh)\b",
    ),
    _rule(
        "bradycardia",
        "Nhịp tim chậm",
        "clinical_finding",
        "cardiovascular",
        r"\b(?:nhip tim cham|cham nhip tim|nhip cham xoang)\b",
    ),
    _rule(
        "atrioventricular_block",
        "Blốc nhĩ thất",
        "disease",
        "cardiovascular",
        r"\b(?:block|bloc|bloc) (?:nhi ?-? ?that|tim)\b",
        r"\broi loan dan truyen nhi that\b",
        r"\btac nghen dan truyen nhi that\b",
    ),
    _rule(
        "intraventricular_block", "Blốc trong thất", "disease", "cardiovascular", r"\b(?:block|bloc|bloc) trong that\b"
    ),
    _rule(
        "sinoatrial_block",
        "Blốc xoang nhĩ",
        "disease",
        "cardiovascular",
        r"\b(?:block|bloc|bloc) (?:xoang nhi|nut xoang nhi)\b",
        r"\broi loan xoang ?-? ?nhi\b",
    ),
    _rule(
        "sick_sinus_syndrome",
        "Hội chứng suy nút xoang",
        "disease",
        "cardiovascular",
        r"\b(?:hoi chung )?(?:suy nut xoang|nut xoang benh ly|nut xoang)\b",
        r"\broi loan chuc nang nut xoang\b",
    ),
    _rule(
        "qt_prolongation",
        "Khoảng QT kéo dài",
        "clinical_finding",
        "cardiovascular",
        r"\b(?:khoang|doan) q ?-? ?t keo dai\b",
        r"\bqt keo dai\b",
        r"\bkeo dai (?:khoang|doan) qt\b",
        r"\bhoi chung qt\b",
    ),
    _rule("atrial_fibrillation", "Rung nhĩ", "disease", "cardiovascular", r"\brung nhi\b"),
    _rule("ventricular_fibrillation", "Rung thất", "disease", "cardiovascular", r"\brung that\b"),
    _rule("aortic_stenosis", "Hẹp van động mạch chủ", "disease", "cardiovascular", r"\bhep (?:van )?dong mach chu\b"),
    _rule("mitral_stenosis", "Hẹp van hai lá", "disease", "cardiovascular", r"\bhep van hai la\b"),
    _rule(
        "left_ventricular_outflow_obstruction",
        "Tắc nghẽn đường ra thất trái",
        "disease",
        "cardiovascular",
        r"\btac nghen (?:dong chay|duong) (?:ra|thoat)(?: cua)? (?:tam )?that trai\b",
    ),
    _rule(
        "hypertrophic_cardiomyopathy", "Bệnh cơ tim phì đại", "disease", "cardiovascular", r"\bbenh co tim phi dai\b"
    ),
    _rule(
        "left_ventricular_dysfunction",
        "Rối loạn chức năng thất trái",
        "disease",
        "cardiovascular",
        r"\b(?:roi loan|suy) chuc nang that trai\b",
        r"\bchuc nang that trai bi suy\b",
        r"\bsuy that trai\b",
    ),
    _rule(
        "peripheral_arterial_disease",
        "Bệnh động mạch ngoại biên",
        "disease",
        "cardiovascular",
        r"\b(?:benh|suy|roi loan) (?:dong )?mach (?:mau )?ngoai (?:bien|vi)\b",
        r"\btac nghen dong mach ngoai bien\b",
    ),
    _rule(
        "stroke",
        "Đột quỵ/tai biến mạch máu não",
        "disease",
        "neurologic",
        r"\b(?:dot quy|tai bien mach mau nao)\b",
        r"\bnhoi mau nao\b",
    ),
    _rule(
        "cerebrovascular_disease",
        "Bệnh mạch máu não",
        "disease",
        "neurologic",
        r"\bbenh mach mau nao\b",
        r"\bsuy tuan hoan nao\b",
    ),
    _rule(
        "coronary_cerebral_artery_stenosis",
        "Hẹp động mạch vành hoặc mạch máu não",
        "disease",
        "cardiovascular",
        r"\bhep cac dong mach vanh hoac cac mach mau nao\b",
    ),
    _rule(
        "intracranial_hemorrhage",
        "Xuất huyết nội sọ",
        "disease",
        "neurologic",
        r"\b(?:xuat huyet|chay mau) (?:noi so|nao|duoi mang nhien|duoi mang cung)\b",
    ),
    _rule("aneurysm", "Phình động mạch", "disease", "cardiovascular", r"\bphinh (?:dong )?mach\b"),
    _rule("atherosclerosis", "Xơ vữa động mạch", "disease", "cardiovascular", r"\bxo (?:vua|cung) dong mach\b"),
    _rule(
        "peripheral_circulatory_disorder",
        "Rối loạn tuần hoàn ngoại biên",
        "disease",
        "cardiovascular",
        r"\broi loan tuan hoan ngoai bien\b",
    ),
    _rule(
        "low_cardiac_reserve",
        "Dự trữ tim kém",
        "clinical_finding",
        "cardiovascular",
        r"\bdu tru tim kem\b",
        r"\bap luc lam day tim thap\b",
    ),
    _rule(
        "low_resting_heart_rate",
        "Tần số tim lúc nghỉ thấp",
        "clinical_finding",
        "cardiovascular",
        r"\b(?:nhip|tan so) tim (?:tu the )?(?:luc )?nghi duoi\b",
    ),
    _rule(
        "conduction_disorder",
        "Rối loạn dẫn truyền tim",
        "disease",
        "cardiovascular",
        r"\bsuy giam dan truyen\b",
        r"\bbat thuong[^.;]{0,25}(?:nut xoang nhi|nut nhi that)\b",
        generic=True,
    ),
    _rule(
        "cardiovascular_disease",
        "Bệnh tim mạch",
        "disease",
        "cardiovascular",
        r"\bbenh tim(?: mach)?\b",
        r"\broi loan tim mach\b",
        generic=True,
    ),
    _rule("shock", "Sốc", "clinical_finding", "systemic", r"\b(?:soc|shock)\b"),
    # Hô hấp
    _rule("asthma", "Hen phế quản", "disease", "respiratory", r"\b(?:hen|hen phe quan|hen suyen|suyen)\b"),
    _rule("bronchospasm", "Co thắt phế quản", "clinical_finding", "respiratory", r"\bco that phe quan\b"),
    _rule(
        "copd",
        "Bệnh phổi tắc nghẽn mạn tính",
        "disease",
        "respiratory",
        r"\b(?:copd|benh (?:tac nghen phoi|phoi tac nghen)|roi loan phoi tac nghen) (?:man|man tinh)?\b",
    ),
    _rule("respiratory_failure", "Suy hô hấp", "organ_impairment", "respiratory", r"\bsuy ho hap\b"),
    _rule("chronic_lung_disease", "Bệnh phổi mạn tính", "disease", "respiratory", r"\bbenh phoi man\b"),
    _rule("sleep_apnea", "Ngưng thở khi ngủ", "disease", "respiratory", r"\bngung tho (?:trong )?khi ngu\b"),
    _rule("pulmonary_edema", "Phù phổi", "clinical_finding", "respiratory", r"\bphu phoi\b", r"\bsung huyet phoi\b"),
    _rule(
        "hypoxemia",
        "Thiếu oxy máu",
        "clinical_finding",
        "respiratory",
        r"\b(?:thieu|giam) oxy(?:gen)? mau\b",
        r"\bthieu oxy mo\b",
    ),
    _rule(
        "hypoxia_hypercapnia",
        "Thiếu oxy hoặc tăng CO₂ máu",
        "clinical_finding",
        "respiratory",
        r"\bthieu oxy nang\b",
        r"\btang co2 (?:trong )?mau\b",
    ),
    _rule("hypoventilation", "Giảm thông khí", "clinical_finding", "respiratory", r"\bgiam thong khi\b"),
    _rule("pneumothorax", "Tràn khí màng phổi", "disease", "respiratory", r"\btran khi mang phoi\b"),
    _rule(
        "respiratory_secretion_clearance_impairment",
        "Giảm khả năng làm sạch dịch tiết hô hấp",
        "clinical_finding",
        "respiratory",
        r"\bsuy giam chat tiet man tinh\b",
        r"\bgiam kha nang loai bo dom\b",
    ),
    _rule(
        "respiratory_disease",
        "Bệnh hô hấp",
        "disease",
        "respiratory",
        r"\bbenh (?:ly )?(?:duong )?ho hap\b",
        r"\bbenh phoi\b",
        generic=True,
    ),
    # Nội tiết - chuyển hóa - điện giải
    _rule(
        "type_1_diabetes",
        "Đái tháo đường típ 1",
        "disease",
        "endocrine",
        r"\b(?:dai thao duong|tieu duong) (?:typ|type|tuyp|tip|tiep) ?(?:1|i)\b",
        r"\bdai thao duong phu thuoc insulin\b",
    ),
    _rule(
        "type_2_diabetes",
        "Đái tháo đường típ 2",
        "disease",
        "endocrine",
        r"\b(?:dai thao duong|tieu duong) (?:typ|type|tuyp|tip) ?(?:2|ii)\b",
        r"\btieu duong khong le thuoc insulin\b",
    ),
    _rule(
        "diabetic_ketoacidosis",
        "Nhiễm toan ceton do đái tháo đường",
        "disease",
        "endocrine",
        r"\b(?:nhiem (?:toan|acid|keto acid) (?:the )?ceton|nhiem toan ceton mau)\b",
    ),
    _rule("diabetes_insipidus", "Đái tháo nhạt", "disease", "endocrine", r"\bdai thao nhat\b"),
    _rule("diabetes_mellitus", "Đái tháo đường", "disease", "endocrine", r"\b(?:dai thao duong|tieu duong)\b"),
    _rule(
        "hyperthyroidism", "Cường giáp", "disease", "endocrine", r"\b(?:cuong|tang nang) (?:tuyen )?giap(?: trang)?\b"
    ),
    _rule("hypothyroidism", "Suy giáp", "disease", "endocrine", r"\b(?:suy|nhuoc|thieu nang) (?:tuyen )?giap\b"),
    _rule(
        "thyrotoxicosis",
        "Nhiễm độc giáp",
        "disease",
        "endocrine",
        r"\bnhiem doc (?:tuyen )?giap\b",
        r"\bngo doc giap\b",
    ),
    _rule(
        "thyroid_disease",
        "Bệnh tuyến giáp",
        "disease",
        "endocrine",
        r"\b(?:benh|roi loan) (?:ly )?tuyen giap\b",
        r"\broi loan chuc nang tuyen giap\b",
        generic=True,
    ),
    _rule(
        "endocrine_gland_disorder",
        "Bệnh tuyến nội tiết",
        "disease",
        "endocrine",
        r"\bbenh anh huong den tuyen (?:thuong than|yen|giap)\b",
        generic=True,
    ),
    _rule(
        "primary_hyperaldosteronism",
        "Cường aldosteron nguyên phát",
        "disease",
        "endocrine",
        r"\b(?:cuong|tang) aldosteron(?:e)?(?: mau)?(?: nguyen phat| tien phat)?\b",
        r"\bhoi chung conn\b",
    ),
    _rule("adrenal_insufficiency", "Suy tuyến thượng thận", "disease", "endocrine", r"\bsuy (?:tuyen )?thuong than\b"),
    _rule("addison_disease", "Bệnh Addison", "disease", "endocrine", r"\bbenh addison\b"),
    _rule(
        "pheochromocytoma", "U tủy thượng thận", "disease", "endocrine", r"\b(?:u tuy thuong than|u te bao ua crom)\b"
    ),
    _rule(
        "hyperparathyroidism", "Cường cận giáp", "disease", "endocrine", r"\b(?:cuong|tang nang) (?:tuyen )?can giap\b"
    ),
    _rule(
        "hypoparathyroidism",
        "Suy cận giáp",
        "disease",
        "endocrine",
        r"\b(?:suy|giam nang|thieu nang|gia suy) (?:tuyen )?can giap\b",
    ),
    _rule(
        "metabolic_acidosis",
        "Nhiễm toan chuyển hóa",
        "clinical_finding",
        "metabolic",
        r"\b(?:nhiem (?:toan|acid)|toan huyet|toan)(?: do)? chuyen hoa\b",
        r"\bnhiem acid lactic\b",
        r"\btoan huyet\b",
    ),
    _rule(
        "metabolic_alkalosis",
        "Nhiễm kiềm chuyển hóa",
        "clinical_finding",
        "metabolic",
        r"\bnhiem kiem(?: chuyen hoa)?\b",
    ),
    _rule("acidosis", "Nhiễm toan", "clinical_finding", "metabolic", r"\bnhiem toan\b", generic=True),
    _rule("dehydration", "Mất nước", "clinical_finding", "metabolic", r"\bmat nuoc\b"),
    _rule(
        "hypovolemia",
        "Giảm thể tích tuần hoàn",
        "clinical_finding",
        "metabolic",
        r"\b(?:giam|thieu) (?:the tich|khoi luong) (?:mau|tuan hoan)\b",
    ),
    _rule(
        "hyperkalemia",
        "Tăng kali máu",
        "clinical_finding",
        "electrolyte",
        r"\b(?:tang kali|kali huyet cao)(?: mau| huyet)?\b",
    ),
    _rule(
        "hypokalemia",
        "Hạ kali máu",
        "clinical_finding",
        "electrolyte",
        r"\b(?:ha|giam) kali (?:mau|huyet|huyet thanh)?\b",
        r"\bkali huyet ha\b",
    ),
    _rule("hypernatremia", "Tăng natri máu", "clinical_finding", "electrolyte", r"\btang natri (?:mau|huyet)?\b"),
    _rule("hyponatremia", "Hạ natri máu", "clinical_finding", "electrolyte", r"\b(?:ha|giam) natri (?:mau|huyet)?\b"),
    _rule(
        "hypercalcemia",
        "Tăng calci máu",
        "clinical_finding",
        "electrolyte",
        r"\btang (?:calci|canxi|calcium) (?:mau|huyet)?\b",
    ),
    _rule(
        "hypocalcemia",
        "Hạ calci máu",
        "clinical_finding",
        "electrolyte",
        r"\b(?:ha|giam) (?:calci|canxi|calcium) (?:mau|huyet)?\b",
    ),
    _rule(
        "hypercalciuria",
        "Tăng calci niệu",
        "clinical_finding",
        "electrolyte",
        r"\btang (?:calci|canxi) nieu\b",
        r"\bcalci nieu nang\b",
    ),
    _rule(
        "hypophosphatemia",
        "Hạ phosphat máu",
        "clinical_finding",
        "electrolyte",
        r"\b(?:ha|giam)(?: nong do)? phosphat (?:mau|huyet)?\b",
    ),
    _rule(
        "hypermagnesemia",
        "Tăng magnesi máu",
        "clinical_finding",
        "electrolyte",
        r"\bmagnesi mau tang\b",
        r"\btang magnesi mau\b",
    ),
    _rule("hyperchloremia", "Tăng clo máu", "clinical_finding", "electrolyte", r"\btang clo (?:mau|huyet)?\b"),
    _rule("hypochloremia", "Hạ clo máu", "clinical_finding", "electrolyte", r"\b(?:ha|giam) clo (?:mau|huyet)?\b"),
    _rule(
        "electrolyte_disorder",
        "Rối loạn điện giải",
        "clinical_finding",
        "electrolyte",
        r"\broi loan (?:nuoc va )?dien giai\b",
        r"\bmat can bang dien giai\b",
        generic=True,
    ),
    _rule("porphyria", "Rối loạn chuyển hóa porphyrin", "disease", "metabolic", r"\b(?:porphyria|porphyrin)\b"),
    _rule(
        "heme_biosynthesis_disorder",
        "Rối loạn sinh tổng hợp heme",
        "disease",
        "metabolic",
        r"\bdi truyen ve sinh tong hop haem\b",
    ),
    _rule(
        "phenylketonuria",
        "Phenylketon niệu",
        "disease",
        "metabolic",
        r"\b(?:phenylketon|phenylceton)(?:uria| niệu| nieu)?\b",
    ),
    _rule(
        "hereditary_fructose_intolerance",
        "Không dung nạp fructose di truyền",
        "disease",
        "metabolic",
        r"\bkhong dung nap fructose\b",
        r"\bvan de di truyen[^.;]{0,30}hap thu fructose\b",
    ),
    _rule(
        "hereditary_galactose_intolerance",
        "Không dung nạp galactose di truyền",
        "disease",
        "metabolic",
        r"\bkhong (?:dung nap|nap) galactose\b",
        r"\bgalactose huyet bam sinh\b",
        r"\bgalatoza huyet\b",
    ),
    _rule(
        "glucose_galactose_malabsorption",
        "Kém hấp thu glucose-galactose",
        "disease",
        "metabolic",
        r"\b(?:kem|giam|roi loan|bat thuong) hap thu glucose ?-? ?galactose\b",
        r"\bhap thu kem glucose (?:va| ) galactose\b",
    ),
    _rule(
        "lactase_deficiency",
        "Thiếu hụt lactase",
        "disease",
        "metabolic",
        r"\bthieu (?:hut )?(?:men|enzym)? ?(?:lapp )?lactase\b",
        r"\bkhong dung nap lactose\b",
    ),
    _rule(
        "g6pd_deficiency",
        "Thiếu men G6PD",
        "disease",
        "hematologic",
        r"\b(?:thieu (?:hut )?(?:men )?)?(?:g ?-? ?6 ?-? ?pd|glucose ?-? ?6 ?-? ?phosphat(?:e)? dehydrogenase)\b",
    ),
    _rule("gout", "Bệnh gút", "disease", "metabolic", r"\b(?:gout|gut)\b"),
    _rule("hyperuricemia", "Tăng acid uric máu", "clinical_finding", "metabolic", r"\btang acid uric (?:mau|huyet)?\b"),
    _rule("malnutrition", "Suy dinh dưỡng", "clinical_finding", "metabolic", r"\bsuy dinh duong\b"),
    _rule(
        "hypoglycemia",
        "Hạ đường huyết",
        "clinical_finding",
        "metabolic",
        r"\b(?:ha duong|ha glucose|giam glucose|giam duong) (?:mau|huyet)?\b",
    ),
    _rule(
        "hyperglycemia",
        "Tăng đường huyết",
        "clinical_finding",
        "metabolic",
        r"\b(?:tang duong|tang glucose) (?:mau|huyet)?\b",
    ),
    _rule(
        "hyperosmolar_state",
        "Tình trạng tăng thẩm thấu",
        "clinical_finding",
        "metabolic",
        r"\b(?:hon me|tinh trang) tang (?:ap luc )?tham thau\b",
    ),
    _rule("ketoacidosis", "Nhiễm toan ceton", "clinical_finding", "metabolic", r"\bnhiem keto acid\b"),
    _rule(
        "amino_acid_metabolism_disorder",
        "Rối loạn chuyển hóa acid amin",
        "disease",
        "metabolic",
        r"\b(?:roi loan|suy giam) chuyen hoa (?:acid|axit) amin\b",
    ),
    _rule(
        "calcium_metabolism_disorder",
        "Rối loạn chuyển hóa calci",
        "disease",
        "metabolic",
        r"\broi loan chuyen hoa (?:calci|canxi)\b",
    ),
    _rule(
        "carbohydrate_metabolism_disorder",
        "Rối loạn chuyển hóa carbohydrat",
        "disease",
        "metabolic",
        r"\broi loan (?:su dung|chuyen hoa) carbohydrat\b",
    ),
    _rule(
        "hypervitaminosis_d",
        "Thừa vitamin D",
        "clinical_finding",
        "metabolic",
        r"\b(?:thua vitamin d|qua lieu vitamin d|ngo doc qua lieu vitamin d)\b",
    ),
    _rule("iron_overload", "Quá tải sắt", "clinical_finding", "metabolic", r"\bqua tai (?:chat )?sat\b"),
    _rule(
        "fluid_overload",
        "Quá tải dịch",
        "clinical_finding",
        "metabolic",
        r"\b(?:thua nuoc|u nuoc|qua tai dich|tang luong nuoc ngoai bao|tang the tich tuan hoan)\b",
    ),
    _rule(
        "siadh",
        "Hội chứng tiết ADH không thích hợp",
        "disease",
        "endocrine",
        r"\bsiadh\b",
        r"\btang tiet vasopressin khong tham thau\b",
    ),
    _rule("hyperlipidemia", "Tăng lipid máu", "clinical_finding", "metabolic", r"\btang lipid mau\b"),
    _rule(
        "lactose_metabolism_disorder",
        "Rối loạn chuyển hóa lactose",
        "disease",
        "metabolic",
        r"\broi loan chuyen hoa lien quan den lactose\b",
    ),
    # Tiêu hóa
    _rule(
        "peptic_ulcer",
        "Loét dạ dày–tá tràng",
        "disease",
        "gastrointestinal",
        r"\b(?:viem )?loet (?:da day|ta trang|hanh ta trang|da day ?-? ?ta trang|duong tieu hoa)\b",
    ),
    _rule(
        "gastrointestinal_bleeding",
        "Xuất huyết tiêu hóa",
        "clinical_finding",
        "gastrointestinal",
        r"\b(?:xuat huyet|chay mau) (?:duong )?tieu hoa\b",
        r"\bchay mau (?:da day|duong ruot|truc trang)\b",
    ),
    _rule(
        "bowel_obstruction",
        "Tắc nghẽn ruột",
        "disease",
        "gastrointestinal",
        r"\b(?:tac|tac nghen|hep) (?:nghen )?(?:duong )?(?:ruot|duong tieu hoa)\b",
        r"\bhep co hoc duong tieu hoa\b",
        r"\btac mon vi ?-? ?ta trang\b",
    ),
    _rule(
        "paralytic_ileus",
        "Liệt ruột",
        "disease",
        "gastrointestinal",
        r"\bliet ruot\b",
        r"\bmat truong luc[^.;]{0,30}(?:ruot|nhu dong)\b",
    ),
    _rule("inflammatory_bowel_disease", "Bệnh viêm ruột", "disease", "gastrointestinal", r"\bbenh viem ruot\b"),
    _rule(
        "ulcerative_colitis",
        "Viêm loét đại tràng",
        "disease",
        "gastrointestinal",
        r"\bviem loet dai(?: ?-? ?truc)? trang\b",
    ),
    _rule("crohn_disease", "Bệnh Crohn", "disease", "gastrointestinal", r"\b(?:benh )?crohn\b"),
    _rule("colitis", "Viêm đại tràng", "disease", "gastrointestinal", r"\bviem dai trang\b"),
    _rule("pancreatitis", "Viêm tụy", "disease", "gastrointestinal", r"\bviem tuy\b"),
    _rule("achalasia", "Co thắt tâm vị", "disease", "gastrointestinal", r"\b(?:co that tam vi|tam vi khong gian)\b"),
    _rule("esophageal_stenosis", "Hẹp thực quản", "disease", "gastrointestinal", r"\b(?:hep|co that) thuc quan\b"),
    _rule("pyloric_stenosis", "Hẹp môn vị", "disease", "gastrointestinal", r"\bhep mon vi\b"),
    _rule(
        "megacolon",
        "Phình đại tràng",
        "disease",
        "gastrointestinal",
        r"\b(?:megacolon|phinh (?:to |dai )?(?:dai trang|ruot ket)|phi dai ruot ket|to dai trang)\b",
    ),
    _rule("diarrhea", "Tiêu chảy", "clinical_finding", "gastrointestinal", r"\btieu chay\b"),
    _rule("vomiting", "Nôn", "clinical_finding", "gastrointestinal", r"\bnon(?: nhieu| sau mo)?\b"),
    _rule("dyspepsia", "Khó tiêu", "clinical_finding", "gastrointestinal", r"\bkho tieu\b"),
    _rule(
        "irritable_bowel_syndrome",
        "Hội chứng ruột kích thích",
        "disease",
        "gastrointestinal",
        r"\bdai trang kich thich\b",
        r"\bhoi chung ruot kich thich\b",
    ),
    _rule("enteritis", "Viêm ruột", "disease", "gastrointestinal", r"\bviem (?:nhiem )?duong ruot\b", r"\bviem ruot\b"),
    _rule("proctitis", "Viêm trực tràng", "disease", "gastrointestinal", r"\bviem truc trang\b"),
    _rule("appendicitis", "Viêm ruột thừa", "disease", "gastrointestinal", r"\bviem ruot thua\b"),
    _rule("constipation", "Táo bón", "clinical_finding", "gastrointestinal", r"\btao bon\b"),
    _rule("abdominal_pain", "Đau bụng", "clinical_finding", "gastrointestinal", r"\bdau bung\b"),
    _rule(
        "colostomy_state",
        "Có hậu môn nhân tạo",
        "procedure_state",
        "gastrointestinal",
        r"\bhau mon gia\b",
        r"\bkhong co hau mon\b",
    ),
    _rule(
        "intestinal_hypomotility",
        "Giảm nhu động ruột",
        "clinical_finding",
        "gastrointestinal",
        r"\bgiam kha nang van dong cua ruot\b",
    ),
    _rule("bloating", "Đầy hơi", "clinical_finding", "gastrointestinal", r"\btinh trang day hoi\b"),
    _rule("hemorrhoids", "Bệnh trĩ", "disease", "gastrointestinal", r"\bbenh tri\b"),
    _rule(
        "gastrointestinal_disease",
        "Bệnh đường tiêu hóa",
        "disease",
        "gastrointestinal",
        r"\bbenh (?:ly )?(?:duong )?tieu hoa\b",
        generic=True,
    ),
    # Thần kinh - tâm thần
    _rule("epilepsy", "Động kinh/co giật", "disease", "neurologic", r"\b(?:dong kinh|co giat|tinh trang dong kinh)\b"),
    _rule("parkinson_disease", "Bệnh Parkinson", "disease", "neurologic", r"\bparkinson\b"),
    _rule("myasthenia_gravis", "Nhược cơ", "disease", "neuromuscular", r"\bnhuoc co\b"),
    _rule("huntington_disease", "Bệnh Huntington", "disease", "neurologic", r"\bhuntington\b"),
    _rule(
        "intracranial_hypertension",
        "Tăng áp lực nội sọ",
        "clinical_finding",
        "neurologic",
        r"\btang ap luc (?:noi so|icp)\b",
    ),
    _rule("dementia", "Sa sút trí tuệ", "disease", "psychiatric", r"\b(?:sa sut tri tue|mat tri nho)\b"),
    _rule("alzheimer_disease", "Bệnh Alzheimer", "disease", "neurologic", r"\balzheimer\b"),
    _rule("depression", "Trầm cảm", "disease", "psychiatric", r"\btram cam\b"),
    _rule(
        "bipolar_disorder",
        "Rối loạn lưỡng cực",
        "disease",
        "psychiatric",
        r"\b(?:roi loan|tram cam) luong cuc\b",
        r"\bhung ?-? ?tram cam\b",
    ),
    _rule("schizophrenia", "Tâm thần phân liệt", "disease", "psychiatric", r"\b(?:roi loan )?tam than phan liet\b"),
    _rule(
        "psychotic_disorder",
        "Rối loạn tâm thần",
        "disease",
        "psychiatric",
        r"\b(?:benh|benh nhan|roi loan|loan) tam than\b",
        generic=True,
    ),
    _rule("personality_disorder", "Rối loạn nhân cách", "disease", "psychiatric", r"\broi loan nhan cach\b"),
    _rule("anxiety_fear_state", "Lo âu/ám ảnh/sợ hãi", "disease", "psychiatric", r"\b(?:lo au|am anh|so hai)\b"),
    _rule("emotional_disorder", "Rối loạn cảm xúc", "disease", "psychiatric", r"\broi loan cam xuc\b"),
    _rule(
        "movement_disorder",
        "Rối loạn vận động",
        "disease",
        "neurologic",
        r"\broi loan van dong\b",
        r"\broi loan van dong ngoai thap\b",
    ),
    _rule(
        "nervous_system_disease",
        "Bệnh hệ thần kinh",
        "disease",
        "neurologic",
        r"\bbenh (?:ly )?(?:o )?he (?:thong )?than kinh\b",
        r"\bbenh than kinh (?:trung uong|ngoai bien)\b",
        r"\bhe than kinh (?:trung uong|ngoai bien)\b",
        r"\broi loan than kinh (?:trung uong|ngoai bien)\b",
        generic=True,
    ),
    _rule("coma", "Hôn mê", "clinical_finding", "neurologic", r"\b(?:tien )?hon me\b", generic=True),
    _rule("spastic_paralysis", "Liệt cứng", "disease", "neuromuscular", r"\bliet cung\b", r"\bliet chu ky\b"),
    _rule("adams_stokes_syndrome", "Hội chứng Adams–Stokes", "disease", "neurologic", r"\badams stokes\b"),
    _rule(
        "central_nervous_system_injury",
        "Tổn thương hệ thần kinh trung ương",
        "clinical_state",
        "neurologic",
        r"\bton thuong[^.;]{0,40}than kinh trung uong\b",
    ),
    # Huyết học
    _rule(
        "active_bleeding",
        "Đang xuất huyết",
        "clinical_finding",
        "hematologic",
        r"\b(?:dang |moi )?(?:bi )?(?:chay mau|xuat huyet)(?: benh ly| nghiem trong| dang hoat dong)?\b",
    ),
    _rule(
        "bleeding_disorder",
        "Rối loạn chảy máu/đông máu",
        "disease",
        "hematologic",
        r"\b(?:roi loan|the tang|benh ua) (?:chay mau|dong mau)\b",
        r"\bchung dong mau noi mach\b",
        r"\bloan mau\b",
    ),
    _rule("thrombocytopenia", "Giảm tiểu cầu", "clinical_finding", "hematologic", r"\bgiam tieu cau\b"),
    _rule(
        "bone_marrow_suppression",
        "Suy tủy/rối loạn tạo máu",
        "disease",
        "hematologic",
        r"\b(?:suy tuy|loan tao mau|roi loan tao mau)\b",
    ),
    _rule("anemia", "Thiếu máu", "disease", "hematologic", r"\bthieu mau(?! (?:co tim|tim|nao|cuc bo|duong ruot))\b"),
    _rule("thalassemia", "Thalassemia", "disease", "hematologic", r"\bthalass(?:emia|emie)\b"),
    _rule("thrombosis", "Huyết khối", "disease", "hematologic", r"\b(?:huyet khoi|thuyen tac|tao cuc mau dong)\b"),
    _rule(
        "hypoprothrombinemia", "Giảm prothrombin máu", "clinical_finding", "hematologic", r"\bgiam prothrombin mau\b"
    ),
    _rule("agranulocytosis", "Giảm bạch cầu hạt", "clinical_finding", "hematologic", r"\bgiam bach cau hat\b"),
    _rule(
        "blood_disorder",
        "Bệnh lý về máu",
        "disease",
        "hematologic",
        r"\b(?:benh|roi loan) (?:ly )?(?:ve )?mau\b",
        r"\broi loan tang mau\b",
        r"\bbenh ly nghiem trong cua he tao mau\b",
        generic=True,
    ),
    # Nhiễm trùng - miễn dịch
    _rule("sepsis", "Nhiễm trùng huyết", "disease", "infectious", r"\bnhiem (?:trung|khuan) huyet\b"),
    _rule("tuberculosis", "Bệnh lao", "disease", "infectious", r"\b(?:benh )?lao(?: phoi| da)?\b"),
    _rule("hiv_infection", "Nhiễm HIV", "disease", "infectious", r"\b(?:nhiem )?hiv\b"),
    _rule("immunodeficiency", "Suy giảm miễn dịch", "disease", "immune", r"\bsuy giam mien dich\b"),
    _rule("meningitis", "Viêm màng não", "disease", "infectious", r"\bviem mang nao\b"),
    _rule("fungal_infection", "Nhiễm nấm", "disease", "infectious", r"\bnhiem nam\b"),
    _rule("viral_infection", "Nhiễm virus", "disease", "infectious", r"\bnhiem (?:virus|virut)\b"),
    _rule("infection", "Nhiễm trùng/nhiễm khuẩn", "disease", "infectious", r"\bnhiem (?:trung|khuan)\b", generic=True),
    _rule("fever", "Sốt", "clinical_finding", "infectious", r"\b(?:benh nhan co )?sot\b"),
    _rule("varicella", "Thủy đậu", "disease", "infectious", r"\bthuy dau\b"),
    _rule("acute_poisoning", "Nhiễm độc cấp", "clinical_state", "toxicologic", r"\bnhiem doc cap\b"),
    # Mắt - da - cơ xương và các nhóm thường gặp khác
    _rule(
        "angle_closure_glaucoma",
        "Glôcôm góc đóng/góc hẹp",
        "disease",
        "ophthalmic",
        r"\b(?:glaucom|gloucom|glocom|tang nhan ap)[^.;]{0,18}goc (?:dong|hep)\b",
    ),
    _rule("glaucoma", "Glôcôm/tăng nhãn áp", "disease", "ophthalmic", r"\b(?:glaucom|gloucom|glocom|tang nhan ap)\b"),
    _rule("cataract", "Đục thủy tinh thể", "disease", "ophthalmic", r"\bduc thuy tinh the\b"),
    _rule("retinal_disease", "Bệnh võng mạc", "disease", "ophthalmic", r"\b(?:benh|viem|xuat huyet) vong mac\b"),
    _rule("color_vision_defect", "Rối loạn sắc giác", "disease", "ophthalmic", r"\b(?:mu mau|loan mau sac)\b"),
    _rule("dry_eye", "Khô mắt", "disease", "ophthalmic", r"\bkho mat\b"),
    _rule(
        "corneal_disorder",
        "Bệnh giác mạc/củng mạc",
        "disease",
        "ophthalmic",
        r"\b(?:giac mac|cung mac) (?:bi )?(?:ton thuong|mong)\b",
        r"\bmong (?:giac mac|cung mac)\b",
    ),
    _rule(
        "increased_vitreous_pressure",
        "Tăng áp suất dịch kính",
        "clinical_finding",
        "ophthalmic",
        r"\btang ap suat dich kinh\b",
    ),
    _rule(
        "open_eye_injury",
        "Vết thương hở ở mắt",
        "clinical_state",
        "ophthalmic",
        r"\btang ap suat dich kinh[^.;]{0,50}vet thuong ho\b",
    ),
    _rule(
        "optic_neuropathy",
        "Bệnh thần kinh thị giác",
        "disease",
        "ophthalmic",
        r"\b(?:benh teo )?than kinh thi giac\b",
        r"\bleber\b",
    ),
    _rule("osteoporosis", "Loãng xương", "disease", "musculoskeletal", r"\bloang xuong\b"),
    _rule("psoriasis", "Vảy nến", "disease", "dermatologic", r"\b(?:vay|vay) nen\b"),
    _rule(
        "muscle_disease",
        "Bệnh cơ",
        "disease",
        "neuromuscular",
        r"\bbenh (?:ly )?(?:ve )?co\b",
        r"\bbenh co di truyen\b",
        generic=True,
    ),
    _rule(
        "tendon_disorder",
        "Bệnh lý gân",
        "disease",
        "musculoskeletal",
        r"\bbenh (?:ly |su )?(?:o )?gan co\b",
        r"\bbenh (?:ly |su )?benh gan\b",
    ),
    _rule(
        "systemic_lupus", "Lupus ban đỏ hệ thống", "disease", "immune", r"\blupus ban do(?: he thong)?\b", r"\bsle\b"
    ),
    _rule("sarcoidosis", "Bệnh sarcoidosis", "disease", "immune", r"\b(?:sarcoidosis|benh u hat|chung u hat)\b"),
    _rule("angioedema", "Phù mạch", "disease", "immune", r"\b(?:phu mach|phu than kinh mach|phu quincke)\b"),
    _rule("urticaria", "Mày đay", "disease", "immune", r"\b(?:may day|me day)\b"),
    _rule("allergic_rhinitis", "Viêm mũi dị ứng", "disease", "immune", r"\bviem mui di ung\b"),
    _rule("celiac_disease", "Bệnh Celiac", "disease", "immune", r"\b(?:benh )?c(?:eliac|oeliac)\b"),
    _rule("wheat_allergy", "Dị ứng lúa mì", "disease", "immune", r"\bdi ung (?:voi )?lua mi\b"),
    _rule(
        "drug_allergy",
        "Dị ứng thuốc",
        "disease",
        "immune",
        r"\b(?:di ung|qua man)[^.;]{0,50}(?:penicillin|beta lactam|sulfonamid)\b",
    ),
    _rule("histamine_intolerance", "Không dung nạp histamin", "disease", "immune", r"\bkhong dung nap histamin\b"),
    _rule("oral_ulcer", "Loét miệng/áp-tơ", "disease", "dermatologic", r"\b(?:ap to|loet mieng|loet mieng)\b"),
    _rule("ocular_herpes", "Herpes ở mắt", "disease", "ophthalmic", r"\bbenh mat do herpes\b"),
    _rule("netherton_syndrome", "Hội chứng Netherton", "disease", "dermatologic", r"\bnetherton\b"),
    _rule("mast_cell_disorder", "Rối loạn tế bào mast", "disease", "immune", r"\bhoi chung te bao mast\b"),
    _rule("generalized_erythema", "Ban đỏ toàn thân", "clinical_finding", "dermatologic", r"\bban do toan than\b"),
    _rule("perioral_dermatitis", "Viêm da quanh miệng", "disease", "dermatologic", r"\bviem quanh (?:mom|mieng)\b"),
    _rule("acne_rosacea", "Trứng cá đỏ", "disease", "dermatologic", r"\btrung ca do\b"),
    _rule("edema", "Phù", "clinical_finding", "systemic", r"\bphu(?: ne| toan than| ngoai bien| chung)?\b"),
    _rule("burn", "Bỏng", "clinical_finding", "systemic", r"\bbong(?: nang)?\b"),
    _rule(
        "melanoma", "Ung thư hắc tố", "disease", "oncologic", r"\b(?:ung thu hac to|u melanin ac tinh|ung thu sac to)\b"
    ),
    _rule("breast_cancer", "Ung thư vú", "disease", "oncologic", r"\b(?:ung thu|benh) vu ac tinh\b", r"\bung thu vu\b"),
    _rule(
        "malignancy",
        "Bệnh ác tính",
        "disease",
        "oncologic",
        r"\b(?:u ac tinh|benh ly da day ac tinh|benh da day ac tinh)\b",
        generic=True,
    ),
    _rule("multiple_myeloma", "Đa u tủy", "disease", "oncologic", r"\b(?:da u tuy|u tuy xuong ac tinh|u tuy)\b"),
    _rule("carcinoid_tumor", "U carcinoid", "disease", "oncologic", r"\bu carcinoid\b"),
    _rule(
        "bone_malignancy",
        "Bệnh xương ác tính",
        "disease",
        "oncologic",
        r"\b(?:u ac tinh tieu xuong|di can xuong|benh xuong ac tinh)\b",
    ),
    _rule("preeclampsia", "Tiền sản giật", "disease", "obstetric", r"\btien san giat\b"),
    _rule("eclampsia", "Sản giật", "disease", "obstetric", r"(?<!tien )\bsan giat\b"),
    _rule("gestational_toxicosis", "Nhiễm độc thai nghén", "disease", "obstetric", r"\bnhiem doc thai nghen\b"),
    _rule("threatened_miscarriage", "Dọa sẩy thai", "disease", "obstetric", r"\bdoa say thai\b"),
    _rule("hernia", "Thoát vị", "disease", "gastrointestinal", r"\bthoat vi\b"),
    _rule("arthritis", "Viêm khớp", "disease", "musculoskeletal", r"\bviem (?:xuong )?khop\b"),
    _rule("pericarditis", "Viêm màng ngoài tim", "disease", "cardiovascular", r"\bviem mang ngoai tim\b"),
    _rule("dry_rhinitis", "Viêm mũi khô/teo", "disease", "respiratory", r"\bviem mui (?:kho|teo)\b"),
    _rule("hemoptysis", "Ho ra máu", "clinical_finding", "respiratory", r"\bho ra mau\b"),
    _rule("third_space_fluid", "Ứ dịch khoang thứ ba", "clinical_finding", "systemic", r"\bu dich khoang thu ba\b"),
    _rule("hemodilution", "Pha loãng máu", "clinical_finding", "hematologic", r"\bchung loang mau\b"),
    _rule(
        "subdural_hematoma", "Tụ máu dưới màng cứng", "disease", "neurologic", r"\btu mau[^.;]{0,20}duoi mang cung\b"
    ),
    _rule("mitochondrial_disorder", "Rối loạn ty thể", "disease", "metabolic", r"\broi loan ty the\b"),
    _rule(
        "vagotonia",
        "Tăng trương lực phó giao cảm",
        "clinical_finding",
        "neurologic",
        r"\btang truong luc (?:he |than kinh )?(?:doi|pho) giao cam\b",
    ),
    _rule(
        "generalized_skin_disorder",
        "Tổn thương da lan tỏa",
        "disease",
        "dermatologic",
        r"\bteo da[^.;]{0,35}trung ca\b",
    ),
    _rule("adrenal_tumor", "U tuyến thượng thận", "disease", "endocrine", r"\bu tuyen thuong than\b"),
    _rule("granulomatous_disease", "Bệnh u hạt", "disease", "immune", r"\bu hat\b"),
)

CONDITION_CONCEPTS: dict[ConditionConceptCode, ConceptDefinition] = {
    rule.code: ConceptDefinition(rule.preferred_name_vi, rule.concept_type, rule.body_system)
    for rule in CONDITION_RULES
}

_GENERIC_SUPPRESSIONS: dict[str, frozenset[str]] = {
    "diabetes_mellitus": frozenset({"type_1_diabetes", "type_2_diabetes", "diabetic_ketoacidosis"}),
    "glaucoma": frozenset({"angle_closure_glaucoma"}),
    "shock": frozenset({"cardiogenic_shock"}),
    "active_bleeding": frozenset({"intracranial_hemorrhage", "gastrointestinal_bleeding"}),
    "ischemia": frozenset({"ischemic_heart_disease"}),
    "acidosis": frozenset({"metabolic_acidosis", "diabetic_ketoacidosis"}),
    "coma": frozenset({"hyperosmolar_state"}),
    "granulomatous_disease": frozenset({"sarcoidosis"}),
    "kidney_disease": frozenset(
        {
            "acute_kidney_injury",
            "chronic_kidney_disease",
            "end_stage_kidney_disease",
            "polycystic_kidney_disease",
            "renal_impairment",
        }
    ),
    "liver_disease": frozenset(
        {"acute_liver_disease", "chronic_liver_disease", "active_liver_disease", "hepatic_impairment"}
    ),
}


def mention_record_id(normalized_mention: str) -> str:
    """Sinh ID tất định, không phụ thuộc UUID của một interaction cụ thể."""
    digest = hashlib.sha256(normalized_mention.encode("utf-8")).hexdigest()[:16]
    return f"condition-mention:{digest}"


def normalize_rule_text(value: str) -> str:
    """Tạo chuỗi so rule ổn định mà không sửa raw mention dùng để đối chiếu."""
    folded = remove_vietnamese_accents(value).casefold()
    folded = re.sub(r"[\[\](){},;:/_–—-]+", " ", folded)
    return " ".join(folded.split())


def match_condition_concepts(value: str) -> tuple[ConditionConceptCode, ...]:
    """Trả canonical code theo alias xác định; không dùng fuzzy similarity hoặc model."""
    normalized = normalize_rule_text(value)
    matched_rules = [
        rule for rule in CONDITION_RULES if any(re.search(pattern, normalized) for pattern in rule.patterns)
    ]
    matched_codes = {rule.code for rule in matched_rules}

    selected: list[ConditionConceptCode] = []
    specific_systems = {rule.body_system for rule in matched_rules if not rule.generic}
    for rule in matched_rules:
        if rule.generic and rule.body_system in specific_systems:
            continue
        if matched_codes & _GENERIC_SUPPRESSIONS.get(rule.code, frozenset()):
            continue
        selected.append(rule.code)
    return tuple(dict.fromkeys(selected))


def is_renal_hepatic_mention(value: str) -> bool:
    """Giữ helper tương thích pilot cũ; chỉ xét canonical thuộc hệ thận hoặc gan mật."""
    normalized = normalize_rule_text(value)
    return bool(re.search(r"\b(?:e?gfr|clcr|crcl|creatinin(?:e)?)\b", normalized)) or any(
        CONDITION_CONCEPTS[code].body_system in {"renal", "hepatic"} for code in match_condition_concepts(value)
    )


def _fallback_qualifiers(raw_mention: str, normalized: str) -> Qualifiers:
    folded = raw_mention.casefold()
    severity: SeverityQualifier | None = None
    if any(value in folded for value in ("nặng", "nghiêm trọng", "trầm trọng", "severe")):
        severity = "severe"
    elif any(value in folded for value in ("trung bình", "mức độ vừa", "vừa đến", "moderate")):
        severity = "moderate"
    elif "nhẹ" in folded or "mild" in folded:
        severity = "mild"

    course: CourseQualifier | None = None
    if re.search(r"\bcap(?: tinh)?\b", normalized):
        course = "acute"
    elif re.search(r"\bman(?: tinh)?\b", normalized):
        course = "chronic"

    stage: StageQualifier | None = "end_stage" if "giai doan cuoi" in normalized else None
    dialysis = True if re.search(r"\b(?:tham phan|tham tach mau|loc mau|chay than)\b", normalized) else None
    criteria = tuple(
        match.group(0).strip()
        for match in re.finditer(
            r"(?:e?gfr|clcr|crcl|độ thanh thải creatinin(?:e)?|mức lọc cầu thận|child[ -]?pugh|nyha|"
            r"huyết áp tâm thu|nhịp tim)[^;)]{0,80}",
            raw_mention,
            flags=re.IGNORECASE,
        )
    )
    return Qualifiers(severity=severity, course=course, stage=stage, dialysis=dialysis, criteria_text=criteria)


def _has_top_level_comma(value: str) -> bool:
    depth = 0
    for character in value:
        if character == "(":
            depth += 1
        elif character == ")":
            depth = max(0, depth - 1)
        elif character in {",", ";", "/"} and depth == 0:
            return True
    return False


def _expression_operator(raw_mention: str, is_compound: bool) -> ExpressionOperator:
    folded = raw_mention.casefold()
    has_or = " hoặc " in folded or " or " in folded
    has_and = " và " in folded or " and " in folded
    if has_or and has_and:
        return "mixed"
    if has_or:
        return "or"
    if has_and:
        return "and"
    return "unclear" if is_compound else "single"


def rule_mapping(
    mention: MentionInput,
    *,
    ai_status: NormalizationMethod = "not_requested",
) -> MentionMapping:
    """Map một mention bằng rule; giữ lại mention chưa map để reviewer nhìn thấy."""
    normalized = normalize_rule_text(mention.raw_mention)
    codes = match_condition_concepts(mention.raw_mention)
    inferred_qualifiers = _fallback_qualifiers(mention.raw_mention, normalized)
    qualifiers = inferred_qualifiers if len(codes) == 1 else Qualifiers()
    components = tuple(Component(code, qualifiers, mention.raw_mention) for code in codes)
    is_compound = (
        len(components) > 1
        or bool(re.search(r"\b(?:hoac|va|and|or)\b", normalized))
        or _has_top_level_comma(mention.raw_mention)
    )
    return MentionMapping(
        record_id=mention.record_id,
        components=components,
        expression=_expression_operator(mention.raw_mention, is_compound),
        is_compound=is_compound,
        confidence="medium" if components else "low",
        reason=(
            "Khớp alias/thuật ngữ bằng rule tất định; bắt buộc duyệt thủ công."
            if components
            else "Chưa có rule đủ chắc chắn; giữ nguyên mention để phân loại thủ công."
        ),
        ai_status=ai_status,
    )


def fallback_mapping(mention: MentionInput) -> MentionMapping:
    """Fallback sau lỗi model vẫn dùng rule và không làm mất mention."""
    return rule_mapping(mention, ai_status="fallback")
