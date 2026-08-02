"""Chuyển text thành vector.

Hai không gian embedding tách biệt, đừng trộn:
- `hdsd_excerpts` — đoạn trích tờ HDSD, phục vụ tra thông tin thuốc và truy nguồn.
- `drug_names`    — tên biệt dược / hoạt chất, phục vụ gợi ý khi người dùng gõ sai.

Lưu ý: chuẩn hoá tên thuốc KHÔNG nên dựa chính vào embedding. Khớp mờ theo ký tự
(rapidfuzz + bỏ dấu) chính xác và rẻ hơn nhiều cho tên riêng tiếng Việt.
Embedding chỉ là lớp gợi ý bổ sung. Xem domain/normalization.py.
"""

from collections.abc import Sequence


class Embedder:
    """Bọc provider embedding. Đổi provider chỉ sửa ở đây."""

    def __init__(self, model: str, dimensions: int, batch_size: int = 64) -> None:
        self.model = model
        self.dimensions = dimensions
        self.batch_size = batch_size

    def embed_documents(self, texts: Sequence[str]) -> list[list[float]]:
        """Embed nhiều đoạn, chia batch theo `batch_size`."""
        raise NotImplementedError

    def embed_query(self, text: str) -> list[float]:
        """Embed một câu truy vấn."""
        raise NotImplementedError
