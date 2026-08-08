import type { Metadata } from "next";
import { buildPrivateMetadata } from "@/utils/metadata-utils";

export const metadata: Metadata = buildPrivateMetadata(
  "Tra cứu thông tin thuốc",
  "Thông tin có dẫn nguồn từ tờ hướng dẫn sử dụng."
);

export default function DrugInformationLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
