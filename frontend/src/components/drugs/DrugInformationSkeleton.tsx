import { Skeleton } from "@/components/ui/Skeleton";

/** Khung skeleton cho `/drug-information/[id]` trong lúc chờ dữ liệu thuốc + leaflet */
export default function DrugInformationSkeleton() {
  return (
    <div className="space-y-6" aria-hidden="true">
      <div className="space-y-2">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>

      <div className="space-y-2">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-5/6" />
      </div>

      <Skeleton className="h-24 w-full" />
    </div>
  );
}
