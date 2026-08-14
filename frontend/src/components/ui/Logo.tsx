import Image from "next/image";

/**
 * Logo thương hiệu dùng chung cho toàn app.
 *
 * ★ Là logo Vinmec (bird + wordmark "VINMEC HEALTHCARE SYSTEM"), tải từ nguồn gốc
 *   và đặt tại `public/images/vinmec/logo.svg`.
 *
 * ★ Vì logo ĐÃ chứa sẵn chữ "VINMEC", nơi gọi KHÔNG đặt thêm <span> tên thương hiệu
 *   bên cạnh nữa — làm vậy là hiện tên hai lần.
 *
 * ★ Logo nằm ngang (tỉ lệ 128×80), không phải hình vuông như mark cũ. Nơi gọi phải
 *   truyền chiều cao kèm `w-auto` (ví dụ `h-10 w-auto`); ép `h-10 w-10` sẽ bóp méo chữ.
 */
export default function Logo({ className = "h-8 w-auto" }: { className?: string }) {
  return (
    <Image
      src="/images/vinmec/logo.svg"
      alt="Vinmec Healthcare System"
      width={128}
      height={80}
      priority
      className={className}
    />
  );
}
