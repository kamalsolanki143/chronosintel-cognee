"""
ChronosIntel — Knowledge Graph Builder Service
===============================================
Triggers Cognee's cognify() to build the knowledge graph
from ingested documents, then persists extracted entities
and relationships to the database.

Workflow:
  1. Trigger cognee.cognify() for the case dataset
  2. Retrieve extracted graph data via graph_memory
  3. Upsert Entity and Relationship records into the database
  4. Update Case status to READY
"""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import (
    Case,
    CaseStatus,
    Entity,
    EntityType,
    Relationship,
    RelationshipType,
)
from app.utils.exceptions import CaseNotFoundError, GraphBuildError

logger = logging.getLogger(__name__)


class GraphBuilderService:
    """
    Builds the Cognee knowledge graph and syncs entities/relationships to DB.

    Usage::

        builder = GraphBuilderService()
        await builder.build_graph(db=db, case_id="abc-123")
    """

    async def build_graph(
        self, db: AsyncSession, case_id: str
    ) -> dict[str, int]:
        """
        Build the knowledge graph for a case.

        Args:
            db:      Async database session.
            case_id: The investigation case ID.

        Returns:
            Dict with entity_count and relationship_count.

        Raises:
            CaseNotFoundError: If the case doesn't exist.
            GraphBuildError:   If Cognee cognify fails.
        """
        from app.services.case_memory import case_memory_service

        # Validate case exists
        case = await case_memory_service.get_case(db, case_id)

        # Update status to BUILDING_GRAPH
        case.status = CaseStatus.BUILDING_GRAPH
        case.updated_at = datetime.now(timezone.utc)
        await db.flush()

        try:
            # 1. Trigger Cognee knowledge graph construction
            from ai.cognee.memory_manager import cognee_memory
            logger.info("Starting Cognee cognify for case '%s'", case_id)
            await cognee_memory.build_graph(case_id)

            # 2. Retrieve graph data
            from ai.cognee.graph_memory import cognee_graph
            nodes, edges = await cognee_graph.export_nodes_edges(case_id)
            logger.info(
                "Graph built: case=%s nodes=%d edges=%d",
                case_id, len(nodes), len(edges),
            )

            # 3. Upsert entities to DB
            entity_count = await self._upsert_entities(db, case_id, nodes)

            # 4. Upsert relationships to DB
            rel_count = await self._upsert_relationships(db, case_id, edges)

            # 5. Mark case as READY
            case.status = CaseStatus.READY
            case.updated_at = datetime.now(timezone.utc)
            await db.flush()

            return {"entity_count": entity_count, "relationship_count": rel_count}

        except GraphBuildError:
            raise
        except Exception as exc:
            case.status = CaseStatus.CREATED  # Revert status on failure
            await db.flush()
            raise GraphBuildError(case_id=case_id, reason=str(exc)) from exc

    async def _upsert_entities(
        self, db: AsyncSession, case_id: str, nodes: list[dict[str, Any]]
    ) -> int:
        """
        Upsert graph nodes as Entity records.
        Skips entities already existing in DB (by name + case_id).
        """
        upserted = 0
        existing_names: set[str] = set()

        # Load existing entity names for this case
        result = await db.execute(
            select(Entity.name).where(Entity.case_id == case_id)
        )
        existing_names = {row[0].lower() for row in result.fetchall()}

        for node in nodes:
            name = str(node.get("label") or node.get("name") or "").strip()
            if not name or name.lower() in existing_names:
                continue

            entity_type = self._map_entity_type(node.get("type", "other"))

            entity = Entity(
                case_id=case_id,
                name=name,
                entity_type=entity_type,
                description=node.get("description"),
                cognee_node_id=str(node.get("id", "")),
                confidence=1.0,
            )
            db.add(entity)
            existing_names.add(name.lower())
            upserted += 1

        await db.flush()
        logger.info("Upserted %d entities for case '%s'", upserted, case_id)
        return upserted

    async def _upsert_relationships(
        self,
        db: AsyncSession,
        case_id: str,
        edges: list[dict[str, Any]],
    ) -> int:
        """
        Upsert graph edges as Relationship records.
        Maps Cognee node IDs to DB entity IDs.
        """
        # Build cognee_node_id → db entity_id map
        result = await db.execute(
            select(Entity.id, Entity.cognee_node_id).where(
                Entity.case_id == case_id
            )
        )
        node_id_map: dict[str, str] = {
            row[1]: row[0] for row in result.fetchall() if row[1]
        }

        upserted = 0
        for edge in edges:
            source_node_id = str(edge.get("source", ""))
            target_node_id = str(edge.get("target", ""))

            source_entity_id = node_id_map.get(source_node_id)
            target_entity_id = node_id_map.get(target_node_id)

            if not source_entity_id or not target_entity_id:
                continue  # Skip edges where entities aren't in DB

            rel_type = self._map_relationship_type(edge.get("label", "related_to"))

            rel = Relationship(
                case_id=case_id,
                source_entity_id=source_entity_id,
                target_entity_id=target_entity_id,
                relationship_type=rel_type,
                description=edge.get("label"),
                weight=float(edge.get("weight", 1.0)),
                cognee_edge_id=str(edge.get("id", "")),
            )
            db.add(rel)
            upserted += 1

        await db.flush()
        logger.info("Upserted %d relationships for case '%s'", upserted, case_id)
        return upserted

    @staticmethod
    def _map_entity_type(raw_type: str) -> EntityType:
        """Map Cognee node type string to EntityType enum."""
        mapping = {
            "person": EntityType.PERSON,
            "people": EntityType.PERSON,
            "individual": EntityType.PERSON,
            "organization": EntityType.ORGANIZATION,
            "company": EntityType.ORGANIZATION,
            "location": EntityType.LOCATION,
            "place": EntityType.LOCATION,
            "project": EntityType.PROJECT,
            "system": EntityType.SYSTEM,
            "concept": EntityType.CONCEPT,
            "datetime": EntityType.DATE_TIME,
            "date": EntityType.DATE_TIME,
            "time": EntityType.DATE_TIME,
        }
        return mapping.get(str(raw_type).lower(), EntityType.OTHER)

    @staticmethod
    def _map_relationship_type(raw_label: str) -> RelationshipType:
        """Map Cognee edge label to RelationshipType enum."""
        label = str(raw_label).lower().replace(" ", "_")
        try:
            return RelationshipType(label)
        except ValueError:
            return RelationshipType.RELATED_TO


# ── Module-level singleton ────────────────────────────────────────────────────
graph_builder_service = GraphBuilderService()
