"""Truy hồi đoạn trích liên quan.

★ RANH GIỚI QUAN TRỌNG NHẤT CỦA CODEBASE NÀY ★

Vai trò của similarity search KHÁC NHAU tuỳ loại tương tác — đừng áp dụng một luật
chung cho cả hai.

**Thuốc–thuốc: KHÔNG dùng retrieval để quyết định.**
Ingestion tạo quan hệ có cấu trúc (hoạt chất A, hoạt chất B) -> bản ghi có bằng chứng
từ PDF. Request path tra khoá chính xác, không tìm kiếm xấp xỉ.
Dùng phép xấp xỉ thay cho phép tra chính xác sẽ sinh lỗi kiểu: truy vấn
"Warfarin + Tamoxifen" trả về bản ghi "Acenocoumarol + Tamoxifen" (cùng nhóm coumarin,
rất gần nhau trong không gian embedding) — một cảnh báo CÓ nguồn, CÓ trích dẫn, nhưng
SAI CẶP THUỐC. Đây là lỗi vượt qua được mọi lớp kiểm tra "có nguồn hay không".
=> Quyết định bởi db/repositories + domain/.

**Thuốc–thực phẩm: CÓ, retrieval chính là cơ chế phát hiện.**
Không tồn tại bảng tra cho nhóm này; thông tin nằm trong văn bản tự do của tờ HDSD
("tránh nước bưởi chùm", "không dùng cùng rượu"). Không có khoá để tra, nên tìm kiếm
ngữ nghĩa là cách duy nhất. Ràng buộc: đầu ra phải là ĐOẠN TRÍCH NGUYÊN VĂN kèm nguồn,
không phải kết luận do model tự phát biểu.

**Chuẩn hoá tên thuốc:** khớp mờ, xem domain/normalization.py.

Dưới `score_threshold` thì trả rỗng và để tầng trên báo "chưa có dữ liệu".
KHÔNG hạ ngưỡng để "có gì đó mà trả về".
"""

from dataclasses import dataclass

from medsafe.vectordb.vector_store import SearchHit, VectorStore


@dataclass(frozen=True)
class RetrievedExcerpt:
    """Đoạn trích đã đủ điều kiện hiển thị cho người dùng."""

    text: str  # nguyên văn
    source_url: str
    drug_id: str
    page: int | None
    section: str | None
    score: float


class Retriever:
    def __init__(
        self,
        store: VectorStore,
        embedder,  # medsafe.embeddings.embedder.Embedder
        *,
        top_k: int = 5,
        score_threshold: float = 0.35,
    ) -> None:
        self.store = store
        self.embedder = embedder
        self.top_k = top_k
        self.score_threshold = score_threshold

    def retrieve_excerpts(
        self,
        query: str,
        *,
        drug_ids: list[str] | None = None,
    ) -> list[RetrievedExcerpt]:
        """Lấy đoạn trích liên quan, lọc theo ngưỡng điểm.

        Trả list rỗng khi không có gì vượt ngưỡng — đó là kết quả hợp lệ, không phải lỗi.
        """
        raise NotImplementedError

    def find_food_interactions(self, ingredient: str) -> list[RetrievedExcerpt]:
        """Tìm đoạn HDSD nói về tương tác với thực phẩm / đồ uống.

        KHÁC với nhánh thuốc–thuốc: ở đây không có bảng tra, retrieval CHÍNH LÀ cơ chế
        phát hiện. Đầu ra là đoạn trích nguyên văn — hệ thống không tự phát biểu kết
        luận thay cho văn bản gốc.

        Độ phủ phụ thuộc chất lượng tờ HDSD; rỗng nghĩa là "không tìm thấy trong tài
        liệu hiện có", không phải "không có tương tác". UI phải nói đúng điều đó.
        """
        raise NotImplementedError

    def find_evidence_for_pair(
        self,
        ingredient_a: str,
        ingredient_b: str,
    ) -> list[RetrievedExcerpt]:
        """Tìm đoạn trích minh chứng cho một cặp tương tác **đã được xác định từ DB**.

        Tiền đề: ingestion đã tạo bản ghi exact-pair gắn với chunk nguồn. Hàm này chỉ
        phục hồi/kiểm tra bằng chứng nguyên văn để hiển thị. Không dùng kết quả gần đúng
        để thay thế một pair key khác.
        """
        raise NotImplementedError

    @staticmethod
    def _to_excerpt(hit: SearchHit) -> RetrievedExcerpt:
        raise NotImplementedError
