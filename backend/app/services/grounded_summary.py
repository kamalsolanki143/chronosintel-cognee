"""
ChronosIntel — Grounded Summary Service
========================================
Orchestrates chat follow-up queries with case memory context.

Unlike investigation queries (one-shot), chat maintains
conversation history while always grounding each reply
in freshly retrieved Cognee evidence.

Never passes user messages directly to Gemini without evidence.
"""

from __future__ import annotations

import logging
import time
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.database.schemas import ChatMessage, ChatResponse, EvidenceItem

logger = logging.getLogger(__name__)


class GroundedSummaryService:
    """
    Manages grounded chat responses with conversation memory.

    Usage::

        service = GroundedSummaryService()
        response = await service.chat(
            db=db,
            case_id="abc-123",
            message="What about Alice's emails?",
            conversation_history=[...],
        )
    """

    async def chat(
        self,
        db: AsyncSession,
        case_id: str,
        message: str,
        conversation_history: list[ChatMessage],
        max_history: int = 10,
    ) -> ChatResponse:
        """
        Process a chat message with grounded evidence retrieval.

        Args:
            db:                   Async database session.
            case_id:              The investigation case ID.
            message:              Current user message.
            conversation_history: Previous conversation messages.
            max_history:          Max messages to include in context.

        Returns:
            ChatResponse with grounded answer and supporting evidence.
        """
        start_time = time.time()

        from app.services.case_memory import case_memory_service
        from app.services.evidence_chain import evidence_chain_service
        from ai.cognee.temporal_search import temporal_search_engine
        from ai.gemini.client import gemini_client

        # Validate case
        await case_memory_service.get_case(db, case_id)

        # 1. Search Cognee with the current message
        logger.info("Chat search | case=%s | msg='%s'", case_id, message[:60])
        raw_results = await temporal_search_engine.temporal_search(
            case_id=case_id,
            query=message,
            max_results=15,
        )

        # 2. Build evidence items
        evidence_items = await evidence_chain_service.build_evidence_items(
            db=db,
            case_id=case_id,
            raw_results=raw_results,
        )

        # 3. Trim conversation history
        trimmed_history = conversation_history[-max_history:]
        history_dicts = [msg.model_dump() for msg in trimmed_history]

        # 4. Grounded chat response from Gemini
        answer = await gemini_client.chat_with_context(
            query=message,
            evidence_items=[item.model_dump() for item in evidence_items],
            conversation_history=history_dicts,
        )

        elapsed_ms = int((time.time() - start_time) * 1000)

        return ChatResponse(
            case_id=case_id,
            message=answer,
            evidence=evidence_items[:5],  # Top 5 for chat (less verbose)
            role="assistant",
            processing_time_ms=elapsed_ms,
        )


# ── Module-level singleton ────────────────────────────────────────────────────
grounded_summary_service = GroundedSummaryService()
