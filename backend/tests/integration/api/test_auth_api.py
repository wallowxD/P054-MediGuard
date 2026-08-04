"""Test HTTP của auth router.

Repository thật được thay bằng implementation in-memory qua `dependency_overrides`, nên
test chạy hoàn toàn offline: không Supabase, không PostgreSQL, không mạng. Thứ được kiểm
ở đây là phần ráp nối HTTP — status code, hình dạng payload camelCase và error body —
còn bất biến bảo mật nằm ở `tests/unit/domain/test_auth_domain.py`.
"""

from collections.abc import Iterator
from uuid import UUID, uuid4

import pytest
from httpx import AsyncClient

from medsafe.api.dependencies import get_user_repository
from medsafe.config import Settings, get_settings
from medsafe.db.models.user import ROLE_PATIENT, User
from medsafe.domain.auth import EmailAlreadyRegisteredError
from medsafe.main import app

SECRET = "test-secret-khong-dung-o-production"

VALID_SIGNUP = {"email": "quang@gmail.com", "password": "matkhau123", "name": "Lê Nguyễn Minh Quang"}


class InMemoryUserRepository:
    """Thoả Protocol `UserRepository` nhưng giữ dữ liệu trong dict."""

    def __init__(self) -> None:
        self.by_email: dict[str, User] = {}

    async def get_by_email(self, email: str) -> User | None:
        return self.by_email.get(email)

    async def get_by_id(self, user_id: UUID) -> User | None:
        return next((u for u in self.by_email.values() if u.id == user_id), None)

    async def create(self, *, email: str, name: str, password_hash: str, role: str) -> User:
        if email in self.by_email:
            raise EmailAlreadyRegisteredError
        # is_active phải set tay: `default=True` của SQLAlchemy chỉ áp dụng lúc INSERT
        # thật, còn object dựng trong bộ nhớ sẽ có is_active=None.
        user = User(id=uuid4(), email=email, name=name, password_hash=password_hash, role=role, is_active=True)
        self.by_email[email] = user
        return user

    async def update_password_hash(self, user: User, password_hash: str) -> None:
        user.password_hash = password_hash


@pytest.fixture
def user_repository() -> Iterator[InMemoryUserRepository]:
    repository = InMemoryUserRepository()
    app.dependency_overrides[get_user_repository] = lambda: repository
    app.dependency_overrides[get_settings] = lambda: Settings(jwt_secret_key=SECRET)
    yield repository
    app.dependency_overrides.clear()


async def _register_and_login(client: AsyncClient) -> dict:
    await client.post("/api/v1/auth/register", json=VALID_SIGNUP)
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": VALID_SIGNUP["email"], "password": VALID_SIGNUP["password"]},
    )
    return response.json()


# ── POST /auth/register ────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_dang_ky_thanh_cong_tra_201_va_ho_so(
    client: AsyncClient, user_repository: InMemoryUserRepository
) -> None:
    response = await client.post("/api/v1/auth/register", json=VALID_SIGNUP)

    assert response.status_code == 201
    body = response.json()
    assert body["email"] == "quang@gmail.com"
    assert body["name"] == "Lê Nguyễn Minh Quang"
    assert body["roles"] == [ROLE_PATIENT]
    assert UUID(body["id"])


@pytest.mark.asyncio
async def test_response_dang_ky_khong_lo_mat_khau(client: AsyncClient, user_repository: InMemoryUserRepository) -> None:
    """Response chỉ được chứa đúng field của IAuthUser."""
    response = await client.post("/api/v1/auth/register", json=VALID_SIGNUP)

    assert set(response.json()) == {"id", "email", "name", "roles"}


@pytest.mark.asyncio
async def test_dang_ky_luon_tao_role_patient_du_client_gui_role_khac(
    client: AsyncClient, user_repository: InMemoryUserRepository
) -> None:
    """★ Chống leo thang đặc quyền: tự nhận PHARMACIST là vào được /review/**."""
    response = await client.post("/api/v1/auth/register", json={**VALID_SIGNUP, "role": "PHARMACIST"})

    assert response.status_code == 201
    assert response.json()["roles"] == [ROLE_PATIENT]


