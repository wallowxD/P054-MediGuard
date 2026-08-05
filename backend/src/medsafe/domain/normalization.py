"""Chuẩn hoá tên thuốc → hoạt chất. Logic THUẦN, không import fastapi/sqlalchemy/openai."""

from dataclasses import dataclass
import re
import unicodedata

try:
    from rapidfuzz import fuzz
except ImportError:
    # Fallback if rapidfuzz is not installed
    from difflib import SequenceMatcher

    class fuzz:
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
