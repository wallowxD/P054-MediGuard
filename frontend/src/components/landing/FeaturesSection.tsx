import { BookOpen, PillBottle, ShieldAlert } from "lucide-react";
import { LANDING_SECTIONS } from "@/constants/routes";
import SectionHeading from "./SectionHeading";

const FEATURES = [
  {
    Icon: PillBottle,
    title: "Tra tương tác thuốc",
    description:
      "Tải hoặc chụp ảnh nhiều đơn thuốc, hệ thống OCR nhận diện và gộp danh sách thuốc để kiểm tra.",
  },
  {
    Icon: BookOpen,
    title: "Tra thông tin thuốc",
    description:
      "Tìm hướng dẫn sử dụng, liều dùng, chống chỉ định, tác dụng phụ và thông tin liên hệ liên quan.",
  },
  {
    Icon: ShieldAlert,
    title: "Cảnh báo an toàn",
    description:
      "Kết quả được diễn giải dễ hiểu và luôn nhắc người dùng không tự ý thay đổi hoặc ngưng thuốc.",
  },
];

export default function FeaturesSection() {
  return (
    <section
      id={LANDING_SECTIONS.FEATURES.slice(1)}
      className="scroll-mt-20 border-t border-border py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          title="Ba chức năng chính"
          subtitle="Thiết kế cho bệnh nhân, đồng thời hỗ trợ dược sĩ đối chiếu nguồn."
        />

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ Icon, title, description }) => (
            <article
              key={title}
              className="group rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5"
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <Icon className="h-6 w-6" aria-hidden />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-foreground">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
                {description}
              </p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
