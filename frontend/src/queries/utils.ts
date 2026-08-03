/**
 * Chỗ đứng tạm cho những endpoint backend chưa build.
 *
 * Cố tình reject thay vì trả mock rỗng: mock âm thầm sẽ khiến UI trông như chạy
 * được, rồi vỡ lúc nối API thật. Reject làm lỗi nổi lên ngay ở tầng React Query.
 */
export const apiNotReady = <T>(endpoint: string, payload?: unknown): Promise<T> =>
  Promise.reject(
    new Error(
      `[API chưa sẵn sàng] ${endpoint}` +
        (payload === undefined ? "" : ` — payload: ${JSON.stringify(payload)}`)
    )
  );
