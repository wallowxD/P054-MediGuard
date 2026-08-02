/**
 * Giỏ thuốc người dùng đang gom trước khi bấm "Tra tương tác".
 * Đây là client state thuần — kết quả tra về thì để React Query giữ, KHÔNG copy
 * sang store (hai nguồn sự thật, lệch lúc nào không hay).
 */
export interface IDrugBasketState {
  items: IDrugItem[];
  /** Thực phẩm người dùng thêm tay để đối chiếu */
  foods: string[];
}
