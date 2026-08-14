"""Điều phối tra cứu tổng hợp trên dữ liệu exact và citation đã xác thực."""

import asyncio
import json
import re
import time
from collections import Counter, defaultdict
from dataclasses import dataclass
from datetime import UTC, datetime
from itertools import combinations
from typing import Any, Literal
from urllib.parse import urlparse
from uuid import UUID

from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from medsafe.config import get_llm_config
from medsafe.db.models.drug import Drug
from medsafe.db.models.evidence import EvidenceChunk
from medsafe.db.models.interaction import (
    DrugDrugInteraction,
    DrugFoodInteraction,
)
from medsafe.db.repositories.disease_catalog_repository import SqlDiseaseCatalogRepository
from medsafe.db.repositories.drug_interaction_repository import SqlDrugDrugInteractionRepository
from medsafe.db.repositories.drug_repository import SqlDrugRepository
from medsafe.db.repositories.history_repository import SqlInteractionHistoryRepository
from medsafe.db.repositories.unified_interaction_repository import (
    CategorizedSupplementInteraction,
    MappedDiseaseInteraction,
    SqlUnifiedInteractionRepository,
)
from medsafe.domain.normalization import normalize_for_matching
from medsafe.domain.pairing import DrugPair
from medsafe.domain.supplement_category import supplement_note_kind
from medsafe.llm.llm_client import LLMClient
from medsafe.prompts.prompt_templates import INTERACTION_SUMMARY_PROMPT, INTERACTION_SUMMARY_SYSTEM
from medsafe.schemas.interactions import (
    AISummary,
    Citation,
    DiseaseSnapshot,
    DrugSnapshot,
    InteractionCheckResponse,
    InteractionItem,
    InteractionNote,
    SeverityScaleItem,
    UnavailableResult,
)

SEVERITY_ORDER = ("contraindicated", "major", "moderate", "minor", "unknown")
SEVERITY_LABELS = {
    "contraindicated": "Chống chỉ định",
    "major": "Nguy cơ cao",
    "moderate": "Cần thận trọng",
    "minor": "Mức độ nhẹ",
    "unknown": "Chưa phân loại",
}
_severity_cache: tuple[float, set[str]] | None = None


class _SummaryRecord(BaseModel):
    record_id: str = Field(alias="recordId")
    warning: str
    management_bullets: list[str] = Field(default_factory=list, alias="managementBullets")


class _SummaryBatch(BaseModel):
    summaries: list[_SummaryRecord]


@dataclass(frozen=True, slots=True)
class _NoteCandidate:
    kind: Literal["drug-food", "drug-supplement"]
    row: Any
    object_name: str
    source_priority: int
    citation: Citation


def _review_status(value: str | None) -> Literal["pending", "approved"]:
    return "approved" if value == "approved" else "pending"


def _fallback_summary(record: dict[str, Any]) -> AISummary:
    warning = record.get("consequence") or record.get("effectDescription") or record.get("mechanism")
    return AISummary(
        status="fallback",
        warning=warning or "Có bản ghi tương tác trong dữ liệu nguồn; vui lòng đối chiếu trích dẫn nguyên văn.",
        management_bullets=[record["management"]] if record.get("management") else [],
    )


