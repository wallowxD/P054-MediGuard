import { AlertTriangle, CheckCircle2, FileText, Quote } from "lucide-react";

/**
 * Thay cho ô "Placeholder minh hoạ AI Agent và đơn thuốc" trong wireframe.
 *
 * Dựng bằng markup thật thay vì ảnh: sắc nét ở mọi mật độ điểm ảnh, tự đổi theo
 * dark mode, không tốn thêm request. Nội dung minh hoạ đúng thứ sản phẩm làm —
 * một cảnh báo CÓ đoạn trích nguyên văn kèm nguồn.
 */
export default function HeroVisual() {
  return (
    <div className="relative">
      {/* Quầng sáng nền */}
      <div
        aria-hidden
        className="absolute -inset-6 -z-10 rounded-[2rem] bg-primary/10 blur-2xl"
      />

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-primary/5">
        {/* Thanh tiêu đề giả lập cửa sổ ứng dụng */}
        <div className="flex items-center gap-2 border-b border-border bg-background-elevated px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-severity-major/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-warning/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/60" />
          <span className="ml-2 text-xs text-foreground-muted">Kết quả tra cứu</span>
        </div>

        <div className="space-y-3 p-4 sm:p-5">
          {/* Danh sách thuốc đã nhận diện */}
          <div className="flex flex-wrap items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-foreground-muted" aria-hidden />
            {["Warfarin 5mg", "Aspirin 81mg", "Nước ép bưởi"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-border bg-surface px-2.5 py-1 text-xs text-foreground-secondary"
              >
                {item}
              </span>
            ))}
          </div>

          {/* Cảnh báo có nguồn */}
          <div className="rounded-xl border border-severity-major/30 bg-severity-major/5 p-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                <AlertTriangle
                  className="h-4 w-4 text-severity-major"
                  aria-hidden
                />
                Warfarin × Aspirin
              </span>
              <span className="rounded-full border border-severity-major px-2 py-0.5 text-[11px] font-medium text-severity-major">
                Nghiêm trọng
              </span>
            </div>

            <figure className="mt-3 rounded-lg border-l-2 border-severity-major/40 bg-background/60 px-3 py-2">
              <Quote className="h-3 w-3 text-foreground-muted" aria-hidden />
              <blockquote className="mt-1 text-xs italic leading-relaxed text-foreground-secondary">
                “Dùng đồng thời với các thuốc chống kết tập tiểu cầu làm tăng nguy cơ
                chảy máu…”
              </blockquote>
              <figcaption className="mt-1.5 text-[11px] text-foreground-muted">
                Tờ HDSD Warfarin — tr. 3
              </figcaption>
            </figure>
          </div>

          {/* Trạng thái human-in-the-loop */}
          <div className="flex items-center gap-2 rounded-lg bg-surface px-3 py-2 text-xs text-foreground-secondary">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
            Mọi cảnh báo đều kèm trích dẫn nguyên văn và nguồn đối chiếu
          </div>
        </div>
      </div>
    </div>
  );
}
