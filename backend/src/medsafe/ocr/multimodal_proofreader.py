"""Multimodal Proofreader Module cho tài liệu Y Dược Việt Nam.

So sánh trực tiếp HÌNH ẢNH HƯỚNG DẪN SỬ DỤNG THUỐC gốc với VĂN BẢN MARKDOWN ĐÃ OCR.
Sử dụng Gemini 3.6 Flash với `response_mime_type="application/json"` để CHỈ TRẢ VỀ JSON DIFF
các dòng bị lỗi, giúp tiết kiệm 90%+ Output Tokens và tăng tốc độ xử lý.
"""

import io
import json
import logging
import os
import random
import re
import time
from pathlib import Path

from pydantic import BaseModel, Field

from medsafe.config import get_settings

try:
    from PIL import Image

    Image.MAX_IMAGE_PIXELS = None
except ImportError:
    Image = None

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None

logger = logging.getLogger(__name__)


class CorrectionItem(BaseModel):
    line: int = Field(description="Số dòng bị lỗi trong Markdown (kiểu số nguyên int)")
    original: str = Field(description="Nội dung dòng gốc")
    corrected: str = Field(
        description="Nội dung dòng sau khi đã sửa hoặc thêm tag <!-- NEED_REVIEW --> / <!-- INCOMPLETE_DOCUMENT -->"
    )
    flag: str = Field(description="Giá trị: 'CORRECTED', 'NEEDS_REVIEW', hoặc 'INCOMPLETE_DOCUMENT'")
    reason: str = Field(description="Lý do sửa đối chiếu từ ảnh gốc")


def calculate_backoff_with_jitter(attempt: int) -> float:
    """Calculate exponential backoff wait time with uniform random jitter.

    Attempt 1: 1–2s  (2^0 to 2^1)
    Attempt 2: 2–4s  (2^1 to 2^2)
    Attempt 3: 4–8s  (2^2 to 2^3)
    Attempt 4: 8–16s (2^3 to 2^4)
    """
    min_sec = float(2 ** (attempt - 1))
    max_sec = float(2**attempt)
    return random.uniform(min_sec, max_sec)


