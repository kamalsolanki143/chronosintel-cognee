"""
ChronosIntel — Knowledge Graph API Router
==========================================
Endpoints:
  GET /api/graph/{case_id}        — Full node/edge graph for visualization
  GET /api/graph/{case_id}/stats  — Graph statistics
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db
from app.database.schemas import GraphResponse
from app.utils.exceptions import CaseNotFoundError

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get(
    "/{case_id}",
    response_model=GraphResponse,
    summary="Get the knowledge graph for a case",
    description=(
        "Returns the full entity-relationship knowledge graph for a case. "
        "Nodes represent entities (people, orgs, projects, concepts). "
        "Edges represent temporal and semantic relationships."
    ),
)
async def get_graph(
    case_id: str,
    db: AsyncSession = Depends(get_db),
) -> GraphResponse:
    """
    Retrieve the knowledge graph for a case.

    Returns nodes and edges suitable for frontend graph visualization
    (e.g., D3.js force-directed graph, Cytoscape.js, etc.)

    Node types: person, organization, location, project, system, concept, datetime
    Edge labels: communicated_with, mentioned, participated_in, caused, preceded, etc.
    """
    from app.services.case_memory import case_memory_service
    from ai.cognee.graph_visualizer import graph_visualizer

    try:
        await case_memory_service.get_case(db, case_id)
    except CaseNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    try:
        graph_response = await graph_visualizer.build_graph_response(case_id)
        return graph_response
    except Exception as exc:
        logger.error("Graph retrieval failed for case=%s: %s", case_id, exc, exc_info=True)
        # Return empty graph on failure rather than 500
        return GraphResponse(
            case_id=case_id,
            node_count=0,
            edge_count=0,
            nodes=[],
            edges=[],
            generated_at=datetime.now(timezone.utc),
        )


@router.get(
    "/{case_id}/stats",
    response_model=dict,
    summary="Get knowledge graph statistics for a case",
)
async def get_graph_stats(
    case_id: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """
    Get aggregate statistics about the case knowledge graph.

    Returns entity counts by type, relationship counts by type,
    and overall graph health metrics.
    """
    from sqlalchemy import func, select
    from app.database.models import Entity, EntityType, Relationship, RelationshipType, Event
    from app.services.case_memory import case_memory_service

    try:
        await case_memory_service.get_case(db, case_id)
    except CaseNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))

    # Entity counts by type
    entity_result = await db.execute(
        select(Entity.entity_type, func.count().label("count"))
        .where(Entity.case_id == case_id)
        .group_by(Entity.entity_type)
    )
    entities_by_type = {row[0].value: row[1] for row in entity_result.fetchall()}

    # Total counts
    total_entities = sum(entities_by_type.values())
    total_relationships = await db.scalar(
        select(func.count()).where(Relationship.case_id == case_id)
    ) or 0
    total_events = await db.scalar(
        select(func.count()).where(Event.case_id == case_id)
    ) or 0

    return {
        "case_id": case_id,
        "total_entities": total_entities,
        "total_relationships": total_relationships,
        "total_events": total_events,
        "entities_by_type": entities_by_type,
        "graph_density": round(
            total_relationships / max(total_entities * (total_entities - 1), 1), 4
        ),
    }
