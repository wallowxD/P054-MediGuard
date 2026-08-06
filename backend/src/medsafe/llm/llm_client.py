"""Gọi LLM — một cửa duy nhất.

Mọi lời gọi model đi qua đây để: đổi provider một chỗ, log token/chi phí một chỗ,
và mock trong test một chỗ. Không gọi thẳng SDK provider ở node/route.

temperature mặc định 0.0: đây là hệ tra cứu, không phải hệ sáng tác.
Tự động Retry với Exponential Backoff khi dính Rate Limit (429).
"""

import json
import os
import time
from typing import Any

# Load .env từ root dự án
try:
    from dotenv import find_dotenv, load_dotenv

    load_dotenv(find_dotenv(usecwd=True))
except ImportError:
    pass

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None


class GeminiRateLimitError(Exception):
    """Lỗi khi Gemini API dính Rate Limit (429) và đã thử lại vượt quá số lần cho phép."""

    pass


def repair_truncated_json(raw_json: str) -> dict[str, Any]:
    """Tự động vá lỗi JSON bị cắt ngang do max_tokens."""
    cleaned = raw_json.strip()
    if "```" in cleaned:
        if "```json" in cleaned:
            cleaned = cleaned.split("```json")[1].split("```")[0].strip()
        else:
            cleaned = cleaned.split("```")[1].split("```")[0].strip()

    # Thử load trực tiếp trước
    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        pass

    # Vá chuỗi string bị cắt dở
    # Bỏ bớt phần dở dang ở cuối
    pos = max(cleaned.rfind("}"), cleaned.rfind("]"))
    if pos != -1:
        truncated_candidate = cleaned[: pos + 1]
        # Thêm đóng ngoặc nhọn nếu cần
        if not truncated_candidate.endswith("}"):
            truncated_candidate += "}"
        try:
            return json.loads(truncated_candidate)
        except json.JSONDecodeError:
            pass

    return {}


class LLMClient:
    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        base_url: str | None = None,
        *,
        temperature: float = 0.0,
        max_tokens: int = 4096,
    ) -> None:
        self.gemini_key = api_key or os.getenv("GEMINI_API_KEY")
        self.gemini_model = model or os.getenv("GEMINI_MODEL") or "gemini-3.5-flash-lite"
        self.gemini_base_url = (
            base_url or os.getenv("GEMINI_BASE_URL") or "https://generativelanguage.googleapis.com/v1beta/openai"
        )

        self.temperature = temperature
        self.max_tokens = max_tokens

        if OpenAI is not None and self.gemini_key:
            self.client = OpenAI(api_key=self.gemini_key, base_url=self.gemini_base_url, timeout=45.0)
        else:
            self.client = None

    def complete(self, prompt: str, *, system: str | None = None, max_retries: int = 5) -> str:
        """Sinh text thuần CHỈ dùng Gemini API.

        Nếu bị Rate Limit 429: Retry với Exponential Backoff (2s, 4s, 8s, 16s, 32s).
        """
        if self.client is None:
            raise RuntimeError("Chưa cấu hình GEMINI_API_KEY hoặc chưa cài đặt thư viện openai.")

        messages = []
        if system:
            messages.append({"role": "system", "content": system})
        messages.append({"role": "user", "content": prompt})

        delay = 2.0
        for attempt in range(1, max_retries + 1):
            try:
                res = self.client.chat.completions.create(
                    model=self.gemini_model,
                    messages=messages,
                    temperature=self.temperature,
                    max_tokens=self.max_tokens,
                )
                return res.choices[0].message.content or ""
            except Exception as e:
                err_str = str(e)
                is_rate_limit = any(k in err_str.lower() for k in ["429", "rate limit", "resource_exhausted", "quota"])

                if is_rate_limit:
                    if attempt < max_retries:
                        print(f"⚠️ Gemini Rate Limit (429). Thử lại lần {attempt}/{max_retries} sau {delay:.1f} giây...")
                        time.sleep(delay)
                        delay *= 2.0
                        continue
                    else:
                        raise GeminiRateLimitError(
                            f"❌ Đã thử {max_retries} lần nhưng Gemini vẫn bị Rate Limit (429): {e}"
                        )
                else:
                    raise e

        raise GeminiRateLimitError(f"❌ Gemini dính Rate Limit vượt quá {max_retries} lần thử lại.")

    def complete_json(self, prompt: str, schema_description: str = "", *, system: str | None = None) -> dict[str, Any]:
        """Sinh output có cấu trúc theo dạng JSON kèm tự động vá lỗi cắt dở."""
        json_system = (
            (system or "")
            + "\nBạn BẮT BUỘC chỉ trả về kết quả dưới dạng định dạng JSON hợp lệ. Không viết thêm lời mở đầu hay giải thích."
        )
        if schema_description:
            prompt += f"\n\nYêu cầu trả về đúng Cấu trúc JSON sau:\n{schema_description}"

        raw_output = self.complete(prompt, system=json_system)
        parsed = repair_truncated_json(raw_output)

        if not parsed:
            print(f"❌ Không thể parse JSON từ Gemini Output.\nRaw output: {raw_output[:300]}...")

        return parsed
