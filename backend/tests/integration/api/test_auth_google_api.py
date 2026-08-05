"""Test HTTP của `POST /api/v1/auth/google`.

Cùng phong cách `test_auth_api.py`: repository thật thay bằng in-memory qua
`dependency_overrides`, và `verify_google_id_token` được monkeypatch — test chạy hoàn toàn
offline, không Supabase, không PostgreSQL, không gọi Google thật.

Đây cũng là nơi kiểm business logic "first login tạo user", "returning login dùng lại user
cũ" và "email trùng chưa link bị từ chối" — codebase này không có tầng service riêng để unit
test cô lập, nên các luồng đó được kiểm qua route (giống cách `/login`/`/register` đã được
kiểm ở `test_auth_api.py`).
"""

from collections.abc import Iterator
from uuid import UUID, uuid4

import pytest
from httpx import AsyncClient

from medsafe.api.dependencies import get_oauth_identity_repository, get_user_repository
from medsafe.api.v1 import auth as auth_route
from medsafe.config import Settings, get_settings
from medsafe.db.models.oauth_identity import OAuthIdentity
from medsafe.db.models.user import ROLE_PATIENT, User
from medsafe.domain.auth import GoogleEmailNotVerifiedError, GoogleIdentity, InvalidGoogleTokenError
from medsafe.main import app

SECRET = "test-secret-khong-dung-o-production"
CLIENT_ID = "test-client-id.apps.googleusercontent.com"

GOOGLE_IDENTITY = GoogleIdentity(
    subject="109876543210987654321",
    email="quang@gmail.com",
    name="Lê Nguyễn Minh Quang",
    picture=None,
)


class InMemoryUserRepository:
    """Thoả Protocol `UserRepository` nhưng giữ dữ liệu trong dict."""

    def __init__(self) -> None:
        self.by_id: dict[UUID, User] = {}

    async def get_by_email(self, email: str) -> User | None:
        return next((u for u in self.by_id.values() if u.email == email), None)

    async def get_by_id(self, user_id: UUID) -> User | None:
        return self.by_id.get(user_id)

    async def create(self, *, email: str, name: str, password_hash: str | None, role: str) -> User:
        user = User(id=uuid4(), email=email, name=name, password_hash=password_hash, role=role, is_active=True)
        self.by_id[user.id] = user
        return user

    async def update_password_hash(self, user: User, password_hash: str) -> None:
        user.password_hash = password_hash


class InMemoryOAuthIdentityRepository:
    """Thoả Protocol `OAuthIdentityRepository` nhưng giữ dữ liệu trong dict."""

    def __init__(self) -> None:
        self.by_key: dict[tuple[str, str], OAuthIdentity] = {}

    async def get_by_provider_subject(self, provider: str, provider_subject: str) -> OAuthIdentity | None:
        return self.by_key.get((provider, provider_subject))

    async def create(
        self, *, user_id: UUID, provider: str, provider_subject: str, provider_email: str | None
    ) -> OAuthIdentity:
        identity = OAuthIdentity(
            id=uuid4(),
            user_id=user_id,
            provider=provider,
            provider_subject=provider_subject,
            provider_email=provider_email,
        )
        self.by_key[(provider, provider_subject)] = identity
        return identity


@pytest.fixture
def user_repository() -> Iterator[InMemoryUserRepository]:
    repository = InMemoryUserRepository()
    identity_repository = InMemoryOAuthIdentityRepository()
    app.dependency_overrides[get_user_repository] = lambda: repository
    app.dependency_overrides[get_oauth_identity_repository] = lambda: identity_repository
    app.dependency_overrides[get_settings] = lambda: Settings(jwt_secret_key=SECRET, google_oauth_client_id=CLIENT_ID)
    yield repository
    app.dependency_overrides.clear()


@pytest.fixture
def mock_google_identity(monkeypatch: pytest.MonkeyPatch):
    """Monkeypatch điểm gọi Google trong route — mặc định trả `GOOGLE_IDENTITY`."""

    async def _fake_verify(id_token: str, client_id: str) -> GoogleIdentity:
        return GOOGLE_IDENTITY

    monkeypatch.setattr(auth_route, "verify_google_id_token", _fake_verify)
    return monkeypatch


