"""Toàn bộ SQL liên quan tới hồ sơ sức khoẻ tự khai của người dùng.

Protocol là ranh giới để tầng API không phụ thuộc SQLAlchemy; integration test override
dependency bằng implementation in-memory nên chạy được mà không cần database thật.

★ Repository này CHỈ đọc/ghi hồ sơ theo yêu cầu tường minh của người dùng. Không có hàm
  nào "lấy bệnh nền từ hồ sơ để tra cứu", và đừng thêm: hồ sơ không tự sinh cảnh báo và
  không tự chảy vào request tra cứu (ADR 0017, spec 002 US1.4).
"""

from datetime import date
from decimal import Decimal
from typing import Protocol
from uuid import UUID

from sqlalchemy import case, delete, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import func

from medsafe.db.models.disease import Disease
from medsafe.db.models.patient import (
    SOURCE_PHARMACIST_CONFIRMED,
    SOURCE_SELF_REPORTED,
    SPECIAL_CONDITION_CODES,
    PatientCondition,
    PatientDisease,
    PatientProfile,
)


class PatientProfileRepository(Protocol):
    """Cổng truy cập hồ sơ sức khoẻ tự khai mà tầng API được phép biết tới."""

    async def get_profile(self, user_id: UUID) -> PatientProfile | None: ...

    async def upsert_profile(
        self,
        user_id: UUID,
        *,
        date_of_birth: date | None,
        sex: str | None,
        weight_kg: Decimal | None,
        height_cm: Decimal | None,
    ) -> PatientProfile: ...

    async def record_consent(self, user_id: UUID) -> PatientProfile: ...

    async def delete_profile(self, user_id: UUID) -> bool: ...

    async def delete_all_health_data(self, user_id: UUID) -> None: ...

    async def list_conditions(self, user_id: UUID) -> list[PatientCondition]: ...

    async def add_condition(
        self, user_id: UUID, condition_code: str, *, source: str = SOURCE_SELF_REPORTED
    ) -> PatientCondition: ...

    async def delete_condition(self, user_id: UUID, condition_id: UUID) -> bool: ...

    async def delete_all_conditions(self, user_id: UUID) -> int: ...

    async def list_diseases(self, user_id: UUID) -> list[tuple[PatientDisease, Disease]]: ...

    async def add_disease(
        self, user_id: UUID, disease_id: UUID, *, source: str = SOURCE_SELF_REPORTED
    ) -> PatientDisease: ...

    async def delete_disease(self, user_id: UUID, patient_disease_id: UUID) -> bool: ...


