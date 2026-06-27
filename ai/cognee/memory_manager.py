"""
ChronosIntel — Cognee Memory Manager
======================================
Wraps the official Cognee API to provide:
  - Per-case dataset isolation (namespace: chronosintel_{case_id})
  - Document ingestion via cognee.add()
  - Knowledge graph construction via cognee.cognify()
  - Semantic search via cognee.search()
  - Case reset

Official Cognee docs: https://docs.cognee.ai
"""

from __future__ import annotations

import logging
from typing import Any

import cognee
from cognee.api.v1.search.types import SearchType

logger = logging.getLogger(__name__)


class CogneeMemoryManager:
    """
    Manages Cognee memory operations scoped to individual investigation cases.

    Each case has its own Cognee dataset named `chronosintel_{case_id}`.
    This ensures complete memory isolation between investigations.

    Usage::

        manager = CogneeMemoryManager()
        await manager.add_document(case_id="abc-123", text="Email content...", doc_id="doc-1")
        await manager.build_graph(case_id="abc-123")
        results = await manager.search(case_id="abc-123", query="Who knew about Project X?")
    """

    def _dataset_name(self, case_id: str) -> str:
        """Return the Cognee dataset name for a case."""
        return f"chronosintel_{case_id}"

    async def add_document(
        self,
        case_id: str,
        text: str,
        doc_id: str | None = None,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        """
        Add a single document's text to the Cognee memory for a case.

        Args:
            case_id:  The investigation case ID.
            text:     The full text content to ingest.
            doc_id:   Optional document identifier (used as dataset-level tag).
            metadata: Optional metadata attached to the document.
        """
        dataset = self._dataset_name(case_id)
        try:
            logger.info("Adding document to Cognee dataset '%s' (doc_id=%s)", dataset, doc_id)
            await cognee.add(text, dataset_name=dataset)
            logger.debug("Document added to Cognee: doc_id=%s", doc_id)
        except Exception as exc:
            from app.utils.exceptions import CogneeError
            raise CogneeError(operation="add", reason=str(exc)) from exc

    async def add_documents(
        self,
        case_id: str,
        documents: list[dict[str, Any]],
    ) -> int:
        """
        Add multiple documents to Cognee memory.

        Args:
            case_id:   The investigation case ID.
            documents: List of dicts with keys: text, doc_id (optional), metadata (optional).

        Returns:
            Number of documents successfully added.
        """
        added = 0
        for doc in documents:
            try:
                await self.add_document(
                    case_id=case_id,
                    text=doc["text"],
                    doc_id=doc.get("doc_id"),
                    metadata=doc.get("metadata"),
                )
                added += 1
            except Exception as exc:
                logger.error(
                    "Failed to add document '%s' to Cognee: %s",
                    doc.get("doc_id", "unknown"),
                    exc,
                )
        return added

    async def build_graph(self, case_id: str) -> None:
        """
        Trigger Cognee's knowledge graph construction (cognify) for a case.

        This processes all previously added documents and builds entity/relationship
        graphs. This is an expensive async operation.

        Args:
            case_id: The investigation case ID.
        """
        dataset = self._dataset_name(case_id)
        try:
            logger.info("Building Cognee knowledge graph for dataset '%s'", dataset)
            await cognee.cognify(datasets=[dataset])
            logger.info("Knowledge graph built for case '%s'", case_id)
        except Exception as exc:
            from app.utils.exceptions import CogneeError
            raise CogneeError(operation="cognify", reason=str(exc)) from exc

    async def search(
        self,
        case_id: str,
        query: str,
        search_type: SearchType = SearchType.INSIGHTS,
        max_results: int = 20,
    ) -> list[dict[str, Any]]:
        """
        Perform semantic search over the case knowledge graph.

        Args:
            case_id:     The investigation case ID.
            query:       Natural language investigation query.
            search_type: Cognee SearchType (INSIGHTS, CHUNKS, GRAPH_COMPLETION, etc.)
            max_results: Maximum number of results to return.

        Returns:
            List of search result dicts from Cognee.
        """
        dataset = self._dataset_name(case_id)
        try:
            logger.info(
                "Searching Cognee dataset '%s' | type=%s | query='%s'",
                dataset,
                search_type.value,
                query[:100],
            )
            results = await cognee.search(
                query_text=query,
                query_type=search_type,
                datasets=[dataset],
            )

            # Normalize results to list of dicts
            normalized: list[dict[str, Any]] = []
            for item in results[:max_results]:
                if isinstance(item, dict):
                    normalized.append(item)
                elif hasattr(item, "__dict__"):
                    normalized.append(item.__dict__)
                else:
                    normalized.append({"content": str(item)})

            logger.info(
                "Cognee search returned %d results for query='%s'",
                len(normalized),
                query[:60],
            )
            return normalized

        except Exception as exc:
            from app.utils.exceptions import CogneeError
            raise CogneeError(operation="search", reason=str(exc)) from exc

    async def search_chunks(
        self,
        case_id: str,
        query: str,
        max_results: int = 20,
    ) -> list[dict[str, Any]]:
        """Search for raw text chunks relevant to the query."""
        return await self.search(
            case_id=case_id,
            query=query,
            search_type=SearchType.CHUNKS,
            max_results=max_results,
        )

    async def search_graph(
        self,
        case_id: str,
        query: str,
        max_results: int = 20,
    ) -> list[dict[str, Any]]:
        """Search using graph-completion strategy for structured insights."""
        return await self.search(
            case_id=case_id,
            query=query,
            search_type=SearchType.GRAPH_COMPLETION,
            max_results=max_results,
        )

    async def reset_case(self, case_id: str) -> None:
        """
        Remove all Cognee memory for a case (prune the dataset).

        Args:
            case_id: The investigation case ID to reset.
        """
        dataset = self._dataset_name(case_id)
        try:
            logger.warning("Resetting Cognee memory for dataset '%s'", dataset)
            await cognee.prune.prune_data()
            # TODO: cognee.prune per-dataset when API supports it
            # Currently prunes all data — replace with dataset-scoped prune when available
            logger.info("Cognee memory reset for case '%s'", case_id)
        except Exception as exc:
            from app.utils.exceptions import CogneeError
            raise CogneeError(operation="prune", reason=str(exc)) from exc


# ── Module-level singleton ────────────────────────────────────────────────────
cognee_memory = CogneeMemoryManager()