@pytest.mark.asyncio
async def test_email_duoc_ha_chu_thuong_truoc_khi_luu(
    client: AsyncClient, user_repository: InMemoryUserRepository
) -> None:
    await client.post("/api/v1/auth/register", json={**VALID_SIGNUP, "email": "Quang@Gmail.com"})

    assert "quang@gmail.com" in user_repository.by_email


@pytest.mark.asyncio
async def test_dang_ky_trung_email_tra_409(client: AsyncClient, user_repository: InMemoryUserRepository) -> None:
    await client.post("/api/v1/auth/register", json=VALID_SIGNUP)
    response = await client.post("/api/v1/auth/register", json=VALID_SIGNUP)

    assert response.status_code == 409
    assert response.json()["code"] == "email_already_registered"


@pytest.mark.asyncio
async def test_dang_ky_trung_email_khac_hoa_thuong_van_tra_409(
    client: AsyncClient, user_repository: InMemoryUserRepository
) -> None:
    await client.post("/api/v1/auth/register", json=VALID_SIGNUP)
    response = await client.post("/api/v1/auth/register", json={**VALID_SIGNUP, "email": "QUANG@gmail.com"})

    assert response.status_code == 409


@pytest.mark.asyncio
async def test_mat_khau_yeu_tra_400_kem_ly_do(client: AsyncClient, user_repository: InMemoryUserRepository) -> None:
    response = await client.post("/api/v1/auth/register", json={**VALID_SIGNUP, "password": "abc"})

    assert response.status_code == 400
    body = response.json()
    assert body["code"] == "password_policy_violation"
    assert "8 ký tự" in body["message"]


@pytest.mark.asyncio
async def test_email_sai_dinh_dang_tra_422(client: AsyncClient, user_repository: InMemoryUserRepository) -> None:
    response = await client.post("/api/v1/auth/register", json={**VALID_SIGNUP, "email": "khong-phai-email"})

    assert response.status_code == 422


# ── POST /auth/login ───────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_dang_nhap_tra_token_dang_camel_case(
    client: AsyncClient, user_repository: InMemoryUserRepository
) -> None:
    """Frontend đọc `accessToken`/`refreshToken`; snake_case ở đây là contract drift."""
    await client.post("/api/v1/auth/register", json=VALID_SIGNUP)
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": VALID_SIGNUP["email"], "password": VALID_SIGNUP["password"]},
    )

    assert response.status_code == 200
    body = response.json()
    assert set(body) == {"accessToken", "refreshToken", "expiresIn", "user"}
    assert body["user"]["email"] == "quang@gmail.com"


@pytest.mark.asyncio
async def test_sai_mat_khau_tra_401(client: AsyncClient, user_repository: InMemoryUserRepository) -> None:
    await client.post("/api/v1/auth/register", json=VALID_SIGNUP)
    response = await client.post(
        "/api/v1/auth/login", json={"email": VALID_SIGNUP["email"], "password": "sai-mat-khau1"}
    )

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"


@pytest.mark.asyncio
async def test_email_khong_ton_tai_tra_loi_giong_het_sai_mat_khau(
    client: AsyncClient, user_repository: InMemoryUserRepository
) -> None:
    """★ Không để endpoint đăng nhập trở thành công cụ dò xem email nào đã đăng ký."""
    await client.post("/api/v1/auth/register", json=VALID_SIGNUP)

    sai_mat_khau = await client.post(
        "/api/v1/auth/login", json={"email": VALID_SIGNUP["email"], "password": "sai-mat-khau1"}
    )
    khong_ton_tai = await client.post(
        "/api/v1/auth/login", json={"email": "nguoi-la@gmail.com", "password": "sai-mat-khau1"}
    )

    assert sai_mat_khau.status_code == khong_ton_tai.status_code == 401
    assert sai_mat_khau.json() == khong_ton_tai.json()


