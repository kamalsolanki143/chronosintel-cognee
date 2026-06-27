"""
ChronosIntel — Version Manager Service
========================================
Snapshots case state for version comparison.

Workflow (triggered after new evidence is uploaded):
  1. Serialize current entity/relationship/event counts
  2. Save CaseVersion snapshot to database
  3. Enable diff between any two versions

Snapshots are lightweight — they store counts and key IDs,
not full document content (that remains in the Document table).
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import (
    CaseVersion,
    Document,
    Entity,
    Event,
    Relationship,
)
from app.database.schemas import VersionSnapshot
from app.utils.exceptions import CaseNotFoundError, VersionNotFoundError

logger = logging.getLogger(__name__)


class VersionManagerService:
    """
    Manages case version snapshots for audit trail and diff comparison.

    Usage::

        manager = VersionManagerService()
        snapshot = await manager.create_snapshot(
            db=db, case_id="abc-123", label="After breach docs"
        )
    """

    async def create_snapshot(
        self,
        db: AsyncSession,
        case_id: str,
        label: str | None = None,
        description: str | None = None,
    ) -> CaseVersion:
        """
        Create a new version snapshot for a case.

        Args:
            db:          Async database session.
            case_id:     The investigation case ID.
            label:       Optional human-readable version label.
            description: Optional description of what changed.

        Returns:
            Created CaseVersion ORM object.
        """
        from app.services.case_memory import case_memory_service

        # Validate case exists
        await case_memory_service.get_case(db, case_id)

        # Get current version number
        max_version = await db.scalar(
            select(func.max(CaseVersion.version_number)).where(
                CaseVersion.case_id == case_id
            )
        )
        next_version = (max_version or 0) + 1

        # Gather current counts
        doc_count = await db.scalar(
            select(func.count()).where(Document.case_id == case_id)
        ) or 0
        entity_count = await db.scalar(
            select(func.count()).where(Entity.case_id == case_id)
        ) or 0
        event_count = await db.scalar(
            select(func.count()).where(Event.case_id == case_id)
        ) or 0
        rel_count = await db.scalar(
            select(func.count()).where(Relationship.case_id == case_id)
        ) or 0

        # Gather entity names for diff
        entity_result = await db.execute(
            select(Entity.name).where(Entity.case_id == case_id)
        )
        entity_names = [row[0] for row in entity_result.fetchall()]

        snapshot_data = {
            "entity_names": entity_names[:200],  # cap snapshot size
            "document_count": doc_count,
            "entity_count": entity_count,
            "event_count": event_count,
            "relationship_count": rel_count,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        version = CaseVersion(
            case_id=case_id,
            version_number=next_version,
            label=label or f"Version {next_version}",
            description=description,
            snapshot=snapshot_data,
            document_count=doc_count,
            entity_count=entity_count,
            event_count=event_count,
            relationship_count=rel_count,
        )
        db.add(version)
        await db.flush()

        logger.info(
            "Snapshot created: case=%s version=%d entities=%d events=%d",
            case_id, next_version, entity_count, event_count,
        )
        return version

    async def get_snapshot(
        self, db: AsyncSession, case_id: str, version_number: int
    ) -> CaseVersion:
        """
        Retrieve a specific version snapshot.

        Raises:
            VersionNotFoundError: If the version doesn't exist.
        """
        result = await db.execute(
            select(CaseVersion).where(
                CaseVersion.case_id == case_id,
                CaseVersion.version_number == version_number,
            )
        )
        version = result.scalar_one_or_none()
        if version is None:
            raise VersionNotFoundError(case_id=case_id, version=version_number)
        return version

    async def list_snapshots(
        self, db: AsyncSession, case_id: str
    ) -> list[VersionSnapshot]:
        """List all snapshots for a case, ordered by version number."""
        result = await db.execute(
            select(CaseVersion)
            .where(CaseVersion.case_id == case_id)
            .order_by(CaseVersion.version_number)
        )
        versions: list[CaseVersion] = list(result.scalars().all())

        return [
            VersionSnapshot(
                version_id=v.id,
                version_number=v.version_number,
                label=v.label,
                description=v.description,
                document_count=v.document_count,
                entity_count=v.entity_count,
                event_count=v.event_count,
                relationship_count=v.relationship_count,
                created_at=v.created_at,
            )
            for v in versions
        ]

    async def get_current_version(
        self, db: AsyncSession, case_id: str
    ) -> int:
        """Get the latest version number for a case."""
        result = await db.scalar(
            select(func.max(CaseVersion.version_number)).where(
                CaseVersion.case_id == case_id
            )
        )
        return result or 0


# ── Module-level singleton ────────────────────────────────────────────────────
version_manager_service = VersionManagerService()
