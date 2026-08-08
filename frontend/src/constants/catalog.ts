/**
 * Hằng số của thanh chữ cái trong danh mục thuốc.
 *
 * Phải khớp với `backend/src/medsafe/domain/catalog.py`. Backend luôn trả đủ 27 nhóm nên
 * FE không tự dựng lại bảng chữ cái để render — chỉ dùng các hằng số này để so sánh.
 */

/**
 * Giá trị gửi lên cho nhóm tên không bắt đầu bằng chữ cái Latin (ví dụ "3B-Medi").
 *
 * ⚠️ KHÔNG được đổi thành "#". Trình duyệt cắt `?letter=#` thành fragment nên tham số
 * không bao giờ rời khỏi máy client, và request vẫn trả về 200 với toàn bộ danh mục —
 * lỗi im lặng hoàn toàn. Nhãn "#" chỉ dùng để HIỂN THỊ.
 */
export const NON_ALPHA_LETTER = "other";

/** Nhãn hiển thị của nhóm `other` trên thanh A–Z. */
export const NON_ALPHA_LABEL = "#";

/** Số dòng mỗi trang — khớp `catalog.page_size_default` trong `backend/config.yaml`. */
export const CATALOG_PAGE_SIZE = 40;
