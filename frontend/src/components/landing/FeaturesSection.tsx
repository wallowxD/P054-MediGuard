import Image from "next/image";
import { BookOpen, PillBottle, ShieldAlert } from "lucide-react";
import Button from "@/components/ui/Button";
import { LANDING_SECTIONS, ROUTES } from "@/constants/routes";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

const PRIMARY_FEATURE = {
  Icon: PillBottle,
  image: "/images/landing/drug-interaction.jpg",
  imageAlt: "Minh họa kiểm tra tương tác giữa hai loại thuốc",
  title: "Tra tương tác thuốc",
  description:
    "Nhập tên thuốc hoặc tải ảnh đơn thuốc → nhận danh sách các cặp thuốc có tương tác, kèm nguồn trích dẫn để đối chiếu.",
  cta: "Kiểm tra tương tác",
  href: ROUTES.INTERACTIONS,
};

const SECONDARY_FEATURES = [
  {
    Icon: BookOpen,
    image: "/images/landing/medication-leaflet.jpg",
    imageAlt: "Minh họa đọc và đối chiếu tờ hướng dẫn sử dụng thuốc",
    title: "Tra thông tin thuốc",
    description:
      "Nhập tên thuốc → xem hướng dẫn sử dụng, liều dùng, chống chỉ định và tác dụng phụ theo tờ HDSD.",
    cta: "Tra thông tin thuốc",
    href: ROUTES.SIGNIN,
  },
  {
    Icon: ShieldAlert,
    image: "/images/landing/safety-warning.jpg",
    imageAlt: "Minh họa cảnh báo an toàn khi sử dụng thuốc",
    title: "Cảnh báo an toàn",
    description:
      "Xem kết quả tra cứu → nhận cảnh báo rõ ràng, kèm nguồn trích dẫn và hướng dẫn nên làm gì tiếp theo.",
    cta: "Tìm hiểu cảnh báo",
    href: ROUTES.SIGNIN,
  },
];

export default function FeaturesSection() {
  return (
    <section
      id={LANDING_SECTIONS.FEATURES.slice(1)}
      className="scroll-mt-20 border-t border-border bg-background-elevated py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <SectionHeading
            title="Ba chức năng chính"
            subtitle="Thiết kế cho bệnh nhân, đồng thời hỗ trợ dược sĩ đối chiếu nguồn."
          />
        </Reveal>

        <div className="mt-14 space-y-8">
          <Reveal>
            <article className="landing-feature-card group flex flex-col overflow-hidden rounded-2xl border border-border bg-card md:flex-row">
              <div className="relative aspect-[16/9] overflow-hidden bg-hero-tint-soft md:aspect-auto md:w-2/5">
                <Image
                  src={PRIMARY_FEATURE.image}
                  alt={PRIMARY_FEATURE.imageAlt}
                  fill
                  sizes="(min-width: 768px) 40vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.025]"
                />
              </div>
              <div className="flex flex-1 flex-col justify-center p-7 sm:p-9">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-hero-tint text-primary">
                  <PRIMARY_FEATURE.Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
                </span>
                <h3 className="font-heading mt-5 text-2xl font-semibold text-foreground">
                  {PRIMARY_FEATURE.title}
                </h3>
                <p className="mt-3 max-w-xl text-base leading-relaxed text-foreground-secondary">
                  {PRIMARY_FEATURE.description}
                </p>
                <div className="mt-6">
                  <Button href={PRIMARY_FEATURE.href} variant="solid">
                    {PRIMARY_FEATURE.cta}
                  </Button>
                </div>
              </div>
            </article>
          </Reveal>

          <div className="grid gap-8 sm:grid-cols-2">
            {SECONDARY_FEATURES.map(({ Icon, image, imageAlt, title, description, cta, href }, index) => (
              <Reveal key={title} delay={index === 0 ? "short" : "medium"}>
                <article className="landing-feature-card group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-[box-shadow,transform] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] hover:-translate-y-1.5">
                  <div className="relative aspect-[16/10] overflow-hidden bg-hero-tint-soft">
                    <Image
                      src={image}
                      alt={imageAlt}
                      fill
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-[1.025]"
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-7 sm:p-8">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-hero-tint text-primary">
                      <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
                    </span>
                    <h3 className="font-heading mt-5 text-2xl font-semibold text-foreground">{title}</h3>
                    <p className="mt-3 text-base leading-relaxed text-foreground-secondary">
                      {description}
                    </p>
                    <div className="mt-6">
                      <Button href={href} variant="solid">
                        {cta}
                      </Button>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
