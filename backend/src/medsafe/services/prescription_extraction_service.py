"""Điều phối Gemini vision và catalog matching cho candidate ảnh đơn thuốc."""

from collections.abc import Sequence

from sqlalchemy.ext.asyncio import AsyncSession

from medsafe.config import PrescriptionExtractionConfig, get_prescription_extraction_config
from medsafe.db.repositories.disease_catalog_repository import SqlDiseaseCatalogRepository
from medsafe.db.repositories.drug_repository import SqlDrugRepository
from medsafe.domain.normalization import ScoredDrugCandidate, normalize_for_matching, search_catalog
from medsafe.domain.prescription_extraction import (
    PrescriptionExtractionError,
    PrescriptionExtractionTimeoutError,
    PrescriptionExtractionUnavailableError,
    PrescriptionImageInput,
    PrescriptionImageLimitError,
    prepare_prescription_image,
)
from medsafe.llm.llm_client import GeminiRateLimitError, GeminiUnavailableError, LLMClient
from medsafe.prompts.prompt_templates import (
    PRESCRIPTION_IMAGE_EXTRACTION_PROMPT,
    PRESCRIPTION_IMAGE_EXTRACTION_SYSTEM,
)
from medsafe.schemas.prescription_extraction import (
    ExtractedPrescriptionDisease,
    ExtractedPrescriptionDrug,
    ModelExtractedDisease,
    ModelExtractedDrug,
    ModelPrescriptionExtraction,
    PrescriptionDiseaseCandidate,
    PrescriptionDrugCandidate,
    PrescriptionExtractionResponse,
)


