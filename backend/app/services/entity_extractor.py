"""
ChronosIntel — Entity Extractor Service
=========================================
Extracts named entities from document text using Gemini.

Used after ingestion to populate the Entity table with
structured data about persons, organizations, projects, etc.

Gemini is only used here after text has been retrieved
from the database — not from raw user prompts.
"""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from app.database.models import Document, DocumentStatus, Entity, EntityType
from app.services.graph_builder import GraphBuilderService

logger = logging.getLogger(__name__)


class EntityExtractorService:
    """
    Extracts and stores named entities from document text.

    Usage::

        extractor = EntityExtractorService()
        entities = await extractor.extract_from_document(
            db=db, case_id="abc-123", document_id="doc-456"
        )
    """

    async def extract_from_document(
        self, db: AsyncSession, case_id: str, document_id: str
    ) -> list[Entity]:
        """
        Extract entities from a document and store them in the database.

        Args:
            db:          Async database session.
            case_id:     The investigation case ID.
            document_id: The document to extract entities from.

        Returns:
            List of created Entity ORM objects.
        """
        from sqlalchemy import select
        from ai.gemini.client import gemini_client

        # Get document text
        result = await db.execute(
            select(Document).where(
                Document.id == document_id,
                Document.case_id == case_id,
                Document.status == DocumentStatus.PROCESSED,
            )
        )
        doc = result.scalar_one_or_none()
        if not doc or not doc.content_text:
            logger.warning("No processed content for doc_id=%s", document_id)
            return []

        # Extract via Gemini (text from DB, not from user prompt)
        raw_entities: list[dict[str, Any]] = await gemini_client.extract_entities_from_text(
            doc.content_text[:8000]
        )

        created: list[Entity] = []
        for raw in raw_entities:
            name = str(raw.get("name") or "").strip()
            if not name:
                continue

            entity_type = GraphBuilderService._map_entity_type(
                raw.get("type", "other")
            )

            entity = Entity(
                case_id=case_id,
                name=name,
                entity_type=entity_type,
                description=raw.get("description"),
                confidence=0.9,  # Gemini-extracted entities are high confidence
            )
            db.add(entity)
            created.append(entity)

        await db.flush()
        logger.info(
            "Extracted %d entities from document '%s'", len(created), document_id
        )
        return created

    async def extract_from_all_documents(
        self, db: AsyncSession, case_id: str
    ) -> int:
        """
        Extract entities from all processed documents for a case.

        Returns:
            Total number of entities created.
        """
        from sqlalchemy import select

        result = await db.execute(
            select(Document.id).where(
                Document.case_id == case_id,
                Document.status == DocumentStatus.PROCESSED,
            )
        )
        doc_ids = [row[0] for row in result.fetchall()]

        total = 0
        for doc_id in doc_ids:
            entities = await self.extract_from_document(db, case_id, doc_id)
            total += len(entities)

        return total


# ── Module-level singleton ────────────────────────────────────────────────────
entity_extractor_service = EntityExtractorService()
