"""Vector-store boundary for Qdrant Cloud.

Metadata của mỗi vector BẮT BUỘC đủ để dựng lại đường về nguồn: drug_id, source_url,
page, section. Vector nào không truy được nguồn thì không được phép nằm trong
collection — vì đoạn trích lấy ra từ nó sẽ không hiển thị được nguồn cho người dùng.
"""

from dataclasses import dataclass
from typing import Any, Protocol


@dataclass(frozen=True)
class SearchHit:
    """Một kết quả tìm kiếm kèm điểm và metadata nguồn."""

    text: str
    score: float
    metadata: dict[str, Any]


class VectorStore(Protocol):
    """Minimal interface that keeps retrieval independent from the Qdrant SDK."""

    def upsert(
        self,
        collection: str,
        ids: list[str],
        texts: list[str],
        embeddings: list[list[float]],
        metadatas: list[dict[str, Any]],
    ) -> None: ...

    def query(
        self,
        collection: str,
        embedding: list[float],
        top_k: int,
        where: dict[str, Any] | None = None,
    ) -> list[SearchHit]: ...

    def delete_by_drug(self, collection: str, drug_id: str) -> None: ...


class QdrantVectorStore:
    """Qdrant Cloud adapter; implementation is delivered by the active feature tasks."""

    def __init__(self, url: str, api_key: str) -> None:
        self.url = url
        self.api_key = api_key

    def upsert(
        self,
        collection: str,
        ids: list[str],
        texts: list[str],
        embeddings: list[list[float]],
        metadatas: list[dict[str, Any]],
    ) -> None:
        raise NotImplementedError

    def query(
        self,
        collection: str,
        embedding: list[float],
        top_k: int,
        where: dict[str, Any] | None = None,
    ) -> list[SearchHit]:
        raise NotImplementedError

    def delete_by_drug(self, collection: str, drug_id: str) -> None:
        """Xoá toàn bộ chunk của một thuốc — dùng khi trích xuất lại tờ HDSD."""
        raise NotImplementedError
