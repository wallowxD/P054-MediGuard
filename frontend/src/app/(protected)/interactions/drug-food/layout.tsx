import type { Metadata } from "next";
import { buildPrivateMetadata } from "@/utils/metadata-utils";

export const metadata: Metadata = buildPrivateMetadata(
  "Tra cứu thuốc – thực phẩm",
  "Tra cứu tương tác thuốc–thực phẩm có trích dẫn nguồn."
);

export default function DrugFoodInteractionsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
