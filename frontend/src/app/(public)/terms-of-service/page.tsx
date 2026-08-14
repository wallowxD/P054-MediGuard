import type { Metadata } from "next";
import { MAIN_CONTENT_ID } from "@/components/ui/SkipLink";
import { buildPublicMetadata } from "@/utils/metadata-utils";

export const metadata: Metadata = buildPublicMetadata(
  "Điều khoản sử dụng",
  "Điều khoản sử dụng Medication Safety Copilot.",
  "/terms-of-service"
);

// TODO: điền nội dung pháp lý thật. Bắt buộc nêu rõ: sản phẩm chỉ cung cấp thông tin
// tham khảo, không thay thế chẩn đoán/kê đơn của bác sĩ.
export default function TermsOfServicePage() {
  return (
    <main id={MAIN_CONTENT_ID} tabIndex={-1} className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-foreground">Điều khoản sử dụng</h1>
      <p className="mt-4 text-sm text-foreground-secondary">Nội dung đang được soạn.</p>
    </main>
  );
}
