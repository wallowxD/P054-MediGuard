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
      <div className="flex flex-wrap gap-1.5" aria-hidden>
        {Array.from({ length: 27 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-8 rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Lọc theo chữ cái">
      <button
        type="button"
        onClick={() => onSelect(null)}
        aria-pressed={selected === null}
        className={`h-8 rounded-full px-3.5 text-xs font-semibold transition-all ${
          selected === null
            ? "bg-primary text-white shadow-sm"
            : "liquid-glass-pill text-foreground-secondary hover:text-foreground"
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
            className={`h-8 min-w-8 rounded-full px-2 text-xs font-semibold transition-all ${
              isEmpty
                ? "cursor-not-allowed text-foreground-muted opacity-30"
                : isSelected
                  ? "bg-primary text-white shadow-sm"
                  : "liquid-glass-pill text-foreground-secondary hover:text-foreground hover:scale-105"
            }`}
          >
            {labelFor(letter)}
          </button>
        );
      })}
    </div>
  );
}
