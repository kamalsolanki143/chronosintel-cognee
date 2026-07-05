"""
ChronosIntel — Timeline API Router
=====================================
Endpoints:
  GET /api/timeline/{case_id}         — Full chronological timeline
  GET /api/timeline/{case_id}/summary — Gemini-synthesized narrative
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db
from app.database.schemas import TimelineResponse
from app.services.timeline_engine import timeline_engine_service
from app.utils.exceptions import CaseNotFoundError

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
    "/{case_id}",
    response_model=TimelineResponse,
    summary="Get chronological event timeline for a case",
    description=(
        "Returns all temporal events extracted from the case knowledge graph, "
        "sorted chronologically. Merges database events with Cognee search results."
    ),
)
async def get_timeline(
    case_id: str,
    query: Optional[str] = Query(
        None, description="Optional focus query to filter timeline relevance"
    ),
    db: AsyncSession = Depends(get_db),
) -> TimelineResponse:
    """
    Retrieve the chronological investigation timeline for a case.

    Events are extracted from:
    - Database Event records (previously extracted/stored)
    - Live Cognee knowledge graph search

    Events without timestamps are sorted to the end of the timeline.
    """
    try:
        return await timeline_engine_service.get_timeline(
            db=db, case_id=case_id, query=query
        )
    except CaseNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        logger.error("Timeline failed for case=%s: %s", case_id, exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Timeline generation failed: {exc}",
        )


@router.get(
    "/{case_id}/summary",
    response_model=dict,
    summary="Get Gemini-synthesized timeline narrative",
)
async def get_timeline_summary(
    case_id: str,
    query: Optional[str] = Query(None, description="Optional focus query"),
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Get an AI-synthesized narrative summary of the case timeline.

    Uses Gemini to narrate the timeline as a coherent story,
    grounded in the extracted temporal events.
    """
    from ai.gemini.client import gemini_client

    try:
        timeline = await timeline_engine_service.get_timeline(
            db=db, case_id=case_id, query=query
        )
    except CaseNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    event_dicts = [e.model_dump() for e in timeline.events]

    narrative = await gemini_client.synthesize_timeline(
        case_id=case_id,
        events=event_dicts,
        query=query,
    )

    return {
        "case_id": case_id,
        "total_events": timeline.total_events,
        "date_range": timeline.date_range,
        "narrative": narrative,
    }
