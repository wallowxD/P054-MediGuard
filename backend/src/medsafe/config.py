"""Cấu hình — hai nguồn tách bạch.

- `config.yaml` (backend/): tham số RAG, không phải secret, sửa được không cần deploy.
- `.env` (REPO ROOT): secret. Phải ở root vì scripts/submit_log.py gọi load_dotenv()
  theo CWD = repo root; đặt .env ở backend/ sẽ hỏng AI log mà không báo lỗi.
"""

from functools import lru_cache
from pathlib import Path
from typing import Any, Literal

import yaml
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# backend/src/medsafe/config.py -> parents[3] = repo root
REPO_ROOT: Path = Path(__file__).resolve().parents[3]
BACKEND_ROOT: Path = Path(__file__).resolve().parents[2]
CONFIG_YAML: Path = BACKEND_ROOT / "config.yaml"


def load_yaml_config(path: Path = CONFIG_YAML) -> dict[str, Any]:
    """Đọc tham số RAG từ config.yaml. Thiếu file thì trả dict rỗng."""
    if not path.exists():
        return {}
    with path.open(encoding="utf-8") as f:
        return yaml.safe_load(f) or {}


class AuthConfig(BaseModel):
    """Tham số auth từ `config.yaml` (không phải secret).

    Đọc một lần qua `get_auth_config()` — `Settings.rag` đọc lại file mỗi lần truy cập,
    chấp nhận được cho ingestion nhưng không chấp nhận được trên request path.
    """

    algorithm: str = "HS256"
    access_token_ttl_minutes: int = Field(default=30, gt=0)
    refresh_token_ttl_days: int = Field(default=14, gt=0)
    password_min_length: int = Field(default=8, ge=8)
    self_signup_role: str = "PATIENT"


@lru_cache
def get_auth_config() -> AuthConfig:
    return AuthConfig(**load_yaml_config().get("auth", {}))


class Settings(BaseSettings):
    """Secret + tham số môi trường. Nạp từ <repo-root>/.env."""

    model_config = SettingsConfigDict(
        env_file=REPO_ROOT / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # App
    app_name: str = "Medication Safety Copilot"
    app_env: Literal["development", "production", "test"] = "development"
    app_port: int = Field(default=8000, ge=1, le=65535)
    app_host: str = "0.0.0.0"
    log_level: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"
    cors_origins: str = "http://localhost:3000"

    # LLM
    openai_api_key: str = ""
    model_name: str = "gpt-4o"
    llm_temperature: float = Field(default=0.0, ge=0.0, le=2.0)

    # OCR providers
    google_api_key: str = ""
    gemini_api_key: str = ""
    vertex_api_key: str = ""
    use_vertex_ai: bool = False
    gcp_project: str = ""
    gcp_location: str = "us-central1"
    gemini_model: str = "gemini-3.6-flash"

    gemini_base_url: str = "https://generativelanguage.googleapis.com/v1beta/openai"

    qwen_api_key: str = ""
    dashscope_api_key: str = ""
    dashscope_base_url: str = ""
    qwen_model: str = "qwen3-vl-flash"
    qwen_base_url: str = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1"

    ocr_provider: str = "gemini"
    ocr_dpi: int = 300
    output_dir: str = "output"

    # Auth — secret ký JWT. Rỗng thì auth router từ chối phục vụ (xem domain/auth.py).
    jwt_secret_key: str = ""
    # OAuth client ID của Google Cloud, dùng làm `audience` khi verify ID token — xem
    # ADR 0016. Không phải secret (client ID công khai trong OAuth consent screen), nhưng
    # vẫn đặt trong .env vì khác giá trị giữa dev/staging/production.
    google_oauth_client_id: str = ""

    # Data
    database_url: str = "sqlite:///./data/app.db"
    supabase_url: str = ""
    supabase_service_role_key: str = ""
    qdrant_url: str = ""
    qdrant_api_key: str = ""

    @property
    def rag(self) -> dict[str, Any]:
        """Tham số RAG từ config.yaml."""
        return load_yaml_config()


@lru_cache
def get_settings() -> Settings:
    return Settings()
