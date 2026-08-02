"""Chuẩn hoá tên thuốc → hoạt chất. Logic THUẦN, không import fastapi/sqlalchemy/openai.

Đây là nút thắt của toàn hệ thống: tra sai tên thuốc thì mọi thứ phía sau đều sai.
PRD lấy "tỷ lệ chuẩn hoá tên thuốc đúng" làm success metric — số đo đó sinh ra từ
test của chính module này, đổ vào eval/results/report.md.

Bài toán cụ thể:
- "SaVi Acarbose 50 mg [Acarbose]" (biệt dược, có hàm lượng, có ngoặc) → "Acarbose"
- CSV ghi tên cột không dấu, JSON tương tác ghi có dấu → phải bỏ dấu khi so khớp
- Người dùng gõ tay sẽ sai chính tả → cần khớp mờ, KHÔNG khớp chính xác

Vì là hàm thuần nên test chạy không cần LLM, không cần DB, không cần mạng.
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class NormalizedDrug:
    """Kết quả chuẩn hoá một chuỗi tên thuốc người dùng nhập."""

    raw_input: str
    active_ingredient: str | None  # None = không khớp được
    matched_brand: str | None
    confidence: float  # 0.0–1.0
    is_ambiguous: bool  # nhiều ứng viên điểm sát nhau


def extract_ingredient_from_brand(brand_name: str) -> str | None:
    """Rút hoạt chất từ tên biệt dược.

    Ưu tiên phần trong ngoặc vuông nếu có ("SaVi Acarbose 50 mg [Acarbose]" → "Acarbose"),
    sau đó mới tới heuristic bỏ hàm lượng/dạng bào chế.
    """
    raise NotImplementedError


def normalize_for_matching(text: str) -> str:
    """Đưa chuỗi về dạng chuẩn để so khớp: bỏ dấu, thường hoá, bỏ hàm lượng, gọn khoảng trắng.

    CHỈ dùng cho so khớp. Không lưu kết quả này thay cho tên gốc.
    """
    raise NotImplementedError


def match_drug(
    user_input: str,
    catalog: list[tuple[str, str]],
    *,
    threshold: int = 88,
) -> NormalizedDrug:
    """Khớp chuỗi người dùng nhập với danh mục [(biệt dược, hoạt chất)].

    Dưới `threshold` thì trả `active_ingredient=None` — tầng trên sẽ hỏi lại người dùng
    để xác nhận. KHÔNG đoán bừa: chọn nhầm thuốc còn nguy hiểm hơn không tìm thấy.

    Nhiều ứng viên điểm sát nhau → `is_ambiguous=True`, bắt buộc người dùng chọn.
    """
    raise NotImplementedError
