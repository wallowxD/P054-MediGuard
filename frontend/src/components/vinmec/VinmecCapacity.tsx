import { VINMEC_CAPACITY_STATS } from "./vinmec-about-content";

/**
 * "Năng lực Hệ thống" — dải xanh đặc với 10 con số.
 *
 * ★ Số hiển thị là CHUỖI lấy nguyên dạng bản gốc ("1.505", "8.8 triệu"), không phải
 *   number được format lại. Đừng đổi sang `Intl.NumberFormat`: dấu chấm ngăn nghìn
 *   kiểu Việt và chữ "triệu" viết thành lời sẽ bị chuẩn hoá mất.
 *
 * Dùng `<dl>` vì đây đúng là cặp giá trị–nhãn. `<dt>` là nhãn còn `<dd>` là giá trị,
 * nhưng thứ tự HIỂN THỊ ngược lại (số trên, nhãn dưới) nên đảo bằng `flex-col-reverse`
 * thay vì viết sai thứ tự thẻ.
 */
export default function VinmecCapacity() {
  return (
    <section className="bg-[var(--vm-blue)] py-12 text-white lg:py-16">
      <div className="vinmec-container">
        <h2 className="vinmec-title vinmec-title-on-blue">Năng lực Hệ thống</h2>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
          {VINMEC_CAPACITY_STATS.map((stat) => (
            <div key={stat.label} className="flex flex-col-reverse gap-1.5">
              <dt className="text-[13px] leading-snug text-white/85">{stat.label}</dt>
              <dd className="text-3xl font-semibold leading-none">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
