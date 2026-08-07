"""Cửa duy nhất gọi Google để verify OpenID Connect ID Token — không gọi ở nơi khác.

Mirror `llm/llm_client.py`: mọi lời gọi ra ngoài tới một provider bên thứ ba phải đi qua
một file duy nhất, để dễ mock trong test và dễ audit lời gọi mạng. Dùng
`google.oauth2.id_token.verify_oauth2_token` (thư viện chính thức `google-auth`) — không tự
decode JWT, không gọi endpoint `tokeninfo` (không khuyến nghị cho production).

★ Không log `id_token_str` hay claims thô ở module này hoặc caller — token còn hạn dùng là
  bearer credential, và claims chứa email/tên là dữ liệu cá nhân.
"""

import anyio
from google.auth.exceptions import GoogleAuthError
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token as google_id_token

from medsafe.domain.auth import GoogleIdentity, InvalidGoogleTokenError, extract_google_identity


def _verify_sync(id_token_str: str, client_id: str) -> dict[str, object]:
    """Verify chữ ký, `aud` và hạn dùng qua public key của Google (cache trong process).

    `google-auth` ném `ValueError` cho token hỏng/hết hạn/sai audience, và
    `GoogleAuthError` cho lỗi giao tiếp (không lấy được public key). Cả hai đều là lỗi xác
    thực từ góc nhìn của client, nên gộp thành một `InvalidGoogleTokenError`.
    """
    try:
        return google_id_token.verify_oauth2_token(id_token_str, google_requests.Request(), client_id)
    except (ValueError, GoogleAuthError) as exc:
        raise InvalidGoogleTokenError from exc


async def verify_google_id_token(id_token_str: str, client_id: str) -> GoogleIdentity:
    """Verify ID token và trả về identity đã xác minh.

    `verify_oauth2_token` là hàm đồng bộ và có I/O mạng (lấy public key Google), nên chạy
    qua `anyio.to_thread.run_sync` để không chặn event loop — cùng cách
    `api/v1/auth.py` xử lý Argon2.
    """
    claims = await anyio.to_thread.run_sync(_verify_sync, id_token_str, client_id)
    return extract_google_identity(claims)
