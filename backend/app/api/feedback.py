"""
ChronosIntel — Feedback API Router
=====================================
Endpoints:
  POST /api/feedback/ — Submit investigator feedback on an investigation result

Feedback is used to:
  1. Record rating and free-form text
  2. Re-ingest investigator corrections into Cognee
  3. Rebuild graph to incorporate corrections (progressive learning)
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db
from app.database.schemas import FeedbackRequest, FeedbackResponse
from app.services.case_memory import case_memory_service
from app.utils.exceptions import CaseNotFoundError

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/",
    response_model=FeedbackResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Submit investigator feedback",
    description=(
        "Submit feedback on an investigation answer. "
        "Ratings of 1-5 stars. Corrections are re-ingested into the "
        "knowledge graph to improve future answers."
    ),
)
async def submit_feedback(
    request: FeedbackRequest,
    db: AsyncSession = Depends(get_db),
) -> FeedbackResponse:
    """
    Submit investigator feedback on an investigation result.

    If `corrections` is provided, the correction text is re-ingested
    into the Cognee knowledge graph and the graph is rebuilt.
    This progressively improves future investigation accuracy.

    **Feedback loop:**
    1. Record rating (1-5)
    2. Log useful evidence IDs
    3. If corrections provided → re-ingest into Cognee → rebuild graph
    """
    from ai.cognee.feedback_learning import feedback_learner

    try:
        await case_memory_service.get_case(db, request.case_id)
    except CaseNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    result = await feedback_learner.record_feedback(
        case_id=request.case_id,
        query=request.query,
        answer=request.answer,
        rating=request.rating,
        feedback_text=request.feedback_text,
        evidence_ids=request.evidence_ids,
        corrections=request.corrections,
    )

    logger.info(
        "Feedback submitted: case=%s rating=%d reinforcement=%s",
        request.case_id, request.rating, result["reinforcement_applied"],
    )

    return FeedbackResponse(
        feedback_id=result["feedback_id"],
        case_id=request.case_id,
        message=(
            "Feedback recorded. Correction applied to knowledge graph."
            if result["reinforcement_applied"]
            else "Feedback recorded. Thank you for improving ChronosIntel."
        ),
        reinforcement_applied=result["reinforcement_applied"],
    )


@router.get(
    "/",
    response_model=dict,
    summary="Feedback health check",
)
async def feedback_health() -> dict:
    """Simple health check for the feedback endpoint."""
    return {
        "status": "ok",
        "message": "Feedback endpoint is active. POST / to submit feedback.",
    }
