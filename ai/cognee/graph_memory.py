"""
ChronosIntel — Cognee Graph Memory
=====================================
Provides helpers to retrieve and export the knowledge graph
built by Cognee for a given case.

NOTE: Cognee's internal graph storage API is subject to change.
      Functions marked with TODO may require updates as Cognee evolves.
"""

from __future__ import annotations

import logging
from typing import Any

import cognee

logger = logging.getLogger(__name__)


class CogneeGraphMemory:
    """
    Retrieves graph data from Cognee's internal knowledge store.

    The graph is extracted via Cognee's search API using different search
    strategies and post-processed into node/edge format suitable for
    the ChronosIntel API and frontend visualization.

    Usage::

        graph_memory = CogneeGraphMemory()
        graph_data = await graph_memory.get_graph_data(case_id="abc-123")
    """

    def _dataset_name(self, case_id: str) -> str:
        return f"chronosintel_{case_id}"

    async def get_graph_data(self, case_id: str) -> dict[str, Any]:
        """
        Retrieve the full knowledge graph for a case.

        Returns a dict with keys:
          - nodes: list of node dicts (id, label, type, attributes)
          - edges: list of edge dicts (source, target, label, weight)

        Args:
            case_id: The investigation case ID.
        """
        dataset = self._dataset_name(case_id)
        try:
            # Search with GRAPH_COMPLETION to get structured graph output
            from cognee.api.v1.search.types import SearchType
            results = await cognee.search(
                query_text="*",  # wildcard to retrieve all graph nodes
                query_type=SearchType.GRAPH_COMPLETION,
                datasets=[dataset],
            )
            return self._parse_graph_results(results)

        except Exception as exc:
            logger.warning(
                "Could not retrieve Cognee graph for case '%s': %s. "
                "Returning empty graph.",
                case_id,
                exc,
            )
            return {"nodes": [], "edges": []}

    async def export_nodes_edges(
        self, case_id: str
    ) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
        """
        Export graph as separate nodes and edges lists.

        Returns:
            Tuple of (nodes, edges).
        """
        graph_data = await self.get_graph_data(case_id)
        return graph_data.get("nodes", []), graph_data.get("edges", [])

    def _parse_graph_results(
        self, results: list[Any]
    ) -> dict[str, list[dict[str, Any]]]:
        """
        Parse Cognee search results into nodes and edges.

        Cognee may return results as dicts, dataclasses, or objects.
        This method normalizes them into a consistent format.
        """
        nodes: dict[str, dict[str, Any]] = {}
        edges: list[dict[str, Any]] = []
        edge_id_counter = 0

        for item in results:
            raw: dict[str, Any] = {}
            if isinstance(item, dict):
                raw = item
            elif hasattr(item, "__dict__"):
                raw = item.__dict__

            # Try to extract node information
            node_id = (
                raw.get("id")
                or raw.get("node_id")
                or raw.get("uuid")
                or str(id(item))
            )
            label = (
                raw.get("name")
                or raw.get("label")
                or raw.get("title")
                or raw.get("content", "")[:80]
                or f"node_{node_id}"
            )
            node_type = (
                raw.get("type")
                or raw.get("node_type")
                or raw.get("entity_type")
                or "concept"
            )

            if node_id and str(node_id) not in nodes:
                nodes[str(node_id)] = {
                    "id": str(node_id),
                    "label": str(label),
                    "type": str(node_type),
                    "description": raw.get("description") or raw.get("content"),
                    "attributes": {
                        k: v
                        for k, v in raw.items()
                        if k not in {"id", "name", "label", "type", "description", "content"}
                        and not k.startswith("_")
                    },
                }

            # Try to extract edge / relationship information
            if "relationships" in raw and isinstance(raw["relationships"], list):
                for rel in raw["relationships"]:
                    rel_raw: dict[str, Any] = rel if isinstance(rel, dict) else getattr(rel, "__dict__", {})
                    source = rel_raw.get("source_id") or rel_raw.get("from") or node_id
                    target = rel_raw.get("target_id") or rel_raw.get("to")
                    if source and target:
                        edges.append(
                            {
                                "id": f"edge_{edge_id_counter}",
                                "source": str(source),
                                "target": str(target),
                                "label": str(rel_raw.get("type", "related_to")),
                                "weight": float(rel_raw.get("weight", 1.0)),
                            }
                        )
                        edge_id_counter += 1

        return {"nodes": list(nodes.values()), "edges": edges}


# ── Module-level singleton ────────────────────────────────────────────────────
cognee_graph = CogneeGraphMemory()
