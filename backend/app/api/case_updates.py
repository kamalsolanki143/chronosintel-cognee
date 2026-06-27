"""
ChronosIntel — Case Updates API Router
=========================================
Endpoints:
  POST /api/case/update — Upload new evidence to existing case, re-run graph, detect changes

Workflow:
  1. Upload new documents to case
  2. Snapshot current state (create version)
  3. Re-ingest documents into Cognee
  4. Rebuild knowledge graph
  5. Detect changes between old and new versions
  6. Return diff summary
"""

from __future__ import annotations

import logging
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db
from app.database.models import CaseStatus, DocumentType
from app.database.schemas import CaseUpdateResponse, VersionDiff
from app.services.case_memory import case_memory_service
from app.services.change_detector import change_detector_service
from app.services.graph_builder import graph_builder_service
from app.services.ingestion_service import ingestion_service
from app.services.version_manager import version_manager_service
from app.utils.exceptions import CaseNotFoundError

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/update",
    response_model=CaseUpdateResponse,
    status_code=status.HTTP_200_OK,
    summary="Upload new evidence and update investigation",
    description=(
        "Upload new evidence files to an existing case. "
        "Creates a version snapshot before and after, rebuilds the knowledge graph, "
        "and returns a diff showing what changed."
    ),
)
async def update_case_with_evidence(
    case_id: Annotated[str, Form(description="Target case ID")],
    files: Annotated[List[UploadFile], File(description="New evidence files")],
    version_label: Annotated[
        Optional[str], Form(description="Label for the new version")
    ] = None,
    version_description: Annotated[
        Optional[str], Form(description="Description of what changed")
    ] = None,
    db: AsyncSession = Depends(get_db),
) -> CaseUpdateResponse:
    """
    Upload new evidence to an existing case and re-run the full investigation pipeline.

    **Continuous Memory Workflow:**
    1. Snapshot current state → Version N
    2. Ingest new documents
    3. Rebuild Cognee knowledge graph
    4. Snapshot new state → Version N+1
    5. Compute diff (new entities, new relationships, new events)
    6. Return change summary
    """
    # Validate case
    try:
        await case_memory_service.get_case(db, case_id)
    except CaseNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    # 1. Snapshot current state (before update)
    previous_snapshot = await version_manager_service.create_snapshot(
        db=db,
        case_id=case_id,
        label=f"Before update: {version_label or 'new evidence'}",
        description="Auto-snapshot before new evidence ingestion",
    )
    previous_version = previous_snapshot.version_number

    # 2. Ingest new files
    await case_memory_service.update_case_status(db, case_id, CaseStatus.INGESTING)

    file_data_list = []
    for upload in files:
        content = await upload.read()
        file_data_list.append({
            "file_content": content,
            "filename": upload.filename or "unnamed",
        })

    successful, failed = await ingestion_service.ingest_batch(
        db=db, case_id=case_id, files=file_data_list
    )

    if not successful:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"All uploads failed: {failed}",
        )

    # 3. Rebuild knowledge graph
    try:
        await case_memory_service.update_case_status(
            db, case_id, CaseStatus.BUILDING_GRAPH
        )
        await graph_builder_service.build_graph(db=db, case_id=case_id)
    except Exception as exc:
        logger.error("Graph rebuild failed: %s", exc)
        await case_memory_service.update_case_status(db, case_id, CaseStatus.READY)

    # 4. Snapshot new state (after update)
    new_snapshot = await version_manager_service.create_snapshot(
        db=db,
        case_id=case_id,
        label=version_label or f"After {len(successful)} new document(s)",
        description=version_description,
    )
    new_version = new_snapshot.version_number

    # 5. Compute diff
    try:
        diff = await change_detector_service.compute_diff(
            db=db,
            case_id=case_id,
            version_a=previous_version,
            version_b=new_version,
        )
    except Exception as exc:
        logger.warning("Diff computation failed: %s", exc)
        diff = VersionDiff(
            version_a=previous_version,
            version_b=new_version,
            change_summary=f"Uploaded {len(successful)} document(s). Diff unavailable: {exc}",
        )

    logger.info(
        "Case updated: case=%s v%d→v%d docs=%d",
        case_id, previous_version, new_version, len(successful),
    )

    return CaseUpdateResponse(
        case_id=case_id,
        previous_version=previous_version,
        new_version=new_version,
        diff=diff,
        message=(
            f"Successfully ingested {len(successful)} document(s). "
            f"Knowledge graph updated. "
            f"{len(failed)} file(s) failed."
        ),
    )
