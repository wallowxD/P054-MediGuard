import { History, Pill } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/constants/routes";
import SidebarNavList from "./SidebarNavList";
import SidebarUserFooter from "./SidebarUserFooter";

/** Sidebar trái cố định — chỉ hiển thị từ `lg:` trở lên, thay cho AppHeader cũ */
export default function AppSidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-border bg-background-elevated lg:flex">
      <Link
        href={ROUTES.DASHBOARD}
        className="flex h-14 items-center gap-2 border-b border-border px-4 font-heading text-base font-semibold text-foreground"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <Pill className="h-4 w-4" aria-hidden />
        </span>
        MediGuard
      </Link>

      <div className="flex flex-1 flex-col justify-between overflow-y-auto px-3 py-4">
        <SidebarNavList />

        <div className="mt-6">
          <div className="flex items-center justify-between px-3">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-foreground-muted">
              Lịch sử tra cứu
            </h2>
            <Link
              href={ROUTES.HISTORY}
              className="rounded text-xs font-medium text-primary hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Xem tất cả
            </Link>
          </div>
          <div className="mt-2 flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-3 py-6 text-center">
            <History className="h-5 w-5 text-foreground-muted" aria-hidden />
            <p className="text-xs text-foreground-muted">Chưa có lượt tra cứu nào.</p>
          </div>
        </div>
      </div>

      <SidebarUserFooter />
    </aside>
  );
}