class InteractionCheckService:
    def __init__(self, session: AsyncSession, llm_client: LLMClient | None = None) -> None:
        self.session = session
        self.drugs = SqlDrugRepository(session)
        self.diseases = SqlDiseaseCatalogRepository(session)
        self.ddi = SqlDrugDrugInteractionRepository(session)
        self.interactions = SqlUnifiedInteractionRepository(session)
        self.history = SqlInteractionHistoryRepository(session)
        self.llm_config = get_llm_config()
        self.llm = llm_client or LLMClient(model=self.llm_config.model)

    async def check(self, *, user_id: UUID, drug_ids: list[UUID], disease_ids: list[UUID]) -> InteractionCheckResponse:
        selected_drugs = await self.drugs.get_by_ids(drug_ids)
        if len(selected_drugs) != len(drug_ids):
            raise ValueError("Một hoặc nhiều thuốc không còn trong danh mục phiên bản hiện hành.")
        selected_drugs = sorted(selected_drugs, key=lambda value: drug_ids.index(value.id))
        selected_diseases = await self.diseases.get_by_ids(disease_ids)
        if len(selected_diseases) != len(disease_ids):
            raise ValueError("Một hoặc nhiều bệnh nền không còn trong danh mục được duyệt.")
        selected_diseases = sorted(selected_diseases, key=lambda value: disease_ids.index(value.id))

        drug_pairs = self._cross_drug_pairs(selected_drugs)
        disease_pairs = [
            (ingredient, disease.id)
            for drug in selected_drugs
            for ingredient in drug.canonical_ingredients
            for disease in selected_diseases
        ]
        ingredients = [value for drug in selected_drugs for value in drug.canonical_ingredients]
        # AsyncSession không cho chạy nhiều statement đồng thời trên cùng transaction.
        # Mỗi repository đã batch toàn bộ key nên bốn query tuần tự vẫn tránh N+1.
        ddi_rows = await self.ddi.find_by_pairs(drug_pairs, only_approved=False)
        disease_rows = await self.interactions.find_disease_interactions(disease_pairs)
        food_rows = await self.interactions.find_food_notes(ingredients, drug_ids)
        supplement_rows = await self.interactions.find_supplement_notes(ingredients, drug_ids)
        source_ids = {
            value
            for value in [
                *(row.source_drug_id for row in ddi_rows),
                *(value.interaction.drug_id for value in disease_rows),
                *(row.drug_id for row in food_rows),
                *(value.interaction.drug_id for value in supplement_rows),
            ]
            if value is not None
        }
        source_drugs = await self.interactions.get_source_drugs(list(source_ids))
        citation_drugs = list({drug.id: drug for drug in [*selected_drugs, *source_drugs]}.values())
        evidence = await self.interactions.list_candidate_evidence([drug.id for drug in citation_drugs])

        items, unavailable = self._build_primary(
            selected_drugs, citation_drugs, selected_diseases, drug_pairs, ddi_rows, disease_rows, evidence
        )
        notes = self._build_notes(citation_drugs, food_rows, supplement_rows, evidence)
        summarized = await self._summarize([*items, *notes])
        items = [InteractionItem.model_validate(value) for value in summarized[: len(items)]]
        notes = [InteractionNote.model_validate(value) for value in summarized[len(items) :]]

        counts = Counter(item.severity for item in items)
        scale = await self._severity_scale(counts)
        highlight = min(
            items,
            key=lambda item: (SEVERITY_ORDER.index(item.severity), item.kind, item.subject, item.object, item.id),
            default=None,
        )
        checked_at = datetime.now(UTC)
        drug_snapshots = [
            DrugSnapshot(id=drug.id, brand_name=drug.brand_name, ingredient=drug.ingredient_raw)
            for drug in selected_drugs
        ]
        disease_snapshots = [DiseaseSnapshot(id=disease.id, name=disease.name) for disease in selected_diseases]
        response = InteractionCheckResponse(
            check_id=None,
            history_status="not-saved",
            checked_at=checked_at,
            drugs=drug_snapshots,
            diseases=disease_snapshots,
            severity_scale=scale,
            highlight_id=highlight.id if highlight else None,
            items=items,
            notes=notes,
            unavailable=unavailable,
        )
        try:
            check = await self.history.save(
                user_id=user_id,
                drugs=[value.model_dump(mode="json", by_alias=True) for value in drug_snapshots],
                diseases=[value.model_dump(mode="json", by_alias=True) for value in disease_snapshots],
                severity_counts=dict(counts),
                summary_status="generated"
                if all(value.ai_summary.status == "generated" for value in [*items, *notes])
                else "fallback",
                items=[value.model_dump(mode="json", by_alias=True) for value in items],
                notes=[value.model_dump(mode="json", by_alias=True) for value in notes],
                unavailable=[value.model_dump(mode="json", by_alias=True) for value in unavailable],
            )
            response.check_id = check.id
            response.history_status = "saved"
            response.checked_at = check.created_at
        except Exception:
            await self.session.rollback()
        return response

    @staticmethod
    def _cross_drug_pairs(drugs: list[Drug]) -> list[DrugPair]:
        return sorted(
            {
                DrugPair.create(left, right)
                for drug_a, drug_b in combinations(drugs, 2)
                for left in drug_a.canonical_ingredients
                for right in drug_b.canonical_ingredients
                if normalize_for_matching(left) != normalize_for_matching(right)
            },
            key=lambda value: (value.ingredient_a, value.ingredient_b),
        )

    @staticmethod
    def _source_maps(
        drugs: list[Drug], evidence: list[EvidenceChunk]
    ) -> tuple[dict[UUID, Drug], dict[UUID, list[EvidenceChunk]]]:
        chunks: dict[UUID, list[EvidenceChunk]] = defaultdict(list)
        for chunk in evidence:
            if chunk.drug_id:
                chunks[chunk.drug_id].append(chunk)
        return {drug.id: drug for drug in drugs}, chunks

    @staticmethod
    def _is_google_drive_file_url(url: str | None) -> bool:
        if not url:
            return False
        parsed = urlparse(url)
        return parsed.scheme == "https" and parsed.netloc == "drive.google.com" and parsed.path.startswith("/file/d/")

    @staticmethod
    def _is_displayable_source_url(url: str | None) -> bool:
        if not url:
            return False
        parsed = urlparse(url)
        return parsed.scheme in {"http", "https"} and not parsed.path.lower().endswith(".md")

    def _citation(
        self,
        *,
        kind: str,
        row: Any,
        quote: str,
        source_drug_id: UUID | None,
        direct_url: str | None,
        drugs: list[Drug],
        evidence: list[EvidenceChunk],
        ingredient: str,
    ) -> Citation | None:
        if not quote or not quote.strip():
            return None
        drug_map, chunk_map = self._source_maps(drugs, evidence)
        candidate_ids = (
            [source_drug_id]
            if source_drug_id
            else [
                drug.id
                for drug in drugs
                if normalize_for_matching(ingredient) in {normalize_for_matching(v) for v in drug.canonical_ingredients}
            ]
        )
        matches = [
            chunk for drug_id in candidate_ids for chunk in chunk_map.get(drug_id, []) if quote.strip() in chunk.content
        ]
        source_drug = drug_map.get(source_drug_id) if source_drug_id else None
        chunk = matches[0] if len({(item.drug_id, item.source_url) for item in matches}) == 1 else None
        if source_drug is None and chunk:
            source_drug = drug_map.get(chunk.drug_id)
        source_candidates = [
            source_drug.leaflet_url if source_drug else None,
            direct_url,
            chunk.source_url if chunk else None,
        ]
        if kind in {"drug-food", "drug-supplement"}:
            # Các chunk OCR có thể trỏ tới artifact Markdown nội bộ. Người dùng phải
            # được đưa về đúng PDF tờ HDSD trong Drive, không được thấy file trung gian.
            url = next(
                (candidate for candidate in source_candidates if self._is_google_drive_file_url(candidate)), None
            )
        else:
            url = next(
                (
                    candidate
                    for candidate in [direct_url, *source_candidates]
                    if self._is_displayable_source_url(candidate)
                ),
                None,
            )
        if not url:
            return None
        version = getattr(row, "version", None) or getattr(row, "created_at", None) or "current"
        return Citation(
            evidence_id=f"{kind}:{row.id}:{version}",
            chunk_id=chunk.id if chunk else None,
            quote=quote.strip(),
            source=source_drug.brand_name if source_drug else "Tờ hướng dẫn sử dụng gốc",
            source_url=url,
            section=chunk.section_name if chunk else None,
        )

    def _build_primary(
        self,
        drugs: list[Drug],
        citation_drugs: list[Drug],
        diseases: list[Any],
        requested_pairs: list[DrugPair],
        ddi_rows: list[DrugDrugInteraction],
        disease_rows: list[MappedDiseaseInteraction],
        evidence: list[EvidenceChunk],
    ) -> tuple[list[InteractionItem], list[UnavailableResult]]:
        items: list[InteractionItem] = []
        unavailable: list[UnavailableResult] = []
        ddi_by_pair: dict[tuple[str, str], list[DrugDrugInteraction]] = defaultdict(list)
        for row in ddi_rows:
            ddi_by_pair[(row.ingredient_a_norm, row.ingredient_b_norm)].append(row)
        for pair in requested_pairs:
            rows = ddi_by_pair[(pair.ingredient_a, pair.ingredient_b)]
            valid = 0
            for row in rows:
                citation = self._citation(
                    kind="drug-drug",
                    row=row,
                    quote=row.verbatim_quote,
                    source_drug_id=row.source_drug_id,
                    direct_url=row.source_leaflet_url,
                    drugs=citation_drugs,
                    evidence=evidence,
                    ingredient=row.ingredient_a_norm,
                )
                if not citation:
                    continue
                valid += 1
                items.append(
                    self._item_from_row(row, "drug-drug", row.ingredient_a_norm, row.ingredient_b_norm, citation)
                )
            if not rows or not valid:
                unavailable.append(
                    UnavailableResult(
                        key=f"{pair.ingredient_a}|{pair.ingredient_b}",
                        kind="drug-drug",
                        subject=pair.ingredient_a,
                        object=pair.ingredient_b,
                        reason="missing-record" if not rows else "missing-citation",
                    )
                )

        disease_by_pair: dict[tuple[str, UUID], list[MappedDiseaseInteraction]] = defaultdict(list)
        for value in disease_rows:
            requested_ingredient = value.requested_ingredient or value.interaction.canonical_ingredient
            disease_by_pair[(requested_ingredient, value.disease_id)].append(value)
        rendered_disease_rows: set[tuple[UUID, str]] = set()
        for drug in drugs:
            for ingredient in drug.canonical_ingredients:
                for disease in diseases:
                    key = (normalize_for_matching(ingredient), disease.id)
                    rows = disease_by_pair[key]
                    valid = 0
                    for mapped_row in rows:
                        row = mapped_row.interaction
                        citation = self._citation(
                            kind="drug-disease",
                            row=row,
                            quote=row.verbatim_quote,
                            source_drug_id=row.drug_id,
                            direct_url=row.source_leaflet_url,
                            drugs=citation_drugs,
                            evidence=evidence,
                            ingredient=row.canonical_ingredient,
                        )
                        if not citation:
                            continue
                        valid += 1
                        row_key = (drug.id, row.disease_name_unaccent)
                        if row_key in rendered_disease_rows:
                            continue
                        rendered_disease_rows.add(row_key)
                        object_name = disease.name
                        if mapped_row.requires_context:
                            object_name = f"{row.disease_name} — thuộc nhóm {disease.name}"
                        items.append(self._item_from_row(row, "drug-disease", drug.brand_name, object_name, citation))
                    if not rows or not valid:
                        unavailable.append(
                            UnavailableResult(
                                key=f"{drug.id}|{disease.id}",
                                kind="drug-disease",
                                subject=drug.brand_name,
                                object=disease.name,
                                reason="missing-record" if not rows else "missing-citation",
                            )
                        )
        return items, unavailable

    def _item_from_row(
        self, row: Any, kind: Literal["drug-drug", "drug-disease"], subject: str, object_name: str, citation: Citation
    ) -> InteractionItem:
        raw = {
            "mechanism": getattr(row, "mechanism", None),
            "consequence": getattr(row, "consequence", None),
            "effectDescription": getattr(row, "effect_description", None),
            "management": getattr(row, "management", None),
        }
        return InteractionItem(
            id=f"{kind}:{row.id}",
            kind=kind,
            severity=row.severity if row.severity in SEVERITY_ORDER else "unknown",
            review_status=_review_status(row.review_status),
            subject=subject,
            object=object_name,
            pair_key=f"{subject}|{object_name}",
            mechanism=raw["mechanism"],
            consequence=raw["consequence"],
            effect_description=raw["effectDescription"],
            management=raw["management"],
            ai_summary=_fallback_summary(raw),
            citations=[citation],
        )

    def _build_notes(
        self,
        drugs: list[Drug],
        food_rows: list[DrugFoodInteraction],
        supplement_rows: list[CategorizedSupplementInteraction],
        evidence: list[EvidenceChunk],
    ) -> list[InteractionNote]:
        # `drug_supplement_interactions + supplements.category` là nguồn phân loại chính.
        # `drug_food_interactions` là nguồn legacy, chỉ bổ sung nội dung/citation còn thiếu
        # khi cùng hoạt chất + thực phẩm đã có ở nguồn chính.
        categorized_rows: list[tuple[Literal["drug-food", "drug-supplement"], Any, str, int]] = [
            (kind, value.interaction, value.interaction.supplement_name, 0)
            for value in supplement_rows
            if (kind := supplement_note_kind(value.category)) is not None
        ]
        categorized_rows.extend(("drug-food", row, row.food_item, 1) for row in food_rows)

        grouped: dict[tuple[str, str, str], list[_NoteCandidate]] = defaultdict(list)
        for kind, row, object_name, source_priority in categorized_rows:
            ingredient = row.canonical_ingredient
            citation = self._citation(
                kind=kind,
                row=row,
                quote=row.verbatim_quote,
                source_drug_id=row.drug_id,
                direct_url=None,
                drugs=drugs,
                evidence=evidence,
                ingredient=ingredient,
            )
            if not citation:
                continue
            key = (kind, self._note_text_key(ingredient), self._note_text_key(object_name))
            grouped[key].append(
                _NoteCandidate(
                    kind=kind,
                    row=row,
                    object_name=object_name,
                    source_priority=source_priority,
                    citation=citation,
                )
            )

        notes: list[InteractionNote] = []
        for key in sorted(grouped):
            candidates = sorted(grouped[key], key=lambda value: (value.source_priority, str(value.row.id)))
            primary = candidates[0]
            effect_description = self._merge_note_text(
                [getattr(value.row, "effect_description", None) for value in candidates]
            )
            management = self._merge_note_text([getattr(value.row, "management", None) for value in candidates])
            if (
                effect_description
                and management
                and self._note_text_key(effect_description) == self._note_text_key(management)
            ):
                management = None
            citations: list[Citation] = []
            citation_keys: set[tuple[str, str]] = set()
            for candidate in candidates:
                citation_key = (
                    self._quote_key(candidate.citation.quote),
                    candidate.citation.source_url.split("?", maxsplit=1)[0].rstrip("/").casefold(),
                )
                if citation_key in citation_keys:
                    continue
                citation_keys.add(citation_key)
                citations.append(candidate.citation)

            severities = {
                value
                for candidate in candidates
                if (value := getattr(candidate.row, "severity", None)) in SEVERITY_ORDER
            }
            severity = min(severities, key=SEVERITY_ORDER.index) if severities else "unknown"
            review_status: Literal["pending", "approved"] = (
                "approved"
                if all(_review_status(candidate.row.review_status) == "approved" for candidate in candidates)
                else "pending"
            )
            raw = {"effectDescription": effect_description, "management": management}
            notes.append(
                InteractionNote(
                    id=f"{primary.kind}:{primary.row.id}",
                    kind=primary.kind,
                    severity=severity,
                    review_status=review_status,
                    subject=primary.row.canonical_ingredient,
                    object=primary.object_name,
                    effect_description=effect_description,
                    management=management,
                    ai_summary=_fallback_summary(raw),
                    citations=citations,
                )
            )
        return notes

    @staticmethod
    def _note_text_key(value: str) -> str:
        return " ".join(normalize_for_matching(value).split())

    @classmethod
    def _quote_key(cls, value: str) -> str:
        without_marker = re.sub(r"^[\s\-–—•*]+", "", value)
        return cls._note_text_key(without_marker)

    @classmethod
    def _merge_note_text(cls, values: list[str | None]) -> str | None:
        merged: list[str] = []
        seen: set[str] = set()
        for value in values:
            stripped = value.strip() if value else ""
            key = cls._quote_key(stripped)
            if not stripped or not key or key in seen:
                continue
            seen.add(key)
            merged.append(stripped)
        return " ".join(merged) or None

    async def _summarize(self, records: list[InteractionItem | InteractionNote]) -> list[dict[str, Any]]:
        values = [record.model_dump(mode="json", by_alias=True) for record in records]
        semaphore = asyncio.Semaphore(self.llm_config.concurrency)

        async def summarize_batch(batch: list[dict[str, Any]]) -> dict[str, _SummaryRecord]:
            payload = [
                {
                    "recordId": row["id"],
                    "mechanism": row.get("mechanism"),
                    "consequence": row.get("consequence"),
                    "effectDescription": row.get("effectDescription"),
                    "management": row.get("management"),
                }
                for row in batch
            ]
            try:
                async with semaphore:
                    result = await self.llm.generate_structured(
                        INTERACTION_SUMMARY_PROMPT.format(records_json=json.dumps(payload, ensure_ascii=False)),
                        _SummaryBatch,
                        system=INTERACTION_SUMMARY_SYSTEM,
                        timeout_seconds=self.llm_config.timeout_seconds,
                    )
                expected = {row["id"] for row in batch}
                returned = {row.record_id for row in result.summaries}
                if expected != returned or len(result.summaries) != len(expected):
                    return {}
                return {row.record_id: row for row in result.summaries}
            except Exception:
                return {}

        maps = (
            await asyncio.gather(
                *(
                    summarize_batch(values[index : index + self.llm_config.batch_size])
                    for index in range(0, len(values), self.llm_config.batch_size)
                )
            )
            if values
            else []
        )
        generated = {key: value for batch_map in maps for key, value in batch_map.items()}
        for row in values:
            summary = generated.get(row["id"])
            if summary:
                row["aiSummary"] = {
                    "status": "generated",
                    "warning": summary.warning,
                    "managementBullets": summary.management_bullets,
                }
        return values

    async def _severity_scale(self, counts: Counter[str]) -> list[SeverityScaleItem]:
        global _severity_cache
        now = time.monotonic()
        if _severity_cache is None or now - _severity_cache[0] > 300:
            _severity_cache = (now, await self.interactions.distinct_severities())
        severities = _severity_cache[1] or set(SEVERITY_ORDER)
        return [
            SeverityScaleItem(severity=value, label=SEVERITY_LABELS[value], result_count=counts[value])
            for value in SEVERITY_ORDER
            if value in severities
        ]
