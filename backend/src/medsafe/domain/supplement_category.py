"""Phân nhóm danh mục `supplements` cho phần ghi chú tương tác."""

from typing import Literal

SupplementNoteKind = Literal["drug-food", "drug-supplement"]

FOOD_AND_BEVERAGE_CATEGORIES = frozenset({"food", "beverage", "fruit"})
SUPPLEMENT_CATEGORIES = frozenset({"supplement", "herb"})


def supplement_note_kind(category: str | None) -> SupplementNoteKind | None:
    """Map category chính xác sang nhóm hiển thị; không đoán cho category lạ hoặc thiếu."""
    normalized = category.strip().casefold() if category else ""
    if normalized in FOOD_AND_BEVERAGE_CATEGORIES:
        return "drug-food"
    if normalized in SUPPLEMENT_CATEGORIES:
        return "drug-supplement"
    return None
