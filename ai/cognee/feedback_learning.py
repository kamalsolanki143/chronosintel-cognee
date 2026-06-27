"""
ChronosIntel — Feedback Learning
===================================
Records investigator feedback and applies reinforcement
to the Cognee knowledge graph.

Feedback loop:
  1. Investigator rates an answer (1–5 stars)
  2. Marks useful evidence IDs
  3. Provides corrections if any
  4. FeedbackLearner stores feedback and re-adds corrections to Cognee
     so the graph is progressively improved

NOTE: Cognee does not yet expose a native reinforcement/feedback API.
      This implementation stores feedback and re-ingests corrections
      as high-priority documents. True RLHF integration is marked TODO.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

logger = logging.getLogger(__name__)


class FeedbackLearner:
    """
    Manages investigator feedback and applies graph reinforcement.

    Usage::

        learner = FeedbackLearner()
        result = await learner.record_feedback(
            case_id="abc-123",
            query="Who knew about the breach?",
            answer="John Doe and Alice Smith...",
            rating=4,
            corrections="The email was from Alice, not Bob.",
        )
    """

    async def record_feedback(
        self,
        case_id: str,
        query: str,
        answer: str,
        rating: int,
        feedback_text: str | None = None,
        evidence_ids: list[str] | None = None,
        corrections: str | None = None,
    ) -> dict[str, Any]:
        """
        Record investigator feedback and apply reinforcement if applicable.

        Args:
            case_id:      The investigation case ID.
            query:        The original investigation query.
            answer:       The answer provided by the system.
            rating:       1–5 star rating.
            feedback_text: Optional free-form feedback.
            evidence_ids: Evidence IDs the investigator marked as useful.
            corrections:  Investigator corrections to add to the knowledge graph.

        Returns:
            Dict with feedback_id and reinforcement_applied flag.
        """
        feedback_id = str(uuid.uuid4())
        reinforcement_applied = False

        # Log feedback record
        logger.info(
            "Feedback recorded | case=%s | rating=%d/5 | feedback_id=%s",
            case_id,
            rating,
            feedback_id,
        )

        # If investigator provided corrections, re-ingest them into Cognee
        if corrections and corrections.strip():
            try:
                await self._apply_correction(case_id, query, corrections, feedback_id)
                reinforcement_applied = True
                logger.info(
                    "Correction applied to Cognee | case=%s | feedback_id=%s",
                    case_id,
                    feedback_id,
                )
            except Exception as exc:
                logger.error(
                    "Failed to apply correction to Cognee | feedback_id=%s | error=%s",
                    feedback_id,
                    exc,
                )

        return {
            "feedback_id": feedback_id,
            "case_id": case_id,
            "reinforcement_applied": reinforcement_applied,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    async def _apply_correction(
        self,
        case_id: str,
        original_query: str,
        correction: str,
        feedback_id: str,
    ) -> None:
        """
        Re-ingest an investigator correction into Cognee as a high-priority document.

        The correction is formatted as a structured note and added to the
        case knowledge graph so future queries benefit from the correction.

        Args:
            case_id:        The investigation case ID.
            original_query: The query that led to the incorrect answer.
            correction:     The investigator's correction.
            feedback_id:    The feedback record ID (used for traceability).
        """
        from ai.cognee.memory_manager import cognee_memory

        correction_document = (
            f"[INVESTIGATOR CORRECTION — ID: {feedback_id}]\n"
            f"Original Query: {original_query}\n"
            f"Correction: {correction}\n"
            f"Recorded: {datetime.now(timezone.utc).isoformat()}\n"
            f"[END CORRECTION]"
        )

        await cognee_memory.add_document(
            case_id=case_id,
            text=correction_document,
            doc_id=f"correction_{feedback_id}",
            metadata={
                "type": "investigator_correction",
                "feedback_id": feedback_id,
                "original_query": original_query,
            },
        )

        # Re-build graph to incorporate the correction
        # TODO: Cognee does not yet support incremental graph updates.
        #       cognify() rebuilds the entire dataset graph.
        #       When incremental updates are available, replace with targeted update.
        await cognee_memory.build_graph(case_id=case_id)


# ── Module-level singleton ────────────────────────────────────────────────────
feedback_learner = FeedbackLearner()
