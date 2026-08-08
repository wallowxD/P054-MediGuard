import type { Metadata } from "next";
import { buildPrivateMetadata } from "@/utils/metadata-utils";

export const metadata: Metadata = buildPrivateMetadata(
  "Xác nhận danh sách thuốc",
  "Xác nhận thuốc nhận diện từ đơn thuốc với danh mục bệnh viện trước khi tra cứu."
);

export default function PrescriptionReviewLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
