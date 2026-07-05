"""
ChronosIntel — Change Detector Service
========================================
Compares two case version snapshots to detect:
  - New entities (added since last version)
  - Removed entities
  - New relationships
  - New events
  - Contradiction flags

Used when new evidence is uploaded to show what changed in the investigation.
"""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import CaseVersion, Entity, Relationship
from app.database.schemas import VersionDiff
from app.utils.exceptions import VersionNotFoundError

logger = logging.getLogger(__name__)


class ChangeDetectorService:
    """
    Compares two case version snapshots to identify changes.

    Usage::

        detector = ChangeDetectorService()
        diff = await detector.compute_diff(
            db=db, case_id="abc-123",
            version_a=1, version_b=2,
        )
    """

    async def compute_diff(
        self,
        db: AsyncSession,
        case_id: str,
        version_a: int,
        version_b: int,
    ) -> VersionDiff:
        """
        Compute the difference between two version snapshots.

        Args:
            db:        Async database session.
            case_id:   The investigation case ID.
            version_a: Earlier version number.
            version_b: Later version number.

        Returns:
            VersionDiff with lists of new/removed entities and new events.
        """
        from app.services.version_manager import version_manager_service

        snap_a = await version_manager_service.get_snapshot(db, case_id, version_a)
        snap_b = await version_manager_service.get_snapshot(db, case_id, version_b)

        entities_a: set[str] = set(
            (snap_a.snapshot or {}).get("entity_names", [])
        )
        entities_b: set[str] = set(
            (snap_b.snapshot or {}).get("entity_names", [])
        )

        new_entities = sorted(entities_b - entities_a)
        removed_entities = sorted(entities_a - entities_b)

        # New relationships (count delta as proxy)
        rel_delta = snap_b.relationship_count - snap_a.relationship_count
        new_relationships = []
        if rel_delta > 0:
            # Fetch actual new relationships from DB (beyond version_a creation time)
            new_relationships = await self._get_new_relationships(
                db, case_id, snap_a.created_at, snap_b.created_at
            )

        # New events delta
        event_delta = snap_b.event_count - snap_a.event_count
        new_events = []
        if event_delta > 0:
            new_events = [f"{event_delta} new event(s) detected"]

        # Generate change summary
        change_summary = self._generate_summary(
            version_a=version_a,
            version_b=version_b,
            new_entities=new_entities,
            removed_entities=removed_entities,
            new_relationships=new_relationships,
            new_events=new_events,
        )

        logger.info(
            "Diff computed: case=%s v%d→v%d | +%d entities -%d entities +%d rels",
            case_id, version_a, version_b,
            len(new_entities), len(removed_entities), len(new_relationships),
        )

        return VersionDiff(
            version_a=version_a,
            version_b=version_b,
            new_entities=new_entities,
            removed_entities=removed_entities,
            new_relationships=new_relationships,
            new_events=new_events,
            change_summary=change_summary,
        )

    async def compute_diff_from_latest(
        self,
        db: AsyncSession,
        case_id: str,
    ) -> VersionDiff | None:
        """
        Compute diff between the last two versions.
        Returns None if there are fewer than 2 versions.
        """
        from sqlalchemy import func

        result = await db.execute(
            select(CaseVersion.version_number)
            .where(CaseVersion.case_id == case_id)
            .order_by(CaseVersion.version_number.desc())
            .limit(2)
        )
        versions = [row[0] for row in result.fetchall()]

        if len(versions) < 2:
            return None

        return await self.compute_diff(
            db, case_id, versions[1], versions[0]
        )

    async def _get_new_relationships(
        self,
        db: AsyncSession,
        case_id: str,
        from_time: Any,
        to_time: Any,
    ) -> list[dict[str, str]]:
        """Fetch new relationships created between two timestamps."""
        from app.database.models import Relationship

        result = await db.execute(
            select(Relationship)
            .where(
                Relationship.case_id == case_id,
                Relationship.created_at > from_time,
                Relationship.created_at <= to_time,
            )
            .limit(20)
        )
        rels: list[Relationship] = list(result.scalars().all())

        return [
            {
                "source": rel.source_entity_id,
                "target": rel.target_entity_id,
                "type": rel.relationship_type.value,
            }
            for rel in rels
        ]

    @staticmethod
    def _generate_summary(
        version_a: int,
        version_b: int,
        new_entities: list[str],
        removed_entities: list[str],
        new_relationships: list[dict],
        new_events: list[str],
    ) -> str:
        """Generate a human-readable change summary."""
        parts: list[str] = [
            f"Changes from version {version_a} to version {version_b}:"
        ]

        if new_entities:
            parts.append(
                f"• {len(new_entities)} new entit{'y' if len(new_entities) == 1 else 'ies'}: "
                + ", ".join(new_entities[:5])
                + ("..." if len(new_entities) > 5 else "")
            )
        if removed_entities:
            parts.append(f"• {len(removed_entities)} entit{'y' if len(removed_entities) == 1 else 'ies'} removed")
        if new_relationships:
            parts.append(f"• {len(new_relationships)} new relationship(s) detected")
        if new_events:
            parts.extend([f"• {e}" for e in new_events])
        if not any([new_entities, removed_entities, new_relationships, new_events]):
            parts.append("• No significant changes detected")

        return "\n".join(parts)


# ── Module-level singleton ────────────────────────────────────────────────────
change_detector_service = ChangeDetectorService()