MULTIMODAL_PROOFREAD_SYSTEM_PROMPT = """Bạn là chuyên gia hiệu đính tài liệu Y Dược Việt Nam cao cấp.

BỐI CẢNH GIAI ĐOẠN 1:
Văn bản Markdown đầu vào được bóc tách từ OCR giai đoạn 1 (với quy tắc giữ nguyên văn, không tự sửa chữ mờ/lỗi OCR và đã lọc bỏ các trang ảnh bao bì/vỏ hộp).

NHIỆM VỤ HIỆU ĐÍNH (GIAI ĐOẠN 2):
So sánh trực tiếp HÌNH ẢNH HƯỚNG DẪN SỬ DỤNG THUỐC với VĂN BẢN MARKDOWN ĐÃ ĐÁNH SỐ DÒNG (dạng `số_dòng: nội_dung`).
Nhiệm vụ của bạn là hiệu đính, phát hiện và sửa chữa các lỗi OCR, lỗi chính tả, thiếu dấu tiếng Việt, chữ bị dính/tách, hoặc sai lệch tên thuốc, hoạt chất, tá dược, hàm lượng, số đăng ký dựa trên hình ảnh gốc.

QUY TẮC HIỆU ĐÍNH NGHIÊM NGẶT:
1. SỬA LỖI OCR & THUẬT NGỮ: Khác với OCR giai đoạn 1, ở giai đoạn hiệu đính này bạn ĐƯỢC PHÉP và NÊN sửa các từ gõ sai, thiếu dấu, lỗi nhận diện chữ (vd: "ngquivo ban" -> "ngoại ban", "TÁ DỤC" -> "TÁ DƯỢC") khi ảnh thể hiện rõ.
2. BỎ QUA ẢNH BAO BÌ (ETUI/MOCKUP): Ảnh bao bì/vỏ hộp đã được lọc bỏ ở giai đoạn 1. Nếu ảnh đính kèm là mẫu bao bì/vỏ hộp/nhãn lọ không phải tờ HDSD, hãy BỎ QUA không sửa đổi và KHÔNG gán flag INCOMPLETE_DOCUMENT.
3. CHỈ SỬA KHI CÓ CƠ SỞ: Chỉ sửa khi phát hiện sai lệch hoặc lỗi OCR rõ ràng so với ảnh gốc. Tuyệt đối KHÔNG tự ý sửa đổi văn phong, không viết lại câu.
4. GIỮ NGUYÊN CẤU TRÚC MARKDOWN: Giữ tiêu đề (#, ##), danh sách (-), bảng biểu (|). KHÔNG gộp hoặc tách dòng.
5. Nếu văn bản đã chính xác 100% so với ảnh gốc, trả về mảng rỗng `[]`.
6. TRẢ VỀ DUY NHẤT 1 JSON ARRAY HỢP LỆ. KHÔNG viết lời dẫn hay nhận xét bên ngoài mảng JSON.
7. ĐÁNH DẤU NGHI VẤN (`"flag": "NEEDS_REVIEW"`): Nếu liều lượng, tên hoạt chất hoặc chữ bị mờ/nhoè không chắc 100%, gán `"flag": "NEEDS_REVIEW"` và thêm comment `<!-- NEED_REVIEW: [lý do] -->` vào `corrected`. Ngược lại gán `"flag": "CORRECTED"`.
8. ĐÁNH DẤU TÀI LIỆU BỊ CẮT CỤT (`"flag": "INCOMPLETE_DOCUMENT"`): CHỈ gán cờ này khi chính tờ HDSD bị ngắt lửng lơ giữa câu/tiêu đề hoặc thiếu trang kết thúc. KHÔNG gán cờ này cho trang bao bì/vỏ hộp.
9. KHÔNG TRẢ VỀ CHUỖI CẮT CỤT DỞ DANG: Tuyệt đối KHÔNG trả về giá trị `corrected` bị dở dang/ngắt giữa câu (ví dụ: `"- Liều glucose tối đa khuyên dùng là 500 -"`). Nếu câu bị ngắt/xuống dòng hoặc đứt lửng, hãy giữ nguyên toàn bộ nội dung dòng gốc.

OUTPUT FORMAT (Bắt buộc là 1 JSON Array hợp lệ):
[
  {
    "line": <số_dòng_kiểu_int>,
    "original": "<nội_dung_dòng_gốc_chính_xác>",
    "corrected": "<nội_dung_dòng_đã_sửa>",
    "flag": "CORRECTED" hoặc "NEEDS_REVIEW" hoặc "INCOMPLETE_DOCUMENT",
    "reason": "<lý_do_ngắn_gọn_đối_chiếu_từ_ảnh>"
  }
]
"""


