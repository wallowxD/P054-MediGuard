import { VINMEC_MILESTONES } from "./vinmec-about-content";

/**
 * "Những cột mốc quan trọng" — dòng thời gian dọc, năm mới nhất ở trên.
 *
 * ★ Đường kẻ dọc và chấm tròn là trang trí thuần CSS trên `<li>`, không phải phần tử
 *   riêng — nhờ vậy cấu trúc vẫn là danh sách lồng danh sách đúng ngữ nghĩa, trình
 *   đọc màn hình nghe được "2026, danh sách 4 mục" thay vì một mớ div.
 *
 * ★ Bản gốc thiếu mốc 2020; khoảng trống đó là thật. Đừng chèn năm cho liền mạch.
 */
export default function VinmecMilestones() {
  return (
    <section className="bg-[var(--vm-gray-bg)] py-12 lg:py-16">
      <div className="vinmec-container">
        <h2 className="vinmec-title text-[var(--vm-text)]">Những cột mốc quan trọng</h2>

        <ol className="mt-8">
          {VINMEC_MILESTONES.map((milestone) => (
            <li
              key={milestone.year}
              className="relative border-l-2 border-[var(--vm-border-soft)] pb-8 pl-8 last:border-transparent last:pb-0"
            >
              <span
                aria-hidden="true"
                className="absolute -left-[9px] top-1 h-4 w-4 rounded-full border-4 border-[var(--vm-gray-bg)] bg-[var(--vm-green)]"
              />
              <h3 className="mb-3 text-2xl font-semibold leading-none text-[var(--vm-title-blue)]">
                {milestone.year}
              </h3>
              <ul className="grid gap-2">
                {milestone.events.map((event) => (
                  <li
                    key={event}
                    className="relative pl-4 text-sm leading-relaxed text-[var(--vm-text)] before:absolute before:left-0 before:top-[9px] before:h-1.5 before:w-1.5 before:rounded-full before:bg-[var(--vm-text-faint)]"
                  >
                    {event}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
