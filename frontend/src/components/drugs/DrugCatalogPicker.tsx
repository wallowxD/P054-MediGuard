"use client";

import { Search } from "lucide-react";
import { useEffect, useId, useState } from "react";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDrugSearch } from "@/queries/interactions";

const DEBOUNCE_MS = 400;

interface DrugCatalogPickerProps {
  label: string;
  placeholder?: string;
  hint?: string;
  onSelect?: (drug: IDrugItem) => void;
  selectedIds?: string[];
}

/**
 * Ô tìm thuốc trong danh mục bệnh viện, nối `GET /api/v1/drugs/search`.
 *
 * Gợi ý hiển thị ĐÚNG những gì backend trả về và không bao giờ nhận text tự do.
 *
 * Hiện gợi ý chỉ để ĐỌC. Ba trang dùng component này (thuốc–thuốc, thuốc–thực phẩm, đơn
 * thuốc) đều cần bước xác nhận thuốc vào giỏ, mà luồng đó chưa có backend — dựng nút bấm
 * rồi không làm gì còn tệ hơn không có nút. Khi luồng giỏ thuốc sẵn sàng, thêm prop
 * `onSelect` và bọc nội dung gợi ý trong `<button>`.
 *
 * Trang "Tra cứu thuốc" KHÔNG dùng component này: ở đó ô tìm kiếm lọc thẳng danh sách
 * bên dưới nên dùng `DrugCatalogSearchBar`.
 */
export default function DrugCatalogPicker({ label, placeholder, hint, onSelect, selectedIds = [] }: DrugCatalogPickerProps) {
  const [query, setQuery] = useState("");
  // Chỉ set trong callback của setTimeout (bất đồng bộ) — không set trực tiếp
  // trong thân effect để tránh cascading render (react-hooks/set-state-in-effect).
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

  // Còn trong khoảng debounce thì kết quả đang hiển thị thuộc về từ khoá cũ. Coi đó là
  // trạng thái đang tải, nếu không danh sách sẽ nhấp nháy kết quả cũ trong lúc gõ.
  const isPending = trimmed.length > 0 && (trimmed !== debouncedTrimmed || isFetching);
  const candidates = data?.candidates ?? [];

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

      <div id={statusId} role="status" aria-live="polite" className="min-h-5 pt-0.5">
        {trimmed.length === 0 ? (
          <p className="text-xs text-foreground-muted">
            {hint ?? "Nhập tên biệt dược hoặc hoạt chất để tìm trong danh mục bệnh viện."}
          </p>
        ) : isPending ? (
          <div className="space-y-1.5" aria-hidden="true">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-4/5" />
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
          <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card">
            {candidates.map((candidate) => (
              <li key={candidate.drugId}>
                <button
                  type="button"
                  disabled={selectedIds.includes(candidate.drugId)}
                  onClick={() => {
                    onSelect?.({ id: candidate.drugId, brandName: candidate.brandName, ingredient: candidate.ingredient });
                    setQuery("");
                  }}
                  className="w-full px-3 py-2 text-left transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:cursor-default disabled:opacity-50"
                >
                  <span className="block text-sm font-medium text-foreground">
                    {candidate.brandName}{selectedIds.includes(candidate.drugId) ? " · Đã chọn" : ""}
                  </span>
                  <span className="mt-0.5 block whitespace-pre-line text-xs text-foreground-secondary">
                    {candidate.ingredient}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
