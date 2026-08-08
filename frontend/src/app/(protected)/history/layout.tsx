import type { Metadata } from "next";
import { buildPrivateMetadata } from "@/utils/metadata-utils";

export const metadata: Metadata = buildPrivateMetadata(
  "Lịch sử tra cứu",
  "Danh sách các lượt tra cứu tương tác thuốc đã thực hiện."
);

export default function HistoryLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
