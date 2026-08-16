import {
  Activity,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Database,
  FileCheck2,
  Pill,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { LANDING_SECTIONS } from "@/constants/routes";

const WORKFLOW_STEPS = [
  {
    step: "01",
    badge: "Bước 1",
    icon: Camera,
    title: "Nhập thuốc hoặc Quét ảnh đơn",
    description:
      "Tìm kiếm trong danh mục chuẩn của bệnh viện hoặc tải ảnh đơn thuốc để AI tự động nhận diện biệt dược và hoạt chất.",
    preview: (
      <div className="space-y-2 rounded-2xl bg-surface/60 p-3 border border-border/50">
        <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
          <span className="flex items-center gap-1.5 text-primary">
            <Pill className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Metformin 500mg</span>
          </span>
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
        </div>
        <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
          <span className="flex items-center gap-1.5 text-primary">
            <Pill className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">Atorvastatin 20mg</span>
          </span>
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
        </div>
      </div>
    ),
  },
  {
    step: "02",
    badge: "Bước 2",
    icon: Activity,
    title: "Khai báo bệnh nền & thể trạng",
    description:
      "Tự khai các điều kiện lâm sàng đặc biệt như mang thai, cho con bú hoặc suy giảm chức năng gan thận để đối chiếu an toàn.",
    preview: (
      <div className="space-y-2 rounded-2xl bg-surface/60 p-3 border border-border/50">
        <div className="flex items-center justify-between rounded-xl bg-primary/10 px-2.5 py-1 text-[11px] font-semibold text-primary">
          <span className="truncate">Thai kỳ (Mang thai)</span>
          <span className="h-2 w-2 shrink-0 rounded-full bg-primary animate-pulse" />
        </div>
        <div className="flex items-center justify-between rounded-xl bg-surface px-2.5 py-1 text-[11px] font-medium text-foreground-secondary">
          <span className="truncate">Suy giảm chức năng thận</span>
          <span className="text-[10px] text-foreground-muted shrink-0">Đã chọn</span>
        </div>
      </div>
    ),
  },
  {
    step: "03",
    badge: "Bước 3",
    icon: Database,
    title: "AI đối chiếu Exact-Key",
    description:
      "Hệ thống kiểm tra chéo các cặp thuốc và bệnh nền theo cơ sở dữ liệu đã chuẩn hóa, đảm bảo độ chính xác tuyệt đối không bịa đặt.",
    preview: (
      <div className="space-y-2 rounded-2xl bg-surface/60 p-3 border border-border/50">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-foreground-muted text-[10px]">Cơ chế đối chiếu:</span>
          <span className="font-bold text-sky-600 dark:text-sky-400 text-[10px]">Exact Matching</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-surface overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-primary via-sky-400 to-emerald-400" />
        </div>
        <p className="text-[10px] text-foreground-muted truncate">Metformin + Thuốc cản quang</p>
      </div>
    ),
  },
  {
    step: "04",
    badge: "Bước 4",
    icon: ShieldCheck,
    title: "Cảnh báo & Dẫn nguồn HDSD",
    description:
      "Kết quả hiển thị phân cấp mức độ nguy cơ rõ ràng, kèm trích dẫn nguyên văn từng đoạn từ tờ HDSD gốc được dược sĩ kiểm duyệt.",
    preview: (
      <div className="space-y-1.5 rounded-2xl bg-surface/60 p-3 border-l-4 border-l-amber-500 border border-border/50">
        <div className="flex items-center justify-between text-[11px]">
          <span className="font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Nghiêm trọng
          </span>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-0.5">
            <FileCheck2 className="h-3 w-3" />
            Đã duyệt
          </span>
        </div>
        <p className="text-[10px] italic text-foreground-secondary line-clamp-2">
          “Tạm ngừng Metformin trước khi chụp cản quang...”
        </p>
      </div>
    ),
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id={LANDING_SECTIONS.HOW_IT_WORKS.slice(1)}
      className="py-16 sm:py-24 relative overflow-hidden"
      aria-label="Quy trình tra cứu an toàn thuốc"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="mb-14 text-center max-w-2xl mx-auto space-y-2.5">
          <div className="inline-flex items-center gap-1.5 rounded-full liquid-glass-pill px-3 py-1 text-xs font-semibold text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Trải nghiệm trực quan</span>
          </div>
          <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
            Quy trình tra cứu thông minh
          </h2>
          <p className="text-sm text-foreground-secondary sm:text-base">
            Quy trình 4 bước được thiết kế tinh gọn, minh bạch và tin cậy theo chuẩn an toàn y tế.
          </p>
        </div>

        {/* 4-Step Connected Card Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {WORKFLOW_STEPS.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.step}
                className="group relative flex flex-col justify-between rounded-3xl liquid-glass p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-primary/40"
              >
                {/* Top Badge & Step Icon */}
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110 shadow-xs">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="font-heading text-xs font-bold px-2.5 py-1 rounded-full bg-surface text-foreground-secondary border border-border/50">
                      {step.badge}
                    </span>
                  </div>

                  <h3 className="font-heading text-base font-bold text-foreground mb-2 leading-snug">
                    {step.title}
                  </h3>
                  <p className="text-xs leading-relaxed text-foreground-secondary mb-6">
                    {step.description}
                  </p>
                </div>

                {/* Bottom Micro-UI Visual Preview */}
                <div className="mt-auto pt-2">
                  {step.preview}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