class SqlPatientProfileRepository:
    """Implementation SQLAlchemy chạy trên Supabase PostgreSQL."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_profile(self, user_id: UUID) -> PatientProfile | None:
        return await self._session.get(PatientProfile, user_id)

    async def upsert_profile(
        self,
        user_id: UUID,
        *,
        date_of_birth: date | None,
        sex: str | None,
        weight_kg: Decimal | None,
        height_cm: Decimal | None,
    ) -> PatientProfile:
        """Ghi đè toàn bộ hồ sơ, khớp ngữ nghĩa PUT của endpoint health-profile.

        Dùng INSERT … ON CONFLICT thay vì "SELECT rồi INSERT hoặc UPDATE": hai request
        lưu hồ sơ gửi song song sẽ cùng qua được bước SELECT và bản ghi thứ hai chết vì
        trùng khoá chính.

        `updated_at` phải set tường minh ở nhánh DO UPDATE — `onupdate=func.now()` của
        ORM chỉ chạy với UPDATE do ORM sinh ra, không áp cho câu lệnh này.

        `consented_at` CỐ Ý không nằm trong nhánh DO UPDATE: lưu lại hồ sơ không phải là
        lúc xin đồng ý lần nữa, và ghi đè nó sẽ xoá mất dấu vết đồng ý lần đầu. Dùng
        `record_consent`.
        """
        values = {
            "user_id": user_id,
            "date_of_birth": date_of_birth,
            "sex": sex,
            "weight_kg": weight_kg,
            "height_cm": height_cm,
        }
        stmt = (
            insert(PatientProfile)
            .values(**values)
            .on_conflict_do_update(
                index_elements=[PatientProfile.user_id],
                set_={
                    "date_of_birth": date_of_birth,
                    "sex": sex,
                    "weight_kg": weight_kg,
                    "height_cm": height_cm,
                    "updated_at": func.now(),
                },
            )
            .returning(PatientProfile)
        )
        result = await self._session.execute(stmt)
        profile = result.scalar_one()
        await self._session.commit()
        await self._session.refresh(profile)
        return profile

    async def record_consent(self, user_id: UUID) -> PatientProfile:
        """Đóng dấu thời điểm người dùng đồng ý cho lưu dữ liệu sức khoẻ.

        `COALESCE` giữ nguyên dấu cũ nếu đã có: gọi lại nhiều lần không dời mốc đồng ý
        lần đầu, mà mốc đó mới là thứ có ý nghĩa khi cần chứng minh.

        Tạo luôn dòng hồ sơ rỗng nếu chưa có — đồng ý xảy ra TRƯỚC lúc nhập dữ liệu, nên
        đây là thứ tự đúng chứ không phải tác dụng phụ.
        """
        stmt = (
            insert(PatientProfile)
            .values(user_id=user_id, consented_at=func.now())
            .on_conflict_do_update(
                index_elements=[PatientProfile.user_id],
                set_={"consented_at": func.coalesce(PatientProfile.consented_at, func.now())},
            )
            .returning(PatientProfile)
        )
        result = await self._session.execute(stmt)
        profile = result.scalar_one()
        await self._session.commit()
        await self._session.refresh(profile)
        return profile

    async def delete_all_health_data(self, user_id: UUID) -> None:
        """Xoá TOÀN BỘ dữ liệu sức khoẻ của một người dùng trong MỘT transaction.

        Đây là hàm mà endpoint "xoá hồ sơ của tôi" phải gọi. Gọi lần lượt `delete_profile`
        rồi `delete_all_conditions` thì mỗi hàm tự commit, nên một lỗi ở giữa để lại
        "đang mang thai" hay "suy thận" mồ côi trong database của một người vừa được báo
        là dữ liệu sức khoẻ đã xoá xong. Không có FK cascade nào che chỗ này vì hai bảng
        cùng trỏ tới `users`, không trỏ vào nhau.

        Không đụng tới tài khoản đăng nhập.
        """
        await self._session.execute(delete(PatientDisease).where(PatientDisease.user_id == user_id))
        await self._session.execute(delete(PatientCondition).where(PatientCondition.user_id == user_id))
        await self._session.execute(delete(PatientProfile).where(PatientProfile.user_id == user_id))
        await self._session.commit()

    async def delete_profile(self, user_id: UUID) -> bool:
        """Xoá riêng dòng hồ sơ. KHÔNG đụng tài khoản và KHÔNG xoá `patient_conditions`.

        Dùng cho thao tác hẹp "xoá phần thông tin cơ thể" trên UI. Xoá toàn bộ dữ liệu
        sức khoẻ thì dùng `delete_all_health_data` để hai bảng đi trong cùng transaction.
        """
        result = await self._session.execute(delete(PatientProfile).where(PatientProfile.user_id == user_id))
        await self._session.commit()
        return bool(result.rowcount)

    async def list_conditions(self, user_id: UUID) -> list[PatientCondition]:
        result = await self._session.execute(
            select(PatientCondition)
            .where(
                PatientCondition.user_id == user_id,
                PatientCondition.condition_code.in_(SPECIAL_CONDITION_CODES),
            )
            .order_by(PatientCondition.created_at, PatientCondition.condition_code)
        )
        return list(result.scalars().all())

    async def add_condition(
        self, user_id: UUID, condition_code: str, *, source: str = SOURCE_SELF_REPORTED
    ) -> PatientCondition:
        """Thêm một tình trạng đặc biệt. Idempotent: thêm lại mã đã có không tạo dòng lặp.

        Nhánh DO UPDATE cho phép dược sĩ xác nhận một tình trạng người dùng đã tự khai mà
        không cần xoá rồi thêm lại. Nhưng nó CHỈ ĐI MỘT CHIỀU: `pharmacist_confirmed` đã
        có thì giữ nguyên, kể cả khi lệnh mới mang `self_reported`.

        Không có nhánh CASE này thì người dùng bỏ chọn rồi chọn lại một chip — thao tác
        hoàn toàn bình thường trên UI — sẽ âm thầm hạ cấp xác nhận của dược sĩ xuống dữ
        liệu tự khai, mà không ai nhìn thấy gì bất thường.

        Hạ cấp có chủ ý (dược sĩ rút lại xác nhận) phải đi bằng đường khác, không đi lẫn
        vào thao tác thêm của người dùng.
        """
        stmt = (
            insert(PatientCondition)
            .values(user_id=user_id, condition_code=condition_code, source=source)
            .on_conflict_do_update(
                constraint="uq_patient_conditions_user_code",
                set_={
                    "source": case(
                        (PatientCondition.source == SOURCE_PHARMACIST_CONFIRMED, SOURCE_PHARMACIST_CONFIRMED),
                        else_=source,
                    )
                },
            )
            .returning(PatientCondition)
        )
        result = await self._session.execute(stmt)
        condition = result.scalar_one()
        await self._session.commit()
        await self._session.refresh(condition)
        return condition

    async def delete_condition(self, user_id: UUID, condition_id: UUID) -> bool:
        """Xoá theo (id, user_id) chứ không chỉ theo id.

        Lọc thêm `user_id` để một người dùng không xoá được dòng của người khác kể cả khi
        đoán đúng UUID; tầng API không phải nhớ tự kiểm tra quyền sở hữu.
        """
        result = await self._session.execute(
            delete(PatientCondition).where(
                PatientCondition.id == condition_id,
                PatientCondition.user_id == user_id,
            )
        )
        await self._session.commit()
        return bool(result.rowcount)

    async def delete_all_conditions(self, user_id: UUID) -> int:
        result = await self._session.execute(delete(PatientCondition).where(PatientCondition.user_id == user_id))
        await self._session.commit()
        return int(result.rowcount or 0)

    async def list_diseases(self, user_id: UUID) -> list[tuple[PatientDisease, Disease]]:
        """Liệt kê bệnh đã lưu, kể cả khi catalog về sau bị ẩn khỏi autocomplete."""
        result = await self._session.execute(
            select(PatientDisease, Disease)
            .join(Disease, Disease.id == PatientDisease.disease_id)
            .where(PatientDisease.user_id == user_id)
            .order_by(Disease.name_unaccent, PatientDisease.created_at)
        )
        return [(association, disease) for association, disease in result.all()]

    async def add_disease(
        self, user_id: UUID, disease_id: UUID, *, source: str = SOURCE_SELF_REPORTED
    ) -> PatientDisease:
        """Lưu stable disease ID; idempotent và không hạ cấp xác nhận của dược sĩ."""
        stmt = (
            insert(PatientDisease)
            .values(user_id=user_id, disease_id=disease_id, source=source)
            .on_conflict_do_update(
                constraint="uq_patient_diseases_user_disease",
                set_={
                    "source": case(
                        (PatientDisease.source == SOURCE_PHARMACIST_CONFIRMED, SOURCE_PHARMACIST_CONFIRMED),
                        else_=source,
                    )
                },
            )
            .returning(PatientDisease)
        )
        result = await self._session.execute(stmt)
        association = result.scalar_one()
        await self._session.commit()
        await self._session.refresh(association)
        return association

    async def delete_disease(self, user_id: UUID, patient_disease_id: UUID) -> bool:
        """Xoá theo cả association ID và owner để không thể xoá bệnh của user khác."""
        result = await self._session.execute(
            delete(PatientDisease).where(
                PatientDisease.id == patient_disease_id,
                PatientDisease.user_id == user_id,
            )
        )
        await self._session.commit()
        return bool(result.rowcount)
