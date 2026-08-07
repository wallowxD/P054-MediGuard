"""Data models for OCR pipeline processing."""


from pydantic import BaseModel, Field


class PageOCRResult(BaseModel):
    """Result of processing a single PDF page."""

    page_number: int = Field(description="1-based page number")
    text: str = Field(default="", description="Transcribed Markdown text of the page")
    is_package_page: bool = Field(
        default=False, description="True if the page was identified as a packaging/label page and ignored"
    )
    error: str | None = Field(default=None, description="Error message if page OCR failed")


class DocumentOCRResult(BaseModel):
    """Result of processing an entire PDF document."""

    file_name: str = Field(description="Original filename of the PDF")
    pdf_path: str = Field(description="Full path to the source PDF")
    total_pages: int = Field(description="Total number of pages in the PDF")
    processed_pages: int = Field(description="Number of non-package pages successfully transcribed")
    markdown_content: str = Field(description="Merged Markdown document string")
    output_path: str | None = Field(
        default=None, description="Path where the final .md file was saved"
    )
    pages: list[PageOCRResult] = Field(default_factory=list, description="Per-page OCR details")


class OCRProcessRequest(BaseModel):
    """Request model for invoking OCR on a PDF document."""

    pdf_path: str = Field(description="Path to local PDF file")
    output_filename: str | None = Field(
        default=None, description="Custom output filename (defaults to <pdf_stem>.md)"
    )
    dpi: int | None = Field(default=None, description="Custom DPI for rendering (defaults to settings)")
