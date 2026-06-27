"""
ChronosIntel — Memory API Router
===================================
Endpoints:
  GET  /api/memory/{case_id}                     — Case memory state
  GET  /api/memory/{case_id}/versions            — Version history
  GET  /api/memory/{case_id}/diff/{va}/{vb}      — Diff between versions
  POST /api/memory/{case_id}/snapshot            — Manual version snapshot
  DELETE /api/memory/{case_id}                   — Reset case memory
"""

from __future__ import annotations

import logging
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db
from app.database.models import Document, Entity, Event, Relationship
from app.database.schemas import MemoryStateResponse, VersionDiff, VersionSnapshot
from app.services.case_memory import case_memory_service
from app.services.change_detector import change_detector_service
from app.services.version_manager import version_manager_service
from app.utils.exceptions import CaseNotFoundError, VersionNotFoundError

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
    "/{case_id}",
    response_model=MemoryStateResponse,
    summary="Get the memory state for a case",
    description=(
        "Returns the current state of case memory: document counts, "
        "entity counts, event counts, and version history."
    ),
)
async def get_memory_state(
    case_id: str,
    db: AsyncSession = Depends(get_db),
) -> MemoryStateResponse:
    """Get the full memory state for an investigation case."""
    try:
        case_data = await case_memory_service.get_case_with_counts(db, case_id)
    except CaseNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    versions = await version_manager_service.list_snapshots(db, case_id)

    return MemoryStateResponse(
        case_id=case_id,
        cognee_dataset=case_data["cognee_dataset"],
        status=case_data["status"],
        document_count=case_data["document_count"],
        entity_count=case_data["entity_count"],
        event_count=case_data["event_count"],
        relationship_count=case_data["relationship_count"],
        current_version=case_data["current_version"],
        versions=versions,
        last_updated=case_data["updated_at"],
    )


@router.get(
    "/{case_id}/versions",
    response_model=list[VersionSnapshot],
    summary="Get version history for a case",
)
async def get_version_history(
    case_id: str,
    db: AsyncSession = Depends(get_db),
) -> list[VersionSnapshot]:
    """List all version snapshots for a case."""
    try:
        await case_memory_service.get_case(db, case_id)
    except CaseNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    return await version_manager_service.list_snapshots(db, case_id)


@router.get(
    "/{case_id}/diff/{version_a}/{version_b}",
    response_model=VersionDiff,
    summary="Compare two case versions",
)
async def get_version_diff(
    case_id: str,
    version_a: int,
    version_b: int,
    db: AsyncSession = Depends(get_db),
) -> VersionDiff:
    """
    Compare two investigation versions to see what changed.

    Returns: new entities, removed entities, new relationships, new events.
    """
    try:
        await case_memory_service.get_case(db, case_id)
    except CaseNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    try:
        return await change_detector_service.compute_diff(
            db=db, case_id=case_id, version_a=version_a, version_b=version_b
        )
    except VersionNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Diff computation failed: {exc}",
        )


@router.post(
    "/{case_id}/snapshot",
    response_model=VersionSnapshot,
    status_code=status.HTTP_201_CREATED,
    summary="Manually create a version snapshot",
)
async def create_snapshot(
    case_id: str,
    label: Optional[str] = None,
    description: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
) -> VersionSnapshot:
    """Manually create a version snapshot for the current case state."""
    try:
        await case_memory_service.get_case(db, case_id)
    except CaseNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    snapshot = await version_manager_service.create_snapshot(
        db=db, case_id=case_id, label=label, description=description
    )

    return VersionSnapshot(
        version_id=snapshot.id,
        version_number=snapshot.version_number,
        label=snapshot.label,
        description=snapshot.description,
        document_count=snapshot.document_count,
        entity_count=snapshot.entity_count,
        event_count=snapshot.event_count,
        relationship_count=snapshot.relationship_count,
        created_at=snapshot.created_at,
    )


@router.delete(
    "/{case_id}",
    response_model=dict,
    summary="Reset case memory (delete all data)",
)
async def reset_case_memory(
    case_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Reset all memory for a case — deletes all documents, entities, events,
    relationships, evidence, reports, and Cognee graph data.

    **This is irreversible. Use with caution.**
    """
    try:
        await case_memory_service.get_case(db, case_id)
    except CaseNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    # Reset Cognee memory (best effort)
    try:
        from ai.cognee.memory_manager import cognee_memory
        await cognee_memory.reset_case(case_id)
    except Exception as exc:
        logger.warning("Cognee reset failed: %s", exc)

    # Delete the case (cascades to all related records)
    await case_memory_service.delete_case(db, case_id)

    return {"message": f"Case '{case_id}' and all associated memory deleted."}
