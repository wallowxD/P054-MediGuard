"""Chuẩn hoá tên thuốc → hoạt chất. Logic THUẦN, không import fastapi/sqlalchemy/openai."""

import re
import unicodedata
from dataclasses import dataclass

try:
    from rapidfuzz import fuzz
except ImportError:
    # Fallback if rapidfuzz is not installed
    from difflib import SequenceMatcher

    # Tên viết thường là chủ ý: lớp này thay thế module `rapidfuzz.fuzz`, giữ nguyên
    # call site `fuzz.ratio(...)` nên không đổi sang CapWords.
    class fuzz:  # noqa: N801
        @staticmethod
        def ratio(s1: str, s2: str) -> float:
            return SequenceMatcher(None, s1, s2).ratio() * 100

        @staticmethod
        def token_set_ratio(s1: str, s2: str) -> float:
            return SequenceMatcher(None, s1, s2).ratio() * 100


@dataclass(frozen=True)
class NormalizedDrug:
    """Kết quả chuẩn hoá một chuỗi tên thuốc người dùng nhập."""

    raw_input: str
    active_ingredient: str | None  # None = không khớp được
    matched_brand: str | None
    confidence: float  # 0.0–1.0
    is_ambiguous: bool  # nhiều ứng viên điểm sát nhau


def remove_vietnamese_accents(text: str) -> str:
    """Bỏ dấu tiếng Việt."""
    if not text:
        return ""
    text = unicodedata.normalize("NFD", text)
    text = "".join(c for c in text if unicodedata.category(c) != "Mn")
    text = text.replace("đ", "d").replace("Đ", "D")
    return text


def normalize_for_matching(text: str) -> str:
    """Đưa chuỗi về dạng chuẩn để so khớp: bỏ dấu, thường hoá, bỏ hàm lượng, gọn khoảng trắng."""
    if not text:
        return ""
    # Bỏ dấu
    s = remove_vietnamese_accents(text).lower()
    # Loại bỏ các đơn vị hàm lượng dạng số + mg/g/ml/mcg/iu/iu/vị viên...
    s = re.sub(r"\b\d+([.,]\d+)?\s*(mg|g|ml|mcg|iu|iu/ml|mg/ml|g/l|%)\b", "", s, flags=re.IGNORECASE)
    # Loại bỏ ngoặc vuông/ngoặc đơn nếu còn
    s = re.sub(r"[\[\]()/\-_]", " ", s)
    # Gọn khoảng trắng
    s = " ".join(s.split())
    return s


def extract_ingredient_from_brand(brand_name: str) -> str | None:
    """Rút hoạt chất từ tên biệt dược.

    Ưu tiên phần trong ngoặc vuông nếu có ("SaVi Acarbose 50 mg [Acarbose]" → "Acarbose"),
    sau đó mới tới heuristic bỏ hàm lượng/dạng bào chế.
    """
    if not brand_name:
        return None

    # 1. Tìm ngoặc vuông [Active Ingredient]
    m = re.search(r"\[(.*?)\]", brand_name)
    if m and m.group(1).strip():
        return m.group(1).strip()

    # 2. Tìm ngoặc đơn (Active Ingredient) nếu có
    m_paren = re.search(r"\((.*?)\)", brand_name)
    if m_paren and m_paren.group(1).strip():
        candidate = m_paren.group(1).strip()
        # Nếu ngoặc đơn chứa chữ (không phải số liều dùng)
        if not re.match(r"^\d", candidate):
            return candidate

    # 3. Heuristic: Bỏ hàm lượng và dạng bào chế
    cleaned = brand_name
    cleaned = re.sub(r"\[.*?\]|\(.*?\)", "", cleaned)
    cleaned = re.sub(r"\b\d+([.,]\d+)?\s*(mg|g|ml|mcg|iu|%)\b", "", cleaned, flags=re.IGNORECASE)
    cleaned = " ".join(cleaned.split())

    return cleaned if cleaned else brand_name


def match_drug(
    user_input: str,
    catalog: list[tuple[str, str]],  # [(brand_name, active_ingredient)]
    *,
    threshold: int = 88,
) -> NormalizedDrug:
    """Khớp chuỗi người dùng nhập với danh mục [(biệt dược, hoạt chất)]."""
    if not user_input or not catalog:
        return NormalizedDrug(
            raw_input=user_input,
            active_ingredient=None,
            matched_brand=None,
            confidence=0.0,
            is_ambiguous=False,
        )

    norm_input = normalize_for_matching(user_input)

    best_match = None
    best_score = 0.0
    scores: list[tuple[float, tuple[str, str]]] = []

    for brand, ingredient in catalog:
        norm_brand = normalize_for_matching(brand)
        norm_ing = normalize_for_matching(ingredient)

        # Tính điểm dựa trên cả brand và ingredient
        score_brand = fuzz.token_set_ratio(norm_input, norm_brand)
        score_ing = fuzz.token_set_ratio(norm_input, norm_ing)
        score = max(score_brand, score_ing)

        if score > best_score:
            best_score = score
            best_match = (brand, ingredient)

        if score >= threshold:
            scores.append((score, (brand, ingredient)))

    if best_score < threshold or not best_match:
        return NormalizedDrug(
            raw_input=user_input,
            active_ingredient=None,
            matched_brand=None,
            confidence=best_score / 100.0,
            is_ambiguous=False,
        )

    # Check ambiguity: có đối thủ nào trong vòng 3 điểm của best_score không
    scores.sort(key=lambda x: x[0], reverse=True)
    is_ambiguous = len(scores) > 1 and (scores[0][0] - scores[1][0]) <= 3.0

    return NormalizedDrug(
        raw_input=user_input,
        active_ingredient=best_match[1],
        matched_brand=best_match[0],
        confidence=best_score / 100.0,
        is_ambiguous=is_ambiguous,
    )


