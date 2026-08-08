import { Apple, Combine } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";

const KIND_ICON: Record<TInteractionKind, LucideIcon> = {
  "drug-drug": Combine,
  "drug-food": Apple,
};

const KIND_LABEL: Record<TInteractionKind, string> = {
  "drug-drug": "Thuốc – thuốc",
  "drug-food": "Thuốc – thực phẩm",
};

interface SearchHistoryItemProps {
  item: IInteractionCheckSummaryItem;
}

/** Một dòng lịch sử tra cứu — dẫn tới `/interaction-checks/[id]` để xem chi tiết. */
export default function SearchHistoryItem({ item }: SearchHistoryItemProps) {
  const Icon = KIND_ICON[item.kind];
  const names = [...item.drugNames, ...(item.foodNames ?? [])];

  return (
    <li>
      <Link
        href={`${ROUTES.INTERACTION_CHECKS}/${item.id}`}
        className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-hero-tint text-primary">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 space-y-1">
          <p className="text-sm font-medium text-foreground">{KIND_LABEL[item.kind]}</p>
          <p className="truncate text-sm text-foreground-secondary">{names.join(", ") || "—"}</p>
          <p className="text-xs text-foreground-muted">{item.checkedAt}</p>
        </div>
      </Link>
    </li>
  );
}
