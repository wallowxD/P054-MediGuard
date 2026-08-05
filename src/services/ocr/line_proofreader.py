"""Line-Diff Proofreader Service using Gemini.

Sends numbered text lines to Gemini API and receives ONLY JSON corrections for lines with typos,
then applies line-level replacements in Python. Saves 95%+ of output tokens.
"""

import json
import logging
from typing import List, Optional

import requests

from src.config import get_settings

logger = logging.getLogger(__name__)


class LineDiffProofreader:
    """Proofreads Markdown text line-by-line using Gemini JSON diff output."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        base_url: Optional[str] = None,
    ):
        """Initialize LineDiffProofreader.

        Args:
            api_key: Gemini or Google API key. Defaults to settings.
            model: Model name. Defaults to settings.gemini_model.
            base_url: OpenAI-compatible or Native base URL.
        """
        settings = get_settings()
        self.api_key = (
            api_key
            if api_key is not None
            else (settings.gemini_api_key or settings.google_api_key)
        )
        self.model = model or "gemini-3.6-flash"

    def proofread_markdown(self, markdown_text: str) -> str:
        """Proofread Markdown text and replace only lines containing typos.

        Args:
            markdown_text: Raw Markdown text to proofread.

        Returns:
            Perfected Markdown text with corrected lines replaced.
        """
        if not self.api_key:
            logger.warning("No Gemini API key provided for proofreading. Skipping proofread step.")
            return markdown_text

        lines = markdown_text.splitlines()
        if not lines:
            return markdown_text

        numbered_lines = [
            f"{i+1}: {line}"
            for i, line in enumerate(lines)
            if line.strip()
        ]
        if not numbered_lines:
            return markdown_text

        numbered_text = "\n".join(numbered_lines)

        prompt = f"""Bạn là chuyên gia hiệu đính tài liệu Y Dược Việt Nam.

NHIỆM VỤ:
- Chỉ phát hiện lỗi chính tả và lỗi OCR.
- Chỉ sửa khi chắc chắn.
- Không viết lại câu.
- Không thay đổi văn phong.
- Không thay đổi Markdown.
- Không gộp hoặc tách dòng.
- Không sửa các lỗi khoảng trắng trước dấu câu (ví dụ " :") hoặc đổi kiểu chữ hoa/thường nếu không làm sai nghĩa.
- Không sửa tên thuốc, hoạt chất, tá dược, đơn vị, số đăng ký, địa chỉ, tên công ty... trừ khi chắc chắn là lỗi OCR.

OUTPUT:
Chỉ trả về một JSON Array hợp lệ.
Nếu không có lỗi: []

Mỗi object trong JSON Array:
{{
  "line": <số_dòng_kiểu_int>,
  "corrected": "<nội_dung_đã_sửa>"
}}

DANH SÁCH CÁC DÒNG VĂN BẢN (dạng `số_dòng: nội_dung`):
{numbered_text}"""

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {"responseMimeType": "application/json"},
        }

        import time

        max_retries = 5
        retry_delay = 10

        for attempt in range(1, max_retries + 1):
            try:
                logger.info(f"Sending {len(numbered_lines)} lines to Gemini ({self.model}) for Line-Diff proofreading (attempt {attempt})...")
                r = requests.post(url, json=payload, headers=headers, timeout=90)

                if r.status_code == 200:
                    res = r.json()
                    json_str = res["candidates"][0]["content"]["parts"][0]["text"]
                    corrections: List[dict] = json.loads(json_str)

                    logger.info(f"Gemini identified {len(corrections)} line(s) needing correction.")

                    updated_lines = list(lines)
                    for c in corrections:
                        line_num = c.get("line")
                        corrected_text = c.get("corrected")
                        if line_num and corrected_text and 1 <= line_num <= len(updated_lines):
                            updated_lines[line_num - 1] = corrected_text

                    return "\n".join(updated_lines)

                elif r.status_code == 429:
                    logger.warning(f"Rate limit 429 hit. Retrying in {retry_delay}s... (attempt {attempt}/{max_retries})")
                    time.sleep(retry_delay)
                    retry_delay *= 2
                else:
                    logger.warning(f"Gemini proofreading request failed (status {r.status_code}): {r.text[:200]}")
                    return markdown_text

            except Exception as e:
                logger.error(f"Error during Line-Diff proofreading: {e}")
                if attempt < max_retries:
                    time.sleep(5)
                else:
                    return markdown_text

        return markdown_text
