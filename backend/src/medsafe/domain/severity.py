"""Xếp mức độ nghiêm trọng. Logic THUẦN."""

from enum import StrEnum


class Severity(StrEnum):
    """Bậc severity hiển thị trên UI."""

    CONTRAINDICATED = "contraindicated"  # chống chỉ định phối hợp
    MAJOR = "major"
    MODERATE = "moderate"
    MINOR = "minor"
    UNKNOWN = "unknown"  # có bản ghi nhưng không đủ căn cứ xếp mức


def classify_severity(mechanism: str, consequence: str, management: str) -> Severity:
    """Xếp mức từ nội dung bản ghi tương tác.

    Hàm thuần, tất định. Không đủ căn cứ thì trả UNKNOWN — KHÔNG đoán xuống mức nhẹ.
    """
    text = f"{mechanism} {consequence} {management}".lower()

    if any(k in text for k in ["chống chỉ định", "chong chi dinh", "không được phối hợp", "chong chi dinh phoi hop"]):
        return Severity.CONTRAINDICATED

    if any(k in text for k in ["nghiêm trọng", "xuất huyết", "tử vong", "nguy hiểm tính mạng", "hôn mê", "co giật", "suy hô hấp"]):
        return Severity.MAJOR

    if any(k in text for k in ["thận trọng", "theo dõi", "giảm liều", "điều chỉnh liều", "tăng nồng độ"]):
        return Severity.MODERATE

    if any(k in text for k in ["ít ảnh hưởng", "không đáng kể", "nhẹ"]):
        return Severity.MINOR

    return Severity.UNKNOWN


def requires_pharmacist_flag(severity: Severity) -> bool:
    """Cảnh báo này có được ưu tiên đẩy vào hàng đợi dược sĩ không."""
    return severity in (Severity.CONTRAINDICATED, Severity.MAJOR)
