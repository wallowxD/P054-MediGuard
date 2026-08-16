"""Unit tests for Qwen3-VL Flash OCR Pipeline and Dataset Link Verification."""

from pathlib import Path
from unittest.mock import MagicMock, patch

import fitz  # PyMuPDF
import pytest
from src.models.ocr import DocumentOCRResult
from src.services.dataset_service import update_dataset_link_notes
from src.services.ocr.pdf_renderer import PDFRenderer
from src.services.ocr.pipeline import OCRPipeline
from src.services.ocr.qwen_client import QwenVLClient


@pytest.fixture
def sample_pdf(tmp_path: Path) -> Path:
    """Create a temporary multi-page PDF for testing using PyMuPDF."""
    pdf_path = tmp_path / "test_drug_leaflet.pdf"
    doc = fitz.open()

    # Page 1: Packaging page mock
    page1 = doc.new_page()
    page1.insert_text((50, 50), "MẪU NHÃN ĐĂNG KÝ - SA VI ACARBOSE 50")

    # Page 2: Leaflet page mock
    page2 = doc.new_page()
    page2.insert_text((50, 50), "TỜ HƯỚNG DẪN SỬ DỤNG THUỐC\n# Grandaxin\n## Thành phần\nTofisopam 50mg")

    doc.save(pdf_path)
    doc.close()
    return pdf_path


def test_pdf_renderer(sample_pdf: Path):
    """Test PDFRenderer get_page_count and rendering."""
    renderer = PDFRenderer(dpi=150)
    page_count = renderer.get_page_count(sample_pdf)
    assert page_count == 2

    b64_uri = renderer.render_page_to_base64(sample_pdf, page_index=0)
    assert b64_uri.startswith(("data:image/png;base64,", "data:image/jpeg;base64,"))
    assert len(b64_uri) > 100

    all_pages = renderer.render_all_pages_base64(sample_pdf)
    assert len(all_pages) == 2
    assert all_pages[0][0] == 1
    assert all_pages[1][0] == 2


def test_qwen_client_clean_fences():
    """Test markdown fence removal in QwenVLClient."""
    client = QwenVLClient(api_key="mock_key")

    raw_markdown = "```markdown\n# Grandaxin\n## Thành phần\n```"
    cleaned = client._clean_markdown_fences(raw_markdown)
    assert cleaned == "# Grandaxin\n## Thành phần"

    raw_code = "```md\n| Header 1 | Header 2 |\n| --- | --- |\n```"
    cleaned_code = client._clean_markdown_fences(raw_code)
    assert cleaned_code == "| Header 1 | Header 2 |\n| --- | --- |"

    empty_input = ""
    assert client._clean_markdown_fences(empty_input) == ""


def test_qwen_client_missing_api_key():
    """Test QwenVLClient raises ValueError when API key is missing."""
    client = QwenVLClient(api_key="")
    with pytest.raises(ValueError, match="QWEN_API_KEY is not set"):
        client.process_page_image("data:image/png;base64,fake")


def test_ocr_pipeline_mocked(sample_pdf: Path, tmp_path: Path):
    """Test OCRPipeline end-to-end with mocked QwenVLClient."""
    mock_client = MagicMock(spec=QwenVLClient)

    # Page 1 -> empty string (package page ignored)
    # Page 2 -> Markdown content
    mock_client.process_page_image.side_effect = [
        "",
        "# Grandaxin\n\n## Thành phần\n\nTofisopam 50mg",
    ]

    out_dir = tmp_path / "output"
    pipeline = OCRPipeline(client=mock_client, output_dir=out_dir, dpi=150)
    result: DocumentOCRResult = pipeline.process_pdf(sample_pdf)

    assert result.file_name == "test_drug_leaflet.pdf"
    assert result.total_pages == 2
    assert result.processed_pages == 1
    assert "# Grandaxin" in result.markdown_content
    assert "Tofisopam 50mg" in result.markdown_content

    # Verify file saved on disk
    expected_out_file = out_dir / "test_drug_leaflet.md"
    assert expected_out_file.exists()
    saved_text = expected_out_file.read_text(encoding="utf-8")
    assert saved_text == result.markdown_content
    assert "```markdown" not in saved_text


def test_dataset_service_link_check(tmp_path: Path):
    """Test dataset link verification and CSV notes column update."""
    csv_file = tmp_path / "test_dataset.csv"
    csv_content = (
        "Biet duoc,Link HDSD 1,Link 2\n"
        "Drug A,https://example.com/link1,\n"
        "Drug B,https://example.com/deadlink,https://example.com/link2\n"
        "Drug C,,\n"
    )
    csv_file.write_text(csv_content, encoding="utf-8")

    def mock_check(url: str, timeout: float = 5.0) -> bool:
        return "link" in url and "dead" not in url

    with patch("src.services.dataset_service.check_url_active", side_effect=mock_check):
        updated_path = update_dataset_link_notes(csv_file, max_workers=2, timeout=5.0)

    assert updated_path.exists()

    lines = updated_path.read_text(encoding="utf-8").splitlines()
    header = lines[0]
    assert "notes" in header

    # Verify notes populated
    assert "Link 1: Active" in lines[1]
    assert "Link 2: Active" in lines[2]
    assert "No link" in lines[3]

