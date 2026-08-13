import { Pill } from "lucide-react";
import Link from "next/link";
import Logo from "@/components/ui/Logo";
import { ROUTES } from "@/constants/routes";
import SidebarHistory from "./SidebarHistory";
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
        <Logo className="h-8 w-auto" />
      </Link>

      <div className="flex flex-1 flex-col justify-between overflow-y-auto px-3 py-4">
        <SidebarNavList />

        <SidebarHistory />
      </div>

      <SidebarUserFooter />
    </aside>
  );
}
