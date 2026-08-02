import type { Metadata } from "next";
import { buildPrivateMetadata } from "@/utils/metadata-utils";

// noindex: trang auth không được để Google index
export const metadata: Metadata = buildPrivateMetadata("Đăng nhập");

export default function SignInLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
