"use client";

import { Search } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";

const DEBOUNCE_MS = 400;
const MIN_QUERY_LENGTH = 2;

interface DrugCatalogPickerProps {
  label: string;
  placeholder?: string;
  hint?: string;
}

/**
 * Ô tìm thuốc trong danh mục bệnh viện — chưa có candidate thật (backend catalog
 * search chưa mở) nên KHÔNG render gợi ý và KHÔNG cho thêm text tự do vào bất kỳ
 * danh sách nào. Chỉ mô phỏng trạng thái debounce/loading của UI thật; gõ xong sẽ
 * luôn kết thúc bằng thông báo "chưa kết nối", không suy đoán thuốc nào cả.
 *
 * TODO(API): khi backend mở GET /api/v1/drugs/search, thay khối debounce nội bộ
 * bằng `useDrugSearch()` (src/queries/interactions.ts) và render `data.candidates`
 * thành danh sách có thể chọn, gọi `onSelectCandidate` (props mới) để cha dispatch
 * `addDrug` với `IDrugItem` thật.
 */
export default function DrugCatalogPicker({ label, placeholder, hint }: DrugCatalogPickerProps) {
  const [query, setQuery] = useState("");
  // Chỉ set trong callback của setTimeout (bất đồng bộ) — không set trực tiếp
  // trong thân effect để tránh cascading render (react-hooks/set-state-in-effect).
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const inputId = useId();
  const statusId = `${inputId}-status`;
  const trimmed = query.trim();
  const debouncedTrimmed = debouncedQuery.trim();
  const isChecking = trimmed.length >= MIN_QUERY_LENGTH && trimmed !== debouncedTrimmed;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="flex items-center gap-2 rounded-lg border border-border bg-input px-3 py-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring">
        <Search className="h-4 w-4 shrink-0 text-foreground-muted" aria-hidden />
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder ?? "Tìm tên biệt dược hoặc hoạt chất…"}
          aria-describedby={statusId}
          className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-foreground-muted"
        />
      </div>

      <div id={statusId} role="status" className="min-h-5 pt-0.5">
        {trimmed.length === 0 ? (
          <p className="text-xs text-foreground-muted">
            {hint ?? "Nhập tên biệt dược hoặc hoạt chất để tìm trong danh mục bệnh viện."}
          </p>
        ) : trimmed.length < MIN_QUERY_LENGTH ? (
          <p className="text-xs text-foreground-muted">
            Nhập tối thiểu {MIN_QUERY_LENGTH} ký tự để tìm kiếm.
          </p>
        ) : isChecking ? (
          <div className="space-y-1.5" aria-hidden="true">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-4/5" />
          </div>
        ) : (
          <p className="text-xs text-foreground-secondary">
            Chức năng tìm thuốc từ danh mục bệnh viện sẽ được kết nối sau.
          </p>
        )}
      </div>
    </div>
  );
}
