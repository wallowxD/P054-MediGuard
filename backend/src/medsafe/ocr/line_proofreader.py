import json
import logging
import os
import random
import re
import time

from medsafe.config import get_settings

try:
    from google import genai
    from google.genai import types
except ImportError:
    genai = None
    types = None

logger = logging.getLogger(__name__)


class LineDiffProofreader:
    """Hiệu đính Markdown theo dòng dùng Gemini JSON diff output (Text-only)."""

    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        use_vertex: bool = False,
        project: str | None = None,
        location: str | None = None,
    ):
        settings = get_settings()
        self.api_key = (
            api_key
            if api_key is not None
            else (
                os.getenv("GEMINI_API_KEY")
                or os.getenv("GOOGLE_API_KEY")
                or getattr(settings, "gemini_api_key", "")
                or settings.google_api_key
            )
        )
        self.model = (
            model
            if model is not None
            else (os.getenv("GEMINI_MODEL") or getattr(settings, "gemini_model", "gemini-3.5-flash-lite"))
        )
        self.use_vertex = use_vertex
        self.project = (
            project
            or getattr(settings, "gcp_project", "")
            or os.getenv("GCP_PROJECT")
            or os.getenv("GOOGLE_CLOUD_PROJECT")
        )
        self.location = (
            location or getattr(settings, "gcp_location", "us-central1") or os.getenv("GCP_LOCATION") or "us-central1"
        )
        self._genai_client = None
        self._init_client()

    def _init_client(self):
        if genai is None:
            logger.warning("google.genai SDK not installed.")
            return

        try:
            if self.use_vertex:
                kwargs = {"vertexai": True}
                if self.api_key:
                    kwargs["api_key"] = self.api_key
                else:
                    if self.project:
                        kwargs["project"] = self.project
                    if self.location:
                        kwargs["location"] = self.location
                kwargs["http_options"] = types.HttpOptions(timeout=120000)
                self._genai_client = genai.Client(**kwargs)
                logger.info(f"LineDiffProofreader initialized via Vertex AI (model={self.model})")
            elif self.api_key:
                self._genai_client = genai.Client(api_key=self.api_key, http_options=types.HttpOptions(timeout=120000))
                logger.info(f"LineDiffProofreader initialized via AI Studio (model={self.model})")
        except Exception as e:
            logger.error(f"Failed to initialize google.genai Client in LineDiffProofreader: {e}")
            self._genai_client = None

    def proofread_markdown_with_diff(self, markdown_text: str) -> tuple[str, list[dict]]:
        if not markdown_text or not markdown_text.strip():
            return markdown_text, []

        lines = markdown_text.splitlines()
        numbered_lines = [f"{i + 1}: {line}" for i, line in enumerate(lines) if line.strip()]
        if not numbered_lines:
            return markdown_text, []

        if self._genai_client is None:
            logger.warning("GenAI client not initialized. Skipping line-diff proofreading.")
            return markdown_text, []

        numbered_text = "\n".join(numbered_lines)

        prompt = f"""Bạn là chuyên gia hiệu đính tài liệu Y Dược Việt Nam cao cấp.

NHIỆM VỤ:
Hiệu đính văn bản Markdown Hướng dẫn sử dụng thuốc dựa trên kiến thức Y Dược chuyên sâu.

1. HIỆU ĐÍNH CHÍNH TẢ & LỖI OCR CHẮC CHẮN 100%:
   - Sửa các lỗi chính tả, lỗi nhận diện chữ OCR (vd: "ngquivo ban" -> "ngoại ban", "TÁ DỤC" -> "TÁ DƯỢC"), lỗi dính/tách từ.
   - Sửa tên thuốc, tên hoạt chất, tá dược, hàm lượng, đơn vị (mg, ml, mcg) bị gõ sai OCR mà bạn CHẮC CHẮN 100%.
   - Tuyệt đối KHÔNG tự ý sửa đổi văn phong, không viết lại câu, giữ nguyên cấu trúc Markdown (#, ##, -, |).

2. ĐÁNH DẤU DÒNG NGHI VẤN / BẤT THƯỜNG KHÓ HIỂU (NEED REVIEW):
   Phát hiện các dòng có dấu hiệu bất thường theo kiến thức Y Dược mà bạn nghi ngờ nhưng cần dược sĩ/người xem lại:
   - Diễn đạt tối nghĩa, sai cú pháp y khoa.
   - Liều dùng, nồng độ, hàm lượng bất thường hoặc vô lý.
   - Tên thuốc, tên hoạt chất quá lạ chưa từng thấy.
   - Tương tác thuốc hoặc chỉ định / chống chỉ định có vẻ vô lý.
   - Dữ liệu vô lý hoặc nghi ngờ lỗi gõ máy nặng.
   -> HÀNH ĐỘNG: Trả về dòng trong JSON và chèn comment `<!-- NEED_REVIEW: [lý do nghi ngờ ngắn gọn] -->` vào cuối dòng `corrected`.

3. ĐÁNH DẤU TÀI LIỆU / CÂU BỊ CẮT LỬNG (INCOMPLETE DOCUMENT):
   Nếu phát hiện dòng cuối cùng hoặc văn bản bị ngắt lửng lơ giữa câu, thiếu thông tin kết thúc quan trọng (như bảo quản / nhà sản xuất / hạn dùng):
   -> HÀNH ĐỘNG: Trả về dòng dở dang đó và chèn comment `<!-- INCOMPLETE_DOCUMENT: Tài liệu bị ngắt lửng lơ giữa chừng -->` vào cuối dòng `corrected`.

4. KHÔNG TỰ BỊA CHUỖI CẮT CỤT: Tuyệt đối KHÔNG tự tạo ra chuỗi `corrected` bị dở dang/cắt cụt giữa câu (vd: "khuyên dùng là 500 -").

OUTPUT FORMAT:
Chỉ trả về duy nhất 1 JSON Array hợp lệ. Không viết bất kỳ lời dẫn nào.
Nếu văn bản không có lỗi và không có dòng nghi vấn, trả về mảng rỗng `[]`.

Mỗi object trong JSON Array:
{{
  "line": <số_dòng_kiểu_int>,
  "corrected": "<nội_dung_đã_sửa_hoặc_thêm_comment_NEED_REVIEW_hoặc_INCOMPLETE_DOCUMENT>"
}}

DANH SÁCH CÁC DÒNG VĂN BẢN (dạng `số_dòng: nội_dung`):
{numbered_text}"""

        max_retries = 4
        for attempt in range(1, max_retries + 1):
            try:
                logger.info(
                    f"Sending {len(numbered_lines)} lines to Gemini ({self.model}) for Line-Diff proofreading (attempt {attempt})..."
                )
                response = self._genai_client.models.generate_content(
                    model=self.model,
                    contents=prompt,
                    config=types.GenerateContentConfig(
                        response_mime_type="application/json",
                        temperature=0.0,
                        max_output_tokens=4096,
                    ),
                )

                usage = getattr(response, "usage_metadata", None)
                if usage:
                    in_tok = getattr(usage, "prompt_token_count", 0)
                    out_tok = getattr(usage, "candidates_token_count", 0)
                    total_tok = getattr(usage, "total_token_count", 0)
                    logger.info(
                        f"Gemini Token Usage -> Input: {in_tok:,} tokens | Output: {out_tok:,} tokens | Total: {total_tok:,} tokens"
                    )

                finish_reason = ""
                if getattr(response, "candidates", None) and len(response.candidates) > 0:
                    finish_reason = str(getattr(response.candidates[0], "finish_reason", ""))

                if finish_reason and "STOP" not in finish_reason and finish_reason != "1":
                    logger.warning(
                        f"LineDiffProofreader response truncated (finish_reason={finish_reason}). Retrying..."
                    )
                    time.sleep(1.5)
                    continue

                json_str = response.text or "[]"
                json_str = json_str.strip()
                if json_str.startswith("```"):
                    json_str = re.sub(r"^```(?:json)?\s*\n?", "", json_str, flags=re.IGNORECASE)
                    json_str = re.sub(r"\n?```\s*$", "", json_str).strip()

                corrections: list[dict] = json.loads(json_str, strict=False)
                logger.info(f"Gemini identified {len(corrections)} line(s) needing correction/review.")

                updated_lines = list(lines)
                for c in corrections:
                    line_num = c.get("line")
                    corrected_text = c.get("corrected")
                    if line_num and corrected_text and 1 <= line_num <= len(updated_lines):
                        orig_text = updated_lines[line_num - 1]
                        corr_strip = corrected_text.strip()
                        orig_strip = orig_text.strip()
                        # Strip trailing HTML comments (e.g. <!-- NEED_REVIEW... -->) before running truncation heuristics
                        clean_corr = re.sub(r"\s*<!--.*?-->\s*$", "", corr_strip)

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

                        is_trunc = False
                        if any(clean_corr.endswith(e) for e in dangling_endings):
                            is_trunc = True
                        elif (
                            orig_strip.endswith((".", "!", "?"))
                            and not clean_corr.endswith((".", "!", "?", "*", "_", ")", "]", '"', ">"))
                            and len(clean_corr) < len(orig_strip) - 10
                        ):
                            is_trunc = True
                        elif len(clean_corr) < len(orig_strip) * 0.65 and not corr_strip.endswith("-->"):
                            is_trunc = True

                        if is_trunc:
                            logger.warning(
                                f"Rejected truncated text at line {line_num}: '{corrected_text}'. Retaining original line."
                            )
                            continue

                        updated_lines[line_num - 1] = corrected_text

                return "\n".join(updated_lines), corrections

            except Exception as e:
                err_str = str(e)
                if "429" in err_str or "RESOURCE_EXHAUSTED" in err_str:
                    wait_sec = 23.0
                    match = re.search(r"retry in (\d+(?:\.\d+)?)s", err_str, re.IGNORECASE)
                    if match:
                        wait_sec = float(match.group(1)) + 2.0
                    if attempt < max_retries:
                        logger.warning(
                            f"Rate limit 429 hit. Sleeping {wait_sec:.1f}s before retry (attempt {attempt}/{max_retries})..."
                        )
                        time.sleep(wait_sec)
                    else:
                        raise RuntimeError(f"Gemini 429 Rate limit quota exhausted after {max_retries} attempts: {e}")
                else:
                    logger.error(f"Error during Line-Diff proofreading (attempt {attempt}/{max_retries}): {e}")
                    if attempt < max_retries:
                        wait_sec = (4.0 * attempt) + random.uniform(0.5, 3.0)
                        logger.info(f"Retrying attempt {attempt}/{max_retries} after {wait_sec:.1f}s delay (jitter)...")
                        time.sleep(wait_sec)
                    else:
                        raise RuntimeError(f"Gemini proofread failed after {max_retries} attempts: {e}")

        raise RuntimeError(f"Gemini proofread failed after {max_retries} attempts")

    def proofread_markdown(self, markdown_text: str) -> str:
        content, _ = self.proofread_markdown_with_diff(markdown_text)
        return content
