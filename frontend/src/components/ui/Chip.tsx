import { X } from "lucide-react";

interface ChipProps {
  label: string;
  onRemove: () => void;
  removeLabel?: string;
}

/**
 * Thẻ nhỏ có nút xoá — dùng cho danh sách thuốc/thực phẩm người dùng đã chọn.
 *
 * Nút xoá cố tình lớn hơn icon bên trong nhiều: vùng chạm 28×28 để không phải nhắm
 * vào một chữ × 12px trên điện thoại. Đừng thu lại chỉ để chip trông gọn hơn.
 */
export default function Chip({ label, onRemove, removeLabel }: ChipProps) {
  return (
    <span className="inline-flex min-h-9 items-center gap-1 rounded-full border border-border bg-surface py-1 pl-3 pr-1 text-sm text-foreground">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel ?? `Xoá ${label}`}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-foreground-muted hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="h-3.5 w-3.5" aria-hidden />
      </button>
    </span>
  );
}
