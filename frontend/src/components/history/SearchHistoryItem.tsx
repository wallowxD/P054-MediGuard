import { Clock3, Combine } from "lucide-react";
import Link from "next/link";
import SeverityBadge from "@/components/interactions/SeverityBadge";
import { ROUTES } from "@/constants/routes";

export default function SearchHistoryItem({ item }: { item: IInteractionCheckSummaryItem }) {
  return (
    <li><Link href={`${ROUTES.INTERACTION_CHECKS}/${item.id}`} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-hero-tint text-primary"><Combine className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-medium text-foreground">{item.drugNames.join(" + ") || "Lượt tra cứu"}</p>{item.highestSeverity ? <SeverityBadge severity={item.highestSeverity} /> : null}</div>{item.diseaseNames.length ? <p className="mt-1 truncate text-sm text-foreground-secondary">Bệnh nền: {item.diseaseNames.join(", ")}</p> : null}<p className="mt-2 flex items-center gap-1 text-xs text-foreground-muted"><Clock3 className="h-3.5 w-3.5" />{new Date(item.checkedAt).toLocaleString("vi-VN")} · {item.resultCount} tương tác · {item.noteCount} lưu ý</p></div></Link></li>
  );
}
