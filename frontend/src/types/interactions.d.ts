export {};

/**
 * Type của luồng cảnh báo tương tác và lịch sử tra cứu.
 *
 * Type của danh mục thuốc (`IDrugItem`, `IDrugListResponse`, `IDrugCandidate`…) nằm ở
 * `drugs.d.ts`. Cả hai file đều khai báo global nên không cần import qua lại.
 */
declare global {
  /** Mức nghiêm trọng — xếp tất định ở backend `domain/severity.py`, FE không tự suy ra */
  type TSeverity = "contraindicated" | "major" | "moderate" | "minor" | "unknown";

  /** Trạng thái human-in-the-loop. `pending` VẪN hiển thị cho người dùng, không chặn luồng. */
  type TReviewStatus = "pending" | "approved" | "rejected";

  type TInteractionKind = "drug-drug" | "drug-food";

  /**
   * ★ Đoạn trích minh chứng. Luật số 1 của dự án: KHÔNG có citation thì KHÔNG
   * được hiển thị cảnh báo. UI phải render `quote` nguyên văn, không tóm tắt lại.
   */
  interface ICitation {
    /** Nguyên văn từ tờ HDSD — không được sửa, không được rút gọn */
    quote: string;
    /** Nguồn: tên tài liệu / biệt dược */
    source: string;
    sourceUrl: string;
    page?: number;
    section?: string;
    chunkId: string;
  }

  interface IInteractionItem {
    id: string;
    evidenceVersionId: string;
    kind: TInteractionKind;
    severity: TSeverity;
    reviewStatus: Exclude<TReviewStatus, "rejected">;
    /** Vế thứ nhất — luôn là thuốc */
    subject: string;
    /** Vế thứ hai — thuốc hoặc thực phẩm */
    object: string;
    pairKey?: string;
    mechanism?: string;
    consequence?: string;
    management?: string;
    /** Bắt buộc không rỗng — xem ICitation */
    citations: ICitation[];
    updatedAt?: string;
  }

  interface IInteractionCheckRequest {
    /** Danh sách thuốc người dùng nhập; backend tự sinh C(N,2) cặp cần tra */
    drugIds: string[];
    /** Thực phẩm cần đối chiếu (tuỳ chọn) */
    foods?: string[];
  }

  interface IInteractionCheckResponse {
    items: IInteractionItem[];
    /** Lookup không đủ dữ liệu — hiển thị "chưa có dữ liệu", KHÔNG suy đoán */
    unavailable: IUnavailableResult[];
  }

  type TUnavailableReason =
    | "missing-record"
    | "missing-citation"
    | "source-unavailable"
    | "below-threshold";

  interface IUnavailableResult {
    key: string;
    kind: TInteractionKind;
    subject: string;
    object: string;
    reason: TUnavailableReason;
  }

  interface IInteractionsGetAllRequest extends IPaginatedRequest {
    severity?: TSeverity;
    reviewStatus?: TReviewStatus;
    kind?: TInteractionKind;
  }

  interface IInteractionsGetAllResponse {
    items: IInteractionItem[];
    metadata: IPaginationMetadata;
  }

  /** Một dòng trong `/history` — tóm tắt một lượt tra cứu đã thực hiện */
  interface IInteractionCheckSummaryItem {
    id: string;
    kind: TInteractionKind;
    drugNames: string[];
    foodNames?: string[];
    checkedAt: string;
    resultCount: number;
    unavailableCount: number;
  }

  /** Toàn bộ kết quả của một lượt tra cứu — `/interaction-checks/[id]` */
  interface IInteractionCheckDetail {
    id: string;
    kind: TInteractionKind;
    drugs: IDrugItem[];
    foods: string[];
    checkedAt: string;
    items: IInteractionItem[];
    unavailable: IUnavailableResult[];
  }
}
