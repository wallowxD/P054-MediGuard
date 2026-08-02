import type { Metadata } from "next";
import { buildPrivateMetadata } from "@/utils/metadata-utils";

export const metadata: Metadata = buildPrivateMetadata(
  "Tra tương tác",
  "Tra tương tác thuốc–thuốc và thuốc–thực phẩm có trích dẫn nguồn."
);

export default function InteractionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
