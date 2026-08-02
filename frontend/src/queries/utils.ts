/**
 * Helper bóc envelope `{ error, message, data }` của backend.
 *
 * ⚠️ Envelope này CHƯA được backend xác nhận — xem ghi chú trong
 * `src/types/backend.d.ts`. Nếu FastAPI trả thẳng payload thì bỏ
 * `withApiTransform` khỏi các hook, đừng sửa cong queryFn.
 */

export const isApiSuccess = <T>(res: IApiResponse<T>) => res?.error === 0;

export const getApiErrorMessage = <T>(res: IApiResponse<T>) =>
  res?.message || "Đã có lỗi xảy ra";

export const transformApiResponse = <T>(res: IApiResponse<T>): T => {
  if (!isApiSuccess(res)) throw new Error(getApiErrorMessage(res));
  return res.data;
};

/** Bọc queryFn để hook nhận thẳng data đã bóc */
export const withApiTransform =
  <T>(fn: () => Promise<IApiResponse<T>>) =>
  async (): Promise<T> =>
    transformApiResponse(await fn());

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
