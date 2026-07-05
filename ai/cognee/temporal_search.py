"""
ChronosIntel — Temporal Search Engine
========================================
Builds and executes temporal investigation queries against Cognee.

Temporal queries are augmented with date constraints and entity filters
before being sent to Cognee's semantic search.

Examples:
  - "Who communicated 24 hours before the breach?"
  - "What happened after the legal meeting?"
  - "Which employees knew about Project Phoenix before the leak?"
"""

from __future__ import annotations

import logging
import re
from datetime import datetime, timedelta, timezone
from typing import Any

from app.config import settings

logger = logging.getLogger(__name__)


class TemporalSearchEngine:
    """
    Augments investigation queries with temporal context and entity filters,
    then dispatches to Cognee memory for grounded retrieval.

    Usage::

        engine = TemporalSearchEngine()
        results = await engine.temporal_search(
            case_id="abc-123",
            query="Who knew about the breach before it happened?",
            date_from=datetime(2024, 1, 1),
            date_to=datetime(2024, 3, 1),
        )
    """

    # Common temporal phrases and their relative offsets
    _RELATIVE_TIME_PATTERNS: list[tuple[re.Pattern, timedelta]] = [
        (re.compile(r"24 hours? before", re.I), timedelta(hours=-24)),
        (re.compile(r"week before", re.I), timedelta(weeks=-1)),
        (re.compile(r"day before", re.I), timedelta(days=-1)),
        (re.compile(r"hours? after", re.I), timedelta(hours=24)),
        (re.compile(r"day after", re.I), timedelta(days=1)),
        (re.compile(r"week after", re.I), timedelta(weeks=1)),
    ]

    async def temporal_search(
        self,
        case_id: str,
        query: str,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        entities_filter: list[str] | None = None,
        max_results: int | None = None,
    ) -> list[dict[str, Any]]:
        """
        Execute a temporal investigation query with optional filters.

        Args:
            case_id:        The investigation case ID.
            query:          The natural language query.
            date_from:      Filter results to events after this date.
            date_to:        Filter results to events before this date.
            entities_filter: Restrict results to specific entity names.
            max_results:    Maximum results to return.

        Returns:
            List of evidence dicts from Cognee, post-filtered by temporal constraints.
        """
        from ai.cognee.memory_manager import cognee_memory

        max_n = max_results or settings.max_evidence_results
        augmented_query = self._augment_query(query, date_from, date_to, entities_filter)

        logger.info(
            "Temporal search | case=%s | query='%s'", case_id, augmented_query[:100]
        )

        # Dual search: insights + raw chunks for maximum coverage
        insights = await cognee_memory.search(
            case_id=case_id,
            query=augmented_query,
            max_results=max_n,
        )
        chunks = await cognee_memory.search_chunks(
            case_id=case_id,
            query=augmented_query,
            max_results=max_n,
        )

        # Merge and deduplicate
        all_results = self._merge_deduplicate(insights, chunks)

        # Post-filter by date range if provided
        if date_from or date_to:
            all_results = self._filter_by_date(all_results, date_from, date_to)

        # Post-filter by entity names if provided
        if entities_filter:
            all_results = self._filter_by_entities(all_results, entities_filter)

        logger.info(
            "Temporal search returned %d results (after filters)", len(all_results[:max_n])
        )
        return all_results[:max_n]

    def _augment_query(
        self,
        query: str,
        date_from: datetime | None,
        date_to: datetime | None,
        entities_filter: list[str] | None,
    ) -> str:
        """
        Augment the raw query with temporal and entity context for better retrieval.
        """
        parts = [query]

        if date_from:
            parts.append(f"Events after {date_from.strftime('%Y-%m-%d')}")
        if date_to:
            parts.append(f"Events before {date_to.strftime('%Y-%m-%d')}")
        if entities_filter:
            entity_str = ", ".join(entities_filter)
            parts.append(f"Involving entities: {entity_str}")

        return ". ".join(parts)

    def _merge_deduplicate(
        self,
        list_a: list[dict[str, Any]],
        list_b: list[dict[str, Any]],
    ) -> list[dict[str, Any]]:
        """
        Merge two result lists, removing duplicates by content fingerprint.
        Preserves order (list_a results first).
        """
        seen: set[str] = set()
        merged: list[dict[str, Any]] = []

        for item in list_a + list_b:
            # Fingerprint by first 200 chars of content
            content = (
                item.get("content")
                or item.get("text")
                or item.get("name")
                or str(item)
            )
            fingerprint = str(content)[:200]
            if fingerprint not in seen:
                seen.add(fingerprint)
                merged.append(item)

        return merged

    def _filter_by_date(
        self,
        results: list[dict[str, Any]],
        date_from: datetime | None,
        date_to: datetime | None,
    ) -> list[dict[str, Any]]:
        """
        Filter results by temporal metadata.
        Results without timestamps pass through (cannot be excluded).
        """
        filtered: list[dict[str, Any]] = []
        for item in results:
            ts = item.get("timestamp") or item.get("created_at") or item.get("event_time")
            if ts is None:
                filtered.append(item)  # no timestamp — keep it
                continue

            # Normalize to datetime
            if isinstance(ts, str):
                try:
                    ts = datetime.fromisoformat(ts)
                except ValueError:
                    filtered.append(item)
                    continue

            if ts.tzinfo is None:
                ts = ts.replace(tzinfo=timezone.utc)

            if date_from and ts < date_from:
                continue
            if date_to and ts > date_to:
                continue
            filtered.append(item)

        return filtered

    def _filter_by_entities(
        self,
        results: list[dict[str, Any]],
        entities: list[str],
    ) -> list[dict[str, Any]]:
        """
        Filter results to those mentioning any of the specified entity names.
        Case-insensitive substring match.
        """
        entity_lower = [e.lower() for e in entities]
        filtered: list[dict[str, Any]] = []
        for item in results:
            content = str(
                item.get("content")
                or item.get("text")
                or item.get("name")
                or ""
            ).lower()
            if any(entity in content for entity in entity_lower):
                filtered.append(item)
        return filtered

    def detect_temporal_intent(self, query: str) -> dict[str, Any]:
        """
        Detect temporal intent signals in a natural language query.

        Returns a dict with:
          - has_temporal_intent (bool)
          - relative_offset (timedelta | None)
          - direction: 'before' | 'after' | None
        """
        result: dict[str, Any] = {
            "has_temporal_intent": False,
            "relative_offset": None,
            "direction": None,
        }
        query_lower = query.lower()

        if any(kw in query_lower for kw in ["before", "after", "during", "when", "timeline", "hours", "days"]):
            result["has_temporal_intent"] = True

        for pattern, offset in self._RELATIVE_TIME_PATTERNS:
            if pattern.search(query):
                result["relative_offset"] = offset
                result["direction"] = "before" if offset.total_seconds() < 0 else "after"
                break

        return result


# ── Module-level singleton ────────────────────────────────────────────────────
temporal_search_engine = TemporalSearchEngine()
