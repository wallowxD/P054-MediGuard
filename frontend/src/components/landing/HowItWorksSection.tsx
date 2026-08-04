import { LANDING_SECTIONS } from "@/constants/routes";
import Reveal from "./Reveal";
import SectionHeading from "./SectionHeading";

const STEPS = [
  {
    title: "Nhập tên thuốc hoặc chụp đơn",
    description:
      "Gõ tên thuốc, hoặc chọn một hoặc nhiều ảnh đơn thuốc. Hệ thống hỗ trợ gộp nhiều đơn trong cùng một lần kiểm tra.",
  },
  {
    title: "Kiểm tra và xác nhận thuốc OCR nhận diện",
    description:
      "Kiểm tra các tên thuốc OCR nhận diện, sửa mục chưa khớp và thêm thuốc còn thiếu khi cần.",
  },
  {
    title: "Xem tương tác, mức độ nguy cơ và nguồn",
    description:
      "Xem từng cặp “Có tương tác” hoặc “Không có tương tác”, mức độ rõ ràng và nguồn PDF đối chiếu.",
  },
  {
    title: "Nhận hướng dẫn tiếp theo",
    description: "Theo dõi, hỏi dược sĩ, hoặc liên hệ bác sĩ sớm.",
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id={LANDING_SECTIONS.HOW_IT_WORKS.slice(1)}
      className="scroll-mt-20 border-t border-border py-20 sm:py-24"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <SectionHeading
            title="Cách hoạt động"
            subtitle="Bốn bước đơn giản từ tên thuốc hoặc ảnh đơn thuốc đến hướng dẫn tiếp theo."
          />
        </Reveal>

        <Reveal className="mt-14">
          <ol className="grid gap-0 border-y border-border sm:grid-cols-2 sm:divide-x sm:divide-border lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="relative px-0 py-8 sm:px-6 lg:px-8 lg:first:pl-0 lg:last:pr-0"
            >
              <span className="font-heading text-5xl font-semibold tracking-tight text-primary/40">
                0{i + 1}
              </span>
              <h3 className="font-heading mt-5 text-xl font-bold text-foreground">
                {step.title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-foreground-secondary">
                {step.description}
              </p>
            </li>
          ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
