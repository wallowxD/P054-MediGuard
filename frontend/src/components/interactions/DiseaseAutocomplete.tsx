"use client";

import { Search, X } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { useDiseaseSearch } from "@/queries/interactions";

export default function DiseaseAutocomplete({
  selected,
  onChange,
}: {
  selected: IDiseaseItem[];
  onChange: (items: IDiseaseItem[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const id = useId();
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);
  const { data, isFetching } = useDiseaseSearch(debounced);

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-sm font-medium text-foreground">Bệnh nền áp dụng cho lượt này</label>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-input px-3 py-2 focus-within:ring-2 focus-within:ring-ring">
        <Search className="h-4 w-4 text-foreground-muted" aria-hidden />
        <input id={id} value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm trong danh mục bệnh nền…" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
      </div>
      {debounced && query.trim() === debounced ? (
        <div className="overflow-hidden rounded-lg border border-border bg-card" role="listbox">
          {isFetching ? <p className="px-3 py-2 text-xs text-foreground-muted">Đang tìm…</p> : null}
          {data?.items.filter((item) => !selected.some((value) => value.id === item.id)).map((item) => (
            <button key={item.id} type="button" onClick={() => { onChange([...selected, item]); setQuery(""); }} className="block w-full px-3 py-2 text-left text-sm hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" role="option" aria-selected="false">
              {item.name}
            </button>
          ))}
          {!isFetching && data?.items.length === 0 ? <p className="px-3 py-2 text-xs text-foreground-muted">Không tìm thấy bệnh phù hợp.</p> : null}
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        {selected.map((item) => (
          <span key={item.id} className="inline-flex items-center gap-1.5 rounded-full bg-surface px-3 py-1 text-xs text-foreground-secondary">
            {item.name}
            <button type="button" onClick={() => onChange(selected.filter((value) => value.id !== item.id))} aria-label={`Bỏ ${item.name}`} className="rounded-full focus-visible:ring-2 focus-visible:ring-ring"><X className="h-3.5 w-3.5" /></button>
          </span>
        ))}
      </div>
      <p className="text-xs text-foreground-muted">Chỉ bệnh đã chọn từ danh mục mới được gửi để đối chiếu exact.</p>
    </div>
  );
}
