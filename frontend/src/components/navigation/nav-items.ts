import { Apple, Combine, HeartPulse, Home, Pill } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROUTES } from "@/constants/routes";

export interface INavItem {
  href: string;
  label: string;
  /** Nhãn ngắn cho BottomNav — thanh hẹp trên mobile không đủ chỗ cho label đầy đủ */
  shortLabel: string;
  Icon: LucideIcon;
  /** Chưa nối backend thật — hiển thị badge "Chưa hỗ trợ" ở nơi liệt kê tính năng */
  unsupported?: boolean;
}

/** Nguồn duy nhất cho 5 mục điều hướng chính — dùng lại ở sidebar, drawer mobile và dashboard */
export const PRIMARY_NAV_ITEMS: INavItem[] = [
  { href: ROUTES.DASHBOARD, label: "Trang chủ", shortLabel: "Trang chủ", Icon: Home },
  {
    href: ROUTES.DRUG_INFORMATION,
    label: "Tra cứu thông tin thuốc",
    shortLabel: "Thông tin thuốc",
    Icon: Pill,
  },
  {
    href: ROUTES.INTERACTIONS_DRUG_DRUG,
    label: "Tra cứu thuốc – thuốc",
    shortLabel: "Thuốc – thuốc",
    Icon: Combine,
    unsupported: true,
  },
  {
    href: ROUTES.INTERACTIONS_DRUG_FOOD,
    label: "Tra cứu thuốc – thực phẩm",
    shortLabel: "Thuốc – thực phẩm",
    Icon: Apple,
    unsupported: true,
  },
  {
    href: ROUTES.INTERACTIONS_DRUG_DISEASE,
    label: "Tra cứu thuốc – bệnh nền",
    shortLabel: "Thuốc – bệnh nền",
    Icon: HeartPulse,
    unsupported: true,
  },
];

/** BottomNav trên mobile chỉ giữ các mục cốt lõi, tránh quá tải thanh điều hướng dưới */
export const BOTTOM_NAV_ITEMS: INavItem[] = PRIMARY_NAV_ITEMS.slice(0, 4);

export const isNavItemActive = (pathname: string, href: string): boolean =>
  pathname === href || pathname.startsWith(`${href}/`);
