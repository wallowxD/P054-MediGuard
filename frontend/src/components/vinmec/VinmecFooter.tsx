import Image from "next/image";
import Link from "next/link";
import { DEAD_LINK, VINMEC_COPYRIGHT, VINMEC_FOOTER_COLUMNS } from "./vinmec-content";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vm-menu-blue)] focus-visible:ring-offset-2";

/**
 * Footer Vinmec: 6 cột liên kết + dải bản quyền màu xám ở đáy.
 *
 * ★ Tự mang class `vinmec-theme` như VinmecHeader — nó được dùng ở cả `/vinmec`
 *   lẫn màn tính năng `/`, không thể trông chờ trang cha bọc sẵn biến `--vm-*`.
 *
 * ★ `medicalDisclaimer`: bật ở màn tính năng. Footer cũ của màn đó mang hai câu
 *   miễn trừ y khoa; thay footer mà bỏ luôn chúng là làm hụt phần an toàn bắt buộc
 *   của sản phẩm (xem nguyên tắc "không kết luận lâm sàng" trong AGENTS.md), nên
 *   chúng được mang sang đây chứ không biến mất.
 */
export default function VinmecFooter({
  medicalDisclaimer = false,
}: {
  medicalDisclaimer?: boolean;
}) {
  return (
    <footer className="vinmec-theme bg-white">
      {/* SÁU cột, không phải năm: hai cột link + QR + shop + mạng xã hội + cột
          badge bên phải. Để `lg:grid-cols-5` là cột badge rơi xuống hàng mới. */}
      <div className="vinmec-container grid gap-8 py-12 sm:grid-cols-2 lg:grid-cols-6">
        {VINMEC_FOOTER_COLUMNS.map((column) => (
          <div key={column.title}>
            <h3 className="mb-4 text-sm font-semibold text-[var(--vm-text)]">{column.title}</h3>
            <ul className="space-y-2.5">
              {column.links.map((link) => (
                <li key={link}>
                  <a
                    href={DEAD_LINK}
                    className={`rounded-sm text-[13px] text-[var(--vm-text-muted)] transition-colors hover:text-[var(--vm-menu-blue)] ${FOCUS}`}
                  >
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div>
          <h3 className="mb-4 text-sm font-semibold text-[var(--vm-text)]">Tải App MyVinmec</h3>
          <Image
            src="/images/vinmec/app-qr.svg"
            alt="Mã QR tải ứng dụng MyVinmec"
            width={124}
            height={124}
            className="h-[110px] w-[110px]"
          />
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-[var(--vm-text)]">Vinmec shop</h3>
          <Image
            src="/images/vinmec/logo-vinmec-system.png"
            alt="Online.Vinmec"
            width={460}
            height={290}
            className="h-auto w-[120px] object-contain"
          />
          <p className="mt-1 text-sm font-semibold leading-tight text-[var(--vm-menu-blue)]">
            ONLINE.
            <br />
            VINMEC
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-semibold text-[var(--vm-text)]">Theo dõi chúng tôi</h3>
          <div className="mb-5 flex gap-3">
            <a href={DEAD_LINK} aria-label="YouTube Vinmec" className={`rounded-sm ${FOCUS}`}>
              <Image
                src="/images/vinmec/icon-youtube.svg"
                alt=""
                aria-hidden="true"
                width={32}
                height={32}
                className="h-8 w-8"
              />
            </a>
            <a href={DEAD_LINK} aria-label="Facebook Vinmec" className={`rounded-sm ${FOCUS}`}>
              <Image
                src="/images/vinmec/icon-facebook.svg"
                alt=""
                aria-hidden="true"
                width={32}
                height={32}
                className="h-8 w-8"
              />
            </a>
          </div>

          <h3 className="mb-3 text-sm font-semibold text-[var(--vm-text)]">Đối tác liên kết</h3>
          <Image
            src="/images/vinmec/partner-buoctiep.webp"
            alt="Bước Tiếp"
            width={160}
            height={60}
            className="h-9 w-auto object-contain"
          />
        </div>

        <div className="flex flex-col items-start gap-3 lg:items-end">
          <Image
            src="/images/vinmec/badge-bocongthuong.svg"
            alt="Đã thông báo Bộ Công Thương"
            width={200}
            height={76}
            className="h-[52px] w-auto object-contain"
          />
          <Image
            src="/images/vinmec/badge-dmca.png"
            alt="DMCA Protected"
            width={135}
            height={28}
            className="h-[22px] w-auto object-contain"
          />
        </div>
      </div>

      {medicalDisclaimer ? (
        <div className="vinmec-container pb-8">
          <div className="border-t border-[var(--vm-border)] pt-6 text-[13px] leading-6 text-[var(--vm-text-muted)]">
            <p>
              Sản phẩm mô phỏng phục vụ học tập và demo, không thay thế tư vấn hoặc chỉ
              định y khoa.
            </p>
            <p>Bạn không chắc về kết quả? Hỏi dược sĩ/bác sĩ điều trị.</p>
          </div>
        </div>
      ) : null}

      <div className="bg-[var(--vm-gray-bg)]">
        <div className="vinmec-container flex flex-col gap-2 py-4 text-[12px] text-[var(--vm-text-muted)] lg:flex-row lg:items-center lg:justify-between">
          <p>{VINMEC_COPYRIGHT}</p>
          {/* Hai link này trỏ tới trang thật trong app, không phải `#` như phần còn
              lại của footer — footer cũ là lối vào DUY NHẤT tới trang pháp lý, và
              sitemap vẫn quảng cáo chúng. */}
          <ul className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <li>
              <Link
                href="/privacy-policy"
                className={`rounded-sm transition-colors hover:text-[var(--vm-menu-blue)] ${FOCUS}`}
              >
                Chính sách bảo vệ dữ liệu cá nhân
              </Link>
            </li>
            <li aria-hidden="true" className="text-[var(--vm-border)]">
              |
            </li>
            <li>
              <Link
                href="/terms-of-service"
                className={`rounded-sm transition-colors hover:text-[var(--vm-menu-blue)] ${FOCUS}`}
              >
                Điều khoản sử dụng
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
