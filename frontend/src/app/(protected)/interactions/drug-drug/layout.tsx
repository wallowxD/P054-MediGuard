import type { Metadata } from "next";
import { buildPrivateMetadata } from "@/utils/metadata-utils";

export const metadata: Metadata = buildPrivateMetadata(
  "Tra cứu thuốc – thuốc",
  "Tra cứu tương tác thuốc–thuốc có trích dẫn nguồn."
);

export default function DrugDrugInteractionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
