"use client";

import {
  ArrowRight,
  CheckCircle2,
  Database,
  Sparkles,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { LANDING_SECTIONS, ROUTES } from "@/constants/routes";
import InteractivePillCanvas from "./InteractivePillCanvas";

export default function HeroSection() {
  return (
    <section
      id={LANDING_SECTIONS.HOME.slice(1)}
      className="relative overflow-hidden pt-8 pb-16 sm:pt-14 sm:pb-24"
      aria-label="Giới thiệu Trợ lý An toàn Thuốc Vinmec"
    >
      {/*
        ★ KHÔNG đặt orb `absolute … blur-3xl` vào section này.

        Section có `overflow-hidden`, nên `blur` bị cắt phẳng đúng tại mép section —
        tạo một đường kẻ ngang sắc lẹm ngay dưới header và một mảng màu lệch hẳn so
        với vùng phía trên. Blur chỉ toả mượt theo phương không bị cắt, nên hiện
        tượng nhìn như "hai khoảng màu" chứ không như lỗi kỹ thuật, rất dễ bỏ sót.

        Ánh sáng nền của toàn bộ trang công khai do `.landing-theme::before` trong
        globals.css đảm nhiệm: nó `position: fixed` ở cấp trang nên trải liên tục qua
        header và mọi section, không mép nào cắt được.
      */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Text Zone with Apple-Style Fade-Up Entrance */}
          <div className="lg:col-span-6 space-y-6">
            <div className="animate-fade-up inline-flex items-center gap-2 rounded-full liquid-glass-pill px-3.5 py-1.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI An toàn Thuốc Chuẩn Y Khoa</span>
            </div>

            <h1 className="animate-fade-up delay-100 font-heading text-3xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl lg:leading-[1.12]">
              Hiểu rõ hơn về thuốc <br />
              {/* Bậc màu tối đi kèm — xem ghi chú cùng gradient này trong VinmecHero. */}
              <span className="bg-gradient-to-r from-[#0066cc] via-[#0284c7] to-[#10b981] bg-clip-text text-transparent dark:from-[#58b6ff] dark:via-[#7dd3fc] dark:to-[#34d399]">
                bạn đang sử dụng
              </span>
            </h1>

            <p className="animate-fade-up delay-200 max-w-xl text-base leading-relaxed text-foreground-secondary sm:text-lg">
              Tra cứu tương tác thuốc–thuốc, thuốc–bệnh nền và thuốc–thực phẩm theo thời gian thực.
              Mọi cảnh báo đều có trích dẫn nguyên văn từ tờ hướng dẫn sử dụng gốc.
            </p>

            <div className="animate-fade-up delay-300 flex flex-wrap items-center gap-3 pt-2">
              <Button href={ROUTES.SIGNIN} variant="solid" size="lg" className="shadow-lg hover:shadow-primary/25">
                <span>Tra cứu thuốc ngay</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button href={ROUTES.SIGNUP} variant="glass" size="lg">
                <span>Đăng ký tài khoản</span>
              </Button>
            </div>

            <div className="animate-fade-up delay-400 flex items-center gap-4 text-xs text-foreground-muted pt-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>100% Dẫn nguồn HDSD</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Database className="h-4 w-4 text-primary" />
                <span>Đối chiếu exact key chuẩn</span>
              </div>
            </div>
          </div>

          {/* Right 3D Interactive WebGL Pill - Pure & Large Display without enclosing cards */}
          <div className="lg:col-span-6 relative flex items-center justify-center">
            <div className="relative w-full h-[440px] sm:h-[540px] lg:h-[620px] flex items-center justify-center">
              <InteractivePillCanvas />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
