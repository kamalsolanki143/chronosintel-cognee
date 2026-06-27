"""
ChronosIntel — Upload API Router
==================================
Endpoints:
  POST /api/upload/          — Upload files and create a new case if needed
  POST /api/upload/{case_id} — Upload files to an existing case
  GET  /api/upload/{case_id} — List uploaded documents for a case

All uploads trigger:
  1. File validation (type + size)
  2. Document parsing and chunking
  3. Cognee memory ingestion
  4. Knowledge graph construction (async)
"""

from __future__ import annotations

import logging
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, Query, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db
from app.database.models import CaseStatus, DocumentType
from app.database.schemas import (
    BatchUploadResponse,
    CaseCreate,
    CaseResponse,
    DocumentResponse,
    UploadResponse,
)
from app.services.case_memory import case_memory_service
from app.services.graph_builder import graph_builder_service
from app.services.ingestion_service import ingestion_service
from app.utils.exceptions import CaseNotFoundError

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/",
    response_model=BatchUploadResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Upload documents to a case",
    description=(
        "Upload one or more evidence files to a case. "
        "Triggers document parsing, chunking, Cognee ingestion, and graph build."
    ),
)
async def upload_documents(
    case_id: Annotated[str, Form(description="Target case ID")],
    files: Annotated[List[UploadFile], File(description="Evidence files to upload")],
    document_type: Annotated[
        Optional[DocumentType], Form(description="Override document type")
    ] = None,
    author: Annotated[Optional[str], Form(description="Override document author")] = None,
    build_graph: Annotated[
        bool, Form(description="Trigger graph build after upload (default True)")
    ] = True,
    db: AsyncSession = Depends(get_db),
) -> BatchUploadResponse:
    """
    Upload evidence files to an existing case.

    **Flow:**
    1. Validate case exists
    2. For each file: parse → chunk → store in DB → ingest to Cognee
    3. Optionally trigger knowledge graph build (cognify)

    **Supported formats:** .txt, .pdf, .docx, .csv, .json, .eml, .md, .log
    """
    # Validate case exists
    try:
        await case_memory_service.get_case(db, case_id)
    except CaseNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case '{case_id}' not found",
        )

    # Update case status to ingesting
    await case_memory_service.update_case_status(db, case_id, CaseStatus.INGESTING)

    # Prepare file data list
    file_data_list = []
    for upload in files:
        content = await upload.read()
        file_data_list.append({
            "file_content": content,
            "filename": upload.filename or "unnamed",
            "document_type": document_type,
            "author": author,
        })

    # Batch ingest
    successful, failed = await ingestion_service.ingest_batch(
        db=db, case_id=case_id, files=file_data_list
    )

    # Build knowledge graph if requested and we have successful uploads
    if build_graph and successful:
        try:
            await case_memory_service.update_case_status(
                db, case_id, CaseStatus.BUILDING_GRAPH
            )
            await graph_builder_service.build_graph(db=db, case_id=case_id)
        except Exception as exc:
            logger.error("Graph build failed after upload: %s", exc)
            await case_memory_service.update_case_status(
                db, case_id, CaseStatus.READY
            )  # Still mark ready so case is usable

    upload_responses = [
        UploadResponse(
            document_id=doc.id,
            case_id=case_id,
            filename=doc.original_filename,
            status=doc.status,
            chunk_count=doc.chunk_count,
            message="Document ingested and added to knowledge graph",
        )
        for doc in successful
    ]

    logger.info(
        "Upload complete: case=%s uploaded=%d failed=%d",
        case_id, len(successful), len(failed),
    )

    return BatchUploadResponse(
        case_id=case_id,
        uploaded=upload_responses,
        failed=failed,
        total_uploaded=len(successful),
        total_failed=len(failed),
    )


@router.post(
    "/case",
    response_model=CaseResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new investigation case",
)
async def create_case(
    data: CaseCreate,
    db: AsyncSession = Depends(get_db),
) -> CaseResponse:
    """
    Create a new investigation case and return its ID.
    Upload documents to the case using POST /api/upload/.
    """
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
    "/{case_id}",
    response_model=list[DocumentResponse],
    summary="List documents for a case",
)
async def list_documents(
    case_id: str,
    db: AsyncSession = Depends(get_db),
) -> list[DocumentResponse]:
    """List all uploaded documents for an investigation case."""
    from sqlalchemy import select
    from app.database.models import Document

    try:
        await case_memory_service.get_case(db, case_id)
    except CaseNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Case '{case_id}' not found",
        )

    result = await db.execute(
        select(Document)
        .where(Document.case_id == case_id)
        .order_by(Document.created_at.desc())
    )
    docs = list(result.scalars().all())

    return [
        DocumentResponse(
            id=doc.id,
            case_id=doc.case_id,
            filename=doc.filename,
            original_filename=doc.original_filename,
            document_type=doc.document_type,
            status=doc.status,
            file_size=doc.file_size,
            chunk_count=doc.chunk_count,
            author=doc.author,
            document_date=doc.document_date,
            error_message=doc.error_message,
            created_at=doc.created_at,
            updated_at=doc.updated_at,
        )
        for doc in docs
    ]
