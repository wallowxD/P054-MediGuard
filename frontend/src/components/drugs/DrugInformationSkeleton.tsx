import { Skeleton } from "@/components/ui/Skeleton";

/** Khung skeleton cho `/drug-information/[id]` trong lúc chờ dữ liệu thuốc + leaflet */
export default function DrugInformationSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="rounded-[1.75rem] bg-surface/45 p-1 ring-1 ring-black/[0.04] dark:ring-white/[0.07]">
        <div className="rounded-[1.5rem] bg-background-elevated px-5 py-6 sm:px-7 sm:py-7">
          <div className="space-y-4">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-10 w-56" />
            <Skeleton className="h-5 w-80 max-w-full" />
            <div className="flex gap-2">
              <Skeleton className="h-7 w-28 rounded-lg" />
              <Skeleton className="h-7 w-36 rounded-lg" />
            </div>
          </div>

          <div className="mt-6 grid gap-3 border-t border-border/70 pt-5 sm:grid-cols-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>

      <div className="grid gap-5 lg:grid-cols-[14.5rem_minmax(0,1fr)]">
        <Skeleton className="h-72 w-full rounded-2xl" />
        <div className="rounded-[1.75rem] bg-surface/40 p-1 ring-1 ring-black/[0.035] dark:ring-white/[0.06]">
          <div className="space-y-6 rounded-[1.5rem] bg-background-elevated p-6 sm:p-7">
            <div className="flex gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-64 max-w-full" />
                <Skeleton className="h-4 w-96 max-w-full" />
              </div>
            </div>
            <div className="border-t border-border/70 pt-6">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="mt-4 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-11/12" />
              <Skeleton className="mt-2 h-4 w-4/5" />
            </div>
            <div className="border-t border-border/70 pt-6">
              <Skeleton className="h-6 w-52" />
              <Skeleton className="mt-4 h-4 w-full" />
              <Skeleton className="mt-2 h-4 w-5/6" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
