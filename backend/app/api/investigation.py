"""
ChronosIntel — Investigation API Router
=========================================
Endpoints:
  POST /api/investigation/       — Run a temporal investigation query
  GET  /api/investigation/cases  — List all investigation cases
  POST /api/investigation/cases  — Create a new case

The POST / endpoint is the core of ChronosIntel:
  Cognee knowledge graph search → evidence chain → Gemini grounded reasoning
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db
from app.database.schemas import (
    CaseCreate,
    CaseListResponse,
    CaseResponse,
    InvestigationRequest,
    InvestigationResponse,
)
from app.services.case_memory import case_memory_service
from app.services.temporal_reasoning import temporal_reasoning_service
from app.utils.exceptions import CaseNotFoundError

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/",
    response_model=InvestigationResponse,
    status_code=status.HTTP_200_OK,
    summary="Run a temporal investigation query",
    description=(
        "Execute a natural language investigation query over a case's knowledge graph. "
        "Returns a grounded answer with evidence chain. "
        "Gemini ONLY reasons over retrieved Cognee evidence — never from raw user input."
    ),
)
async def run_investigation(
    request: InvestigationRequest,
    db: AsyncSession = Depends(get_db),
) -> InvestigationResponse:
    """
    The core investigation endpoint.

    **Example queries:**
    - "Who knew about Project Phoenix before the leak?"
    - "What happened after the legal meeting on Jan 15?"
    - "Which employees communicated 24 hours before the breach?"

    **Pipeline:** temporal search → evidence chain → Gemini grounded reasoning
    """
    try:
        return await temporal_reasoning_service.investigate(
            db=db,
            case_id=request.case_id,
            query=request.query,
            date_from=request.date_from,
            date_to=request.date_to,
            entities_filter=request.entities_filter,
            max_results=request.max_results,
        )
    except CaseNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )
    except Exception as exc:
        logger.error("Investigation failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Investigation failed: {exc}",
        )


@router.get(
    "/cases",
    response_model=CaseListResponse,
    summary="List all investigation cases",
)
async def list_cases(
    page: int = 1,
    page_size: int = 20,
    db: AsyncSession = Depends(get_db),
) -> CaseListResponse:
    """List all investigation cases with pagination."""
    cases, total = await case_memory_service.list_cases(db, page=page, page_size=page_size)

    case_responses = []
    for case in cases:
        case_data = await case_memory_service.get_case_with_counts(db, case.id)
        case_responses.append(
            CaseResponse(
                id=case.id,
                title=case.title,
                description=case.description,
                status=case.status,
                investigator=case.investigator,
                tags=case.tags,
                cognee_dataset=case.cognee_dataset,
                document_count=case_data["document_count"],
                created_at=case.created_at,
                updated_at=case.updated_at,
            )
        )

    return CaseListResponse(
        cases=case_responses,
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/cases",
    response_model=CaseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new investigation case",
)
async def create_case(
    data: CaseCreate,
    db: AsyncSession = Depends(get_db),
) -> CaseResponse:
    """Create a new investigation case."""
    case = await case_memory_service.create_case(db, data)
    return CaseResponse(
        id=case.id,
        title=case.title,
        description=case.description,
        status=case.status,
        investigator=case.investigator,
        tags=case.tags,
        cognee_dataset=case.cognee_dataset,
        document_count=0,
        created_at=case.created_at,
        updated_at=case.updated_at,
    )


@router.get(
    "/cases/{case_id}",
    response_model=CaseResponse,
    summary="Get a specific case",
)
async def get_case(
    case_id: str,
    db: AsyncSession = Depends(get_db),
) -> CaseResponse:
    """Get details for a specific investigation case."""
    try:
        case_data = await case_memory_service.get_case_with_counts(db, case_id)
    except CaseNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    return CaseResponse(
        id=case_data["id"],
        title=case_data["title"],
        description=case_data["description"],
        status=case_data["status"],
        investigator=case_data["investigator"],
        tags=case_data["tags"],
        cognee_dataset=case_data["cognee_dataset"],
        document_count=case_data["document_count"],
        created_at=case_data["created_at"],
        updated_at=case_data["updated_at"],
    )
