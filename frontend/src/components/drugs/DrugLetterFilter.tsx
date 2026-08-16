"use client";

import { NON_ALPHA_LABEL, NON_ALPHA_LETTER } from "@/constants/catalog";
import { Skeleton } from "@/components/ui/Skeleton";

interface DrugLetterFilterProps {
  letters: IDrugLetterCount[];
  selected: string | null | undefined;
  onSelect: (letter: string | null) => void;
  isLoading?: boolean;
}

const labelFor = (letter: string) => (letter === NON_ALPHA_LETTER ? NON_ALPHA_LABEL : letter);

const describe = (letter: string, count: number) => {
  const name = letter === NON_ALPHA_LETTER ? "nhóm ký tự khác" : `vần ${letter}`;
  return count === 0 ? `${name}, chưa có thuốc` : `${name}, ${count} thuốc`;
};

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
          <Skeleton key={i} className="h-9 w-9 rounded-lg" />
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
        className={`min-h-9 rounded-lg border px-3.5 text-xs font-semibold transition-[background-color,border-color,color,box-shadow,transform] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          selected === null
            ? "border-primary bg-primary text-primary-foreground shadow-[0_6px_16px_rgba(0,102,204,0.16)]"
            : "border-border bg-background-elevated text-foreground-secondary hover:border-primary/25 hover:bg-primary/5 hover:text-primary"
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
            className={`h-9 min-w-9 rounded-lg border px-2 text-xs font-semibold transition-[background-color,border-color,color,box-shadow,transform] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
              isEmpty
                ? "cursor-not-allowed border-transparent bg-surface/30 text-foreground-muted opacity-35"
                : isSelected
                  ? "border-primary bg-primary text-primary-foreground shadow-[0_6px_16px_rgba(0,102,204,0.16)]"
                  : "border-border bg-background-elevated text-foreground-secondary hover:border-primary/25 hover:bg-primary/5 hover:text-primary"
            }`}
          >
            {labelFor(letter)}
          </button>
        );
      })}
    </div>
  );
}
