"""Schemas I/O cho thuốc và danh mục tìm kiếm thuốc."""

from medsafe.schemas.base import CamelModel


class DrugCandidate(CamelModel):
    """Một ứng viên thuốc trong kết quả tìm kiếm danh mục."""

    drug_id: str
    brand_name: str
    ingredient: str
    confidence: float


class DrugSearchResponse(CamelModel):
    """Kết quả tìm kiếm thuốc trong danh mục (`GET /api/v1/drugs/search`)."""

    query: str
    candidates: list[DrugCandidate]
    requires_confirmation: bool


class DrugListItem(CamelModel):
    """Một dòng trong danh mục thuốc (`GET /api/v1/drugs`).

    Chỉ chứa dữ liệu định danh để render danh sách. Nội dung lâm sàng có trích dẫn nằm ở
    endpoint chi tiết — danh sách không hiển thị cảnh báo nên không đính kèm citation.
    """

    id: str
    brand_name: str
    ingredient: str
    dosage_form: str | None = None
    route: str | None = None
    # FE cần biết trước có tra được nguồn hay không để không dẫn người dùng vào trang
    # chi tiết rỗng. Không trả thẳng URL vì danh sách không hiển thị nội dung dẫn nguồn.
    has_leaflet: bool


class DrugLetterCount(CamelModel):
    """Số thuốc thuộc một nhóm chữ cái trên thanh A–Z."""

    letter: str
    count: int


class DrugLetterIndexResponse(CamelModel):
    """Chỉ mục chữ cái của danh mục (`GET /api/v1/drugs/letters`).

    Luôn trả đủ 27 nhóm A–Z + `other`, kể cả nhóm có `count = 0`, để FE disable đúng nút
    thay vì dẫn người dùng tới một trang rỗng.
    """

    letters: list[DrugLetterCount]
    total: int


class DrugDetailResponse(CamelModel):
    """Chi tiết một thuốc trong danh mục (`GET /api/v1/drugs/{drug_id}`).

    Toàn bộ trường `summary_*`, `therapeutic_effect` và `special_notes` là đoạn TRÍCH
    NGUYÊN VĂN từ tờ HDSD (xem `scripts/extract_v2_json.py`), không phải nội dung do model
    tự viết. Vì vậy endpoint trả nguyên chuỗi đã lưu và không diễn giải lại — mục nào
    nguồn không có thì là `None`, FE ẩn mục đó thay vì tự điền.

    `leaflet_url` là đường dẫn tài liệu gốc cho mọi nội dung phía trên; thiếu nó thì
    người dùng không truy vết được, nên FE phải nói rõ khi trường này rỗng.
    """

    id: str
    brand_name: str
    ingredient: str
    dosage_form: str | None = None
    route: str | None = None
    manufacturer: str | None = None
    leaflet_url: str | None = None

    pharmacological_class: str | None = None
    therapeutic_effect: str | None = None
    # `None` = nguồn không nói rõ kê đơn hay OTC. Khác hẳn `False` là "biết chắc không cần
    # đơn" — FE không được gộp hai trạng thái này thành một nhãn.
    is_prescription: bool | None = None

    summary_indications: str | None = None
    summary_contraindications: str | None = None
    summary_dosage: str | None = None
    summary_precautions: str | None = None
    summary_side_effects: str | None = None
    special_notes: str | None = None


class DrugListResponse(CamelModel):
    """Một trang của danh mục thuốc (`GET /api/v1/drugs`).

    Echo lại `letter`/`query` đã chuẩn hoá để FE đánh dấu đúng nút đang chọn trên thanh
    A–Z mà không phải tự suy lại từ URL.
    """

    items: list[DrugListItem]
    page: int
    page_size: int
    total: int
    total_pages: int
    letter: str | None = None
    query: str | None = None
