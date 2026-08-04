import Button from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import Reveal from "./Reveal";

/** Băng CTA cuối trang trước footer — pill bo tròn nền xanh nhạt, giống banner tham chiếu. */
export default function CtaBand() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20">
      <Reveal className="landing-cta-gradient mx-auto max-w-6xl rounded-3xl px-8 py-16 text-center sm:px-12 sm:py-20">
        <h2 className="font-heading text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Sẵn sàng kiểm tra tương tác thuốc của bạn?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-foreground-secondary">
          Miễn phí, có nguồn, hiển thị ngay — dược sĩ đối chiếu song song.
        </p>
        <div className="mt-9">
          <Button href={ROUTES.SIGNIN} variant="accent" size="lg">
            Bắt đầu kiểm tra an toàn
          </Button>
        </div>
      </Reveal>
    </section>
  );
}
