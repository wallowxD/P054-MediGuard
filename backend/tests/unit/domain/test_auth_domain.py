"""Test logic auth thuần — không database, không mạng, không LLM.

Mọi bất biến bảo mật kiểm được mà không cần hạ tầng đều nằm ở đây; test API chỉ kiểm
phần ráp nối HTTP.
"""

from datetime import UTC, datetime, timedelta

import pytest

from medsafe.domain.auth import (
    ACCESS_TOKEN_TYPE,
    REFRESH_TOKEN_TYPE,
    AuthNotConfiguredError,
    GoogleEmailNotVerifiedError,
    InvalidGoogleTokenError,
    InvalidTokenError,
    PasswordPolicyError,
    decode_token,
    extract_google_identity,
    hash_password,
    issue_token_pair,
    normalize_email,
    password_needs_rehash,
    validate_password_policy,
    verify_password,
    verify_password_against_dummy,
)

SECRET = "test-secret-khong-dung-o-production"
ALGORITHM = "HS256"


# ── Chuẩn hoá email ────────────────────────────────────────────────────────────


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("Quang@Gmail.com", "quang@gmail.com"),
        ("  quang@gmail.com  ", "quang@gmail.com"),
        ("QUANG@GMAIL.COM", "quang@gmail.com"),
    ],
)
def test_normalize_email_ha_chu_thuong_va_cat_khoang_trang(raw: str, expected: str) -> None:
    """Không chuẩn hoá thì cùng một người tạo được nhiều tài khoản trùng email."""
    assert normalize_email(raw) == expected


# ── Chính sách mật khẩu ────────────────────────────────────────────────────────


def test_password_dat_yeu_cau_thi_khong_nem_loi() -> None:
    validate_password_policy("matkhau123", min_length=8)


@pytest.mark.parametrize(
    ("password", "ly_do"),
    [
        ("abc123", "ngắn hơn 8 ký tự"),
        ("12345678", "không có chữ cái"),
        ("matkhaudai", "không có chữ số"),
    ],
)
def test_password_khong_dat_thi_nem_password_policy_error(password: str, ly_do: str) -> None:
    with pytest.raises(PasswordPolicyError):
        validate_password_policy(password, min_length=8)


# ── Băm và so khớp mật khẩu ────────────────────────────────────────────────────


def test_hash_roi_verify_dung_mat_khau() -> None:
    hashed = hash_password("matkhau123")
    assert verify_password("matkhau123", hashed) is True


def test_hash_khong_bao_gio_chua_mat_khau_goc() -> None:
    """Chốt chặn hiển nhiên nhưng đáng có: hash rò rỉ không được để lộ mật khẩu."""
    hashed = hash_password("matkhau123")
    assert "matkhau123" not in hashed
    assert hashed.startswith("$argon2id$")


def test_hai_lan_hash_cung_mat_khau_cho_ket_qua_khac_nhau() -> None:
    """Argon2 tự sinh salt. Hai hash giống nhau nghĩa là salt bị cố định — rất nguy hiểm."""
    assert hash_password("matkhau123") != hash_password("matkhau123")


def test_verify_sai_mat_khau_tra_false_thay_vi_nem_loi() -> None:
    hashed = hash_password("matkhau123")
    assert verify_password("matkhau-sai", hashed) is False


def test_verify_voi_hash_hong_tra_false() -> None:
    """Dữ liệu hỏng trong DB không được làm sập request path."""
    assert verify_password("matkhau123", "khong-phai-hash-argon2") is False


def test_verify_against_dummy_luon_false() -> None:
    assert verify_password_against_dummy("bat-ky-mat-khau-nao") is False


def test_hash_moi_khong_can_rehash() -> None:
    assert password_needs_rehash(hash_password("matkhau123")) is False


# ── JWT ────────────────────────────────────────────────────────────────────────


def _issue(**overrides: object):
    kwargs: dict = {
        "subject": "11111111-1111-1111-1111-111111111111",
        "email": "quang@gmail.com",
        "roles": ["PATIENT"],
        "secret_key": SECRET,
        "algorithm": ALGORITHM,
        "access_ttl_minutes": 30,
        "refresh_ttl_days": 14,
    }
    kwargs.update(overrides)
    return issue_token_pair(**kwargs)


def test_access_token_giai_ma_lai_dung_claim() -> None:
    tokens = _issue()
    claims = decode_token(tokens.access_token, secret_key=SECRET, algorithm=ALGORITHM, expected_type=ACCESS_TOKEN_TYPE)

    assert claims.subject == "11111111-1111-1111-1111-111111111111"
    assert claims.email == "quang@gmail.com"
    assert claims.roles == ["PATIENT"]
    assert claims.token_type == ACCESS_TOKEN_TYPE


def test_expires_in_khop_ttl_cau_hinh() -> None:
    assert _issue(access_ttl_minutes=30).expires_in == 30 * 60


def test_access_va_refresh_token_khac_nhau() -> None:
    """jti khiến hai token phát cùng lúc vẫn khác chuỗi."""
    tokens = _issue()
    assert tokens.access_token != tokens.refresh_token


