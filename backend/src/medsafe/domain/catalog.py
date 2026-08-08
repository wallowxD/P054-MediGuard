"""Chỉ mục chữ cái của danh mục thuốc. Logic THUẦN, không import fastapi/sqlalchemy."""

from collections.abc import Mapping
from dataclasses import dataclass

# Nhóm cho tên không bắt đầu bằng chữ cái Latin (ví dụ "3B-Medi").
# Dùng chữ thay vì ký tự "#" vì "#" trong URL là dấu mở fragment: `?letter=#` không bao
# giờ tới được server, còn lỗi thì im lặng. UI vẫn được phép hiển thị nhãn "#".
NON_ALPHA_LETTER = "other"

ALPHABET: tuple[str, ...] = tuple(chr(code) for code in range(ord("A"), ord("Z") + 1))


@dataclass(frozen=True)
class LetterCount:
    """Số thuốc thuộc một nhóm chữ cái."""

    letter: str
    count: int


def bucket_for(name: str) -> str:
    """Trả nhóm chữ cái của một tên thuốc: "A"–"Z" hoặc `NON_ALPHA_LETTER`."""
    first = name[:1].upper()
    return first if first in ALPHABET else NON_ALPHA_LETTER


def build_letter_index(counts_by_first_char: Mapping[str, int]) -> list[LetterCount]:
    """Gộp số đếm theo ký tự đầu thành đúng 27 nhóm: A–Z rồi tới `NON_ALPHA_LETTER`.

    Luôn trả đủ 27 nhóm kể cả nhóm rỗng. Thiếu nhóm rỗng thì FE phải tự dựng lại bảng
    chữ cái và tự đoán nhóm nào cần disable — đúng loại logic không nên nhân bản ở hai
    phía. `count = 0` là tín hiệu tường minh để disable nút trên thanh A–Z.
    """
    totals: dict[str, int] = {letter: 0 for letter in ALPHABET}
    totals[NON_ALPHA_LETTER] = 0

    for first_char, count in counts_by_first_char.items():
        totals[bucket_for(first_char)] += count

    return [LetterCount(letter=letter, count=totals[letter]) for letter in (*ALPHABET, NON_ALPHA_LETTER)]
