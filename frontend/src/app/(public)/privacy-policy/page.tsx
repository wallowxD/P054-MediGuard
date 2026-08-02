import type { Metadata } from "next";
import { buildPublicMetadata } from "@/utils/metadata-utils";

export const metadata: Metadata = buildPublicMetadata(
  "Chính sách bảo mật",
  "Chính sách bảo mật của Medication Safety Copilot.",
  "/privacy-policy"
);

// TODO: điền nội dung pháp lý thật trước khi lên production
export default function PrivacyPolicyPage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-2xl font-semibold text-foreground">Chính sách bảo mật</h1>
      <p className="mt-4 text-sm text-foreground-secondary">Nội dung đang được soạn.</p>
    </main>
  );
}
