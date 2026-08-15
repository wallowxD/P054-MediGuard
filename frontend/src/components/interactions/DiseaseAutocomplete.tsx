"use client";

import { Activity, Plus, Search, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useDiseaseSearch } from "@/queries/interactions";

export default function DiseaseAutocomplete({
  selected,
  onChange,
  label = "Bệnh nền & Tình trạng lâm sàng",
  helpText = "Chỉ bệnh được chọn từ danh mục mới được gửi để đối chiếu exact.",
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
    <div className="space-y-2">
      <label htmlFor={id} className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
        {label} ({selected.length})
      </label>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" aria-hidden />
        <input
          id={id}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Tìm trong danh mục bệnh nền…"
          disabled={disabled}
          className="w-full rounded-2xl liquid-glass-input py-2.5 pl-10 pr-4 text-xs sm:text-sm text-foreground outline-none placeholder:text-foreground-muted disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {debounced && query.trim() === debounced ? (
        <div className="overflow-hidden rounded-2xl liquid-glass shadow-lg" role="listbox">
          {isFetching ? <p className="px-3.5 py-2 text-xs text-foreground-muted">Đang tìm…</p> : null}
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
                className="flex w-full items-center justify-between px-3.5 py-2.5 text-left text-xs font-medium text-foreground transition-colors hover:bg-surface/80 disabled:cursor-not-allowed disabled:opacity-50"
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

      <div className="flex flex-wrap gap-2 pt-1">
        {selected.map((item) => (
          <span
            key={item.id}
            className="inline-flex items-center gap-2 rounded-full liquid-glass-pill py-1.5 pl-3 pr-2 text-xs font-semibold text-foreground"
          >
            <Activity className="h-3.5 w-3.5 text-rose-500" />
            <span>{item.name}</span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(selected.filter((value) => value.id !== item.id))}
              aria-label={`Bỏ ${item.name}`}
              className="flex h-5 w-5 items-center justify-center rounded-full text-foreground-muted hover:bg-surface hover:text-error transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>

      <p className="text-[11px] text-foreground-muted">{helpText}</p>
    </div>
  );
}
