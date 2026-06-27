"""
ChronosIntel — SQLAlchemy ORM Models
======================================
Models:
  - Case            : Investigation case container
  - Document        : Uploaded evidence document
  - Entity          : Named entity extracted from documents
  - Event           : Temporal event extracted/inferred
  - Relationship    : Relationship between two entities
  - Evidence        : Evidence record linking document → entity/event
  - Report          : Generated investigation report
  - CaseVersion     : Snapshot of case state for version comparison

All models use UUID primary keys and include created_at / updated_at timestamps.
"""

from __future__ import annotations

import uuid
from datetime import datetime, timezone
from enum import Enum as PyEnum

from sqlalchemy import (
    JSON,
    Boolean,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


def _uuid() -> str:
    """Generate a new UUID4 string."""
    return str(uuid.uuid4())


def _now() -> datetime:
    """Return current UTC datetime."""
    return datetime.now(timezone.utc)


# ── Base ──────────────────────────────────────────────────────────────────────
class Base(DeclarativeBase):
    """Declarative base for all ORM models."""
    pass


# ── Enums ─────────────────────────────────────────────────────────────────────
class CaseStatus(str, PyEnum):
    CREATED = "created"
    INGESTING = "ingesting"
    BUILDING_GRAPH = "building_graph"
    READY = "ready"
    INVESTIGATING = "investigating"
    CLOSED = "closed"


class DocumentStatus(str, PyEnum):
    PENDING = "pending"
    PROCESSING = "processing"
    PROCESSED = "processed"
    FAILED = "failed"


class DocumentType(str, PyEnum):
    EMAIL = "email"
    CHAT = "chat"
    TRANSCRIPT = "transcript"
    AUDIT_LOG = "audit_log"
    GIT_COMMIT = "git_commit"
    DOCUMENT = "document"
    UNKNOWN = "unknown"


class EntityType(str, PyEnum):
    PERSON = "person"
    ORGANIZATION = "organization"
    LOCATION = "location"
    PROJECT = "project"
    SYSTEM = "system"
    CONCEPT = "concept"
    DATE_TIME = "datetime"
    OTHER = "other"


class RelationshipType(str, PyEnum):
    COMMUNICATED_WITH = "communicated_with"
    MENTIONED = "mentioned"
    PARTICIPATED_IN = "participated_in"
    CAUSED = "caused"
    PRECEDED = "preceded"
    FOLLOWED = "followed"
    RELATED_TO = "related_to"
    ACCESSED = "accessed"
    MODIFIED = "modified"


class EvidenceType(str, PyEnum):
    DIRECT = "direct"
    INFERRED = "inferred"
    CIRCUMSTANTIAL = "circumstantial"


# ── Models ────────────────────────────────────────────────────────────────────

class Case(Base):
    """
    Investigation case — top-level container.
    All documents, entities, events and reports belong to a case.
    """
    __tablename__ = "cases"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    status: Mapped[CaseStatus] = mapped_column(
        Enum(CaseStatus), default=CaseStatus.CREATED, nullable=False
    )
    investigator: Mapped[str | None] = mapped_column(String(256), nullable=True)
    tags: Mapped[dict | None] = mapped_column(JSON, nullable=True)   # list of tag strings
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
    cognee_dataset: Mapped[str | None] = mapped_column(String(256), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )

    # Relationships
    documents: Mapped[list["Document"]] = relationship(
        "Document", back_populates="case", cascade="all, delete-orphan"
    )
    entities: Mapped[list["Entity"]] = relationship(
        "Entity", back_populates="case", cascade="all, delete-orphan"
    )
    events: Mapped[list["Event"]] = relationship(
        "Event", back_populates="case", cascade="all, delete-orphan"
    )
    relationships_: Mapped[list["Relationship"]] = relationship(
        "Relationship", back_populates="case", cascade="all, delete-orphan"
    )
    evidence_records: Mapped[list["Evidence"]] = relationship(
        "Evidence", back_populates="case", cascade="all, delete-orphan"
    )
    reports: Mapped[list["Report"]] = relationship(
        "Report", back_populates="case", cascade="all, delete-orphan"
    )
    versions: Mapped[list["CaseVersion"]] = relationship(
        "CaseVersion", back_populates="case", cascade="all, delete-orphan"
    )


class Document(Base):
    """
    Uploaded evidence document.
    Stores file metadata and parsed text content.
    """
    __tablename__ = "documents"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True
    )
    filename: Mapped[str] = mapped_column(String(512), nullable=False)
    original_filename: Mapped[str] = mapped_column(String(512), nullable=False)
    file_path: Mapped[str] = mapped_column(String(1024), nullable=False)
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True)
    mime_type: Mapped[str | None] = mapped_column(String(128), nullable=True)
    document_type: Mapped[DocumentType] = mapped_column(
        Enum(DocumentType), default=DocumentType.UNKNOWN, nullable=False
    )
    status: Mapped[DocumentStatus] = mapped_column(
        Enum(DocumentStatus), default=DocumentStatus.PENDING, nullable=False
    )
    content_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    chunk_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    author: Mapped[str | None] = mapped_column(String(256), nullable=True)
    document_date: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )

    # Relationships
    case: Mapped["Case"] = relationship("Case", back_populates="documents")
    evidence_records: Mapped[list["Evidence"]] = relationship(
        "Evidence", back_populates="document", cascade="all, delete-orphan"
    )


