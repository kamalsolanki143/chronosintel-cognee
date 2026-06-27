"""
ChronosIntel — Evidence API Router
=====================================
Endpoints:
  GET /api/evidence/{case_id}          — Full evidence chain with provenance
  GET /api/evidence/{case_id}/search   — Search evidence for a specific query
  GET /api/evidence/{case_id}/{ev_id}  — Single evidence record detail
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db
from app.database.schemas import EvidenceResponse
from app.services.case_memory import case_memory_service
from app.services.evidence_chain import evidence_chain_service
from app.utils.exceptions import CaseNotFoundError

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
    "/{case_id}",
    response_model=EvidenceResponse,
    summary="Get the evidence chain for a case",
    description=(
        "Returns the full traceable evidence chain for an investigation case. "
        "Each piece of evidence links to its source document and is scored for relevance. "
        "This is the ground truth behind every AI conclusion."
    ),
)
async def get_evidence_chain(
    case_id: str,
    limit: int = Query(50, ge=1, le=200, description="Max evidence items to return"),
    db: AsyncSession = Depends(get_db),
) -> EvidenceResponse:
    """
    Retrieve the full evidence chain for a case.

    Evidence items are sorted by relevance score (highest first).
    Each item includes: source document, text excerpt, explanation,
    relevance score, and optional timestamp.
    """
    try:
        await case_memory_service.get_case(db, case_id)
    except CaseNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    chain = await evidence_chain_service.get_evidence_chain(
        db=db, case_id=case_id, limit=limit
    )

    return EvidenceResponse(
        case_id=case_id,
        total_evidence=len(chain),
        evidence_chain=chain,
    )


@router.get(
    "/{case_id}/search",
    response_model=EvidenceResponse,
    summary="Search evidence for a specific query",
)
async def search_evidence(
    case_id: str,
    q: str = Query(..., min_length=3, description="Search query"),
    max_results: int = Query(20, ge=1, le=50),
    db: AsyncSession = Depends(get_db),
) -> EvidenceResponse:
    """
    Search the evidence base for a specific query.

    Performs a Cognee semantic search and returns matching evidence
    items with their source provenance.
    """
    from ai.cognee.temporal_search import temporal_search_engine

    try:
        await case_memory_service.get_case(db, case_id)
    except CaseNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    raw_results = await temporal_search_engine.temporal_search(
        case_id=case_id,
        query=q,
        max_results=max_results,
    )

    evidence_items = await evidence_chain_service.build_evidence_items(
        db=db,
        case_id=case_id,
        raw_results=raw_results,
    )

    # Convert to EvidenceChainItem format
    from app.database.schemas import EvidenceChainItem
    from app.database.models import EvidenceType
    chain_items = [
        EvidenceChainItem(
            id=item.evidence_id or f"search_{i}",
            document_id=item.document_id,
            document_name=item.document_name,
            evidence_type=item.evidence_type,
            text_excerpt=item.text_excerpt,
            explanation=item.explanation,
            relevance_score=item.relevance_score,
            timestamp=item.timestamp,
        )
        for i, item in enumerate(evidence_items)
    ]

    return EvidenceResponse(
        case_id=case_id,
        total_evidence=len(chain_items),
        evidence_chain=chain_items,
    )
