"use client";

import { ArrowRight, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import Reveal from "./Reveal";

export default function CtaBand() {
  return (
    <section className="py-14 sm:py-20" aria-label="Bắt đầu sử dụng">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl liquid-glass p-8 sm:p-14 text-center shadow-2xl">
            {/* Ambient lighting */}
            <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
            <div className="pointer-events-none absolute -right-20 -bottom-20 h-72 w-72 rounded-full bg-emerald-500/15 blur-3xl" />

            <div className="relative max-w-2xl mx-auto space-y-4">
              <div className="inline-flex items-center gap-2 rounded-full liquid-glass-pill px-3.5 py-1 text-xs font-semibold text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Trợ lý An toàn Thuốc AI Vinmec</span>
              </div>
              <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-4xl">
                Sẵn sàng kiểm tra an toàn cho đơn thuốc của bạn?
              </h2>
              <p className="text-sm text-foreground-secondary sm:text-base leading-relaxed">
                Tra cứu tức thì, có dẫn nguồn chính thống từ tờ hướng dẫn sử dụng gốc và bảo vệ an toàn cho cả gia đình.
              </p>
              <div className="pt-4 flex flex-wrap justify-center items-center gap-3">
                <Button href={ROUTES.SIGNIN} variant="solid" size="lg" className="shadow-lg hover:shadow-primary/25">
                  <span>Bắt đầu tra cứu ngay</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Button href={ROUTES.SIGNUP} variant="glass" size="lg">
                  <span>Tạo tài khoản miễn phí</span>
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
