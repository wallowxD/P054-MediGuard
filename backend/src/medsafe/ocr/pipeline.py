"""OCR Pipeline Orchestrator.

Quản lý luồng xử lý toàn trình từ file PDF thành Markdown sạch.
"""

import logging
from pathlib import Path

from tqdm import tqdm

from medsafe.config import get_settings
from medsafe.ocr.gemini_client import GeminiVLClient
from medsafe.ocr.pdf_renderer import PDFRenderer
from medsafe.ocr.qwen_client import QwenVLClient
from medsafe.schemas.ocr import DocumentOCRResult, PageOCRResult

logger = logging.getLogger(__name__)


class OCRPipeline:
    """Điều phối render trang PDF, gọi Vision LLM, gộp trang và lưu file Markdown."""

    def __init__(
        self,
        renderer: PDFRenderer | None = None,
        client: QwenVLClient | GeminiVLClient | None = None,
        output_dir: str | Path | None = None,
        dpi: int | None = None,
        provider: str | None = None,
    ):
        settings = get_settings()
        self.dpi = dpi or getattr(settings, "ocr_dpi", 300)
        self.renderer = renderer or PDFRenderer(dpi=self.dpi)
        self.output_dir = Path(output_dir or getattr(settings, "output_dir", "output"))

        if client is not None:
            self.client = client
        else:
            selected_provider = (provider or getattr(settings, "ocr_provider", "qwen") or "qwen").lower()
            gemini_key = getattr(settings, "gemini_api_key", "") or settings.google_api_key
            if selected_provider == "gemini" or (gemini_key and selected_provider != "qwen"):
                logger.info("Initializing OCR Pipeline with GeminiVLClient...")
                self.client = GeminiVLClient()
            else:
                logger.info("Initializing OCR Pipeline with QwenVLClient...")
                self.client = QwenVLClient()

    def process_pdf(
        self,
        pdf_path: str | Path,
        output_filename: str | None = None,
        skip_existing: bool = True,
        proofread: bool = False,
    ) -> DocumentOCRResult:
        pdf_path = Path(pdf_path)
        if not pdf_path.exists():
            raise FileNotFoundError(f"Source PDF does not exist: {pdf_path}")

        file_name = pdf_path.name
        stem = pdf_path.stem
        out_name = output_filename or f"{stem}.md"
        save_path = self.output_dir / out_name

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

        merged_markdown = "\n\n".join(valid_page_texts).strip()

        if proofread and merged_markdown:
            from medsafe.ocr.line_proofreader import LineDiffProofreader

            logger.info("Running Gemini Line-Diff Proofreader to fix typos...")
            proofreader = LineDiffProofreader()
            merged_markdown = proofreader.proofread_markdown(merged_markdown)

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
