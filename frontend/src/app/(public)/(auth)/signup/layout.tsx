import type { Metadata } from "next";
import { buildPrivateMetadata } from "@/utils/metadata-utils";

export const metadata: Metadata = buildPrivateMetadata("Đăng ký");

export default function SignUpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
