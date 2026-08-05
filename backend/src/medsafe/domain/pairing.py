"""Sinh danh sách cặp cần tra từ N thuốc người dùng nhập. Logic THUẦN."""

from dataclasses import dataclass
from itertools import combinations

MAX_DRUGS_PER_CHECK = 20


@dataclass(frozen=True)
class DrugPair:
    """Một cặp hoạt chất cần tra, đã sắp xếp ổn định để cache/khử trùng lặp."""

    ingredient_a: str
    ingredient_b: str

    @classmethod
    def create(cls, a: str, b: str) -> "DrugPair":
        """Luôn sắp theo thứ tự chữ cái để (A,B) và (B,A) là cùng một cặp."""
        norm_a = a.strip().lower()
        norm_b = b.strip().lower()
        sorted_pair = sorted([norm_a, norm_b])
        return cls(ingredient_a=sorted_pair[0], ingredient_b=sorted_pair[1])


def build_pairs(ingredients: list[str]) -> list[DrugPair]:
    """Sinh mọi cặp không trùng từ danh sách hoạt chất.

    Tự khử trùng lặp: hai biệt dược cùng hoạt chất chỉ tính một lần.
    """
    clean_ingredients = sorted(set(i.strip().lower() for i in ingredients if i and i.strip()))
    return [DrugPair.create(a, b) for a, b in combinations(clean_ingredients, 2)]


def validate_input_size(ingredients: list[str]) -> None:
    """Chặn đầu vào quá lớn. Vượt trần thì raise ValueError để tầng API trả 422."""
    if len(ingredients) > MAX_DRUGS_PER_CHECK:
        raise ValueError(
            f"Danh sách thuốc quá lớn ({len(ingredients)} thuốc). "
            f"Hệ thống chỉ hỗ trợ tra tối đa {MAX_DRUGS_PER_CHECK} thuốc trong 1 lần."
        )
