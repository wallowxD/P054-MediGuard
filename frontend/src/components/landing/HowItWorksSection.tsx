import { LANDING_SECTIONS } from "@/constants/routes";
import SectionHeading from "./SectionHeading";

const STEPS = [
  {
    title: "Tải hoặc chụp ảnh",
    description:
      "Chọn một hoặc nhiều ảnh đơn thuốc. Hệ thống hỗ trợ gộp nhiều đơn trong cùng một lần kiểm tra.",
  },
  {
    title: "Xác nhận danh sách thuốc",
    description:
      "Kiểm tra các tên thuốc OCR nhận diện, sửa mục chưa khớp và thêm thuốc còn thiếu khi cần.",
  },
  {
    title: "Xem kết quả có nguồn",
    description:
      "Xem từng cặp “Có tương tác” hoặc “Không có tương tác”, giải thích dễ hiểu và nguồn PDF đối chiếu.",
  },
];

export default function HowItWorksSection() {
  return (
    <section
      id={LANDING_SECTIONS.HOW_IT_WORKS.slice(1)}
      className="scroll-mt-20 border-t border-border bg-background-elevated py-16 sm:py-20"
    >
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          title="Cách hoạt động"
          subtitle="Ba bước đơn giản từ ảnh đơn thuốc đến kết quả tham khảo."
        />

        <ol className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="relative rounded-2xl border border-border bg-card p-6"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border-2 border-primary text-sm font-bold text-primary">
                {i + 1}
              </span>
              <h3 className="mt-4 text-base font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-foreground-secondary">
                {step.description}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
