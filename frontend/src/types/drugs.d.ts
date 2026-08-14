export {};

/**
 * Type của domain danh mục thuốc: `GET /api/v1/drugs`, `/drugs/letters`, `/drugs/search`
 * và `/drugs/{id}`.
 *
 * Tách khỏi `interactions.d.ts` vì danh mục thuốc đứng độc lập với luồng cảnh báo tương
 * tác — trang "Tra cứu thuốc" chạy được mà không cần bất kỳ endpoint interaction nào.
 * `ICitation` vẫn nằm ở `interactions.d.ts` vì nó là kiểu minh chứng dùng chung cho mọi
 * nội dung có dẫn nguồn, không riêng thuốc.
 */
declare global {
  /** Một thuốc đã được xác nhận từ danh mục — dùng ở giỏ thuốc và kết quả tra cứu */
  interface IDrugItem {
    id: string;
    /** Tên biệt dược, ví dụ "Panadol Extra" */
    brandName: string;
    /** Hoạt chất + hàm lượng */
    ingredient: string;
    /** Link tờ HDSD gốc */
    leafletUrl?: string;
  }

  // ── GET /api/v1/drugs/search ───────────────────────────────────────────────

  interface IDrugSearchRequest {
    q: string;
    limit?: number;
  }

  interface IDrugSearchResponse {
    query: string;
    candidates: IDrugCandidate[];
    /** `false` chỉ khi có ĐÚNG một ứng viên khớp tuyệt đối; xem `domain/normalization.py` */
    requiresConfirmation: boolean;
  }

  interface IDrugCandidate {
    drugId: string;
    brandName: string;
    ingredient: string;
    /**
     * 0–100. Backend xếp hạng theo bậc tất định trước rồi mới tới fuzzy:
     * 100 khớp tuyệt đối · 96 tiền tố biệt dược · 93 chuỗi con biệt dược ·
     * 90 chuỗi con hoạt chất · ≥88 fuzzy (lỗi chính tả).
     */
    confidence: number;
  }

  // ── GET /api/v1/drugs ──────────────────────────────────────────────────────

  /**
   * Một dòng hiển thị trong danh mục thuốc.
   *
   * Danh sách được nuôi bởi HAI endpoint khác nhau — `/drugs` khi duyệt theo chữ cái và
   * `/drugs/search` khi người dùng gõ tìm kiếm — nên các trường chỉ có ở một bên là
   * optional. `hasLeaflet` không xác định nghĩa là "không biết", khác với `false` là
   * "biết chắc không có tờ HDSD".
   */
  interface IDrugCatalogRow {
    id: string;
    brandName: string;
    ingredient: string;
    dosageForm?: string | null;
    route?: string | null;
    hasLeaflet?: boolean;
  }

  /** Một dòng trong danh mục (`GET /api/v1/drugs`) — KHÔNG chứa nội dung lâm sàng */
  interface IDrugListItem extends IDrugCatalogRow {
    /** Có tờ HDSD gốc hay không. Trang chi tiết mới là nơi hiển thị trích dẫn. */
    hasLeaflet: boolean;
  }

  interface IDrugListRequest {
    /** "A"–"Z" hoặc `NON_ALPHA_LETTER`; bỏ trống = không lọc */
    letter?: string;
    /** Lọc chuỗi con TẤT ĐỊNH — gõ sai chính tả sẽ ra rỗng, khác với `/drugs/search` */
    q?: string;
    page?: number;
    pageSize?: number;
  }

  interface IDrugListResponse {
    items: IDrugListItem[];
    page: number;
    pageSize: number;
    /** Tổng số dòng khớp bộ lọc, KHÔNG phải số dòng của trang hiện tại */
    total: number;
    totalPages: number;
    /** Echo lại bộ lọc đã áp dụng, đã chuẩn hoá ("A" viết hoa) */
    letter?: string | null;
    query?: string | null;
  }

  // ── GET /api/v1/drugs/letters ──────────────────────────────────────────────

  interface IDrugLetterCount {
    /** "A"–"Z" hoặc `NON_ALPHA_LETTER` */
    letter: string;
    count: number;
  }

  /** Chỉ mục A–Z (`GET /api/v1/drugs/letters`) — luôn đủ 27 nhóm, kể cả nhóm rỗng */
  interface IDrugLetterIndexResponse {
    letters: IDrugLetterCount[];
    total: number;
  }

  // ── GET /api/v1/drugs/{id} ─────────────────────────────────────────────────

  /**
   * Chi tiết một thuốc cho `/drug-information/[id]`.
   *
   * Mọi trường mô tả là đoạn TRÍCH NGUYÊN VĂN từ tờ HDSD, backend chỉ đọc lại chứ không
   * sinh nội dung. Trường nào `null` nghĩa là nguồn không có mục đó — UI phải ẩn hẳn mục,
   * không được thay bằng câu chữ tự viết (luật số 1 của dự án).
   *
   * `isPrescription` có ba trạng thái: `true` kê đơn, `false` không kê đơn,
   * `null`/`undefined` là nguồn không nói rõ — đừng gộp `null` vào `false`.
   */
  interface IDrugInformationDetail {
    id: string;
    brandName: string;
    ingredient: string;
    /**
     * Link tờ HDSD gốc. Khai lại thay vì `extends IDrugItem` vì backend trả `null` khi
     * thuốc chưa có tài liệu, còn `IDrugItem.leafletUrl` chỉ nhận `string | undefined`.
     */
    leafletUrl?: string | null;
    dosageForm?: string | null;
    route?: string | null;
    manufacturer?: string | null;
    pharmacologicalClass?: string | null;
    therapeuticEffect?: string | null;
    isPrescription?: boolean | null;
    summaryIndications?: string | null;
    summaryContraindications?: string | null;
    summaryDosage?: string | null;
    summaryPrecautions?: string | null;
    summarySideEffects?: string | null;
    specialNotes?: string | null;
  }
}
