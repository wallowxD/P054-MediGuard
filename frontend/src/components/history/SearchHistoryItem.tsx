import { Clock3, Combine } from "lucide-react";
import Link from "next/link";
import SeverityBadge from "@/components/interactions/SeverityBadge";
import { ROUTES } from "@/constants/routes";

export default function SearchHistoryItem({ item }: { item: IInteractionCheckSummaryItem }) {
  return (
    <li>
      <Link
        href={`${ROUTES.INTERACTION_CHECKS}/${item.id}`}
        className="group flex items-start gap-3.5 rounded-2xl liquid-glass p-4 sm:p-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-105">
          <Combine className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="min-w-0 max-w-full truncate text-sm font-bold text-foreground group-hover:text-primary transition-colors">
              {item.drugNames.join(" + ") || "Lượt tra cứu tương tác"}
            </p>
            {item.highestSeverity ? <SeverityBadge severity={item.highestSeverity} /> : null}
          </div>
          {item.diseaseNames.length ? (
            <p className="mt-1 truncate text-xs text-foreground-secondary">
              Bệnh nền: {item.diseaseNames.join(", ")}
            </p>
          ) : null}
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-foreground-muted">
            <Clock3 className="h-3.5 w-3.5" />
            {new Date(item.checkedAt).toLocaleString("vi-VN")} • {item.resultCount} tương tác • {item.noteCount} lưu ý
          </p>
        </div>
      </Link>
    </li>
  );
}
