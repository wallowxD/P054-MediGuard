"""Xếp mức độ nghiêm trọng. Logic THUẦN.

★ Mức severity phải suy ra từ NỘI DUNG BẢN GHI ĐÃ THẨM ĐỊNH, không phải do LLM chấm.
Cùng một bản ghi phải luôn ra cùng một mức — nếu để model chấm thì hai lần chạy có thể
ra hai kết quả khác nhau, và cảnh báo an toàn thuốc không được phép như vậy.

Tín hiệu lấy từ trường "Xử trí" / "Hậu quả" trong drugtodrug.json, ví dụ:
- "Chống chỉ định phối hợp"        → CONTRAINDICATED
- "Tăng nguy cơ xuất huyết nghiêm trọng" → MAJOR
"""

from enum import StrEnum


class Severity(StrEnum):
    """Bậc severity hiển thị trên UI.

    UI phải phân biệt các mức bằng cả icon/nhãn chữ, không chỉ bằng màu —
    người mù màu vẫn phải đọc được. (Tiêu chí chấm UX/UI: accessibility.)
    """

    CONTRAINDICATED = "contraindicated"  # chống chỉ định phối hợp
    MAJOR = "major"
    MODERATE = "moderate"
    MINOR = "minor"
    UNKNOWN = "unknown"  # có bản ghi nhưng không đủ căn cứ xếp mức


def classify_severity(mechanism: str, consequence: str, management: str) -> Severity:
    """Xếp mức từ nội dung bản ghi tương tác.

    Hàm thuần, tất định. Không đủ căn cứ thì trả UNKNOWN — KHÔNG đoán xuống mức nhẹ
    cho "đỡ làm người dùng lo".
    """
    raise NotImplementedError


def requires_pharmacist_flag(severity: Severity) -> bool:
    """Cảnh báo này có được đẩy vào hàng đợi dược sĩ không.

    LƯU Ý: đây KHÔNG phải cổng chặn hiển thị. Theo PRD, mọi cảnh báo hiển thị ngay cho
    bệnh nhân kèm nhãn "chờ xác nhận chuyên môn"; dược sĩ xử lý song song.
    Hàm này chỉ quyết định thứ tự ưu tiên trong hàng đợi.
    """
    raise NotImplementedError
