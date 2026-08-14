import { Combine, Home, Pill } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ROUTES } from "@/constants/routes";

export interface INavItem {
  href: string;
  label: string;
  /** Nhãn ngắn cho BottomNav — thanh hẹp trên mobile không đủ chỗ cho label đầy đủ */
  shortLabel: string;
  Icon: LucideIcon;
}

/** Nguồn duy nhất cho điều hướng chính — dùng lại ở sidebar, drawer mobile và dashboard. */
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
    label: "Tra cứu tương tác thuốc",
    shortLabel: "Tương tác",
    Icon: Combine,
  },
];

/** Ba mục cốt lõi vừa đủ cho thanh điều hướng nhanh trên mobile. */
export const BOTTOM_NAV_ITEMS: INavItem[] = PRIMARY_NAV_ITEMS;

export const isNavItemActive = (pathname: string, href: string): boolean =>
  pathname === href || pathname.startsWith(`${href}/`);
