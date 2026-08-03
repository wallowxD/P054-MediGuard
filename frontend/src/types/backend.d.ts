export {};

declare global {
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
