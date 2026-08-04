"""Pydantic I/O — nguồn sinh OpenAPI cho frontend."""

from medsafe.schemas.auth import (
    AuthUserResponse,
    LoginRequest,
    LoginResponse,
    RefreshRequest,
    RegisterRequest,
    TokenPairResponse,
)
from medsafe.schemas.base import CamelModel
from medsafe.schemas.errors import ErrorResponse

__all__ = [
    "AuthUserResponse",
    "CamelModel",
    "ErrorResponse",
    "LoginRequest",
    "LoginResponse",
    "RefreshRequest",
    "RegisterRequest",
    "TokenPairResponse",
]
