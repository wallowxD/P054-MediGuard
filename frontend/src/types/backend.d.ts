export {};

declare global {
  /**
   * Envelope chung của backend.
   *
   * ⚠️ CHƯA XÁC NHẬN. FastAPI mặc định trả thẳng payload, không bọc envelope.
   * Khi backend chốt schema (`backend/src/medsafe/schemas/`), đối chiếu lại file
   * này và `src/queries/utils.ts` — nếu backend trả thẳng thì bỏ `withApiTransform`.
   */
  interface IApiResponse<T> {
    error: number;
    message: string;
    data: T;
  }

  interface IPaginationMetadata {
    page: number;
    size: number;
    total: number;
    totalPages: number;
  }

  interface IPaginatedRequest {
    page?: number;
    size?: number;
    keyword?: string;
  }
}
