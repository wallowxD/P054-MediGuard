"use client";

import { FileText, Pill } from "lucide-react";
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
      <FileText className="h-3 w-3" aria-hidden />
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
        className="block rounded-2xl liquid-glass-subtle p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <p className="text-xs sm:text-sm font-bold text-foreground transition-colors group-hover:text-primary">
          {drug.brandName}
        </p>
        <p className="mt-1 whitespace-pre-line text-xs text-foreground-secondary line-clamp-2">
          {drug.ingredient}
        </p>
        {hasMeta ? (
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-foreground-muted">
            {details ? <span>{details}</span> : null}
            <LeafletTag hasLeaflet={drug.hasLeaflet} />
          </div>
        ) : null}
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
          <div key={i} className="rounded-2xl liquid-glass-subtle p-4 space-y-2">
            <Skeleton className="h-4 w-3/5 rounded-lg" />
            <Skeleton className="h-3.5 w-4/5 rounded-lg" />
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
