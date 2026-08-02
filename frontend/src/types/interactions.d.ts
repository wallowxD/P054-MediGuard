export {};

declare global {
  /** Mức nghiêm trọng — xếp tất định ở backend `domain/severity.py`, FE không tự suy ra */
  type TSeverity = "contraindicated" | "major" | "moderate" | "minor" | "unknown";

  /** Trạng thái human-in-the-loop. `pending` VẪN hiển thị cho người dùng, không chặn luồng. */
  type TReviewStatus = "pending" | "approved" | "rejected";

  type TInteractionKind = "drug-drug" | "drug-food";

  interface IDrugItem {
    id: string;
    /** Tên biệt dược, ví dụ "Panadol Extra" */
    brandName: string;
    /** Hoạt chất + hàm lượng */
    ingredient: string;
    /** Link tờ HDSD gốc */
    leafletUrl?: string;
  }

  /**
   * ★ Đoạn trích minh chứng. Luật số 1 của dự án: KHÔNG có citation thì KHÔNG
   * được hiển thị cảnh báo. UI phải render `quote` nguyên văn, không tóm tắt lại.
   */
  interface ICitation {
    /** Nguyên văn từ tờ HDSD — không được sửa, không được rút gọn */
    quote: string;
    /** Nguồn: tên tài liệu / biệt dược */
    source: string;
    sourceUrl?: string;
    page?: number;
  }

  interface IInteractionItem {
    id: string;
    kind: TInteractionKind;
    severity: TSeverity;
    reviewStatus: TReviewStatus;
    /** Vế thứ nhất — luôn là thuốc */
    subject: string;
    /** Vế thứ hai — thuốc hoặc thực phẩm */
    object: string;
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
    /** Cặp/khoá tra không tìm thấy dữ liệu — hiển thị "chưa có dữ liệu", KHÔNG suy đoán */
    notFound: string[];
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

  interface IDrugSearchRequest {
    keyword: string;
    limit?: number;
  }

  interface IDrugSearchResponse {
    items: IDrugItem[];
  }
}
