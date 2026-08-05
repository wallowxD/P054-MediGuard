"""OCR Pipeline Orchestrator.

Manages end-to-end processing of PDF files to clean Markdown files using Qwen3-VL Flash.
"""

import logging
from pathlib import Path
from typing import Optional

from tqdm import tqdm

from src.config import get_settings
from src.models.ocr import DocumentOCRResult, PageOCRResult
from src.services.ocr.gemini_client import GeminiVLClient
from src.services.ocr.pdf_renderer import PDFRenderer
from src.services.ocr.qwen_client import QwenVLClient

logger = logging.getLogger(__name__)


class OCRPipeline:
    """Orchestrates PDF page rendering, vision model API processing (Qwen / Gemini), page merging, and output saving."""

    def __init__(
        self,
        renderer: Optional[PDFRenderer] = None,
        client: Optional[QwenVLClient | GeminiVLClient] = None,
        output_dir: Optional[str | Path] = None,
        dpi: Optional[int] = None,
        provider: Optional[str] = None,
    ):
        """Initialize OCR Pipeline.

        Args:
            renderer: PDFRenderer instance. Created with settings default if None.
            client: QwenVLClient or GeminiVLClient instance. Created automatically if None.
            output_dir: Output directory for Markdown files. Defaults to settings.output_dir.
            dpi: Rendering DPI. Defaults to settings.ocr_dpi.
            provider: OCR provider ('qwen' or 'gemini'). Defaults to settings.ocr_provider.
        """
        settings = get_settings()
        self.dpi = dpi or settings.ocr_dpi
        self.renderer = renderer or PDFRenderer(dpi=self.dpi)
        self.output_dir = Path(output_dir or settings.output_dir)

        if client is not None:
            self.client = client
        else:
            selected_provider = (provider or settings.ocr_provider or "qwen").lower()
            if selected_provider == "gemini" or (
                settings.gemini_api_key or settings.google_api_key
            ) and selected_provider != "qwen":
                logger.info("Initializing OCR Pipeline with GeminiVLClient...")
                self.client = GeminiVLClient()
            else:
                logger.info("Initializing OCR Pipeline with QwenVLClient...")
                self.client = QwenVLClient()

    def process_pdf(
        self,
        pdf_path: str | Path,
        output_filename: Optional[str] = None,
        skip_existing: bool = True,
        proofread: bool = False,
    ) -> DocumentOCRResult:
        """Run complete OCR pipeline on a PDF file.

        Args:
            pdf_path: Path to the input PDF file.
            output_filename: Optional custom output filename (e.g., 'drug.md').
            skip_existing: If True and target .md output exists and is non-empty, skip reprocessing.
            proofread: If True, run Gemini Line-Diff Proofreader to fix typos in the output Markdown.

        Returns:
            DocumentOCRResult containing metadata, per-page results, and merged Markdown.
        """
        pdf_path = Path(pdf_path)
        if not pdf_path.exists():
            raise FileNotFoundError(f"Source PDF does not exist: {pdf_path}")

        file_name = pdf_path.name
        stem = pdf_path.stem
        out_name = output_filename or f"{stem}.md"
        save_path = self.output_dir / out_name

        # Resume support: skip if output already exists
        if skip_existing and save_path.exists() and save_path.stat().st_size > 0:
            logger.info(f"Output file already exists at '{save_path}'. Skipping OCR.")
            existing_content = save_path.read_text(encoding="utf-8")
            total_pages = self.renderer.get_page_count(pdf_path)
            return DocumentOCRResult(
                file_name=file_name,
                pdf_path=str(pdf_path.resolve()),
                total_pages=total_pages,
                processed_pages=total_pages,
                markdown_content=existing_content,
                output_path=str(save_path.resolve()),
                pages=[],
            )

        logger.info(f"Starting OCR processing for PDF: {pdf_path}")

        # Render PDF pages to base64 images
        rendered_pages = self.renderer.render_all_pages_base64(pdf_path, dpi=self.dpi)
        total_pages = len(rendered_pages)
        logger.info(f"Rendered {total_pages} page(s) at {self.dpi} DPI.")

        page_results = []
        valid_page_texts = []

        for page_num, b64_uri in tqdm(
            rendered_pages, desc=f"OCR {file_name}", unit="page"
        ):
            try:
                page_text = self.client.process_page_image(b64_uri)
                # Check if page was package/ignored
                is_package = not bool(page_text.strip())

                result = PageOCRResult(
                    page_number=page_num,
                    text=page_text,
                    is_package_page=is_package,
                )
                page_results.append(result)

                if not is_package:
                    valid_page_texts.append(page_text)
                    logger.info(
                        f"Page {page_num}/{total_pages}: Transcribed successfully ({len(page_text)} chars)."
                    )
                else:
                    logger.info(
                        f"Page {page_num}/{total_pages}: Identified as package/non-content page (ignored)."
                    )

            except Exception as e:
                logger.error(f"Error processing page {page_num}: {e}")
                result = PageOCRResult(
                    page_number=page_num,
                    text="",
                    is_package_page=False,
                    error=str(e),
                )
                page_results.append(result)

        # Merge page texts in order
        merged_markdown = "\n\n".join(valid_page_texts).strip()

        # Optional Line-Diff Proofreading step
        if proofread and merged_markdown:
            from src.services.ocr.line_proofreader import LineDiffProofreader

            logger.info("Running Gemini Line-Diff Proofreader to fix typos...")
            proofreader = LineDiffProofreader()
            merged_markdown = proofreader.proofread_markdown(merged_markdown)

        # Save to output file
        self.output_dir.mkdir(parents=True, exist_ok=True)
        save_path = self.output_dir / out_name

        save_path.write_text(merged_markdown, encoding="utf-8")
        logger.info(f"Saved merged Markdown to: {save_path}")

        doc_result = DocumentOCRResult(
            file_name=file_name,
            pdf_path=str(pdf_path.resolve()),
            total_pages=total_pages,
            processed_pages=len(valid_page_texts),
            markdown_content=merged_markdown,
            output_path=str(save_path.resolve()),
            pages=page_results,
        )

        return doc_result
