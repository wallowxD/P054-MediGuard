import { ScanText } from "lucide-react";
import EmptyState from "@/components/EmptyState";

export interface IOcrCandidate {
  id: string;
  /** Chuỗi thô OCR nhận diện — chưa phải tên thuốc đã chuẩn hoá */
  rawText: string;
  confidence?: number;
}

interface OcrCandidateListProps {
  candidates: IOcrCandidate[];
}

/**
 * Danh sách candidate OCR — CHƯA phải thuốc đã xác nhận. Người dùng phải xác
 * nhận từng candidate với danh mục bệnh viện (DrugCatalogPicker) trước khi thuốc
 * xuất hiện trong "Thuốc đã xác nhận". Không tự suy ra thuốc nào từ text OCR.
 */
export default function OcrCandidateList({ candidates }: OcrCandidateListProps) {
  if (candidates.length === 0) {
    return (
      <EmptyState
        icon={<ScanText className="h-10 w-10" aria-hidden />}
        title="Chưa có candidate nào từ OCR"
        description="Tên thuốc nhận diện từ ảnh đơn thuốc sẽ hiển thị ở đây để bạn xác nhận với danh mục bệnh viện."
      />
    );
  }

  return (
    <ul className="space-y-2">
      {candidates.map((candidate) => (
        <li
          key={candidate.id}
          className="rounded-lg border border-border bg-background-elevated px-3 py-2 text-sm text-foreground"
        >
          {candidate.rawText}
        </li>
      ))}
    </ul>
  );
}
