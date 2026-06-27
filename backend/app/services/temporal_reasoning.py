"""
ChronosIntel — Temporal Reasoning Service
==========================================
Orchestrates the full investigation query pipeline:

  1. Receive investigation query
  2. Search Cognee with temporal context
  3. Build evidence chain from results
  4. Pass evidence to Gemini for grounded reasoning
  5. Return structured InvestigationResponse

This service ensures Gemini ALWAYS reasons over retrieved evidence.
It never allows direct prompt-to-Gemini queries.
"""

from __future__ import annotations

import logging
import time
from datetime import datetime
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database.schemas import EvidenceItem, InvestigationResponse
from app.utils.exceptions import CaseNotFoundError, InsufficientEvidenceError

logger = logging.getLogger(__name__)


class TemporalReasoningService:
    """
    Orchestrates temporal investigation queries over the knowledge graph.

    The pipeline:
      query → Cognee temporal search → evidence chain → Gemini reasoning → response

    Usage::

        service = TemporalReasoningService()
        response = await service.investigate(
            db=db,
            case_id="abc-123",
            query="Who knew about Project Phoenix before the leak?",
        )
    """

    async def investigate(
        self,
        db: AsyncSession,
        case_id: str,
        query: str,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        entities_filter: list[str] | None = None,
        max_results: int | None = None,
    ) -> InvestigationResponse:
        """
        Run a full temporal investigation query.

        Args:
            db:             Async database session.
            case_id:        The investigation case ID.
            query:          Natural language investigation question.
            date_from:      Optional temporal filter (start).
            date_to:        Optional temporal filter (end).
            entities_filter: Optional entity name filter.
            max_results:    Max evidence results to retrieve.

        Returns:
            InvestigationResponse with grounded answer and evidence chain.

        Raises:
            CaseNotFoundError:        If the case doesn't exist.
            InsufficientEvidenceError: If no evidence is found.
        """
        start_time = time.time()

        from app.services.case_memory import case_memory_service
        from app.services.evidence_chain import evidence_chain_service
        from ai.cognee.temporal_search import temporal_search_engine
        from ai.gemini.client import gemini_client

        max_n = max_results or settings.max_evidence_results

        # 1. Validate case exists
        await case_memory_service.get_case(db, case_id)

        # 2. Temporal search via Cognee
        logger.info("Starting temporal investigation | case=%s | query='%s'", case_id, query[:80])
        raw_results = await temporal_search_engine.temporal_search(
            case_id=case_id,
            query=query,
            date_from=date_from,
            date_to=date_to,
            entities_filter=entities_filter,
            max_results=max_n,
        )

        # 3. Build evidence chain
        evidence_items = await evidence_chain_service.build_evidence_items(
            db=db,
            case_id=case_id,
            raw_results=raw_results,
        )

        # 4. Persist evidence to DB for later retrieval
        if evidence_items:
            await evidence_chain_service.persist_evidence(
                db=db, case_id=case_id, evidence_items=evidence_items
            )

        # 5. Get case context for prompt
        case_data = await case_memory_service.get_case_with_counts(db, case_id)
        additional_context = (
            f"Case: {case_data['title']}\n"
            f"{case_data.get('description') or ''}\n"
            f"Documents analyzed: {case_data['document_count']}"
        )

        # 6. Grounded reasoning via Gemini (ALWAYS uses evidence)
        answer = await gemini_client.reason_over_evidence(
            query=query,
            evidence_items=[item.model_dump() for item in evidence_items],
            additional_context=additional_context,
        )

        # 7. Extract entity mentions from the answer
        entities_mentioned = self._extract_entity_mentions(
            answer, [item.text_excerpt for item in evidence_items if item.text_excerpt]
        )

        # 8. Compute confidence from evidence quality
        confidence = self._compute_confidence(evidence_items)

        elapsed_ms = int((time.time() - start_time) * 1000)
        logger.info(
            "Investigation complete | case=%s | confidence=%.2f | evidence=%d | time=%dms",
            case_id, confidence, len(evidence_items), elapsed_ms,
        )

        return InvestigationResponse(
            case_id=case_id,
            query=query,
            answer=answer,
            confidence=confidence,
            evidence_count=len(evidence_items),
            evidence=evidence_items,
            entities_mentioned=entities_mentioned,
            temporal_range={
                "from": date_from.isoformat() if date_from else None,
                "to": date_to.isoformat() if date_to else None,
            },
            processing_time_ms=elapsed_ms,
        )

    @staticmethod
    def _compute_confidence(evidence_items: list[EvidenceItem]) -> float:
        """
        Compute an overall confidence score from evidence quality.

        Formula: average of top-5 evidence scores, penalized by low count.
        """
        if not evidence_items:
            return 0.0

        scores = sorted(
            [e.relevance_score for e in evidence_items], reverse=True
        )[:5]
        avg_score = sum(scores) / len(scores)

        # Penalize when fewer than 3 evidence items
        count_factor = min(len(evidence_items) / 3.0, 1.0)
        return round(avg_score * count_factor, 3)

    @staticmethod
    def _extract_entity_mentions(
        answer: str, evidence_texts: list[str]
    ) -> list[str]:
        """
        Extract likely named entities mentioned in the answer.
        Uses simple capitalized word heuristic — Gemini-based extraction
        is available in entity_extractor.py for more precise extraction.
        """
        import re

        # Find sequences of 1-3 capitalized words (proper nouns)
        pattern = re.compile(r"\b[A-Z][a-zA-Z]+(?:\s+[A-Z][a-zA-Z]+){0,2}\b")
        mentions = pattern.findall(answer)

        # Filter common English words
        stop_words = {
            "The", "This", "That", "These", "Those", "Based", "According",
            "Evidence", "Finding", "Confidence", "High", "Medium", "Low",
            "ChronosIntel", "Insufficient",
        }
        unique_mentions = list({m for m in mentions if m not in stop_words})
        return unique_mentions[:10]


# ── Module-level singleton ────────────────────────────────────────────────────
temporal_reasoning_service = TemporalReasoningService()
