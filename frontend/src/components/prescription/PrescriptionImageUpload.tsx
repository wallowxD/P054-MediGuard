"use client";

import { AlertCircle, ImageOff, Trash2, Upload, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
const ACCEPTED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

interface ISelectedImage {
  id: string;
  file: File;
  previewUrl: string;
}

interface PrescriptionImageUploadProps {
  /** Khoá toàn bộ tương tác — dùng ở màn ngoài phạm vi (drug-disease) */
  disabled?: boolean;
  /** Mô tả thay thế khi `disabled`, giải thích lý do bị khoá */
  disabledDescription?: string;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isAcceptedType(file: File): boolean {
  if (ACCEPTED_TYPES.includes(file.type as (typeof ACCEPTED_TYPES)[number])) return true;
  const lowerName = file.name.toLowerCase();
  return ACCEPTED_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

/**
 * Uploader ảnh đơn thuốc — chỉ chọn/preview trên thiết bị, không upload lên server,
 * không gọi API, không OCR. Dùng ở các màn tra cứu tương tác để demo luồng nhập ảnh
 * đơn thuốc trong tương lai; hiện tại ảnh không rời khỏi trình duyệt.
 */
export default function PrescriptionImageUpload({
  disabled = false,
  disabledDescription,
}: PrescriptionImageUploadProps) {
  const [images, setImages] = useState<ISelectedImage[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inputId = useId();
  const errorId = useId();

  // Object URL chỉ sống trong bộ nhớ trình duyệt — thu hồi khi ảnh bị xoá hoặc unmount
  // để tránh memory leak.
  useEffect(() => {
    return () => {
      images.forEach((image) => URL.revokeObjectURL(image.previewUrl));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const accepted: ISelectedImage[] = [];
    const nextErrors: string[] = [];

    for (const file of files) {
      if (!isAcceptedType(file)) {
        nextErrors.push(`"${file.name}" không đúng định dạng. Chỉ nhận JPG, JPEG, PNG hoặc WEBP.`);
        continue;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
        nextErrors.push(`"${file.name}" vượt quá dung lượng cho phép (tối đa 10 MB).`);
        continue;
      }
      accepted.push({
        id: `${file.name}-${file.lastModified}-${file.size}-${crypto.randomUUID()}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (accepted.length > 0) {
      setImages((prev) => [...prev, ...accepted]);
    }
    setErrors(nextErrors);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files);
    }
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(e.dataTransfer.files);
    }
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find((image) => image.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((image) => image.id !== id);
    });
  };

  const clearAll = () => {
    setImages((prev) => {
      prev.forEach((image) => URL.revokeObjectURL(image.previewUrl));
      return [];
    });
    setErrors([]);
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card p-4 sm:p-5">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold text-foreground">Ảnh đơn thuốc</h2>
        <p className="text-xs text-foreground-secondary">
          {disabled
            ? (disabledDescription ??
              "Không thể xử lý đơn thuốc vì tính năng này chưa thuộc phạm vi hỗ trợ hiện tại.")
            : "Ảnh hiện chỉ được chọn trên thiết bị. Tính năng tải lên và nhận diện đơn thuốc chưa được hỗ trợ."}
        </p>
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        aria-disabled={disabled}
        className={`flex flex-col items-center gap-3 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
          disabled
            ? "border-border bg-background-elevated opacity-60"
            : isDragging
              ? "border-primary bg-surface"
              : "border-border"
        }`}
      >
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-hero-tint text-primary">
          <Upload className="h-5 w-5" aria-hidden />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Kéo thả ảnh đơn thuốc vào đây</p>
          <p className="text-xs text-foreground-muted">JPG, JPEG, PNG hoặc WEBP — tối đa 10 MB mỗi ảnh</p>
        </div>

        <label htmlFor={inputId} className="sr-only">
          Chọn ảnh đơn thuốc
        </label>
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          multiple
          accept={[...ACCEPTED_TYPES, ...ACCEPTED_EXTENSIONS].join(",")}
          onChange={handleInputChange}
          disabled={disabled}
          aria-describedby={errors.length > 0 ? errorId : undefined}
          className="sr-only"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled}
          className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground-secondary hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:border-border disabled:hover:text-foreground-secondary"
        >
          <Upload className="h-4 w-4" aria-hidden />
          Chọn ảnh đơn thuốc
        </button>
      </div>

      {errors.length > 0 ? (
        <div
          id={errorId}
          role="alert"
          className="flex flex-col gap-1 rounded-lg border border-error/30 bg-error/10 px-3 py-2"
        >
          {errors.map((message, i) => (
            <p key={i} className="flex items-start gap-1.5 text-xs text-error">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {message}
            </p>
          ))}
        </div>
      ) : null}

      {images.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border px-3 py-6 text-center">
          <ImageOff className="h-5 w-5 text-foreground-muted" aria-hidden />
          <p className="text-xs text-foreground-muted">Chưa có ảnh nào được chọn.</p>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-foreground-secondary">
              Đã chọn {images.length} ảnh
            </p>
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground-muted hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Xoá tất cả
            </button>
          </div>

          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {images.map((image) => (
              <li
                key={image.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-background-elevated p-2"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- object URL cục bộ, không phải ảnh tối ưu next/image */}
                <img
                  src={image.previewUrl}
                  alt=""
                  className="h-12 w-12 shrink-0 rounded-md object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground">{image.file.name}</p>
                  <p className="text-xs text-foreground-muted">{formatFileSize(image.file.size)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removeImage(image.id)}
                  aria-label={`Xoá ${image.file.name}`}
                  className="shrink-0 rounded-full p-1.5 text-foreground-muted hover:bg-surface hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="h-3.5 w-3.5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
