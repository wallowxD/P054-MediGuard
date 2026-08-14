import { VINMEC_CARE_VALUES } from "./vinmec-about-content";

/**
 * "Giá trị cốt lõi – C.A.R.E": bốn thẻ, mỗi thẻ mở đầu bằng chữ cái viết tắt phóng to.
 *
 * Chữ cái là trang trí lặp lại nội dung đã có trong `title` ("C" ↔ "Creativity"),
 * nên gắn `aria-hidden` — trình đọc màn hình đọc tiêu đề là đủ, không cần nghe
 * "C, Creativity – Sáng tạo".
 */
export default function VinmecCareValues() {
  return (
    <section className="bg-[var(--vm-gray-bg)] py-12 lg:py-16">
      <div className="vinmec-container">
        <h2 className="vinmec-title text-[var(--vm-text)]">Giá trị cốt lõi – C.A.R.E</h2>

        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {VINMEC_CARE_VALUES.map((value) => (
            <li
              key={value.letter}
              className="flex h-full flex-col rounded-md bg-white p-6 shadow-[0_2px_10px_rgba(0,0,0,0.05)]"
            >
              <span
                aria-hidden="true"
                className="mb-3 text-5xl font-semibold leading-none text-[var(--vm-green)]"
              >
                {value.letter}
              </span>
              <h3 className="mb-2.5 text-base font-semibold leading-snug text-[var(--vm-title-blue)]">
                {value.title}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--vm-text)]">{value.desc}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