class PrescriptionExtractionService:
    def __init__(
        self,
        session: AsyncSession,
        llm_client: LLMClient | None = None,
        config: PrescriptionExtractionConfig | None = None,
    ) -> None:
        self.drugs = SqlDrugRepository(session)
        self.diseases = SqlDiseaseCatalogRepository(session)
        self.config = config or get_prescription_extraction_config()
        self.llm = llm_client or LLMClient(model=self.config.model)

    async def extract(self, images: Sequence[PrescriptionImageInput]) -> PrescriptionExtractionResponse:
        """Trích xuất candidate; không persist ảnh/output và không tự xác nhận catalog ID."""
        if not images:
            raise PrescriptionImageLimitError("Cần ít nhất một ảnh đơn thuốc.")
        if len(images) > self.config.max_files:
            raise PrescriptionImageLimitError(f"Chỉ được tải tối đa {self.config.max_files} ảnh mỗi lần.")
        if sum(len(image.data) for image in images) > self.config.max_total_size_bytes:
            raise PrescriptionImageLimitError("Tổng dung lượng ảnh không được vượt quá 25 MB.")

        prepared = [
            prepare_prescription_image(
                image,
                max_file_size_bytes=self.config.max_file_size_bytes,
                max_pixels=self.config.max_pixels,
            )
            for image in images
        ]
        try:
            extracted = await self.llm.generate_structured_with_images(
                PRESCRIPTION_IMAGE_EXTRACTION_PROMPT,
                ModelPrescriptionExtraction,
                system=PRESCRIPTION_IMAGE_EXTRACTION_SYSTEM,
                images=[(image.data, image.mime_type) for image in prepared],
                timeout_seconds=self.config.timeout_seconds,
            )
        except TimeoutError as exc:
            raise PrescriptionExtractionTimeoutError(
                "Gemini chưa phản hồi trong thời gian cho phép. Hãy thử lại sau; dung lượng ảnh không phải nguyên nhân."
            ) from exc
        except GeminiRateLimitError as exc:
            raise PrescriptionExtractionUnavailableError(
                "Gemini đã vượt giới hạn lượt gọi của API key. Hãy kiểm tra quota hoặc thử lại sau."
            ) from exc
        except GeminiUnavailableError as exc:
            raise PrescriptionExtractionUnavailableError(
                "Gemini đang quá tải khi xử lý ảnh. Hãy chờ một lúc rồi bấm đọc lại đơn thuốc."
            ) from exc
        except PrescriptionExtractionError:
            raise
        except Exception as exc:
            raise PrescriptionExtractionUnavailableError(
                "Chưa thể nhận diện đơn thuốc lúc này. Hãy thử lại hoặc nhập thuốc thủ công."
            ) from exc

        # Hai repository dùng chung một AsyncSession nên query tuần tự; mỗi query vẫn batch toàn catalog.
        drug_catalog = await self.drugs.list_catalog_pairs()
        disease_catalog = await self.diseases.list_active()
        unique_drugs = self._deduplicate_drugs(extracted.drugs)
        unique_diseases = self._deduplicate_diseases(extracted.diseases)
        return PrescriptionExtractionResponse(
            drugs=[
                ExtractedPrescriptionDrug(
                    raw_text=value.raw_text.strip(),
                    name=value.name.strip(),
                    ingredient=value.ingredient.strip() if value.ingredient and value.ingredient.strip() else None,
                    uncertain=value.uncertain,
                    candidates=self._match_drugs(value, drug_catalog),
                )
                for value in unique_drugs
            ],
            diseases=[
                ExtractedPrescriptionDisease(
                    raw_text=value.raw_text.strip(),
                    name=value.name.strip(),
                    uncertain=value.uncertain,
                    candidates=self._match_diseases(
                        value,
                        [(disease.id, disease.name, disease.name) for disease in disease_catalog],
                    ),
                )
                for value in unique_diseases
            ],
            model=self.config.model,
        )

    def _match_drugs(
        self,
        extracted: ModelExtractedDrug,
        catalog: list[tuple[object, str, str]],
    ) -> list[PrescriptionDrugCandidate]:
        scored_by_id: dict[str, ScoredDrugCandidate] = {}
        queries = [extracted.name, extracted.ingredient]
        for query in queries:
            if not query or not query.strip():
                continue
            scored, _ = search_catalog(query.strip(), catalog, limit=self.config.candidate_limit)
            for candidate in scored:
                current = scored_by_id.get(candidate.drug_id)
                if current is None or candidate.confidence > current.confidence:
                    scored_by_id[candidate.drug_id] = candidate
        ranked = sorted(scored_by_id.values(), key=lambda value: (-value.confidence, value.brand_name.casefold()))
        return [
            PrescriptionDrugCandidate(
                drug_id=value.drug_id,
                brand_name=value.brand_name,
                ingredient=value.ingredient,
                confidence=value.confidence,
            )
            for value in ranked[: self.config.candidate_limit]
        ]

    def _match_diseases(
        self,
        extracted: ModelExtractedDisease,
        catalog: list[tuple[object, str, str]],
    ) -> list[PrescriptionDiseaseCandidate]:
        scored, _ = search_catalog(extracted.name.strip(), catalog, limit=self.config.candidate_limit)
        return [
            PrescriptionDiseaseCandidate(
                disease_id=value.drug_id,
                name=value.brand_name,
                confidence=value.confidence,
            )
            for value in scored
        ]

    @staticmethod
    def _deduplicate_drugs(values: list[ModelExtractedDrug]) -> list[ModelExtractedDrug]:
        result: list[ModelExtractedDrug] = []
        positions: dict[str, int] = {}
        for value in values:
            key = normalize_for_matching(value.name)
            if not key:
                continue
            if key not in positions:
                positions[key] = len(result)
                result.append(value)
                continue
            index = positions[key]
            existing = result[index]
            if existing.uncertain and not value.uncertain:
                result[index] = value
        return result

    @staticmethod
    def _deduplicate_diseases(values: list[ModelExtractedDisease]) -> list[ModelExtractedDisease]:
        result: list[ModelExtractedDisease] = []
        positions: dict[str, int] = {}
        for value in values:
            key = normalize_for_matching(value.name)
            if not key:
                continue
            if key not in positions:
                positions[key] = len(result)
                result.append(value)
                continue
            index = positions[key]
            if result[index].uncertain and not value.uncertain:
                result[index] = value
        return result