# ── First login / returning login ────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_dang_nhap_google_lan_dau_tao_user_moi_role_patient(
    client: AsyncClient, user_repository: InMemoryUserRepository, mock_google_identity: pytest.MonkeyPatch
) -> None:
    response = await client.post("/api/v1/auth/google", json={"idToken": "fake-id-token"})

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"accessToken", "refreshToken", "expiresIn", "user"}
    assert body["user"]["email"] == "quang@gmail.com"
    assert body["user"]["roles"] == [ROLE_PATIENT]
    assert len(user_repository.by_id) == 1


@pytest.mark.asyncio
async def test_dang_nhap_google_lan_hai_dung_lai_user_cu_khong_tao_trung(
    client: AsyncClient, user_repository: InMemoryUserRepository, mock_google_identity: pytest.MonkeyPatch
) -> None:
    first = await client.post("/api/v1/auth/google", json={"idToken": "fake-id-token"})
    second = await client.post("/api/v1/auth/google", json={"idToken": "fake-id-token-khac-cung-mot-sub"})

    assert first.status_code == second.status_code == 200
    assert first.json()["user"]["id"] == second.json()["user"]["id"]
    assert len(user_repository.by_id) == 1


@pytest.mark.asyncio
async def test_tai_khoan_google_bi_vo_hieu_hoa_tra_403(
    client: AsyncClient, user_repository: InMemoryUserRepository, mock_google_identity: pytest.MonkeyPatch
) -> None:
    await client.post("/api/v1/auth/google", json={"idToken": "fake-id-token"})
    next(iter(user_repository.by_id.values())).is_active = False

    response = await client.post("/api/v1/auth/google", json={"idToken": "fake-id-token"})

    assert response.status_code == 403
    assert response.json()["code"] == "account_inactive"


# ── Email collision chưa link ────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_email_trung_local_account_chua_link_tra_409(
    client: AsyncClient, user_repository: InMemoryUserRepository, mock_google_identity: pytest.MonkeyPatch
) -> None:
    """★ Không tự động liên kết — xem ADR 0016."""
    await user_repository.create(
        email="quang@gmail.com", name="Quang (đăng ký password)", password_hash="argon2-hash-gia", role=ROLE_PATIENT
    )

    response = await client.post("/api/v1/auth/google", json={"idToken": "fake-id-token"})

    assert response.status_code == 409
    assert response.json()["code"] == "google_account_conflict"
    assert len(user_repository.by_id) == 1  # không tạo user mới


# ── Token không hợp lệ ────────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_google_token_khong_hop_le_tra_401(
    client: AsyncClient, user_repository: InMemoryUserRepository, monkeypatch: pytest.MonkeyPatch
) -> None:
    async def _raise(id_token: str, client_id: str) -> GoogleIdentity:
        raise InvalidGoogleTokenError

    monkeypatch.setattr(auth_route, "verify_google_id_token", _raise)

    response = await client.post("/api/v1/auth/google", json={"idToken": "token-rac"})

    assert response.status_code == 401
    assert response.json()["code"] == "invalid_google_token"
    assert response.headers["www-authenticate"] == "Bearer"


@pytest.mark.asyncio
async def test_google_email_chua_verified_tra_401(
    client: AsyncClient, user_repository: InMemoryUserRepository, monkeypatch: pytest.MonkeyPatch
) -> None:
    async def _raise(id_token: str, client_id: str) -> GoogleIdentity:
        raise GoogleEmailNotVerifiedError

    monkeypatch.setattr(auth_route, "verify_google_id_token", _raise)

    response = await client.post("/api/v1/auth/google", json={"idToken": "token-chua-verify"})

    assert response.status_code == 401
    assert response.json()["code"] == "google_email_not_verified"


@pytest.mark.asyncio
async def test_thieu_id_token_tra_422(client: AsyncClient, user_repository: InMemoryUserRepository) -> None:
    response = await client.post("/api/v1/auth/google", json={})

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_id_token_rong_tra_422(client: AsyncClient, user_repository: InMemoryUserRepository) -> None:
    response = await client.post("/api/v1/auth/google", json={"idToken": ""})

    assert response.status_code == 422
