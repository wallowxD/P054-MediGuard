"""Application configuration loader for OCR services."""

import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings with environment variable fallback."""

    gemini_api_key: str = ""
    google_api_key: str = ""
    gemini_model: str = "gemini-3.5-flash-lite"
    gemini_base_url: str = "https://generativelanguage.googleapis.com/v1beta/openai"

    qwen_api_key: str = ""
    dashscope_api_key: str = ""
    qwen_model: str = "qwen3-vl-flash"
    qwen_base_url: str = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"

    ocr_provider: str = "gemini"
    ocr_dpi: int = 300
    output_dir: str = "output"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        if not self.gemini_api_key and os.getenv("GEMINI_API_KEY"):
            self.gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not self.google_api_key and os.getenv("GOOGLE_API_KEY"):
            self.google_api_key = os.getenv("GOOGLE_API_KEY")
        if not self.qwen_api_key and os.getenv("QWEN_API_KEY"):
            self.qwen_api_key = os.getenv("QWEN_API_KEY")
        if not self.dashscope_api_key and os.getenv("DASHSCOPE_API_KEY"):
            self.dashscope_api_key = os.getenv("DASHSCOPE_API_KEY")


_settings = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
