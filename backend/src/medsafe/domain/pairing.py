"""Sinh danh sách cặp cần tra từ N thuốc người dùng nhập. Logic THUẦN.

N thuốc → C(N,2) cặp. 5 thuốc = 10 cặp, 10 thuốc = 45 cặp. Cần chặn trần để tránh
người dùng nhập 50 thuốc làm nổ số lần truy vấn.

Ghép cặp ở mức HOẠT CHẤT, không phải biệt dược — hai biệt dược khác tên có thể cùng
một hoạt chất, và tương tác xảy ra ở mức hoạt chất.
"""

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
        return cls(*sorted([a, b]))


def build_pairs(ingredients: list[str]) -> list[DrugPair]:
    """Sinh mọi cặp không trùng từ danh sách hoạt chất.

    Tự khử trùng lặp: hai biệt dược cùng hoạt chất chỉ tính một lần.
    """
    unique = sorted(set(i for i in ingredients if i))
    return [DrugPair.create(a, b) for a, b in combinations(unique, 2)]


def validate_input_size(ingredients: list[str]) -> None:
    """Chặn đầu vào quá lớn. Vượt trần thì raise ValueError để tầng API trả 422."""
    raise NotImplementedError