class MultimodalProofreader:
    """Hiệu đính Markdown bằng cách đối chiếu ảnh gốc qua Gemini 3.6 Flash JSON Diff."""

    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        use_vertex: bool = False,
        project: str | None = None,
        location: str | None = None,
        max_retries: int = 4,
    ):
        settings = get_settings()
        self.api_key = (
            api_key
            if api_key is not None
            else (
                os.getenv("VERTEX_API_KEY")
                or getattr(settings, "vertex_api_key", "")
                or getattr(settings, "gemini_api_key", "")
                or settings.google_api_key
            )
        )
        self.model = (
            model
            if model is not None
            else (os.getenv("GEMINI_MODEL") or getattr(settings, "gemini_model", "gemini-3.6-flash"))
        )
        self.use_vertex = (
            use_vertex
            or getattr(settings, "use_vertex_ai", False)
            or os.getenv("USE_VERTEX_AI", "").lower() in ("true", "1", "yes")
        )
        self.project = (
            project
            or getattr(settings, "gcp_project", "")
            or os.getenv("GCP_PROJECT")
            or os.getenv("GOOGLE_CLOUD_PROJECT")
        )
        self.location = (
            location or getattr(settings, "gcp_location", "us-central1") or os.getenv("GCP_LOCATION") or "us-central1"
        )
        self.max_retries = max_retries
        self._genai_client = None
        self._init_client()

    def _init_client(self):
        if genai is None:
            logger.warning("google.genai SDK not installed. MultimodalProofreader requires google.genai.")
            return

        try:
            if self.use_vertex:
                kwargs = {"vertexai": True}
                if self.api_key:
                    kwargs["api_key"] = self.api_key
                else:
                    if self.project:
                        os.environ["GOOGLE_CLOUD_PROJECT"] = self.project
                        os.environ["GCP_PROJECT"] = self.project
                        kwargs["project"] = self.project
                    if self.location:
                        kwargs["location"] = self.location

                kwargs["http_options"] = types.HttpOptions(timeout=120000)
                self._genai_client = genai.Client(**kwargs)
                logger.info(f"MultimodalProofreader initialized via Vertex AI (model={self.model})")
            elif self.api_key:
                self._genai_client = genai.Client(api_key=self.api_key, http_options=types.HttpOptions(timeout=120000))
                logger.info(f"MultimodalProofreader initialized via AI Studio (model={self.model})")
        except Exception as e:
            logger.error(f"Failed to initialize google.genai Client: {e}")
            self._genai_client = None

    def _prepare_image_part(self, image_input: str | Path | bytes, max_side: int = 3584):
        """Prepare google.genai types.Part from image file or bytes."""
        if isinstance(image_input, (str, Path)):
            img_path = Path(image_input)
            if not img_path.exists() or img_path.stat().st_size == 0:
                raise ValueError(f"Image file is empty or missing: {img_path}")
            raw_bytes = img_path.read_bytes()
            ext = img_path.suffix.lower().lstrip(".")
            mime_type = "image/png" if ext == "png" else ("image/jpeg" if ext in ("jpg", "jpeg") else f"image/{ext}")
        elif isinstance(image_input, bytes):
            if len(image_input) == 0:
                raise ValueError("Image bytes input is empty")
            raw_bytes = image_input
            mime_type = "image/jpeg"
        else:
            raise ValueError(f"Unsupported image input type: {type(image_input)}")

        if Image is not None and len(raw_bytes) > 0:
            try:
                with Image.open(io.BytesIO(raw_bytes)) as img:
                    w, h = img.size
                    if max(w, h) > max_side or img.mode in ("RGBA", "P", "LA"):
                        scale = max_side / float(max(w, h)) if max(w, h) > max_side else 1.0
                        new_w, new_h = max(1, int(w * scale)), max(1, int(h * scale))
                        if (new_w, new_h) != (w, h):
                            resample_fn = getattr(Image, "Resampling", Image).LANCZOS
                            img = img.resize((new_w, new_h), resample_fn)
                        if img.mode in ("RGBA", "P", "LA"):
                            img = img.convert("RGB")
                        buf = io.BytesIO()
                        img.save(buf, format="JPEG", quality=90)
                        raw_bytes = buf.getvalue()
                        mime_type = "image/jpeg"
            except Exception as e:
                logger.warning(f"Image resize check failed: {e}. Using raw bytes.")

        return types.Part.from_bytes(data=raw_bytes, mime_type=mime_type)

    def proofread_page(
        self,
        image_input: str | Path | bytes,
        markdown_text: str,
    ) -> tuple[str, list[dict]]:
        """Proofread a single page's Markdown against its source image.

        Returns:
            (corrected_markdown_text, list_of_correction_dicts)
        """
        if not markdown_text or not markdown_text.strip():
            return markdown_text, []

        if self._genai_client is None:
            logger.warning("GenAI client not available. Skipping multimodal proofreading.")
            return markdown_text, []

        lines = markdown_text.splitlines()
        numbered_lines = [f"{i + 1}: {line}" for i, line in enumerate(lines)]
        numbered_prompt_text = "\n".join(numbered_lines)

        user_prompt = f"""Dưới đây là nội dung Markdown đã OCR của trang ảnh (dạng `số_dòng: nội_dung`):

```markdown
{numbered_prompt_text}
```

Hãy đối chiếu từng dòng với hình ảnh đính kèm. Trả về duy nhất 1 JSON Array danh sách các dòng cần sửa đổi."""

        image_part = self._prepare_image_part(image_input)

        attempt = 0
        while attempt < self.max_retries:
            attempt += 1
            try:
                logger.info(f"Sending multimodal proofreading request to Gemini ({self.model}, attempt {attempt})...")
                response = self._genai_client.models.generate_content(
                    model=self.model,
                    contents=[image_part, user_prompt],
                    config=types.GenerateContentConfig(
                        system_instruction=MULTIMODAL_PROOFREAD_SYSTEM_PROMPT,
                        response_mime_type="application/json",
                        response_schema=list[CorrectionItem],
                        temperature=0.0,
                        max_output_tokens=4096,
                    ),
                )

                # Check if Gemini response finished cleanly (FinishReason == STOP)
                finish_reason = ""
                if getattr(response, "candidates", None) and len(response.candidates) > 0:
                    finish_reason = str(getattr(response.candidates[0], "finish_reason", ""))

                if finish_reason and "STOP" not in finish_reason and finish_reason != "1":
                    logger.warning(
                        f"Gemini proofreading output was truncated mid-generation (finish_reason={finish_reason}). Retrying request..."
                    )
                    time.sleep(1.5)
                    continue

                response_text = response.text or "[]"
                usage = getattr(response, "usage_metadata", None)
                if usage:
                    in_tok = getattr(usage, "prompt_token_count", 0)
                    out_tok = getattr(usage, "candidates_token_count", 0)
                    total_tok = getattr(usage, "total_token_count", 0)
                    logger.info(
                        f"Gemini Token Usage -> Input (Prompt): {in_tok:,} tokens | Output (Response): {out_tok:,} tokens | Total: {total_tok:,} tokens"
                    )

                corrections = self._parse_json_corrections(response_text)

                if not corrections:
                    logger.info("Proofreading complete: 0 corrections suggested (text is 100% accurate).")
                    return markdown_text, []

                logger.info(f"Gemini suggested {len(corrections)} line correction(s). Applying...")
                corrected_markdown = self._apply_corrections(lines, corrections)
                return corrected_markdown, corrections

            except Exception as e:
                err_str = str(e)
                wait_sec = calculate_backoff_with_jitter(attempt)
                logger.warning(
                    f"Multimodal proofreading error (attempt {attempt}/{self.max_retries}): {err_str}. Retrying in {wait_sec:.2f}s..."
                )
                time.sleep(wait_sec)

        logger.error("All proofreading attempts failed. Returning original Markdown text.")
        return markdown_text, []

    @staticmethod
    def _parse_json_corrections(text: str) -> list[dict]:
        """Safely parse JSON response from Gemini, extracting valid objects even if JSON is truncated at the end."""
        cleaned = text.strip()
        cleaned = re.sub(r"^```(?:json)?\s*\n?", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\n?```\s*$", "", cleaned).strip()

        # Helper to normalize item fields
        def _normalize_item(item: dict) -> dict:
            if "flag" not in item:
                item["flag"] = "NEEDS_REVIEW"
            if "reason" not in item:
                item["reason"] = "Bị đứt chuỗi phản hồi Gemini (Truncated Output)"
            return item

        # 1. Standard full JSON parse
        try:
            data = json.loads(cleaned, strict=False)
            if isinstance(data, list):
                return [
                    _normalize_item(item)
                    for item in data
                    if isinstance(item, dict) and "line" in item and "corrected" in item
                ]
        except Exception:
            pass

        # 2. Auto-repair truncated JSON
        try:
            repaired = MultimodalProofreader._repair_json_string(cleaned)
            data = json.loads(repaired, strict=False)
            if isinstance(data, list):
                valid = [
                    _normalize_item(item)
                    for item in data
                    if isinstance(item, dict) and "line" in item and "corrected" in item
                ]
                if valid:
                    logger.info(f"Extracted {len(valid)} valid correction object(s) via auto-repaired JSON.")
                    return valid
        except Exception:
            pass

        # 3. Robust Regex Fallback: extract individual complete JSON objects
        valid_corrections = []
        object_matches = re.findall(r'\{\s*"line"\s*:\s*\d+.*?\}(?=\s*,|\s*\]|\s*$)', cleaned, flags=re.DOTALL)
        for obj_str in object_matches:
            try:
                item = json.loads(obj_str, strict=False)
                if isinstance(item, dict) and "line" in item and "corrected" in item:
                    valid_corrections.append(_normalize_item(item))
            except Exception:
                continue

        if valid_corrections:
            logger.info(f"Extracted {len(valid_corrections)} valid correction object(s) via regex fallback.")
            return valid_corrections

        # 4. Partial Regex Fallback: extract line, original, corrected fields if string was truncated mid-object
        partial_matches = re.findall(
            r'\{\s*"line"\s*:\s*(\d+).*?"original"\s*:\s*"(.*?)".*?"corrected"\s*:\s*"(.*?)"',
            cleaned,
            flags=re.DOTALL,
        )
        for line_num, orig, corr in partial_matches:
            try:
                valid_corrections.append(
                    {
                        "line": int(line_num),
                        "original": orig.strip(),
                        "corrected": corr.strip(),
                        "flag": "CORRECTED",
                        "reason": "Parsed from partial response",
                    }
                )
            except Exception:
                continue

        if valid_corrections:
            logger.info(f"Extracted {len(valid_corrections)} valid correction object(s) via partial regex fallback.")
            return valid_corrections

        logger.error(f"Failed to parse JSON corrections. Raw output snippet: {text[:200]}")
        return []

    @staticmethod
    def _repair_json_string(text: str) -> str:
        """Repair truncated JSON string by appending missing closing quotes, braces, and brackets."""
        cleaned = text.strip()
        in_string = False
        escape = False
        for char in cleaned:
            if char == "\\" and not escape:
                escape = True
                continue
            if char == '"' and not escape:
                in_string = not in_string
            escape = False

        if in_string:
            cleaned += '"'

        open_braces = cleaned.count("{") - cleaned.count("}")
        open_brackets = cleaned.count("[") - cleaned.count("]")

        if open_braces > 0:
            cleaned += "}" * open_braces
        if open_brackets > 0:
            cleaned += "]" * open_brackets

        return cleaned

    @staticmethod
    def _is_truncated_correction(original: str, corrected: str) -> bool:
        """Check if proposed corrected text appears truncated mid-sentence."""
        corr_strip = corrected.strip()
        orig_strip = original.strip()

        if not corr_strip or not orig_strip:
            return False

        # 1. Ends with dangling symbols or prepositions
        dangling_endings = (
            "-",
            "+",
            ",",
            ":",
            ";",
            "/",
            "\\",
            " là",
            " và",
            " cho",
            " trong",
            " của",
            " với",
            " hoặc",
            " được",
            " thuộc",
        )
        if any(corr_strip.endswith(ending) for ending in dangling_endings):
            return True

        # 2. Significant length reduction while missing numbers present in original
        if len(corr_strip) < len(orig_strip) * 0.65:
            orig_nums = set(re.findall(r"\d+", orig_strip))
            corr_nums = set(re.findall(r"\d+", corr_strip))
            if orig_nums - corr_nums:
                return True

        return False

    @classmethod
    def _apply_corrections(cls, lines: list[str], corrections: list[dict]) -> str:
        """Apply line corrections cleanly to original lines with truncation safety checks."""
        updated_lines = list(lines)
        total_lines = len(updated_lines)

        for c in corrections:
            try:
                line_idx = int(c.get("line", 0)) - 1
                corrected_text = str(c.get("corrected", ""))
                original_expected = str(c.get("original", ""))

                if 0 <= line_idx < total_lines:
                    current_line = updated_lines[line_idx]

                    # Safety Guard: Check if corrected_text is truncated/incomplete
                    if cls._is_truncated_correction(original_expected or current_line, corrected_text):
                        logger.warning(
                            f"Rejected truncated correction at line {line_idx + 1}: '{corrected_text}'. Retaining original line."
                        )
                        continue

                    # Verify line safety: if original matches current or fuzzy match
                    if (
                        not original_expected
                        or original_expected.strip() in current_line
                        or current_line.strip() in original_expected
                    ):
                        updated_lines[line_idx] = corrected_text
                    else:
                        # Fallback: search nearby lines (± 2 lines) in case line numbers shifted slightly
                        match_found = False
                        for offset in [-1, 1, -2, 2]:
                            near_idx = line_idx + offset
                            if 0 <= near_idx < total_lines:
                                if (
                                    original_expected.strip()
                                    and original_expected.strip() == updated_lines[near_idx].strip()
                                ):
                                    if not cls._is_truncated_correction(updated_lines[near_idx], corrected_text):
                                        updated_lines[near_idx] = corrected_text
                                    match_found = True
                                    break
                        if not match_found:
                            updated_lines[line_idx] = corrected_text

            except Exception as e:
                logger.warning(f"Could not apply correction {c}: {e}")

        return "\n".join(updated_lines)
