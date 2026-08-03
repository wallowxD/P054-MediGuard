"""Chuyển text thành vector.

The `hdsd_excerpts` vector space contains verbatim leaflet chunks for scoped retrieval.
Drug-name normalization does not use embeddings; deterministic character matching is
safer for Vietnamese proper nouns. See domain/normalization.py.
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
