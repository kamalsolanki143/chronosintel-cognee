"""
ChronosIntel — Reports API Router
====================================
Endpoints:
  GET  /api/report/{case_id}         — Generate or retrieve investigation report
  GET  /api/report/{case_id}/list    — List all reports for a case
  POST /api/report/{case_id}/finalize — Mark report as final
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db
from app.database.models import Report
from app.database.schemas import ReportRequest, ReportResponse
from app.services.case_memory import case_memory_service
from app.services.report_generator import report_generator_service
from app.utils.exceptions import CaseNotFoundError

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
    "/{case_id}",
    response_model=ReportResponse,
    summary="Generate or retrieve the investigation report",
    description=(
        "Generates a comprehensive investigation report using Gemini, "
        "grounded in evidence retrieved from Cognee. "
        "If a recent report exists, returns it. Otherwise generates a new one."
    ),
)
async def get_report(
    case_id: str,
    query: Optional[str] = Query(None, description="Focus question for the report"),
    force_regenerate: bool = Query(
        False, description="Force regeneration even if a report exists"
    ),
    db: AsyncSession = Depends(get_db),
) -> ReportResponse:
    """
    Get the investigation report for a case.

    If a report already exists and `force_regenerate=False`, returns the latest.
    Otherwise generates a fresh grounded report using Gemini.
    """
    try:
        await case_memory_service.get_case(db, case_id)
    except CaseNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    # Check for existing report (if not forcing regeneration)
    if not force_regenerate:
        existing = await report_generator_service.get_latest_report(db, case_id)
        if existing:
            return ReportResponse(
                report_id=existing.id,
                case_id=case_id,
                version=existing.version,
                query=existing.query,
                summary=existing.summary or "",
                findings=existing.findings or {},
                html_content=existing.html_content,
                entity_count=existing.entity_count,
                event_count=existing.event_count,
                evidence_count=len(existing.evidence_ids or []),
                is_final=existing.is_final,
                created_at=existing.created_at,
            )

    # Generate new report
    try:
        return await report_generator_service.generate_report(
            db=db,
            case_id=case_id,
            query=query,
            include_timeline=True,
            include_evidence=True,
        )
    except Exception as exc:
        logger.error("Report generation failed: case=%s error=%s", case_id, exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report generation failed: {exc}",
        )


@router.post(
    "/{case_id}/generate",
    response_model=ReportResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate a new investigation report",
)
async def generate_report(
    case_id: str,
    request: ReportRequest,
    db: AsyncSession = Depends(get_db),
) -> ReportResponse:
    """
    Force-generate a new investigation report for a case.
    Always creates a new version regardless of existing reports.
    """
    try:
        await case_memory_service.get_case(db, case_id)
    except CaseNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    try:
        return await report_generator_service.generate_report(
            db=db,
            case_id=case_id,
            query=request.query,
            include_timeline=request.include_timeline,
            include_evidence=request.include_evidence,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Report generation failed: {exc}",
        )


@router.get(
    "/{case_id}/list",
    response_model=list[dict],
    summary="List all reports for a case",
)
async def list_reports(
    case_id: str,
    db: AsyncSession = Depends(get_db),
) -> list[dict]:
    """List all generated investigation reports for a case."""
    try:
        await case_memory_service.get_case(db, case_id)
    except CaseNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    result = await db.execute(
        select(Report)
        .where(Report.case_id == case_id)
        .order_by(Report.version.desc())
    )
    reports = list(result.scalars().all())

    return [
        {
            "report_id": r.id,
            "version": r.version,
            "query": r.query,
            "is_final": r.is_final,
            "entity_count": r.entity_count,
            "event_count": r.event_count,
            "created_at": r.created_at.isoformat(),
        }
        for r in reports
    ]


@router.post(
    "/{case_id}/finalize/{report_id}",
    response_model=dict,
    summary="Mark a report as final",
)
async def finalize_report(
    case_id: str,
    report_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Mark an investigation report as final (locks it from regeneration)."""
    result = await db.execute(
        select(Report).where(Report.id == report_id, Report.case_id == case_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Report '{report_id}' not found for case '{case_id}'",
        )

    report.is_final = True
    await db.flush()

    return {"message": "Report marked as final", "report_id": report_id}
