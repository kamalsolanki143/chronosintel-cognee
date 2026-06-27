"""
ChronosIntel — Case Memory Service
=====================================
Manages CRUD for investigation cases and their memory state.

Responsibilities:
  - Create, read, update, delete cases
  - Track case status transitions
  - Provide aggregate memory metrics (entity/event/relationship counts)
  - Handle Cognee dataset lifecycle

This service is the central entry point for all case operations.
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import settings
from app.database.models import (
    Case,
    CaseStatus,
    CaseVersion,
    Document,
    Entity,
    Event,
    Relationship,
)
from app.database.schemas import CaseCreate, CaseUpdate
from app.utils.exceptions import CaseAlreadyExistsError, CaseNotFoundError

logger = logging.getLogger(__name__)


class CaseMemoryService:
    """
    Service for managing investigation cases and their memory state.

    Usage::

        service = CaseMemoryService()
        case = await service.create_case(db, CaseCreate(title="Project X Leak"))
    """

    async def create_case(
        self, db: AsyncSession, data: CaseCreate
    ) -> Case:
        """
        Create a new investigation case.

        Args:
            db:   Async database session.
            data: CaseCreate request data.

        Returns:
            Created Case ORM object.
        """
        case = Case(
            title=data.title,
            description=data.description,
            investigator=data.investigator,
            tags=data.tags or [],
            metadata_=data.metadata,
            status=CaseStatus.CREATED,
            cognee_dataset=settings.cognee_dataset_name(
                "placeholder"  # Updated after insert with real ID
            ),
        )
        db.add(case)
        await db.flush()  # Get the auto-generated ID

        # Update cognee_dataset with real ID
        case.cognee_dataset = settings.cognee_dataset_name(case.id)
        await db.flush()

        logger.info("Case created: id=%s title='%s'", case.id, case.title)
        return case

    async def get_case(self, db: AsyncSession, case_id: str) -> Case:
        """
        Retrieve a case by ID.

        Raises:
            CaseNotFoundError: If the case does not exist.
        """
        result = await db.execute(select(Case).where(Case.id == case_id))
        case = result.scalar_one_or_none()
        if case is None:
            raise CaseNotFoundError(case_id=case_id)
        return case

    async def get_case_with_counts(
        self, db: AsyncSession, case_id: str
    ) -> dict[str, Any]:
        """
        Get a case with aggregate counts for documents, entities, events, relationships.

        Returns:
            Dict with case fields + counts.
        """
        case = await self.get_case(db, case_id)

        # Fetch counts
        doc_count = await db.scalar(
            select(func.count()).where(Document.case_id == case_id)
        )
        entity_count = await db.scalar(
            select(func.count()).where(Entity.case_id == case_id)
        )
        event_count = await db.scalar(
            select(func.count()).where(Event.case_id == case_id)
        )
        rel_count = await db.scalar(
            select(func.count()).where(Relationship.case_id == case_id)
        )

        # Current version
        version_result = await db.execute(
            select(func.max(CaseVersion.version_number)).where(
                CaseVersion.case_id == case_id
            )
        )
        current_version = version_result.scalar() or 0

        return {
            "id": case.id,
            "title": case.title,
            "description": case.description,
            "status": case.status,
            "investigator": case.investigator,
            "tags": case.tags,
            "cognee_dataset": case.cognee_dataset,
            "document_count": doc_count or 0,
            "entity_count": entity_count or 0,
            "event_count": event_count or 0,
            "relationship_count": rel_count or 0,
            "current_version": current_version,
            "created_at": case.created_at,
            "updated_at": case.updated_at,
        }

    async def list_cases(
        self,
        db: AsyncSession,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[Case], int]:
        """
        List all cases with pagination.

        Returns:
            Tuple of (cases, total_count).
        """
        offset = (page - 1) * page_size
        total = await db.scalar(select(func.count()).select_from(Case))

        result = await db.execute(
            select(Case).order_by(Case.created_at.desc()).offset(offset).limit(page_size)
        )
        cases = list(result.scalars().all())
        return cases, total or 0

    async def update_case(
        self, db: AsyncSession, case_id: str, data: CaseUpdate
    ) -> Case:
        """
        Update case fields.

        Args:
            db:      Async database session.
            case_id: ID of the case to update.
            data:    CaseUpdate fields (partial update).

        Returns:
            Updated Case ORM object.
        """
        case = await self.get_case(db, case_id)
        update_data = data.model_dump(exclude_none=True)

        for field, value in update_data.items():
            setattr(case, field, value)

        case.updated_at = datetime.now(timezone.utc)
        await db.flush()

        logger.info("Case updated: id=%s fields=%s", case_id, list(update_data.keys()))
        return case

    async def update_case_status(
        self, db: AsyncSession, case_id: str, status: CaseStatus
    ) -> Case:
        """Update only the case status."""
        case = await self.get_case(db, case_id)
        old_status = case.status
        case.status = status
        case.updated_at = datetime.now(timezone.utc)
        await db.flush()

        logger.info(
            "Case status: id=%s %s → %s", case_id, old_status.value, status.value
        )
        return case

    async def delete_case(self, db: AsyncSession, case_id: str) -> None:
        """
        Delete a case and all associated data.

        Also removes the Cognee dataset for this case.
        """
        case = await self.get_case(db, case_id)
        await db.delete(case)
        await db.flush()

        logger.info("Case deleted: id=%s", case_id)

    async def get_case_versions(
        self, db: AsyncSession, case_id: str
    ) -> list[CaseVersion]:
        """Get all version snapshots for a case."""
        await self.get_case(db, case_id)  # Validates case exists

        result = await db.execute(
            select(CaseVersion)
            .where(CaseVersion.case_id == case_id)
            .order_by(CaseVersion.version_number)
        )
        return list(result.scalars().all())


# ── Module-level singleton ────────────────────────────────────────────────────
case_memory_service = CaseMemoryService()