@dataclass(frozen=True)
class ScoredDrugCandidate:
    drug_id: str
    brand_name: str
    ingredient: str
    confidence: float


# Bậc điểm cho khớp TẤT ĐỊNH, đặt trên ngưỡng fuzzy để một kết quả chứa đúng chuỗi người
# dùng gõ luôn xếp trên một kết quả chỉ "hao hao". Tên biệt dược được ưu tiên hơn hoạt
# chất vì ô tìm kiếm của danh mục là tìm theo tên thuốc.
EXACT_MATCH_SCORE = 100.0
BRAND_PREFIX_SCORE = 96.0
BRAND_SUBSTRING_SCORE = 93.0
INGREDIENT_SUBSTRING_SCORE = 90.0

# Độ dài tối thiểu để mở từng cơ chế khớp lỏng hơn. Gõ 1 ký tự thì chỉ khớp tiền tố —
# "a" mà khớp cả "Panadol" (có chữ a ở giữa) thì gợi ý thành vô nghĩa. Fuzzy cần nhiều
# ký tự hơn nữa vì nó vốn để bắt lỗi chính tả trong một tên thuốc đầy đủ.
MIN_SUBSTRING_LENGTH = 2
MIN_FUZZY_LENGTH = 4


def _score_candidate(norm_input: str, norm_brand: str, norm_ing: str, threshold: float) -> float | None:
    """Chấm điểm một dòng danh mục; `None` nghĩa là không đủ khớp để hiển thị.

    Khớp chuỗi con phải được xét TRƯỚC fuzzy và fuzzy phải bị chặn theo độ dài.
    `token_set_ratio` so sánh theo token nên chuỗi ngắn cho điểm rác: gõ "Ha" từng khớp
    "Viên Sáng Mắt" ở mức 90+, còn "Panadol" lại trượt "Panadol Viên Sủi" vì token
    "vien sui" kéo điểm trung bình xuống dưới ngưỡng.
    """
    if norm_input in (norm_brand, norm_ing):
        return EXACT_MATCH_SCORE
    if norm_brand.startswith(norm_input):
        return BRAND_PREFIX_SCORE

    if len(norm_input) >= MIN_SUBSTRING_LENGTH:
        if norm_input in norm_brand:
            return BRAND_SUBSTRING_SCORE
        if norm_input in norm_ing:
            return INGREDIENT_SUBSTRING_SCORE

    # Chỉ còn lại đường fuzzy — dành cho lỗi chính tả, không phải cho tiền tố.
    if len(norm_input) < MIN_FUZZY_LENGTH:
        return None

    # So khớp với TỪNG token chứ không chỉ cả chuỗi. Người dùng gõ sai một tên thuốc,
    # không gõ sai cả cụm "panadol vien sui": fuzz.ratio("panadl", "panadol vien sui")
    # = 54.5 nên lỗi chính tả không bao giờ vượt ngưỡng 88, còn so với riêng token
    # "panadol" thì được 92.3. Không có nhánh này thì fuzzy matching là code chết.
    tokens = norm_brand.split() + norm_ing.split()
    score = max((fuzz.ratio(norm_input, token) for token in tokens), default=0.0)
    score = max(score, fuzz.token_set_ratio(norm_input, norm_brand), fuzz.token_set_ratio(norm_input, norm_ing))
    return score if score >= threshold else None


def search_catalog(
    user_input: str,
    catalog: list[tuple[object, str, str]],  # [(drug_id, brand_name, active_ingredient)]
    *,
    threshold: float = 88.0,
    limit: int = 10,
) -> tuple[list[ScoredDrugCandidate], bool]:
    """Khớp và xếp hạng danh sách ứng viên thuốc trong danh mục cho API search.

    Trả về (danh_sách_candidate, requires_confirmation).
    """
    trimmed_input = user_input.strip() if user_input else ""
    if not trimmed_input or not catalog:
        return [], False

    norm_input = normalize_for_matching(trimmed_input)
    if not norm_input:
        return [], False

    scored: list[tuple[float, str, tuple[object, str, str]]] = []
    for drug_id, brand, ingredient in catalog:
        score = _score_candidate(
            norm_input,
            normalize_for_matching(brand),
            normalize_for_matching(ingredient),
            threshold,
        )
        if score is not None:
            scored.append((score, brand, (drug_id, brand, ingredient)))

    if not scored:
        return [], False

    # Cùng điểm thì xếp theo tên: danh mục có nhiều thuốc trùng điểm tuyệt đối (gõ một
    # chữ cái thì mọi kết quả đều là prefix), thứ tự phải ổn định giữa các lần gọi.
    scored.sort(key=lambda item: (-item[0], item[1].lower()))
    top_items = scored[:limit]

    # Chỉ bỏ qua bước xác nhận khi có ĐÚNG một ứng viên và nó khớp tuyệt đối. Khớp tiền
    # tố hay chuỗi con không đủ để tự chọn hộ người dùng — thuốc chọn sai sẽ đi thẳng
    # vào lượt kiểm tra tương tác.
    requires_confirmation = not (len(scored) == 1 and scored[0][0] >= EXACT_MATCH_SCORE)

    candidates = [
        ScoredDrugCandidate(
            drug_id=str(item[2][0]),
            brand_name=item[2][1],
            ingredient=item[2][2],
            confidence=round(float(item[0]), 2),
        )
        for item in top_items
    ]

    return candidates, requires_confirmation
