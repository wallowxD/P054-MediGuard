"use client";

import { ChevronRight, FileText, Pill } from "lucide-react";
import Link from "next/link";
import EmptyState from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { ROUTES } from "@/constants/routes";

interface DrugCatalogListProps {
  items: IDrugCatalogRow[];
  isLoading: boolean;
  isFetching?: boolean;
  emptyTitle?: string;
  emptyDescription: string;
}

function LeafletTag({ hasLeaflet }: { hasLeaflet?: boolean }) {
  if (hasLeaflet === undefined) return null;

  if (!hasLeaflet) return <span className="text-foreground-muted">Chưa có HDSD</span>;

  return (
    <span className="inline-flex items-center gap-1 text-primary">
      <FileText className="h-3 w-3" strokeWidth={1.8} aria-hidden />
      <span>Có HDSD gốc</span>
    </span>
  );
}

function DrugRow({ drug }: { drug: IDrugCatalogRow }) {
  const details = [drug.dosageForm, drug.route].filter(Boolean).join(" • ");
  const hasMeta = Boolean(details) || drug.hasLeaflet !== undefined;

  return (
    <li className="group">
      <Link
        href={`${ROUTES.DRUG_INFORMATION}/${drug.id}`}
        className="flex min-h-full items-start gap-3 rounded-xl border border-transparent bg-surface/35 p-4 transition-[background-color,border-color,box-shadow,transform] duration-300 hover:-translate-y-0.5 hover:border-primary/15 hover:bg-background-elevated hover:shadow-[0_12px_28px_rgba(30,64,110,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-background-elevated text-primary shadow-[inset_0_0_0_1px_rgba(148,163,184,0.12)]">
          <Pill className="h-4.5 w-4.5" strokeWidth={1.8} aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
            {drug.brandName}
          </span>
          <span className="mt-1 block whitespace-pre-line text-xs leading-5 text-foreground-secondary line-clamp-2">
            {drug.ingredient}
          </span>
          {hasMeta ? (
            <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-foreground-muted">
              {details ? <span>{details}</span> : null}
              <LeafletTag hasLeaflet={drug.hasLeaflet} />
            </span>
          ) : null}
        </span>
        <ChevronRight
          className="mt-2.5 h-4 w-4 shrink-0 text-foreground-muted transition-[color,transform] duration-300 group-hover:translate-x-0.5 group-hover:text-primary"
          strokeWidth={1.8}
          aria-hidden
        />
      </Link>
    </li>
  );
}

export default function DrugCatalogList({
  items,
  isLoading,
  isFetching = false,
  emptyTitle = "Không có thuốc nào khớp",
  emptyDescription,
}: DrugCatalogListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2" aria-hidden>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-3 rounded-xl bg-surface/35 p-4">
            <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
            <div className="flex-1 space-y-2 pt-0.5">
              <Skeleton className="h-4 w-3/5 rounded-md" />
              <Skeleton className="h-3.5 w-4/5 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Pill className="h-10 w-10 text-foreground-muted" aria-hidden />}
        title={emptyTitle}
        description={emptyDescription}
      />
    );
  }

  return (
    <ul
      className={`grid gap-3 transition-opacity sm:grid-cols-2 ${isFetching ? "opacity-60" : ""}`}
    >
      {items.map((drug) => (
        <DrugRow key={drug.id} drug={drug} />
      ))}
    </ul>
  );
}
