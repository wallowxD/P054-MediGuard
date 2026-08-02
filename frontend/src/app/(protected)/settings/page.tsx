"use client";

import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-semibold text-foreground">Cài đặt</h1>

      <dl className="rounded-xl border border-border bg-card p-4 text-sm">
        <div className="flex justify-between gap-4 py-1.5">
          <dt className="text-foreground-secondary">Tên</dt>
          <dd className="text-foreground">{session?.user?.name ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4 py-1.5">
          <dt className="text-foreground-secondary">Email</dt>
          <dd className="text-foreground">{session?.user?.email ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-4 py-1.5">
          <dt className="text-foreground-secondary">Vai trò</dt>
          <dd className="text-foreground">{session?.user?.roles?.join(", ") || "—"}</dd>
        </div>
      </dl>
    </div>
  );
}
