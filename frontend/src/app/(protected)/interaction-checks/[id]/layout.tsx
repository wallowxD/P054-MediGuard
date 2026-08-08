import type { Metadata } from "next";
import { buildPrivateMetadata } from "@/utils/metadata-utils";

export const metadata: Metadata = buildPrivateMetadata(
  "Chi tiết lượt tra cứu",
  "Kết quả tổng hợp của một lượt tra cứu tương tác thuốc."
);

export default function InteractionCheckDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
