import { ShieldAlert } from "lucide-react";
import { LANDING_SECTIONS } from "@/constants/routes";

/**
 * Khối cảnh báo trong wireframe. Đây không phải trang trí — nó là cam kết
 * "không kết luận lâm sàng" của sản phẩm, phải hiện rõ trước khi người dùng đăng ký.
 */
export default function SafetyNotice() {
  return (
    <section
      id={LANDING_SECTIONS.SAFETY.slice(1)}
      className="scroll-mt-20 border-t border-border py-14 sm:py-16"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex flex-col gap-4 rounded-2xl border-2 border-warning/40 bg-warning/5 p-6 sm:flex-row sm:items-center sm:gap-5 sm:p-7">
          <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
            <ShieldAlert className="h-6 w-6" aria-hidden />
          </span>
          <div>
            <p className="text-base font-semibold text-foreground">
              Cảnh báo tham khảo — không tự ý đổi hoặc ngưng thuốc, hãy hỏi bác sĩ/dược sĩ.
            </p>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground-secondary">
              Hệ thống chỉ hiển thị thông tin trích dẫn nguyên văn kèm nguồn để bạn đối
              chiếu. Kết quả không phải chẩn đoán, không đề xuất liều và không thay thế
              quyết định của nhân viên y tế.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