def test_dung_refresh_token_nhu_access_token_bi_tu_choi() -> None:
    """★ Bất biến quan trọng nhất của module này.

    Refresh token sống 14 ngày, access token sống 30 phút. Nếu không kiểm claim `typ`
    thì một refresh token bị lộ sẽ gọi được API suốt hai tuần.
    """
    tokens = _issue()
    with pytest.raises(InvalidTokenError):
        decode_token(tokens.refresh_token, secret_key=SECRET, algorithm=ALGORITHM, expected_type=ACCESS_TOKEN_TYPE)


def test_dung_access_token_de_refresh_bi_tu_choi() -> None:
    tokens = _issue()
    with pytest.raises(InvalidTokenError):
        decode_token(tokens.access_token, secret_key=SECRET, algorithm=ALGORITHM, expected_type=REFRESH_TOKEN_TYPE)


def test_token_het_han_bi_tu_choi() -> None:
    tokens = _issue(issued_at=datetime.now(UTC) - timedelta(days=30))
    with pytest.raises(InvalidTokenError):
        decode_token(tokens.access_token, secret_key=SECRET, algorithm=ALGORITHM, expected_type=ACCESS_TOKEN_TYPE)


def test_token_ky_bang_secret_khac_bi_tu_choi() -> None:
    """Đổi JWT_SECRET_KEY phải làm mọi token cũ mất hiệu lực."""
    tokens = _issue()
    # Secret dài ≥32 byte: pyjwt cảnh báo InsecureKeyLengthWarning với khoá ngắn hơn,
    # và JWT_SECRET_KEY thật cũng phải đạt mức này (openssl rand -hex 32).
    with pytest.raises(InvalidTokenError):
        decode_token(
            tokens.access_token,
            secret_key="mot-secret-khac-du-dai-32-byte-tro-len",
            algorithm=ALGORITHM,
            expected_type=ACCESS_TOKEN_TYPE,
        )


def test_token_bi_sua_noi_dung_bi_tu_choi() -> None:
    tokens = _issue()
    header, payload, signature = tokens.access_token.split(".")
    tampered = f"{header}.{payload[:-4]}AAAA.{signature}"

    with pytest.raises(InvalidTokenError):
        decode_token(tampered, secret_key=SECRET, algorithm=ALGORITHM, expected_type=ACCESS_TOKEN_TYPE)


def test_thieu_secret_thi_bao_loi_cau_hinh_chu_khong_ky_bang_chuoi_rong() -> None:
    """Ký bằng secret rỗng nghĩa là ai cũng giả được token."""
    with pytest.raises(AuthNotConfiguredError):
        _issue(secret_key="")

    with pytest.raises(AuthNotConfiguredError):
        decode_token("bat-ky", secret_key="", algorithm=ALGORITHM, expected_type=ACCESS_TOKEN_TYPE)


# ── Claim Google OpenID Connect (ADR 0016) ──────────────────────────────────────
#
# Đây là claims ĐÃ được google-auth verify chữ ký/aud/exp — test ở đây không gọi Google,
# chỉ kiểm logic thuần trên dict claim giả.


def _google_claims(**overrides: object) -> dict[str, object]:
    claims: dict[str, object] = {
        "iss": "https://accounts.google.com",
        "aud": "test-client-id.apps.googleusercontent.com",
        "sub": "109876543210987654321",
        "email": "quang@gmail.com",
        "email_verified": True,
        "name": "Lê Nguyễn Minh Quang",
        "picture": "https://example.com/avatar.png",
    }
    claims.update(overrides)
    return claims


def test_claims_hop_le_tra_ve_identity() -> None:
    identity = extract_google_identity(_google_claims())

    assert identity.subject == "109876543210987654321"
    assert identity.email == "quang@gmail.com"
    assert identity.name == "Lê Nguyễn Minh Quang"


def test_issuer_sai_bi_tu_choi() -> None:
    with pytest.raises(InvalidGoogleTokenError):
        extract_google_identity(_google_claims(iss="https://evil.example.com"))


def test_thieu_sub_bi_tu_choi() -> None:
    claims = _google_claims()
    del claims["sub"]

    with pytest.raises(InvalidGoogleTokenError):
        extract_google_identity(claims)


def test_email_chua_verified_bi_tu_choi() -> None:
    """★ Không được dùng email chưa verified làm định danh liên hệ."""
    with pytest.raises(GoogleEmailNotVerifiedError):
        extract_google_identity(_google_claims(email_verified=False))


def test_thieu_email_bi_tu_choi() -> None:
    claims = _google_claims()
    del claims["email"]

    with pytest.raises(GoogleEmailNotVerifiedError):
        extract_google_identity(claims)


def test_thieu_name_va_picture_van_tra_ve_identity() -> None:
    """Google không bắt buộc trả `name`/`picture` — không được coi đây là lỗi."""
    claims = _google_claims()
    del claims["name"]
    del claims["picture"]

    identity = extract_google_identity(claims)

    assert identity.name is None
    assert identity.picture is None
