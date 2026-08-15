"use client";

import { Check, Plus, Search } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDrugSearch } from "@/queries/interactions";

const DEBOUNCE_MS = 350;

interface DrugCatalogPickerProps {
  label: string;
  placeholder?: string;
  hint?: string;
  onSelect?: (drug: IDrugItem) => void;
  selectedIds?: string[];
}

export default function DrugCatalogPicker({
  label,
  placeholder,
  hint,
  onSelect,
  selectedIds = [],
}: DrugCatalogPickerProps) {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputId = useId();
  const statusId = `${inputId}-status`;
  const trimmed = query.trim();
  const debouncedTrimmed = debouncedQuery.trim();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const { data, isFetching, isError, error } = useDrugSearch(debouncedTrimmed);
  const isPending = trimmed.length > 0 && (trimmed !== debouncedTrimmed || isFetching);
  const candidates = data?.candidates ?? [];

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
        {label}
      </label>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" aria-hidden />
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder ?? "Tìm tên biệt dược hoặc hoạt chất trong danh mục…"}
          aria-describedby={statusId}
          className="w-full rounded-2xl liquid-glass-input py-2.5 pl-10 pr-4 text-xs sm:text-sm text-foreground outline-none placeholder:text-foreground-muted"
        />
      </div>

      <div id={statusId} role="status" aria-live="polite" className="min-h-5 pt-0.5">
        {trimmed.length === 0 ? (
          <p className="text-[11px] text-foreground-muted">
            {hint ?? "Nhập tên biệt dược hoặc hoạt chất để tìm trong danh mục bệnh viện."}
          </p>
        ) : isPending ? (
          <div className="space-y-1.5" aria-hidden="true">
            <Skeleton className="h-9 w-full rounded-xl" />
            <Skeleton className="h-9 w-4/5 rounded-xl" />
          </div>
        ) : isError ? (
          <p className="text-xs text-error">
            {error instanceof Error ? error.message : "Không thể tìm thuốc. Vui lòng thử lại."}
          </p>
        ) : candidates.length === 0 ? (
          <p className="text-xs text-foreground-secondary">
            Không tìm thấy thuốc nào khớp “{debouncedTrimmed}” trong danh mục bệnh viện.
          </p>
        ) : (
          <ul className="divide-y divide-border/60 overflow-hidden rounded-2xl liquid-glass shadow-lg">
            {candidates.map((candidate) => {
              const isSelected = selectedIds.includes(candidate.drugId);
              return (
                <li key={candidate.drugId}>
                  <button
                    type="button"
                    disabled={isSelected}
                    onClick={() => {
                      onSelect?.({
                        id: candidate.drugId,
                        brandName: candidate.brandName,
                        ingredient: candidate.ingredient,
                      });
                      setQuery("");
                    }}
                    className="flex w-full items-center justify-between px-3.5 py-2.5 text-left transition-colors hover:bg-surface/80 disabled:cursor-default disabled:opacity-50"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="block text-xs font-bold text-foreground">
                        {candidate.brandName}
                      </span>
                      <span className="block text-[11px] text-foreground-muted truncate">
                        {candidate.ingredient}
                      </span>
                    </div>

                    <span
                      className={`ml-2 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        isSelected ? "bg-emerald-500/15 text-emerald-600" : "liquid-glass-pill text-primary"
                      }`}
                    >
                      {isSelected ? <Check className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
