"use client";

import { NON_ALPHA_LABEL, NON_ALPHA_LETTER } from "@/constants/catalog";
import { Skeleton } from "@/components/ui/Skeleton";

interface DrugLetterFilterProps {
  letters: IDrugLetterCount[];
  /**
   * Vần đang chọn. Ba trạng thái khác nhau:
   * - một chữ cái → nút đó sáng
   * - `null` → nút "Tất cả" sáng
   * - `undefined` → KHÔNG nút nào sáng, dùng khi danh sách đang do ô tìm kiếm điều
   *   khiển. Thiếu trạng thái này thì "Tất cả" sẽ sáng lên trong lúc danh sách chỉ hiện
   *   kết quả tìm kiếm, tức là thanh chữ cái nói sai về thứ đang hiển thị.
   */
  selected: string | null | undefined;
  onSelect: (letter: string | null) => void;
  isLoading?: boolean;
}

const labelFor = (letter: string) => (letter === NON_ALPHA_LETTER ? NON_ALPHA_LABEL : letter);

const describe = (letter: string, count: number) => {
  const name = letter === NON_ALPHA_LETTER ? "nhóm ký tự khác" : `vần ${letter}`;
  return count === 0 ? `${name}, chưa có thuốc` : `${name}, ${count} thuốc`;
};

/**
 * Thanh chữ cái A–Z của danh mục thuốc.
 *
 * Backend trả đủ 27 nhóm kể cả nhóm rỗng nên component này KHÔNG tự dựng bảng chữ cái —
 * nhóm `count = 0` được disable thay vì ẩn đi, để bảng chữ cái không bị co giãn thất
 * thường và người dùng thấy rõ vần đó không có thuốc chứ không phải trang bị lỗi.
 */
export default function DrugLetterFilter({
  letters,
  selected,
  onSelect,
  isLoading = false,
}: DrugLetterFilterProps) {
  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2" aria-hidden>
        {Array.from({ length: 27 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-9 rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Lọc theo chữ cái">
      <button
        type="button"
        onClick={() => onSelect(null)}
        aria-pressed={selected === null}
        className={`h-9 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          selected === null
            ? "border-primary bg-primary text-primary-foreground"
            : "border-border text-foreground-secondary hover:border-primary hover:text-primary"
        }`}
      >
        Tất cả
      </button>

      {letters.map(({ letter, count }) => {
        const isEmpty = count === 0;
        const isSelected = selected === letter;

        return (
          <button
            key={letter}
            type="button"
            disabled={isEmpty}
            onClick={() => onSelect(letter)}
            aria-pressed={isSelected}
            aria-label={describe(letter, count)}
            title={describe(letter, count)}
            className={`h-9 min-w-9 rounded-full border px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isEmpty
                ? "cursor-not-allowed border-border text-foreground-muted opacity-40"
                : isSelected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-foreground-secondary hover:border-primary hover:text-primary"
            }`}
          >
            {labelFor(letter)}
          </button>
        );
      })}
    </div>
  );
}
