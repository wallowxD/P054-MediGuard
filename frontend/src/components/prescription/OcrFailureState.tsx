import { AlertTriangle, Search, Upload } from "lucide-react";
import Button from "@/components/ui/Button";

interface OcrFailureStateProps {
  onPickAnotherImage: () => void;
  onSearchManually: () => void;
}

/** Trạng thái OCR thất bại — không quy nguyên nhân y khoa, chỉ gợi ý bước tiếp theo. */
export default function OcrFailureState({
  onPickAnotherImage,
  onSearchManually,
}: OcrFailureStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-4 rounded-xl border border-error/30 bg-error/10 px-6 py-12 text-center"
    >
      <AlertTriangle className="h-8 w-8 text-error" aria-hidden />
      <div className="space-y-1">
        <p className="text-base font-medium text-foreground">Chưa thể nhận diện đơn thuốc</p>
        <p className="max-w-md text-sm text-foreground-secondary">
          Hãy chọn ảnh rõ nét hơn, hoặc tìm thuốc thủ công trong danh mục bệnh viện.
        </p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button variant="outline" size="sm" onClick={onPickAnotherImage}>
          <Upload className="h-4 w-4" aria-hidden />
          Chọn ảnh khác
        </Button>
        <Button variant="solid" size="sm" onClick={onSearchManually}>
          <Search className="h-4 w-4" aria-hidden />
          Tìm thuốc thủ công
        </Button>
      </div>
    </div>
  );
}
