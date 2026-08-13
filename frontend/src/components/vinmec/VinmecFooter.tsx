import Image from "next/image";
import {
  DEAD_LINK,
  VINMEC_COPYRIGHT,
  VINMEC_FOOTER_COLUMNS,
  VINMEC_LEGAL_LINKS,
} from "./vinmec-content";

const FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vm-menu-blue)] focus-visible:ring-offset-2";

/** Footer Vinmec: 5 cột liên kết + dải bản quyền màu xám ở đáy. */
export default function VinmecFooter() {
  return (
    <footer className="bg-white">
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

      <div className="bg-[var(--vm-gray-bg)]">
        <div className="vinmec-container flex flex-col gap-2 py-4 text-[12px] text-[var(--vm-text-muted)] lg:flex-row lg:items-center lg:justify-between">
          <p>{VINMEC_COPYRIGHT}</p>
          <ul className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {VINMEC_LEGAL_LINKS.map((link, index) => (
              <li key={link} className="flex items-center gap-2">
                {index > 0 ? (
                  <span aria-hidden="true" className="text-[var(--vm-border)]">
                    |
                  </span>
                ) : null}
                <a
                  href={DEAD_LINK}
                  className={`rounded-sm transition-colors hover:text-[var(--vm-menu-blue)] ${FOCUS}`}
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
