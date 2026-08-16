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
    <div className="space-y-2.5">
      <label htmlFor={inputId} className="text-sm font-semibold text-foreground">
        Tên thuốc hoặc hoạt chất
      </label>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-foreground-muted"
          strokeWidth={1.8}
          aria-hidden
        />
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Ví dụ: Panadol, Paracetamol…"
          aria-describedby={statusId}
          className="min-h-12 w-full rounded-xl border border-border bg-input py-3 pl-12 pr-12 text-sm text-foreground outline-none transition-[border-color,box-shadow,background-color] placeholder:text-foreground-muted hover:border-primary/20 focus:border-primary/40 focus:bg-background-elevated focus:ring-4 focus:ring-primary/8"
        />
        {value ? (
          <button
            type="button"
            onClick={onClear}
            aria-label="Xoá từ khoá tìm kiếm"
            className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-surface hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="h-4 w-4" strokeWidth={1.8} aria-hidden />
          </button>
        ) : null}
      </div>

      <p id={statusId} role="status" aria-live="polite" className="min-h-5 text-xs leading-5 text-foreground-muted">
        {status ?? "Gõ từ một ký tự để tìm theo tên biệt dược hoặc hoạt chất."}
      </p>
    </div>
  );
}
