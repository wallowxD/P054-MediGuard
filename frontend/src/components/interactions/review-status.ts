/**
 * ★ ADR 0005: cảnh báo đã bị dược sĩ bác bỏ KHÔNG được trả về cho patient client.
 *
 * `IInteractionItem.reviewStatus` khai báo là `Exclude<TReviewStatus, "rejected">`, tức
 * ở mức type thì "rejected" không tồn tại. Nhưng type chỉ là lời hứa lúc compile: dữ
 * liệu thật đến từ network, một lỗi filter ở backend hoặc một bản ghi cũ vẫn có thể
 * mang "rejected" vào runtime. Nhận tham số kiểu rộng `TReviewStatus` để so sánh này
 * hợp lệ mà không phải cast ở từng chỗ gọi.
 *
 * Đây là chốt chặn thứ hai, không phải chốt chặn duy nhất — backend vẫn phải lọc.
 */
export const isRejectedForPatient = (status: TReviewStatus): boolean => status === "rejected";
