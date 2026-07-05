"""
ChronosIntel — Report Generator Service
=========================================
Generates comprehensive investigation reports using:
  1. Evidence chain from Cognee
  2. Timeline events from the DB
  3. Key entities from the knowledge graph
  4. Gemini for narrative generation

Reports are stored in the database and optionally as HTML files.
"""

from __future__ import annotations

import logging
import os
from datetime import datetime, timezone
from typing import Any

import aiofiles
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database.models import Entity, Event, Report
from app.database.schemas import ReportResponse
from app.utils.exceptions import CaseNotFoundError

logger = logging.getLogger(__name__)


class ReportGeneratorService:
    """
    Generates and stores investigation reports.

    Usage::

        service = ReportGeneratorService()
        report = await service.generate_report(
            db=db, case_id="abc-123",
            query="Who was responsible for the breach?",
        )
    """

    async def generate_report(
        self,
        db: AsyncSession,
        case_id: str,
        query: str | None = None,
        include_timeline: bool = True,
        include_evidence: bool = True,
    ) -> ReportResponse:
        """
        Generate a comprehensive investigation report.

        Args:
            db:               Async database session.
            case_id:          The investigation case ID.
            query:            Optional guiding question for the report.
            include_timeline: Whether to include the timeline section.
            include_evidence: Whether to include the evidence chain.

        Returns:
            ReportResponse with HTML content and structured findings.
        """
        from app.services.case_memory import case_memory_service
        from app.services.evidence_chain import evidence_chain_service
        from ai.cognee.temporal_search import temporal_search_engine
        from ai.gemini.client import gemini_client

        # 1. Validate case and get metadata
        case_data = await case_memory_service.get_case_with_counts(db, case_id)

        # 2. Get next report version
        max_version = await db.scalar(
            select(func.max(Report.version)).where(Report.case_id == case_id)
        ) or 0
        next_version = max_version + 1

        # 3. Retrieve evidence from Cognee
        search_query = query or f"Investigation summary for {case_data['title']}"
        raw_results = await temporal_search_engine.temporal_search(
            case_id=case_id,
            query=search_query,
            max_results=20,
        )
        evidence_items = await evidence_chain_service.build_evidence_items(
            db=db, case_id=case_id, raw_results=raw_results
        )

        # 4. Get entities
        entity_result = await db.execute(
            select(Entity)
            .where(Entity.case_id == case_id)
            .order_by(Entity.confidence.desc())
            .limit(20)
        )
        entities: list[Entity] = list(entity_result.scalars().all())
        entity_dicts = [
            {
                "name": e.name,
                "entity_type": e.entity_type.value,
                "description": e.description,
            }
            for e in entities
        ]

        # 5. Get events
        event_dicts: list[dict[str, Any]] = []
        if include_timeline:
            event_result = await db.execute(
                select(Event)
                .where(Event.case_id == case_id)
                .order_by(Event.event_time.asc().nullslast())
                .limit(30)
            )
            events: list[Event] = list(event_result.scalars().all())
            event_dicts = [
                {
                    "title": e.title,
                    "event_time": e.event_time.isoformat() if e.event_time else None,
                    "description": e.description,
                    "participants": e.participants or [],
                }
                for e in events
            ]

        # 6. Generate report via Gemini (grounded on evidence)
        evidence_dicts = [item.model_dump() for item in evidence_items]
        html_content = await gemini_client.generate_report(
            case_id=case_id,
            case_title=case_data["title"],
            evidence_items=evidence_dicts,
            events=event_dicts,
            entities=entity_dicts,
            query=query,
        )

        # 7. Save report to file
        file_path = await self._save_report_file(case_id, next_version, html_content)

        # 8. Create Report record in DB
        report = Report(
            case_id=case_id,
            version=next_version,
            query=query,
            summary=html_content[:500] if html_content else "Report generated",
            findings={"evidence_count": len(evidence_items), "entity_count": len(entities)},
            html_content=html_content,
            evidence_ids=[item.evidence_id for item in evidence_items if item.evidence_id],
            entity_count=len(entities),
            event_count=len(event_dicts),
            file_path=file_path,
            is_final=False,
        )
        db.add(report)
        await db.flush()

        logger.info(
            "Report generated: id=%s case=%s version=%d evidence=%d",
            report.id, case_id, next_version, len(evidence_items),
        )

        return ReportResponse(
            report_id=report.id,
            case_id=case_id,
            version=next_version,
            query=query,
            summary=report.summary or "",
            findings=report.findings or {},
            html_content=html_content,
            entity_count=len(entities),
            event_count=len(event_dicts),
            evidence_count=len(evidence_items),
            is_final=False,
            created_at=report.created_at,
        )

    async def get_latest_report(
        self, db: AsyncSession, case_id: str
    ) -> Report | None:
        """Get the latest report for a case."""
        result = await db.execute(
            select(Report)
            .where(Report.case_id == case_id)
            .order_by(Report.version.desc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def _save_report_file(
        self, case_id: str, version: int, content: str
    ) -> str:
        """Save the report HTML to the reports directory."""
        report_dir = os.path.join(settings.report_dir, case_id)
        os.makedirs(report_dir, exist_ok=True)

        filename = f"report_v{version}_{datetime.now(timezone.utc).strftime('%Y%m%d_%H%M%S')}.html"
        file_path = os.path.join(report_dir, filename)

        async with aiofiles.open(file_path, "w", encoding="utf-8") as f:
            await f.write(content)

        logger.debug("Report saved: %s", file_path)
        return file_path


# ── Module-level singleton ────────────────────────────────────────────────────
report_generator_service = ReportGeneratorService()
