"""
ChronosIntel — Timeline Engine Service
========================================
Extracts and orders temporal events from the case knowledge graph.

Pipeline:
  1. Query Cognee for temporal events/activities
  2. Parse dates from raw Cognee results
  3. Merge with Event records from the database
  4. Sort chronologically
  5. Return structured TimelineResponse

Also uses Gemini to synthesize a narrative timeline summary.
"""

from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from typing import Any

from dateutil import parser as dateutil_parser
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import Event
from app.database.schemas import TimelineEvent, TimelineResponse

logger = logging.getLogger(__name__)


class TimelineEngineService:
    """
    Extracts and synthesizes the temporal timeline for an investigation case.

    Usage::

        engine = TimelineEngineService()
        timeline = await engine.get_timeline(db=db, case_id="abc-123")
    """

    async def get_timeline(
        self,
        db: AsyncSession,
        case_id: str,
        query: str | None = None,
    ) -> TimelineResponse:
        """
        Get the chronological event timeline for a case.

        Merges DB-stored events with events retrieved from Cognee.

        Args:
            db:      Async database session.
            case_id: The investigation case ID.
            query:   Optional focus query to filter timeline relevance.

        Returns:
            TimelineResponse with sorted events and date range.
        """
        from app.services.case_memory import case_memory_service

        await case_memory_service.get_case(db, case_id)

        # 1. Get events from database
        db_events = await self._get_db_events(db, case_id)

        # 2. Get additional events from Cognee (temporal search)
        cognee_events = await self._get_cognee_events(case_id, query)

        # 3. Merge and deduplicate
        all_events = self._merge_events(db_events, cognee_events)

        # 4. Sort chronologically (events without dates go to end)
        all_events.sort(
            key=lambda e: (
                e.event_time is None,  # None dates sort last
                e.event_time or datetime.min.replace(tzinfo=timezone.utc),
            )
        )

        # 5. Compute date range
        dated_events = [e for e in all_events if e.event_time]
        date_range: dict[str, Any] | None = None
        if dated_events:
            date_range = {
                "from": dated_events[0].event_time.isoformat() if dated_events else None,
                "to": dated_events[-1].event_time.isoformat() if dated_events else None,
            }

        logger.info(
            "Timeline built: case=%s total_events=%d dated=%d",
            case_id, len(all_events), len(dated_events),
        )

        return TimelineResponse(
            case_id=case_id,
            total_events=len(all_events),
            events=all_events,
            date_range=date_range,
        )

    async def extract_and_store_events(
        self,
        db: AsyncSession,
        case_id: str,
        raw_results: list[dict[str, Any]],
    ) -> int:
        """
        Extract temporal events from Cognee search results and store in DB.

        Args:
            db:          Async database session.
            case_id:     The investigation case ID.
            raw_results: Raw Cognee search results.

        Returns:
            Number of events stored.
        """
        stored = 0
        for result in raw_results:
            event_time = self._extract_datetime(result)
            title = (
                result.get("title")
                or result.get("name")
                or str(result.get("content", ""))[:100]
            )

            if not title.strip():
                continue

            participants_raw = result.get("participants") or []
            if isinstance(participants_raw, str):
                participants_raw = [participants_raw]

            event = Event(
                case_id=case_id,
                title=title.strip(),
                description=str(result.get("content") or result.get("description") or "")[:1000],
                event_time=event_time,
                event_time_raw=result.get("timestamp_raw") or result.get("date_str"),
                participants=participants_raw,
                cognee_node_id=str(result.get("id", "")),
                confidence=float(result.get("score") or result.get("relevance_score") or 1.0),
            )
            db.add(event)
            stored += 1

        await db.flush()
        logger.info("Stored %d events for case '%s'", stored, case_id)
        return stored

    async def _get_db_events(
        self, db: AsyncSession, case_id: str
    ) -> list[TimelineEvent]:
        """Fetch Event records from DB."""
        result = await db.execute(
            select(Event)
            .where(Event.case_id == case_id)
            .order_by(Event.event_time.asc().nullslast())
            .limit(200)
        )
        events: list[Event] = list(result.scalars().all())

        return [
            TimelineEvent(
                event_id=e.id,
                title=e.title,
                description=e.description,
                event_time=e.event_time,
                event_time_raw=e.event_time_raw,
                location=e.location,
                participants=e.participants or [],
                source_document=e.source_document_id,
                confidence=e.confidence,
            )
            for e in events
        ]

    async def _get_cognee_events(
        self, case_id: str, query: str | None
    ) -> list[TimelineEvent]:
        """Search Cognee for temporal events."""
        try:
            from ai.cognee.temporal_search import temporal_search_engine

            search_query = query or "events timeline activities meetings communications"
            results = await temporal_search_engine.temporal_search(
                case_id=case_id,
                query=search_query,
                max_results=50,
            )

            events: list[TimelineEvent] = []
            for r in results:
                event_time = self._extract_datetime(r)
                title = (
                    r.get("title")
                    or r.get("name")
                    or str(r.get("content", ""))[:100]
                )
                if not title.strip():
                    continue

                events.append(
                    TimelineEvent(
                        event_id=str(r.get("id") or "cognee_event"),
                        title=title.strip(),
                        description=str(r.get("content") or r.get("description") or "")[:500],
                        event_time=event_time,
                        event_time_raw=r.get("timestamp_raw"),
                        participants=r.get("participants") or [],
                        confidence=float(r.get("score") or 0.8),
                    )
                )
            return events

        except Exception as exc:
            logger.warning("Failed to get Cognee events: %s", exc)
            return []

    def _merge_events(
        self,
        db_events: list[TimelineEvent],
        cognee_events: list[TimelineEvent],
    ) -> list[TimelineEvent]:
        """Merge and deduplicate events by title similarity."""
        seen_titles: set[str] = set()
        merged: list[TimelineEvent] = []

        for event in db_events:
            key = event.title[:50].lower().strip()
            if key not in seen_titles:
                seen_titles.add(key)
                merged.append(event)

        for event in cognee_events:
            key = event.title[:50].lower().strip()
            if key not in seen_titles:
                seen_titles.add(key)
                merged.append(event)

        return merged

    @staticmethod
    def _extract_datetime(result: dict[str, Any]) -> datetime | None:
        """
        Extract and parse a datetime from a Cognee result dict.
        Tries multiple common field names.
        """
        for key in ["event_time", "timestamp", "date", "created_at", "occurred_at"]:
            raw = result.get(key)
            if not raw:
                continue

            if isinstance(raw, datetime):
                if raw.tzinfo is None:
                    return raw.replace(tzinfo=timezone.utc)
                return raw

            if isinstance(raw, str):
                try:
                    dt = dateutil_parser.parse(raw)
                    if dt.tzinfo is None:
                        dt = dt.replace(tzinfo=timezone.utc)
                    return dt
                except (ValueError, OverflowError):
                    continue

        return None


# ── Module-level singleton ────────────────────────────────────────────────────
timeline_engine_service = TimelineEngineService()
