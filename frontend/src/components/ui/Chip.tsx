import { X } from "lucide-react";

interface ChipProps {
  label: string;
  onRemove: () => void;
  removeLabel?: string;
}

/** Thẻ nhỏ có nút xoá — dùng cho danh sách thuốc/thực phẩm người dùng đã chọn */
export default function Chip({ label, onRemove, removeLabel }: ChipProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface py-1 pl-3 pr-1.5 text-sm text-foreground">
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={removeLabel ?? `Xoá ${label}`}
        className="rounded-full p-0.5 text-foreground-muted hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="h-3 w-3" aria-hidden />
      </button>
    </span>
  );
}
