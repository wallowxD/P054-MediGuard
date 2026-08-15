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
    <section className="rounded-3xl liquid-glass p-4 sm:p-5 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="inline-flex items-center gap-1.5 font-heading text-xs font-bold uppercase tracking-wider text-primary">
          <FileText className="h-4 w-4" aria-hidden />
          Tờ hướng dẫn sử dụng gốc
        </h2>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-pressed={isFullscreen}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-foreground-secondary transition-colors hover:bg-surface/80 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Maximize2 className="h-3.5 w-3.5" aria-hidden />
            )}
            {isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
          </button>
          <a
            href={leafletUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-surface/80 hover:text-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Mở trong tab mới
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </a>
        </div>
      </div>

      <div
        ref={containerRef}
        className={`relative overflow-hidden bg-surface/60 ${
          isFullscreen ? "bg-background" : "rounded-2xl border border-border"
        }`}
      >
        {!isLoaded ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-foreground-muted">
            <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            <p className="text-xs">Đang tải tài liệu gốc…</p>
          </div>
        ) : null}
        <iframe
          src={previewUrl}
          title={title}
          loading="lazy"
          allow="autoplay"
          onLoad={() => setIsLoaded(true)}
          className={`w-full border-0 ${isFullscreen ? "h-screen" : "h-[70vh] min-h-[420px]"}`}
        />
      </div>

      <p className="text-[11px] leading-relaxed text-foreground-muted">
        Tài liệu hiển thị trực tiếp từ kho tài liệu của bệnh viện, không qua chỉnh sửa. Nếu khung
        xem trống, hãy mở tài liệu trong tab mới.
      </p>
    </section>
  );
}
