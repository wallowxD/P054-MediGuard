"use client";

import { AlertTriangle } from "lucide-react";
import EmptyState from "@/components/EmptyState";
import { TextSkeleton } from "@/components/ui/Skeleton";
import { useInteractionCheckDetail } from "@/queries/interactions";
import { useDeleteInteractionCheck } from "@/queries/interactions";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { ROUTES } from "@/constants/routes";
import UnifiedInteractionResults from "./UnifiedInteractionResults";

export default function InteractionCheckDetail({ id }: { id: string }) {
  const { data, isLoading, isError } = useInteractionCheckDetail(id);
  const remove = useDeleteInteractionCheck();
  const router = useRouter();
  if (isLoading) return <div className="rounded-xl border border-border bg-card p-5"><TextSkeleton lines={8} /></div>;
  if (isError || !data) return <EmptyState icon={<AlertTriangle className="h-10 w-10" />} title="Không thể tải lượt tra cứu này" description="Lượt tra cứu không tồn tại hoặc không thuộc tài khoản của bạn." />;
  return <div className="space-y-6"><header className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-xs text-foreground-muted">{new Date(data.checkedAt).toLocaleString("vi-VN")}</p><h1 className="mt-1 text-2xl font-semibold text-foreground">{data.drugs.map((drug) => drug.brandName).join(" + ")}</h1>{data.diseases.length ? <p className="mt-2 text-sm text-foreground-secondary">Bệnh nền đã xác nhận: {data.diseases.map((disease) => disease.name).join(", ")}</p> : null}</div><Button variant="outline" size="sm" disabled={remove.isPending} onClick={() => { if (window.confirm("Xoá lượt tra cứu này?")) remove.mutate(id, { onSuccess: () => router.push(ROUTES.HISTORY) }); }}>Xoá lượt tra cứu</Button></header><UnifiedInteractionResults result={data} /></div>;
}
