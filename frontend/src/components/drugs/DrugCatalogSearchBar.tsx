"use client";

import { Search, X } from "lucide-react";
import { useId } from "react";

interface DrugCatalogSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  /** Mô tả trạng thái kết quả, đọc bởi screen reader qua `aria-live` */
  status?: string;
}

/**
 * Ô "Tra cứu tên thuốc" của trang danh mục.
 *
 * Là input CÓ KIỂM SOÁT, không tự giữ state: khi người dùng bấm một chữ cái trên thanh
 * A–Z, trang cha phải xoá được nội dung ô này. Nếu ô tự giữ state thì màn hình sẽ hiện
 * từ khoá cũ trong khi danh sách bên dưới đã lọc theo chữ cái — hai thứ nói hai chuyện
 * khác nhau.
 *
 * Khác `DrugCatalogPicker`: ô này LỌC danh sách bên dưới chứ không mở dropdown chọn
 * thuốc, nên không có `onSelect`.
 */
export default function DrugCatalogSearchBar({
  value,
  onChange,
  onClear,
  status,
}: DrugCatalogSearchBarProps) {
  const inputId = useId();
  const statusId = `${inputId}-status`;

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        Tra cứu tên thuốc
      </label>

      <div className="flex items-center gap-2 rounded-lg border border-border bg-input px-3 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring">
        <Search className="h-4 w-4 shrink-0 text-foreground-muted" aria-hidden />
        <input
          id={inputId}
          // type="text" chứ không phải "search": nút × mặc định của trình duyệt xoá giá
          // trị mà không bắn event React nào, nên state của trang cha sẽ lệch với ô nhập.
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Nhập tên thuốc cần tìm…"
          aria-describedby={statusId}
          className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-muted"
        />
        {value ? (
          <button
            type="button"
            onClick={onClear}
            aria-label="Xoá từ khoá tìm kiếm"
            className="shrink-0 rounded-full p-1 text-foreground-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </div>

      <p id={statusId} role="status" aria-live="polite" className="min-h-5 text-xs text-foreground-muted">
        {status ?? "Gõ từ một ký tự để tìm theo tên biệt dược hoặc hoạt chất."}
      </p>
    </div>
  );
}
