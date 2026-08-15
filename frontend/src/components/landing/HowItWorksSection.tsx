"use client";

import {
  Activity,
  AlertTriangle,
  Camera,
  CheckCircle2,
  Database,
  FileCheck2,
  FileText,
  Pill,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { LANDING_SECTIONS } from "@/constants/routes";

const STORY_STEPS = [
  {
    id: 0,
    number: "01",
    icon: Search,
    title: "Nhập thuốc hoặc Quét ảnh đơn",
    description:
      "Tìm kiếm thuốc trong danh mục chuẩn của bệnh viện hoặc tải ảnh đơn thuốc để AI tự động nhận diện biệt dược và hoạt chất.",
    badge: "Bước 1",
  },
  {
    id: 1,
    number: "02",
    icon: FileText,
    title: "Chọn tình trạng bệnh nền",
    description:
      "Tự khai các điều kiện lâm sàng đặc biệt như mang thai, cho con bú, hoặc chọn bệnh nền từ danh mục ICD đối chiếu.",
    badge: "Bước 2",
  },
  {
    id: 2,
    number: "03",
    icon: Database,
    title: "AI đối chiếu Exact-Key",
    description:
      "Hệ thống kiểm tra chéo các cặp thuốc và bệnh nền theo cơ sở dữ liệu đã chuẩn hóa, đảm bảo độ chính xác tuyệt đối không bịa đặt.",
    badge: "Bước 3",
  },
  {
    id: 3,
    number: "04",
    icon: ShieldCheck,
    title: "Nhận cảnh báo & Trích dẫn HDSD",
    description:
      "Kết quả hiển thị phân cấp mức độ nguy cơ rõ ràng, kèm trích dẫn nguyên văn từng đoạn từ tờ hướng dẫn sử dụng gốc của nhà sản xuất.",
    badge: "Bước 4",
  },
];

export default function HowItWorksSection() {
  const [activeStep, setActiveStep] = useState(0);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      const viewportCenter = window.innerHeight * 0.45;
      stepRefs.current.forEach((el, index) => {
        if (!el) return;
        const rect = el.getBoundingClientRect();
        if (rect.top <= viewportCenter && rect.bottom >= viewportCenter) {
          setActiveStep(index);
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section
      id={LANDING_SECTIONS.HOW_IT_WORKS.slice(1)}
      className="py-16 sm:py-28 relative overflow-hidden"
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
            Quy trình 4 bước được thiết kế tinh gọn, mang lại kết quả chính xác và tin cậy nhất.
          </p>
        </div>

        {/* Sticky Storytelling Layout */}
        <div className="grid gap-10 lg:grid-cols-12 lg:items-start">
          {/* Left Column: Scrollable Steps List */}
          <div className="lg:col-span-6 space-y-8">
            {STORY_STEPS.map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <div
                  key={step.id}
                  ref={(el) => {
                    stepRefs.current[idx] = el;
                  }}
                  onClick={() => setActiveStep(idx)}
                  className={`cursor-pointer rounded-3xl p-6 sm:p-8 transition-all duration-500 ${
                    isActive
                      ? "liquid-glass border-primary/40 shadow-xl scale-[1.02] ring-1 ring-primary/20"
                      : "liquid-glass-subtle opacity-60 hover:opacity-90"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-xs font-bold transition-all ${
                        isActive
                          ? "bg-primary text-white shadow-md shadow-primary/30"
                          : "bg-surface text-foreground-secondary"
                      }`}
                    >
                      {step.number}
                    </span>

                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center justify-between">
                        <h3
                          className={`font-heading text-lg font-bold transition-colors ${
                            isActive ? "text-foreground" : "text-foreground-secondary"
                          }`}
                        >
                          {step.title}
                        </h3>
                        <span
                          className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                            isActive
                              ? "bg-primary/10 text-primary"
                              : "text-foreground-muted"
                          }`}
                        >
                          {step.badge}
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm leading-relaxed text-foreground-secondary">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Sticky Interactive Simulator Viewport */}
          <div className="lg:col-span-6 lg:sticky lg:top-24">
            <div className="relative overflow-hidden rounded-3xl liquid-glass p-6 sm:p-8 shadow-2xl min-h-[420px] flex flex-col justify-between">
              {/* Dynamic Live Step Previews with Soft Fade Transitions */}
              <div className="relative w-full flex-1 flex flex-col justify-center">
                {activeStep === 0 && (
                  <div className="animate-soft-pop space-y-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <span className="flex items-center gap-2 text-xs font-bold text-primary">
                        <Camera className="h-4 w-4" />
                        <span>OCR Nhận diện đơn thuốc</span>
                      </span>
                      <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                        Đã nhận diện 2 thuốc
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between rounded-2xl liquid-glass-subtle p-3">
                        <div className="flex items-center gap-2.5">
                          <Pill className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-xs font-bold text-foreground">Metformin 500mg</p>
                            <p className="text-[10px] text-foreground-muted">Hoạt chất: Metformin HCl</p>
                          </div>
                        </div>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      </div>

                      <div className="flex items-center justify-between rounded-2xl liquid-glass-subtle p-3">
                        <div className="flex items-center gap-2.5">
                          <Pill className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-xs font-bold text-foreground">Atorvastatin 20mg</p>
                            <p className="text-[10px] text-foreground-muted">Hoạt chất: Atorvastatin Calcium</p>
                          </div>
                        </div>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === 1 && (
                  <div className="animate-soft-pop space-y-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <span className="flex items-center gap-2 text-xs font-bold text-primary">
                        <Activity className="h-4 w-4" />
                        <span>Hồ sơ lâm sàng tự khai</span>
                      </span>
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                        Tình trạng đặc biệt
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between rounded-2xl liquid-glass-subtle p-3 border-l-4 border-l-primary">
                        <div>
                          <p className="text-xs font-bold text-foreground">Phụ nữ mang thai (Thai kỳ)</p>
                          <p className="text-[10px] text-foreground-muted">Áp dụng kiểm tra chống chỉ định thai kỳ</p>
                        </div>
                        <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse" />
                      </div>

                      <div className="flex items-center justify-between rounded-2xl liquid-glass-subtle p-3">
                        <div>
                          <p className="text-xs font-bold text-foreground">Suy giảm chức năng thận</p>
                          <p className="text-[10px] text-foreground-muted">Theo dõi ngưỡng thanh thải creatinin</p>
                        </div>
                        <span className="text-[10px] font-semibold text-foreground-muted">Đã chọn</span>
                      </div>
                    </div>
                  </div>
                )}

                {activeStep === 2 && (
                  <div className="animate-soft-pop space-y-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <span className="flex items-center gap-2 text-xs font-bold text-primary">
                        <Database className="h-4 w-4" />
                        <span>Đối chiếu cơ sở dữ liệu lâm sàng</span>
                      </span>
                      <span className="rounded-full bg-sky-500/15 px-2.5 py-0.5 text-[10px] font-bold text-sky-600 dark:text-sky-400">
                        Exact Key Matching
                      </span>
                    </div>

                    <div className="rounded-2xl liquid-glass-subtle p-4 space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                        <span>Cặp thuốc đối chiếu:</span>
                        <span className="text-primary font-bold">Metformin + Thuốc cản quang</span>
                      </div>
                      <div className="h-1.5 w-full rounded-full bg-surface overflow-hidden">
                        <div className="h-full w-full bg-gradient-to-r from-primary to-emerald-400 animate-pulse" />
                      </div>
                      <p className="text-[11px] text-foreground-secondary leading-relaxed">
                        Hệ thống tự động tra cứu chính xác bảng quan hệ tương tác đã qua thẩm định của hội đồng dược sĩ.
                      </p>
                    </div>
                  </div>
                )}

                {activeStep === 3 && (
                  <div className="animate-soft-pop space-y-4">
                    <div className="flex items-center justify-between border-b border-border/60 pb-3">
                      <span className="flex items-center gap-2 text-xs font-bold text-amber-500">
                        <AlertTriangle className="h-4 w-4" />
                        <span>Báo cáo cảnh báo có dẫn nguồn</span>
                      </span>
                      <span className="rounded-full bg-amber-500/15 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">
                        Mức Nghiêm trọng
                      </span>
                    </div>

                    <div className="rounded-2xl liquid-glass-subtle p-4 border-l-4 border-l-amber-500 space-y-2">
                      <p className="text-xs font-bold text-foreground">
                        Nguy cơ nhiễm toan acid lactic
                      </p>
                      <blockquote className="text-[11px] italic text-foreground-secondary border-l-2 border-primary/40 pl-2.5">
                        “Cần tạm ngừng sử dụng Metformin trước hoặc tại thời điểm thực hiện xét nghiệm chẩn đoán hình ảnh có dùng thuốc cản quang chứa iod...”
                      </blockquote>
                      <div className="pt-2 flex items-center justify-between text-[10px] text-foreground-muted border-t border-border/40">
                        <span className="flex items-center gap-1 font-semibold text-primary">
                          <FileCheck2 className="h-3.5 w-3.5" />
                          Trích tờ HDSD Metformin 500mg
                        </span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          Dược sĩ đã duyệt
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Step Indicator Dots */}
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-border/60 text-xs">
                <span className="text-foreground-muted text-[11px]">
                  Bước {activeStep + 1} / {STORY_STEPS.length}
                </span>
                <div className="flex items-center gap-1.5">
                  {STORY_STEPS.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveStep(i)}
                      aria-label={`Chuyển đến bước ${i + 1}`}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        activeStep === i
                          ? "w-6 bg-primary"
                          : "w-2 bg-border/80 hover:bg-primary/40"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
