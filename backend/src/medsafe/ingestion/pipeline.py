"""Pipeline trích xuất tờ HDSD — chạy BATCH, không nằm trong đường request.

Luồng: load → PDF → text → chunk → embed → vector store + hàng đợi review.

★ Đầu ra của pipeline này KHÔNG được coi là dữ liệu đã thẩm định.
Mọi cặp tương tác do vision model trích ra phải vào DB với trạng thái `pending_review`
và bắt buộc có dược sĩ duyệt (PRD, mục Assumptions).

Chiến lược theo PRD: chạy pilot 50 thuốc đo tỷ lệ dữ liệu hữu ích, rồi mới scale
lên toàn bộ 1073 thuốc.
"""

from dataclasses import dataclass


@dataclass
class IngestionReport:
    """Số liệu một lần chạy — đổ vào eval/results/report.md."""

    drugs_attempted: int
    pdf_downloaded: int
    pdf_failed: int  # link hỏng, không tải được
    chunks_created: int
    interactions_extracted: int
    pending_review: int
    zero_yield_drugs: int  # tải được PDF nhưng không trích ra gì


def run_pipeline(*, limit: int | None = None, drug_ids: list[str] | None = None) -> IngestionReport:
    """Chạy toàn bộ pipeline. `limit` để chạy pilot.

    Idempotent: chạy lại trên cùng một thuốc phải ghi đè chunk cũ, không nhân bản
    (xem utils.helpers.stable_chunk_id và vector_store.delete_by_drug).
    """
    raise NotImplementedError
