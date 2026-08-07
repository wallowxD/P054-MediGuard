"""PDF Renderer service dùng PyMuPDF (fitz).

Chuyển đổi các trang PDF thành ảnh độ phân giải cao để đưa vào Vision model.
"""

import base64
import logging
from pathlib import Path

try:
    import fitz  # PyMuPDF
except ImportError:
    fitz = None

logger = logging.getLogger(__name__)


class PDFRenderer:
    """Xử lý render trang tài liệu PDF thành ảnh dùng PyMuPDF."""

    def __init__(self, dpi: int = 300):
        self.dpi = dpi

    def get_page_count(self, pdf_path: str | Path) -> int:
        pdf_path = Path(pdf_path)
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")

        doc = fitz.open(pdf_path)
        try:
            return len(doc)
        finally:
            doc.close()

    def render_page_to_bytes(
        self,
        pdf_path: str | Path,
        page_index: int,
        dpi: int | None = None,
        fmt: str = "jpeg",
        quality: int = 85,
    ) -> bytes:
        pdf_path = Path(pdf_path)
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")

        render_dpi = dpi or self.dpi
        doc = fitz.open(pdf_path)
        try:
            if page_index < 0 or page_index >= len(doc):
                raise IndexError(
                    f"Page index {page_index} out of range for doc with {len(doc)} pages."
                )

            page = doc[page_index]
            pix = page.get_pixmap(dpi=render_dpi)
            if fmt.lower() in ("jpg", "jpeg"):
                return pix.tobytes(output="jpg", jpg_quality=quality)
            return pix.tobytes(output="png")
        finally:
            doc.close()

    def render_page_to_base64(
        self,
        pdf_path: str | Path,
        page_index: int,
        dpi: int | None = None,
        fmt: str = "jpeg",
    ) -> str:
        img_bytes = self.render_page_to_bytes(pdf_path, page_index, dpi=dpi, fmt=fmt)
        b64_str = base64.b64encode(img_bytes).decode("utf-8")
        mime_type = "jpeg" if fmt.lower() in ("jpg", "jpeg") else "png"
        return f"data:image/{mime_type};base64,{b64_str}"

    def render_all_pages_base64(
        self, pdf_path: str | Path, dpi: int | None = None
    ) -> list[tuple[int, str]]:
        total_pages = self.get_page_count(pdf_path)
        results = []
        for i in range(total_pages):
            b64_uri = self.render_page_to_base64(pdf_path, i, dpi=dpi)
            results.append((i + 1, b64_uri))
        return results

    def render_pdf_to_images(
        self,
        pdf_path: str | Path,
        output_dir: str | Path,
        dpi: int | None = None,
        fmt: str = "png",
        skip_existing: bool = True,
    ) -> list[Path]:
        pdf_path = Path(pdf_path)
        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")

        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        render_dpi = dpi or self.dpi
        doc = fitz.open(pdf_path)
        saved_paths: list[Path] = []
        try:
            total_pages = len(doc)
            for page_index in range(total_pages):
                page_num = page_index + 1
                ext = fmt.lower()
                if ext in ("jpg", "jpeg"):
                    ext = "jpeg"
                img_path = output_dir / f"page_{page_num:03d}.{ext}"

                if skip_existing and img_path.exists() and img_path.stat().st_size > 0:
                    saved_paths.append(img_path)
                    continue

                page = doc[page_index]
                pix = page.get_pixmap(dpi=render_dpi)
                if ext in ("jpg", "jpeg"):
                    pix.save(str(img_path), output="jpg", jpg_quality=95)
                else:
                    pix.save(str(img_path), output="png")

                saved_paths.append(img_path)
        finally:
            doc.close()

        return saved_paths
