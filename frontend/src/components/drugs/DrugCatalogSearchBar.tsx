"use client";

import { Search, X } from "lucide-react";
import { useId } from "react";

interface DrugCatalogSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  status?: string;
}

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
      <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
        Tra cứu tên thuốc trong danh mục
      </label>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" aria-hidden />
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Nhập tên thuốc hoặc hoạt chất cần tìm…"
          aria-describedby={statusId}
          className="w-full rounded-2xl liquid-glass-input py-2.5 pl-10 pr-10 text-xs sm:text-sm text-foreground outline-none placeholder:text-foreground-muted"
        />
        {value ? (
          <button
            type="button"
            onClick={onClear}
            aria-label="Xoá từ khoá tìm kiếm"
            className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full text-foreground-muted hover:bg-surface hover:text-foreground transition-colors"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        ) : null}
      </div>

      <p id={statusId} role="status" aria-live="polite" className="min-h-5 text-[11px] text-foreground-muted">
        {status ?? "Gõ từ một ký tự để tìm theo tên biệt dược hoặc hoạt chất."}
      </p>
    </div>
  );
}
