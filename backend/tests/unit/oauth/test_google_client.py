"""Test cửa gọi Google — mock `verify_oauth2_token`, không gọi mạng, không gọi Google thật.

Claim-shape validation (issuer/sub/email_verified) đã test riêng ở
`tests/unit/domain/test_auth_domain.py`; ở đây chỉ kiểm phần I/O wrapper: verify thành công
delegate đúng cho domain layer, và lỗi từ `google-auth` (token hết hạn, audience sai, chữ ký
hỏng) được gộp đúng thành `InvalidGoogleTokenError`.

★ Mock ở đúng biên I/O — `google_id_token.verify_oauth2_token` — chứ không mock
  `_verify_sync`, vì logic bắt `ValueError`/`GoogleAuthError` và đổi thành
  `InvalidGoogleTokenError` nằm bên TRONG `_verify_sync`. Mock `_verify_sync` sẽ bỏ qua
  chính đoạn logic cần test.
"""

import pytest

from medsafe.domain.auth import InvalidGoogleTokenError
from medsafe.oauth import google_client

CLIENT_ID = "test-client-id.apps.googleusercontent.com"


def _valid_claims() -> dict[str, object]:
    return {
        "iss": "https://accounts.google.com",
        "aud": CLIENT_ID,
        "sub": "109876543210987654321",
        "email": "quang@gmail.com",
        "email_verified": True,
        "name": "Lê Nguyễn Minh Quang",
        "picture": None,
    }


@pytest.mark.asyncio
async def test_token_hop_le_tra_ve_identity(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setattr(
        google_client.google_id_token, "verify_oauth2_token", lambda token, request, audience: _valid_claims()
    )

    identity = await google_client.verify_google_id_token("fake-token", CLIENT_ID)

    assert identity.subject == "109876543210987654321"
    assert identity.email == "quang@gmail.com"


@pytest.mark.asyncio
async def test_token_het_han_tra_ve_invalid_google_token_error(monkeypatch: pytest.MonkeyPatch) -> None:
    """`verify_oauth2_token` ném `ValueError` khi token hết hạn — gộp thành lỗi domain."""

    def _raise_expired(token: str, request: object, audience: str) -> dict[str, object]:
        raise ValueError("Token expired")

    monkeypatch.setattr(google_client.google_id_token, "verify_oauth2_token", _raise_expired)

    with pytest.raises(InvalidGoogleTokenError):
        await google_client.verify_google_id_token("fake-token", CLIENT_ID)


@pytest.mark.asyncio
async def test_audience_sai_tra_ve_invalid_google_token_error(monkeypatch: pytest.MonkeyPatch) -> None:
    """`verify_oauth2_token` ném `ValueError` khi `aud` không khớp client ID cấu hình."""

    def _raise_wrong_audience(token: str, request: object, audience: str) -> dict[str, object]:
        raise ValueError("Token has wrong audience")

    monkeypatch.setattr(google_client.google_id_token, "verify_oauth2_token", _raise_wrong_audience)

    with pytest.raises(InvalidGoogleTokenError):
        await google_client.verify_google_id_token("fake-token", CLIENT_ID)


@pytest.mark.asyncio
async def test_chu_ky_sai_tra_ve_invalid_google_token_error(monkeypatch: pytest.MonkeyPatch) -> None:
    """`verify_oauth2_token` ném `ValueError` khi chữ ký RSA không khớp public key Google."""

    def _raise_bad_signature(token: str, request: object, audience: str) -> dict[str, object]:
        raise ValueError("Could not verify token signature")

    monkeypatch.setattr(google_client.google_id_token, "verify_oauth2_token", _raise_bad_signature)

    with pytest.raises(InvalidGoogleTokenError):
        await google_client.verify_google_id_token("fake-token", CLIENT_ID)
