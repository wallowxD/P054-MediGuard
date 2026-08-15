import { Pill, X } from "lucide-react";

interface SelectedDrugListProps {
  label: string;
  drugs: IDrugItem[];
  onRemove: (id: string) => void;
  emptyHint: string;
}

export default function SelectedDrugList({ label, drugs, onRemove, emptyHint }: SelectedDrugListProps) {
  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-medium text-foreground-secondary">
          {label} <span className="tabular-nums text-foreground-muted">({drugs.length})</span>
        </h3>
      </div>
      {drugs.length > 0 ? (
        <ul className="grid gap-2 sm:grid-cols-2">
          {drugs.map((drug) => (
            <li
              key={drug.id}
              className="flex min-w-0 items-center gap-3 rounded-xl border border-border/80 bg-surface/35 p-3"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Pill className="h-4 w-4" strokeWidth={1.8} aria-hidden />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {drug.brandName}
                </span>
                <span className="mt-0.5 block truncate text-[11px] text-foreground-muted">
                  {drug.ingredient || "Chưa có thông tin hoạt chất"}
                </span>
              </span>
              <button
                type="button"
                onClick={() => onRemove(drug.id)}
                aria-label={`Xoá ${drug.brandName} khỏi danh sách`}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-error/10 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex items-center gap-3 rounded-xl border border-dashed border-border bg-surface/20 px-4 py-3">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface text-foreground-muted">
            <Pill className="h-4 w-4" strokeWidth={1.8} aria-hidden />
          </span>
          <p className="text-xs leading-5 text-foreground-muted">{emptyHint}</p>
        </div>
      )}
    </div>
  );
}