class Entity(Base):
    """
    Named entity extracted from documents.
    Represents people, organizations, projects, etc.
    """
    __tablename__ = "entities"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(512), nullable=False, index=True)
    entity_type: Mapped[EntityType] = mapped_column(
        Enum(EntityType), default=EntityType.OTHER, nullable=False
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    aliases: Mapped[dict | None] = mapped_column(JSON, nullable=True)   # list[str]
    attributes: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    cognee_node_id: Mapped[str | None] = mapped_column(String(512), nullable=True)
    confidence: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )

    # Relationships
    case: Mapped["Case"] = relationship("Case", back_populates="entities")
    evidence_records: Mapped[list["Evidence"]] = relationship(
        "Evidence", back_populates="entity", cascade="all, delete-orphan"
    )


class Event(Base):
    """
    Temporal event extracted or inferred from documents.
    Represents something that happened at a specific time.
    """
    __tablename__ = "events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(512), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    event_time: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True, index=True)
    event_time_raw: Mapped[str | None] = mapped_column(String(256), nullable=True)  # original string
    event_time_end: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    location: Mapped[str | None] = mapped_column(String(512), nullable=True)
    participants: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # list[str] entity names
    source_document_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True
    )
    cognee_node_id: Mapped[str | None] = mapped_column(String(512), nullable=True)
    confidence: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, onupdate=_now, nullable=False
    )

    # Relationships
    case: Mapped["Case"] = relationship("Case", back_populates="events")


class Relationship(Base):
    """
    Directed relationship between two entities in the knowledge graph.
    """
    __tablename__ = "relationships"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True
    )
    source_entity_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("entities.id", ondelete="CASCADE"), nullable=False
    )
    target_entity_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("entities.id", ondelete="CASCADE"), nullable=False
    )
    relationship_type: Mapped[RelationshipType] = mapped_column(
        Enum(RelationshipType), default=RelationshipType.RELATED_TO, nullable=False
    )
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    temporal_context: Mapped[str | None] = mapped_column(String(512), nullable=True)
    weight: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    attributes: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    cognee_edge_id: Mapped[str | None] = mapped_column(String(512), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, nullable=False
    )

    # Relationships
    case: Mapped["Case"] = relationship("Case", back_populates="relationships_")
    source_entity: Mapped["Entity"] = relationship(
        "Entity", foreign_keys=[source_entity_id]
    )
    target_entity: Mapped["Entity"] = relationship(
        "Entity", foreign_keys=[target_entity_id]
    )


class Evidence(Base):
    """
    Evidence record linking a document passage to an entity or event.
    Provides the ground truth trail for every conclusion.
    """
    __tablename__ = "evidence"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True
    )
    document_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("documents.id", ondelete="SET NULL"), nullable=True
    )
    entity_id: Mapped[str | None] = mapped_column(
        String(36), ForeignKey("entities.id", ondelete="SET NULL"), nullable=True
    )
    evidence_type: Mapped[EvidenceType] = mapped_column(
        Enum(EvidenceType), default=EvidenceType.DIRECT, nullable=False
    )
    text_excerpt: Mapped[str | None] = mapped_column(Text, nullable=True)
    explanation: Mapped[str | None] = mapped_column(Text, nullable=True)
    relevance_score: Mapped[float] = mapped_column(Float, default=1.0, nullable=False)
    page_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    chunk_index: Mapped[int | None] = mapped_column(Integer, nullable=True)
    timestamp: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, nullable=False
    )

    # Relationships
    case: Mapped["Case"] = relationship("Case", back_populates="evidence_records")
    document: Mapped["Document | None"] = relationship(
        "Document", back_populates="evidence_records"
    )
    entity: Mapped["Entity | None"] = relationship(
        "Entity", back_populates="evidence_records"
    )


class Report(Base):
    """
    Generated investigation report for a case.
    Stores both structured data and rendered HTML content.
    """
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True
    )
    version: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    query: Mapped[str | None] = mapped_column(Text, nullable=True)
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    findings: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # structured findings
    html_content: Mapped[str | None] = mapped_column(Text, nullable=True)
    evidence_ids: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # list[str]
    entity_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    event_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    file_path: Mapped[str | None] = mapped_column(String(1024), nullable=True)
    is_final: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, nullable=False
    )

    # Relationships
    case: Mapped["Case"] = relationship("Case", back_populates="reports")


class CaseVersion(Base):
    """
    Snapshot of a case's knowledge graph state.
    Enables comparison between investigation versions.
    """
    __tablename__ = "case_versions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=_uuid)
    case_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("cases.id", ondelete="CASCADE"), nullable=False, index=True
    )
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    label: Mapped[str | None] = mapped_column(String(256), nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    snapshot: Mapped[dict | None] = mapped_column(JSON, nullable=True)  # serialized graph state
    document_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    entity_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    event_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    relationship_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    change_summary: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=_now, nullable=False
    )

    # Relationships
    case: Mapped["Case"] = relationship("Case", back_populates="versions")
