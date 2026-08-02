"""Điểm vào ứng dụng FastAPI.

Chạy: uvicorn medsafe.main:app --reload   (từ repo root, sau khi `uv sync`)
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from medsafe.api.routes import router
from medsafe.config import get_settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # TODO: khởi tạo vector store + engine DB ở đây, đóng lại sau yield
    yield


def create_app() -> FastAPI:
    settings = get_settings()

    app = FastAPI(
        title=settings.app_name,
        description=(
            "AI Agent tra tương tác thuốc–thuốc và thuốc–thực phẩm có nguồn. "
            "Thông tin tham khảo, không thay thế quyết định của bác sĩ."
        ),
        version="0.1.0",
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins.split(","),
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(router, prefix="/api/v1")

    @app.get("/health", tags=["system"])
    async def health() -> dict[str, str]:
        return {"status": "ok", "env": settings.app_env}

    return app


app = create_app()
