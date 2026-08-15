"use client";

import { ArrowRight, BookOpen, Layers, PillBottle, ShieldAlert, Sparkles, Utensils } from "lucide-react";
import Button from "@/components/ui/Button";
import { LANDING_SECTIONS, ROUTES } from "@/constants/routes";
import Reveal from "./Reveal";

const FEATURES = [
  {
    Icon: PillBottle,
    title: "Tra cứu tương tác tổng hợp",
    description:
      "Đối chiếu thuốc–thuốc, thuốc–bệnh nền và thuốc–thực phẩm trong cùng một lượt tra cứu. Nhận cảnh báo tức thì kèm trích dẫn nguyên văn tờ HDSD.",
    cta: "Thử tra cứu ngay",
    href: ROUTES.INTERACTIONS_DRUG_DRUG,
    badge: "Lâm sàng",
    delay: "none" as const,
  },
  {
    Icon: BookOpen,
    title: "Dược thư thông tin thuốc",
    description:
      "Tra cứu danh mục thuốc bệnh viện theo bảng chữ cái A–Z hoặc tên biệt dược. Xem chi tiết chỉ định, liều dùng, chống chỉ định và tác dụng phụ chính thống.",
    cta: "Xem dược thư",
    href: ROUTES.DRUG_INFORMATION,
    badge: "Chính thức",
    delay: "short" as const,
  },
  {
    Icon: ShieldAlert,
    title: "Cảnh báo an toàn có nguồn",
    description:
      "Phân cấp mức độ nguy cơ rõ ràng (Chống chỉ định, Nghiêm trọng, Trung bình, Nhẹ) kèm đối chiếu exact key từ cơ sở dữ liệu chuyên môn.",
    cta: "Tìm hiểu an toàn",
    href: ROUTES.SIGNIN,
    badge: "Xác thực",
    delay: "medium" as const,
  },
];

export default function FeaturesSection() {
  return (
    <section
      id={LANDING_SECTIONS.FEATURES.slice(1)}
      className="py-16 sm:py-24 relative overflow-hidden"
      aria-label="Tính năng chính"
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <div className="mb-14 text-center max-w-2xl mx-auto space-y-2.5">
            <div className="inline-flex items-center gap-1.5 rounded-full liquid-glass-pill px-3 py-1 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Năng lực cốt lõi</span>
            </div>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
              Các công cụ hỗ trợ an toàn dùng thuốc
            </h2>
            <p className="text-sm text-foreground-secondary sm:text-base">
              Thiết kế tối giản, trực quan cho người bệnh và đầy đủ bằng chứng y khoa cho chuyên gia.
            </p>
          </div>
        </Reveal>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feat) => (
            <Reveal key={feat.title} delay={feat.delay}>
              <div className="group relative flex flex-col justify-between h-full rounded-3xl liquid-glass p-7 sm:p-8 transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl">
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                      <feat.Icon className="h-6 w-6" />
                    </div>
                    <span className="rounded-full liquid-glass-pill px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                      {feat.badge}
                    </span>
                  </div>

                  <h3 className="font-heading text-xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs sm:text-sm leading-relaxed text-foreground-secondary">
                    {feat.description}
                  </p>
                </div>

                <div className="mt-8 pt-5 border-t border-border/60">
                  <Button href={feat.href} variant="glass" size="sm" className="w-full justify-between">
                    <span>{feat.cta}</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
