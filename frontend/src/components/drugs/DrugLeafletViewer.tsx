"use client";

import { ExternalLink, FileText, Loader2, Maximize2, Minimize2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toDrivePreviewUrl } from "@/utils/drive";

interface DrugLeafletViewerProps {
  /** Link tài liệu gốc lấy từ `leafletUrl` của thuốc */
  leafletUrl: string;
  /** Tên thuốc, chỉ dùng cho tiêu đề iframe (accessibility) */
  drugName?: string;
}

/** URL trỏ thẳng tới một file PDF (không phải Drive) thì nhúng nguyên URL đó. */
function toDirectPdfUrl(url: string): string | null {
  try {
    return new URL(url).pathname.toLowerCase().endsWith(".pdf") ? url : null;
  } catch {
    return null;
  }
}

/**
 * Nhúng nguyên tờ HDSD (PDF trên Google Drive) vào trang, cuộn được ngay tại chỗ.
 *
 * Không tự render PDF: dùng trình xem sẵn có của Drive qua `/preview` để khỏi kéo thêm
 * pdf.js và khỏi phải proxy file qua backend. Đổi lại, tài liệu phải được chia sẻ ở chế độ
 * "anyone with the link"; nếu không, iframe hiện màn hình yêu cầu đăng nhập của Google —
 * lúc đó link "Mở trong tab mới" bên dưới là lối thoát cho người dùng.
 *
 * Link không nhúng được (không phải Drive, cũng không phải .pdf) thì component tự ẩn,
 * `DrugSourcePanel` vẫn còn link tài liệu gốc.
 */
export default function DrugLeafletViewer({ leafletUrl, drugName }: DrugLeafletViewerProps) {
  const previewUrl = toDrivePreviewUrl(leafletUrl) ?? toDirectPdfUrl(leafletUrl);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Nút toàn màn hình phải bám trạng thái thật của document: người dùng có thể thoát
  // bằng phím Esc mà không đi qua handler của mình.
  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    void containerRef.current?.requestFullscreen();
  }, []);

  if (!previewUrl) return null;

  const title = drugName ? `Tờ hướng dẫn sử dụng ${drugName}` : "Tờ hướng dẫn sử dụng";

  return (
    <div className="rounded-[1.75rem] bg-surface/40 p-1 ring-1 ring-black/[0.035] dark:ring-white/[0.06]">
      <section className="space-y-4 rounded-[1.5rem] bg-background-elevated p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.72)] dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <FileText className="h-4.5 w-4.5" strokeWidth={1.8} aria-hidden />
            </span>
            <div>
              <h2 className="font-heading text-sm font-semibold text-foreground">
                Tờ hướng dẫn sử dụng gốc
              </h2>
              <p className="mt-1 text-xs leading-5 text-foreground-secondary">
                Đọc toàn văn tài liệu do bệnh viện cung cấp.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={toggleFullscreen}
              aria-pressed={isFullscreen}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-border/80 bg-surface/40 px-3 py-1.5 text-xs font-medium text-foreground-secondary transition-[background-color,border-color,color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:border-primary/20 hover:bg-primary/5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
            >
              {isFullscreen ? (
                <Minimize2 className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
              ) : (
                <Maximize2 className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
              )}
              {isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
            </button>
            <a
              href={leafletUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold text-primary transition-[background-color,color,transform] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:bg-primary/5 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"
            >
              Mở trong tab mới
              <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.8} aria-hidden />
            </a>
          </div>
        </div>

        <div
          ref={containerRef}
          className={`relative overflow-hidden bg-surface/60 ${
            isFullscreen ? "bg-background" : "rounded-2xl border border-border/80"
          }`}
        >
          {!isLoaded ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-foreground-muted">
              <Loader2 className="h-5 w-5 animate-spin" strokeWidth={1.8} aria-hidden />
              <p className="text-xs">Đang tải tài liệu gốc…</p>
            </div>
          ) : null}
          <iframe
            src={previewUrl}
            title={title}
            loading="lazy"
            allow="autoplay"
            onLoad={() => setIsLoaded(true)}
            className={`w-full border-0 ${isFullscreen ? "h-[100dvh]" : "h-[70vh] min-h-[420px]"}`}
          />
        </div>

        <p className="text-[11px] leading-5 text-foreground-muted">
          Tài liệu hiển thị trực tiếp từ kho tài liệu của bệnh viện, không qua chỉnh sửa. Nếu khung
          xem trống, hãy mở tài liệu trong tab mới.
        </p>
      </section>
    </div>
  );
}
