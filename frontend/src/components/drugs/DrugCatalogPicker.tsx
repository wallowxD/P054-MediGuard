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
    <div className="space-y-2.5">
      <label htmlFor={inputId} className="text-xs font-medium text-foreground-secondary">
        {label}
      </label>

      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-foreground-muted"
          strokeWidth={1.8}
          aria-hidden
        />
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder ?? "Ví dụ: Paracetamol, Aspirin..."}
          aria-describedby={statusId}
          autoComplete="off"
          className="min-h-12 w-full rounded-xl border border-border bg-input py-2.5 pl-11 pr-4 text-sm text-foreground outline-none transition-[border-color,box-shadow] placeholder:text-foreground-muted focus:border-primary focus:ring-2 focus:ring-primary/15"
        />
      </div>

      <div id={statusId} role="status" aria-live="polite" className="min-h-5">
        {trimmed.length === 0 ? (
          <p className="text-xs leading-5 text-foreground-muted">
            {hint ?? "Chọn đúng thuốc từ danh mục để hệ thống đối chiếu chính xác."}
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
          <ul className="divide-y divide-border/70 overflow-hidden rounded-xl border border-border/80 bg-background-elevated shadow-[0_12px_28px_rgba(30,64,110,0.1)] dark:shadow-[0_14px_30px_rgba(0,0,0,0.3)]">
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
                    className="flex min-h-12 w-full items-center justify-between px-3.5 py-2.5 text-left transition-colors hover:bg-surface/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-default disabled:opacity-50"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-foreground">
                        {candidate.brandName}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-foreground-muted">
                        {candidate.ingredient}
                      </span>
                    </div>

                    <span
                      className={`ml-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${
                        isSelected ? "bg-success/10 text-success" : "bg-primary/10 text-primary"
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
