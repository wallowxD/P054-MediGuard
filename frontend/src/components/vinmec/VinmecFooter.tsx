import Image from "next/image";
import Link from "next/link";
import {
  DEAD_LINK,
  VINMEC_COPYRIGHT,
  VINMEC_FOOTER_COLUMNS,
} from "./vinmec-content";

export default function VinmecFooter({
  medicalDisclaimer = false,
}: {
  medicalDisclaimer?: boolean;
}) {
  return (
    <footer className="relative mt-12 border-t border-border/80 bg-surface/40 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand Column */}
          <div className="space-y-4 lg:col-span-2">
            <Link href="/" className="inline-block">
              {/* Cùng lý do với logo trên header: chữ `#286BA6` quá xỉn trên nền tối. */}
              <Image
                src="/images/vinmec/logo.png"
                alt="Vinmec Healthcare System"
                width={128}
                height={70}
                className="logo-plate h-10 w-auto rounded-xl px-2 py-1"
              />
            </Link>
            <p className="max-w-sm text-xs leading-relaxed text-foreground-secondary">
              Hệ thống Y tế phi lợi nhuận do Tập đoàn Vingroup đầu tư phát triển
              với sứ mệnh mang lại sự lựa chọn hoàn hảo về chăm sóc sức khỏe cho
              người bệnh.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="text-xs text-foreground-muted">
                Ứng dụng MyVinmec:
              </span>
              <div className="flex items-center gap-2">
                <Image
                  src="/images/vinmec/app-qr.svg"
                  alt="QR tải MyVinmec"
                  width={64}
                  height={64}
                  // Mã QR bắt buộc phải là mực sẫm trên nền sáng thì máy mới quét được.
                  // Trên nền kính tối nó vừa vô hình vừa vô dụng, nên luôn cần plate sáng.
                  className="logo-plate h-12 w-12 rounded-xl liquid-glass-subtle p-1"
                />
              </div>
            </div>
          </div>

          {/* Quick Links Columns */}
          {VINMEC_FOOTER_COLUMNS.slice(0, 2).map((column) => (
            <div key={column.title} className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
                {column.title}
              </h3>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link}>
                    <a
                      href={DEAD_LINK}
                      className="text-xs text-foreground-muted transition-colors hover:text-primary"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {/* Certifications & Badges Column */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Chứng nhận & Pháp lý
            </h3>
            {/* Hai badge pháp lý là ảnh nền trong suốt mực sẫm; `logo-plate` giữ chúng
                đọc được ở chế độ tối mà không phải đổi màu nhận diện của bên thứ ba. */}
            <div className="flex flex-col items-start gap-2.5">
              <Image
                src="/images/vinmec/badge-bocongthuong.svg"
                alt="Bộ Công Thương"
                width={140}
                height={50}
                className="logo-plate h-9 w-auto rounded-lg object-contain px-1.5 py-0.5 opacity-80"
              />
              <Image
                src="/images/vinmec/badge-dmca.png"
                alt="DMCA Protected"
                width={120}
                height={24}
                className="logo-plate h-5 w-auto rounded-md object-contain px-1.5 opacity-80"
              />
            </div>
          </div>
        </div>

        {/* Safety Disclaimer */}
        {medicalDisclaimer ? (
          <div className="mt-8 rounded-2xl liquid-glass-subtle p-4 text-xs leading-relaxed text-foreground-muted">
            <p className="font-semibold text-foreground">Lưu ý y khoa:</p>
            <p>
              Các cảnh báo tương tác thuốc và thông tin tra cứu trên hệ thống
              mang tính tham khảo y tế, không thay thế chỉ định trực tiếp từ bác
              sĩ chuyên khoa hoặc dược sĩ lâm sàng.
            </p>
          </div>
        ) : null}

        {/* Bottom Bar */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-border/60 pt-6 text-xs text-foreground-muted sm:flex-row">
          <p>{VINMEC_COPYRIGHT}</p>
          <div className="flex items-center gap-4">
            <Link
              href="/privacy-policy"
              className="hover:text-primary transition-colors"
            >
              Chính sách bảo mật
            </Link>
            <span>•</span>
            <Link
              href="/terms-of-service"
              className="hover:text-primary transition-colors"
            >
              Điều khoản sử dụng
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
