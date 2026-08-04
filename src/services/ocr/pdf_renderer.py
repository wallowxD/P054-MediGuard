"""PDF Renderer service using PyMuPDF (fitz).

Converts PDF pages into high-resolution images for vision model input.
"""

import base64
import logging
from pathlib import Path
from typing import List, Tuple

import fitz  # PyMuPDF

logger = logging.getLogger(__name__)


class PDFRenderer:
    """Handles rendering PDF document pages to images using PyMuPDF."""

    def __init__(self, dpi: int = 300):
        """Initialize PDF renderer.

        Args:
            dpi: Resolution in dots per inch for rendering PDF pages. Default is 300.
        """
        self.dpi = dpi

    def get_page_count(self, pdf_path: str | Path) -> int:
        """Get total page count of a PDF file.

        Args:
            pdf_path: Path to the PDF document.

        Returns:
            Total page count.
        """
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
        """Render a single page of a PDF file to image bytes.

        Args:
            pdf_path: Path to the PDF file.
            page_index: 0-based index of the page to render.
            dpi: Optional custom DPI override.
            fmt: Image format ('jpeg' or 'png'). Default 'jpeg'.
            quality: Compression quality for JPEG (1-100). Default 85.

        Returns:
            Image bytes.
        """
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
        """Render a single PDF page and encode as base64 data URI string.

        Args:
            pdf_path: Path to the PDF file.
            page_index: 0-based index of the page to render.
            dpi: Optional custom DPI override.
            fmt: Image format ('jpeg' or 'png'). Default 'jpeg'.

        Returns:
            Data URI string (data:image/jpeg;base64,...).
        """
        img_bytes = self.render_page_to_bytes(pdf_path, page_index, dpi=dpi, fmt=fmt)
        b64_str = base64.b64encode(img_bytes).decode("utf-8")
        mime_type = "jpeg" if fmt.lower() in ("jpg", "jpeg") else "png"
        return f"data:image/{mime_type};base64,{b64_str}"

    def render_all_pages_base64(
        self, pdf_path: str | Path, dpi: int | None = None
    ) -> List[Tuple[int, str]]:
        """Render all pages of a PDF to a list of (page_number_1_based, base64_uri).

        Args:
            pdf_path: Path to PDF file.
            dpi: Optional DPI override.

        Returns:
            List of tuples (page_number, base64_image_uri).
        """
        total_pages = self.get_page_count(pdf_path)
        results = []
        for i in range(total_pages):
            b64_uri = self.render_page_to_base64(pdf_path, i, dpi=dpi)
            results.append((i + 1, b64_uri))
        return results
