import { Construction } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";

interface FeatureUnavailableProps {
  /** Tính năng nào chưa dùng được — nêu đúng tên màn hình người dùng vừa mở */
  title: string;
  /** Một tới hai câu nói rõ hiện tại làm được gì và chưa làm được gì */
  description: string;
  /** Những mảnh còn thiếu, viết theo ngôn ngữ người dùng chứ không phải tên endpoint */
  missing: string[];
}

/**
 * ★ Màn "chưa khả dụng" dùng chung cho các tính năng đã có UI nhưng chưa có backend.
 *
 * Thà nói thẳng là chưa xong còn hơn dựng một form tra cứu đủ ô nhập nhưng nút tra
 * cứu vĩnh viễn disabled: với sản phẩm cảnh báo an toàn thuốc, người dùng bấm mãi
 * không ra kết quả rất dễ kết luận nhầm rằng "không có tương tác nào".
 *
 * Component này KHÔNG chứa control giả — mọi thứ bấm được ở đây đều dẫn tới một
 * trang thật sự hoạt động.
 */
export default function FeatureUnavailable({
  title,
  description,
  missing,
}: FeatureUnavailableProps) {
  return (
    <section
      aria-labelledby="feature-unavailable-title"
      className="space-y-5 rounded-xl border border-border bg-card p-5 sm:p-6"
    >
      <div className="flex gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-surface text-warning">
          <Construction className="h-5 w-5" aria-hidden />
        </span>
        <div className="space-y-1.5">
          <h2 id="feature-unavailable-title" className="text-base font-semibold text-foreground">
            {title}
          </h2>
          <p className="text-sm leading-relaxed text-foreground-secondary">{description}</p>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-foreground">Đang còn thiếu</h3>
        <ul className="space-y-1.5 text-sm text-foreground-secondary">
          {missing.map((item) => (
            <li key={item} className="flex gap-2">
              <span aria-hidden className="select-none text-foreground-muted">
                •
              </span>
              {item}
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-wrap gap-3 border-t border-border pt-4 text-sm">
        <Link
          href={ROUTES.DRUG_INFORMATION}
          className="inline-flex min-h-11 items-center rounded-lg border border-border px-4 font-medium text-foreground transition-colors hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Tra cứu thông tin thuốc
        </Link>
        <Link
          href={ROUTES.DASHBOARD}
          className="inline-flex min-h-11 items-center rounded-lg px-4 font-medium text-foreground-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Về trang chủ
        </Link>
      </div>
    </section>
  );
}
