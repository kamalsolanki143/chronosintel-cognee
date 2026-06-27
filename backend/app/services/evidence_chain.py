"""
ChronosIntel — Evidence Chain Builder Service
===============================================
Builds a traceable evidence chain from Cognee search results.

Each piece of evidence is linked back to:
  - Source document
  - Relevant entity
  - Relevance score
  - Text excerpt

This is what prevents hallucination — every answer cites an evidence chain.
"""

from __future__ import annotations

import logging
from datetime import datetime
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database.models import Document, Entity, Evidence, EvidenceType
from app.database.schemas import EvidenceChainItem, EvidenceItem

logger = logging.getLogger(__name__)


class EvidenceChainService:
    """
    Builds a traceable evidence chain from raw Cognee search results.

    Usage::

        service = EvidenceChainService()
        evidence_items = await service.build_evidence_items(
            db=db,
            case_id="abc-123",
            raw_results=[...],  # from Cognee search
        )
    """

    async def build_evidence_items(
        self,
        db: AsyncSession,
        case_id: str,
        raw_results: list[dict[str, Any]],
        score_threshold: float | None = None,
    ) -> list[EvidenceItem]:
        """
        Convert raw Cognee search results into structured EvidenceItem list.

        Args:
            db:             Async database session.
            case_id:        The investigation case ID.
            raw_results:    Raw Cognee search result dicts.
            score_threshold: Minimum relevance score (defaults to config).

        Returns:
            List of EvidenceItem with provenance metadata.
        """
        threshold = score_threshold or settings.evidence_score_threshold
        evidence_items: list[EvidenceItem] = []

        # Load documents for this case (for name resolution)
        doc_result = await db.execute(
            select(Document.id, Document.original_filename).where(
                Document.case_id == case_id
            )
        )
        doc_name_map: dict[str, str] = {row[0]: row[1] for row in doc_result.fetchall()}

        for result in raw_results:
            text = (
                result.get("content")
                or result.get("text")
                or result.get("name")
                or ""
            )
            if not str(text).strip():
                continue

            # Extract relevance score
            score = float(
                result.get("score")
                or result.get("relevance_score")
                or result.get("similarity")
                or 1.0
            )

            if score < threshold:
                logger.debug("Skipping low-score evidence: %.3f < %.3f", score, threshold)
                continue

            # Try to resolve document metadata
            doc_id = result.get("document_id") or result.get("doc_id")
            doc_name = None
            if doc_id and doc_id in doc_name_map:
                doc_name = doc_name_map[doc_id]
            else:
                # Use source field from Cognee result
                doc_name = result.get("document_name") or result.get("source") or "Knowledge Graph"

            # Parse timestamp if available
            ts_raw = result.get("timestamp") or result.get("event_time") or result.get("created_at")
            timestamp: datetime | None = None
            if ts_raw:
                try:
                    timestamp = datetime.fromisoformat(str(ts_raw)) if isinstance(ts_raw, str) else ts_raw
                except ValueError:
                    pass

            evidence_items.append(
                EvidenceItem(
                    evidence_id=result.get("id"),
                    document_id=str(doc_id) if doc_id else None,
                    document_name=doc_name,
                    text_excerpt=str(text)[:600],
                    explanation=result.get("explanation"),
                    relevance_score=min(max(score, 0.0), 1.0),
                    evidence_type=EvidenceType.DIRECT,
                    timestamp=timestamp,
                    page_number=result.get("page_number"),
                )
            )

        # Sort by relevance descending
        evidence_items.sort(key=lambda e: e.relevance_score, reverse=True)
        logger.info(
            "Built evidence chain: %d items (threshold=%.2f)",
            len(evidence_items),
            threshold,
        )
        return evidence_items

    async def persist_evidence(
        self,
        db: AsyncSession,
        case_id: str,
        evidence_items: list[EvidenceItem],
    ) -> list[Evidence]:
        """
        Persist evidence items to the database for later retrieval.

        Args:
            db:             Async database session.
            case_id:        The investigation case ID.
            evidence_items: EvidenceItem list from build_evidence_items().

        Returns:
            List of created Evidence ORM objects.
        """
        records: list[Evidence] = []

        for item in evidence_items:
            evidence = Evidence(
                case_id=case_id,
                document_id=item.document_id,
                evidence_type=item.evidence_type,
                text_excerpt=item.text_excerpt,
                explanation=item.explanation,
                relevance_score=item.relevance_score,
                timestamp=item.timestamp,
                chunk_index=item.page_number,
            )
            db.add(evidence)
            records.append(evidence)

        await db.flush()
        logger.info("Persisted %d evidence records for case '%s'", len(records), case_id)
        return records

    async def get_evidence_chain(
        self, db: AsyncSession, case_id: str, limit: int = 50
    ) -> list[EvidenceChainItem]:
        """
        Retrieve the full evidence chain for a case from the database.

        Returns:
            List of EvidenceChainItem sorted by relevance.
        """
        result = await db.execute(
            select(Evidence)
            .where(Evidence.case_id == case_id)
            .order_by(Evidence.relevance_score.desc())
            .limit(limit)
        )
        records: list[Evidence] = list(result.scalars().all())

        # Build document name map
        doc_ids = {r.document_id for r in records if r.document_id}
        doc_name_map: dict[str, str] = {}
        if doc_ids:
            doc_result = await db.execute(
                select(Document.id, Document.original_filename).where(
                    Document.id.in_(doc_ids)
                )
            )
            doc_name_map = {row[0]: row[1] for row in doc_result.fetchall()}

        chain_items: list[EvidenceChainItem] = []
        for rec in records:
            chain_items.append(
                EvidenceChainItem(
                    id=rec.id,
                    document_id=rec.document_id,
                    document_name=doc_name_map.get(rec.document_id, "Unknown"),
                    evidence_type=rec.evidence_type,
                    text_excerpt=rec.text_excerpt,
                    explanation=rec.explanation,
                    relevance_score=rec.relevance_score,
                    timestamp=rec.timestamp,
                )
            )

        return chain_items


# ── Module-level singleton ────────────────────────────────────────────────────
evidence_chain_service = EvidenceChainService()
