"use client";

import { Activity, Plus, Search, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useDiseaseSearch } from "@/queries/interactions";

export default function DiseaseAutocomplete({
  selected,
  onChange,
  label = "Tìm bệnh nền hoặc tình trạng sức khỏe",
  helpText = "Chỉ các bệnh bạn chọn mới được đưa vào lần tra cứu này.",
  disabled = false,
}: {
  selected: IDiseaseItem[];
  onChange: (items: IDiseaseItem[]) => void;
  label?: string;
  helpText?: string;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const id = useId();

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isFetching } = useDiseaseSearch(debounced, !disabled);

  return (
    <div className="space-y-2.5">
      <label htmlFor={id} className="text-xs font-medium text-foreground-secondary">
        {label} <span className="tabular-nums text-foreground-muted">({selected.length})</span>
      </label>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-foreground-muted"
          strokeWidth={1.8}
          aria-hidden
        />
        <input
          id={id}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ví dụ: Suy giảm chức năng thận..."
          disabled={disabled}
          autoComplete="off"
          className="min-h-12 w-full rounded-xl border border-border bg-input py-2.5 pl-11 pr-4 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-foreground-muted focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {debounced && query.trim() === debounced ? (
        <div
          className="overflow-hidden rounded-xl border border-border/80 bg-background-elevated shadow-[0_12px_28px_rgba(30,64,110,0.1)] dark:shadow-[0_14px_30px_rgba(0,0,0,0.3)]"
          role="listbox"
        >
          {isFetching ? (
            <p className="px-3.5 py-3 text-xs text-foreground-muted">Đang tìm...</p>
          ) : null}
          {data?.items
            .filter((item) => !selected.some((value) => value.id === item.id))
            .map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => {
                  onChange([...selected, item]);
                  setQuery("");
                }}
                className="flex min-h-11 w-full items-center justify-between px-3.5 py-2.5 text-left text-sm font-medium text-foreground transition-colors hover:bg-surface/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                role="option"
                aria-selected="false"
              >
                <span>{item.name}</span>
                <Plus className="h-3.5 w-3.5 text-primary" />
              </button>
            ))}
          {!isFetching && data?.items.length === 0 ? (
            <p className="px-3.5 py-2 text-xs text-foreground-muted">Không tìm thấy bệnh phù hợp.</p>
          ) : null}
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {selected.map((item) => (
          <span
            key={item.id}
            className="inline-flex min-h-9 items-center gap-2 rounded-xl border border-primary/20 bg-primary/10 py-1.5 pl-3 pr-1.5 text-xs font-medium text-foreground"
          >
            <Activity className="h-3.5 w-3.5 text-primary" aria-hidden />
            <span>{item.name}</span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(selected.filter((value) => value.id !== item.id))}
              aria-label={`Bỏ ${item.name}`}
              className="flex h-6 w-6 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-error/10 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
          </span>
        ))}
      </div>

      <p className="text-[11px] text-foreground-muted">{helpText}</p>
    </div>
  );
}