@pytest.mark.asyncio
async def test_refresh_token_doi_duoc_access_token_moi(
    client: AsyncClient, user_repository: InMemoryUserRepository
) -> None:
    tokens = await _register_and_login(client)

    response = await client.post("/api/v1/auth/refresh", json={"refreshToken": tokens["refreshToken"]})

    assert response.status_code == 200
    assert response.json()["accessToken"]


@pytest.mark.asyncio
async def test_dung_access_token_de_refresh_bi_tu_choi(
    client: AsyncClient, user_repository: InMemoryUserRepository
) -> None:
    tokens = await _register_and_login(client)

    response = await client.post("/api/v1/auth/refresh", json={"refreshToken": tokens["accessToken"]})

    assert response.status_code == 401
    assert response.json()["code"] == "invalid_token"


@pytest.mark.asyncio
async def test_refresh_khong_tra_ve_user(client: AsyncClient, user_repository: InMemoryUserRepository) -> None:
    """★ Khác biệt hợp đồng giữa hai endpoint.

    `/login` trả kèm `user`, `/refresh` thì không — khớp `ILoginResponse` và
    `IRefreshTokenResponse` ở frontend. Gộp chung một response model làm mất phân biệt này.
    """
    tokens = await _register_and_login(client)

    response = await client.post("/api/v1/auth/refresh", json={"refreshToken": tokens["refreshToken"]})

    assert set(response.json()) == {"accessToken", "refreshToken", "expiresIn"}


@pytest.mark.asyncio
async def test_login_body_rong_tra_422(client: AsyncClient, user_repository: InMemoryUserRepository) -> None:
    response = await client.post("/api/v1/auth/login", json={})

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_refresh_body_rong_tra_422(client: AsyncClient, user_repository: InMemoryUserRepository) -> None:
    response = await client.post("/api/v1/auth/refresh", json={})

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_refresh_token_chuoi_rong_tra_422(client: AsyncClient, user_repository: InMemoryUserRepository) -> None:
    """Chuỗi rỗng bị chặn ở tầng schema, không đi tới bước giải mã JWT."""
    response = await client.post("/api/v1/auth/refresh", json={"refreshToken": ""})

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_tai_khoan_bi_vo_hieu_hoa_tra_403(client: AsyncClient, user_repository: InMemoryUserRepository) -> None:
    await client.post("/api/v1/auth/register", json=VALID_SIGNUP)
    user_repository.by_email["quang@gmail.com"].is_active = False

    response = await client.post(
        "/api/v1/auth/login",
        json={"email": VALID_SIGNUP["email"], "password": VALID_SIGNUP["password"]},
    )

    assert response.status_code == 403
    assert response.json()["code"] == "account_inactive"


# ── GET /auth/profiles ─────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_profiles_tra_ho_so_cua_access_token(
    client: AsyncClient, user_repository: InMemoryUserRepository
) -> None:
    tokens = await _register_and_login(client)

    response = await client.get("/api/v1/auth/profiles", headers={"Authorization": f"Bearer {tokens['accessToken']}"})

    assert response.status_code == 200
    assert response.json()["email"] == "quang@gmail.com"


@pytest.mark.asyncio
async def test_profiles_thieu_token_tra_401(client: AsyncClient, user_repository: InMemoryUserRepository) -> None:
    response = await client.get("/api/v1/auth/profiles")

    assert response.status_code == 401
    assert response.json()["code"] == "invalid_token"


@pytest.mark.asyncio
async def test_profiles_voi_refresh_token_bi_tu_choi(
    client: AsyncClient, user_repository: InMemoryUserRepository
) -> None:
    """Refresh token sống 14 ngày — không được dùng nó thay access token."""
    tokens = await _register_and_login(client)

    response = await client.get("/api/v1/auth/profiles", headers={"Authorization": f"Bearer {tokens['refreshToken']}"})

    assert response.status_code == 401
