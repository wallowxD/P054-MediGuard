"""Query chỉ đọc cho batch chuẩn hóa toàn bộ condition mention."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from medsafe.db.models.interaction import DrugDiseaseInteraction
from medsafe.domain.condition_normalization import MentionInput, mention_record_id


class SqlConditionNormalizationRepository:
    """Đọc distinct mention; lớp này không cung cấp bất kỳ mutation nào."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_mentions(self, *, limit: int) -> list[MentionInput]:
        """Lấy mọi mention theo tần suất giảm dần rồi theo normalized name để kết quả tất định."""
        interaction_count = func.count(DrugDiseaseInteraction.id).label("interaction_count")
        raw_mention = func.min(DrugDiseaseInteraction.disease_name).label("raw_mention")
        result = await self._session.execute(
            select(
                raw_mention,
                DrugDiseaseInteraction.disease_name_unaccent,
                interaction_count,
            )
            .group_by(DrugDiseaseInteraction.disease_name_unaccent)
            .order_by(interaction_count.desc(), DrugDiseaseInteraction.disease_name_unaccent)
            .limit(limit)
        )
        mentions = [
            MentionInput(
                record_id=mention_record_id(normalized),
                raw_mention=raw,
                normalized_mention=normalized,
                interaction_count=count,
            )
            for raw, normalized, count in result.all()
        ]
        return mentions
