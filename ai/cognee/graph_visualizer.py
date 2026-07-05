"""
ChronosIntel — Graph Visualizer
==================================
Converts Cognee graph data into the API response format
used by the frontend graph visualization (nodes + edges).

Adds visual properties: node sizes, type-based colors,
edge weights, and label truncation.
"""

from __future__ import annotations

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from app.database.schemas import GraphEdge, GraphNode, GraphResponse

logger = logging.getLogger(__name__)

# Visual size scale by node type
_NODE_SIZE_MAP: dict[str, float] = {
    "person": 2.0,
    "organization": 2.5,
    "project": 2.0,
    "location": 1.5,
    "system": 1.8,
    "concept": 1.2,
    "datetime": 1.0,
    "other": 1.0,
}


class GraphVisualizer:
    """
    Converts raw Cognee graph data into structured GraphResponse for the API.

    Usage::

        visualizer = GraphVisualizer()
        response = await visualizer.build_graph_response(case_id="abc-123")
    """

    async def build_graph_response(self, case_id: str) -> GraphResponse:
        """
        Fetch and format the knowledge graph for a case into API response format.

        Args:
            case_id: The investigation case ID.

        Returns:
            GraphResponse with nodes and edges.
        """
        from ai.cognee.graph_memory import cognee_graph

        nodes_raw, edges_raw = await cognee_graph.export_nodes_edges(case_id)

        nodes = [self._format_node(n) for n in nodes_raw]
        edges = [self._format_edge(e) for e in edges_raw]

        # Deduplicate nodes by ID
        seen_node_ids: set[str] = set()
        unique_nodes: list[GraphNode] = []
        for node in nodes:
            if node.id not in seen_node_ids:
                seen_node_ids.add(node.id)
                unique_nodes.append(node)

        # Filter edges to only reference valid node IDs
        valid_ids = seen_node_ids
        valid_edges = [e for e in edges if e.source in valid_ids and e.target in valid_ids]

        logger.info(
            "Graph built for case '%s': %d nodes, %d edges",
            case_id,
            len(unique_nodes),
            len(valid_edges),
        )

        return GraphResponse(
            case_id=case_id,
            node_count=len(unique_nodes),
            edge_count=len(valid_edges),
            nodes=unique_nodes,
            edges=valid_edges,
            generated_at=datetime.now(timezone.utc),
        )

    def _format_node(self, raw: dict[str, Any]) -> GraphNode:
        """Format a raw Cognee node into a GraphNode schema."""
        node_type = str(raw.get("type", "other")).lower()
        label = str(raw.get("label") or raw.get("name") or "Unknown")

        # Truncate long labels for display
        display_label = label[:60] + "..." if len(label) > 60 else label

        return GraphNode(
            id=str(raw.get("id") or str(uuid.uuid4())),
            label=display_label,
            type=node_type,
            description=raw.get("description"),
            attributes={
                k: v
                for k, v in (raw.get("attributes") or {}).items()
                if v is not None
            },
            size=_NODE_SIZE_MAP.get(node_type, 1.0),
        )

    def _format_edge(self, raw: dict[str, Any]) -> GraphEdge:
        """Format a raw Cognee edge into a GraphEdge schema."""
        label = str(raw.get("label") or raw.get("type") or "related_to")

        return GraphEdge(
            id=str(raw.get("id") or str(uuid.uuid4())),
            source=str(raw.get("source", "")),
            target=str(raw.get("target", "")),
            label=label,
            weight=float(raw.get("weight", 1.0)),
            attributes={
                k: v
                for k, v in (raw.get("attributes") or {}).items()
                if v is not None
            },
        )


# ── Module-level singleton ────────────────────────────────────────────────────
graph_visualizer = GraphVisualizer()
