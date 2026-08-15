import { Pill, X } from "lucide-react";

interface SelectedDrugListProps {
  label: string;
  drugs: IDrugItem[];
  onRemove: (id: string) => void;
  emptyHint: string;
}

export default function SelectedDrugList({ label, drugs, onRemove, emptyHint }: SelectedDrugListProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground-secondary">
          {label} ({drugs.length})
        </h3>
      </div>
      {drugs.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {drugs.map((drug) => (
            <span
              key={drug.id}
              className="inline-flex items-center gap-2 rounded-full liquid-glass-pill py-1.5 pl-3 pr-2 text-xs font-semibold text-foreground shadow-xs"
            >
              <Pill className="h-3.5 w-3.5 text-primary" />
              <span>{drug.brandName}</span>
              <button
                type="button"
                onClick={() => onRemove(drug.id)}
                aria-label={`Xoá ${drug.brandName} khỏi danh sách`}
                className="flex h-5 w-5 items-center justify-center rounded-full text-foreground-muted hover:bg-surface hover:text-error transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border/80 p-3 text-center">
          <p className="text-xs text-foreground-muted">{emptyHint}</p>
        </div>
      )}
    </div>
  );
}
