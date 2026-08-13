import { AlertTriangle } from "lucide-react";

/**
 * ★ ADR 0005: cảnh báo `pending` hiển thị ngay, KHÔNG chờ dược sĩ duyệt — nhưng UI
 * phải nói rõ đây chưa phải xác nhận chuyên môn.
 *
 * Một dòng nhãn nhỏ là không đủ: người đang lo lắng đọc lướt sẽ chỉ thấy mức nghiêm
 * trọng rồi tự ngừng thuốc. Khối này để người đọc quét thấy ngay ba ý: chưa được
 * xác nhận, đừng tự đổi thuốc, hỏi người có chuyên môn.
 *
 * Wording ở đây là hướng dẫn an toàn, không phải chỉ định điều trị: không nêu liều,
 * không đề xuất đổi thuốc, không kết luận tình trạng của người dùng.
 */
export default function PendingReviewNotice() {
  return (
    <div
      role="note"
      className="flex gap-2.5 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2.5"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
      <div className="space-y-1 text-sm">
        <p className="font-medium text-foreground">Chưa được dược sĩ xác nhận</p>
        <p className="text-foreground-secondary">
          Nội dung dưới đây trích từ tài liệu nguồn và đang chờ xác nhận chuyên môn. Không tự
          ý ngừng thuốc hoặc đổi thuốc dựa trên cảnh báo này — hãy hỏi bác sĩ hoặc dược sĩ
          đang theo dõi việc dùng thuốc của bạn.
        </p>
      </div>
    </div>
  );
}
