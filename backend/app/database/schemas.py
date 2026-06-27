"""
ChronosIntel — Pydantic Schemas
=================================
Request and response schemas for all API endpoints.
Organized by domain: Case, Document, Investigation, Chat,
Timeline, Graph, Evidence, Report, Feedback, Health.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.database.models import (
    CaseStatus,
    DocumentStatus,
    DocumentType,
    EntityType,
    EvidenceType,
    RelationshipType,
)


# ── Shared ────────────────────────────────────────────────────────────────────
class BaseResponse(BaseModel):
    """Common response envelope."""
    model_config = ConfigDict(from_attributes=True)


class MessageResponse(BaseModel):
    """Simple message response."""
    message: str
    success: bool = True


# ── Case Schemas ──────────────────────────────────────────────────────────────
class CaseCreate(BaseModel):
    """Request body for creating a new investigation case."""
    title: str = Field(..., min_length=3, max_length=512, description="Case title")
    description: Optional[str] = Field(None, description="Case description")
    investigator: Optional[str] = Field(None, description="Investigator name or ID")
    tags: Optional[list[str]] = Field(default_factory=list, description="Case tags")
    metadata: Optional[dict[str, Any]] = Field(None, description="Additional metadata")


class CaseUpdate(BaseModel):
    """Request body for updating an existing case."""
    title: Optional[str] = Field(None, min_length=3, max_length=512)
    description: Optional[str] = None
    investigator: Optional[str] = None
    status: Optional[CaseStatus] = None
    tags: Optional[list[str]] = None
    metadata: Optional[dict[str, Any]] = None


class CaseResponse(BaseResponse):
    """Response schema for a case."""
    id: str
    title: str
    description: Optional[str] = None
    status: CaseStatus
    investigator: Optional[str] = None
    tags: Optional[list[str]] = None
    cognee_dataset: Optional[str] = None
    document_count: int = 0
    created_at: datetime
    updated_at: datetime


class CaseListResponse(BaseModel):
    """Paginated list of cases."""
    cases: list[CaseResponse]
    total: int
    page: int = 1
    page_size: int = 20


# ── Upload / Document Schemas ─────────────────────────────────────────────────
class UploadRequest(BaseModel):
    """Query parameters for file upload."""
    case_id: str = Field(..., description="Target case ID")
    document_type: Optional[DocumentType] = Field(None, description="Override document type")
    author: Optional[str] = Field(None, description="Document author")
    document_date: Optional[datetime] = Field(None, description="Document creation date")


class UploadResponse(BaseResponse):
    """Response after successful file upload."""
    document_id: str
    case_id: str
    filename: str
    status: DocumentStatus
    chunk_count: int = 0
    message: str


class DocumentResponse(BaseResponse):
    """Full document details."""
    id: str
    case_id: str
    filename: str
    original_filename: str
    document_type: DocumentType
    status: DocumentStatus
    file_size: Optional[int] = None
    chunk_count: int
    author: Optional[str] = None
    document_date: Optional[datetime] = None
    error_message: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class BatchUploadResponse(BaseModel):
    """Response for multiple file uploads."""
    case_id: str
    uploaded: list[UploadResponse]
    failed: list[dict[str, str]] = Field(default_factory=list)
    total_uploaded: int
    total_failed: int


# ── Investigation Schemas ─────────────────────────────────────────────────────
class InvestigationRequest(BaseModel):
    """Request body for an investigation query."""
    case_id: str = Field(..., description="Case to investigate")
    query: str = Field(
        ...,
        min_length=5,
        max_length=2048,
        description="Temporal investigation question",
    )
    max_results: Optional[int] = Field(
        None, ge=1, le=50, description="Max evidence results to retrieve"
    )
    date_from: Optional[datetime] = Field(None, description="Temporal filter start")
    date_to: Optional[datetime] = Field(None, description="Temporal filter end")
    entities_filter: Optional[list[str]] = Field(
        None, description="Filter results to specific entity names"
    )


class EvidenceItem(BaseModel):
    """Single piece of evidence supporting an answer."""
    evidence_id: Optional[str] = None
    document_id: Optional[str] = None
    document_name: Optional[str] = None
    text_excerpt: str
    explanation: Optional[str] = None
    relevance_score: float = Field(ge=0.0, le=1.0)
    evidence_type: EvidenceType = EvidenceType.DIRECT
    timestamp: Optional[datetime] = None
    page_number: Optional[int] = None


class InvestigationResponse(BaseModel):
    """Grounded investigation answer with evidence trail."""
    case_id: str
    query: str
    answer: str
    confidence: float = Field(ge=0.0, le=1.0)
    evidence_count: int
    evidence: list[EvidenceItem]
    entities_mentioned: list[str] = Field(default_factory=list)
    temporal_range: Optional[dict[str, Optional[str]]] = None
    processing_time_ms: Optional[int] = None


# ── Chat Schemas ──────────────────────────────────────────────────────────────
class ChatMessage(BaseModel):
    """Single message in a chat conversation."""
    role: str = Field(..., pattern="^(user|assistant)$")
    content: str


class ChatRequest(BaseModel):
    """Chat follow-up request with conversation history."""
    case_id: str = Field(..., description="Case context for the chat")
    message: str = Field(..., min_length=1, max_length=4096)
    conversation_history: list[ChatMessage] = Field(
        default_factory=list, description="Previous messages for context"
    )
    max_history: int = Field(10, ge=1, le=50, description="Max history messages to include")


class ChatResponse(BaseModel):
    """Chat response with grounded answer."""
    case_id: str
    message: str
    evidence: list[EvidenceItem] = Field(default_factory=list)
    role: str = "assistant"
    processing_time_ms: Optional[int] = None


# ── Timeline Schemas ──────────────────────────────────────────────────────────
class TimelineEvent(BaseModel):
    """A single event on the investigation timeline."""
    event_id: str
    title: str
    description: Optional[str] = None
    event_time: Optional[datetime] = None
    event_time_raw: Optional[str] = None
    location: Optional[str] = None
    participants: list[str] = Field(default_factory=list)
    source_document: Optional[str] = None
    confidence: float = Field(ge=0.0, le=1.0)


class TimelineResponse(BaseModel):
    """Chronological timeline for a case."""
    case_id: str
    total_events: int
    events: list[TimelineEvent]
    date_range: Optional[dict[str, Optional[str]]] = None


# ── Graph Schemas ─────────────────────────────────────────────────────────────
class GraphNode(BaseModel):
    """A node in the knowledge graph."""
    id: str
    label: str
    type: str
    description: Optional[str] = None
    attributes: dict[str, Any] = Field(default_factory=dict)
    size: float = 1.0


class GraphEdge(BaseModel):
    """An edge in the knowledge graph."""
    id: str
    source: str
    target: str
    label: str
    weight: float = 1.0
    attributes: dict[str, Any] = Field(default_factory=dict)


class GraphResponse(BaseModel):
    """Knowledge graph for a case."""
    case_id: str
    node_count: int
    edge_count: int
    nodes: list[GraphNode]
    edges: list[GraphEdge]
    generated_at: datetime


# ── Evidence Schemas ──────────────────────────────────────────────────────────
class EvidenceChainItem(BaseModel):
    """Linked evidence item with full provenance."""
    id: str
    document_id: Optional[str] = None
    document_name: Optional[str] = None
    entity_name: Optional[str] = None
    evidence_type: EvidenceType
    text_excerpt: Optional[str] = None
    explanation: Optional[str] = None
    relevance_score: float
    timestamp: Optional[datetime] = None


class EvidenceResponse(BaseModel):
    """Full evidence chain for a case."""
    case_id: str
    total_evidence: int
    evidence_chain: list[EvidenceChainItem]


# ── Report Schemas ────────────────────────────────────────────────────────────
class ReportRequest(BaseModel):
    """Request to generate an investigation report."""
    case_id: str
    query: Optional[str] = Field(None, description="Specific query to focus report on")
    include_timeline: bool = True
    include_graph: bool = True
    include_evidence: bool = True


class ReportResponse(BaseModel):
    """Generated investigation report."""
    report_id: str
    case_id: str
    version: int
    query: Optional[str] = None
    summary: str
    findings: list[dict[str, Any]] = Field(default_factory=list)
    html_content: Optional[str] = None
    entity_count: int
    event_count: int
    evidence_count: int
    is_final: bool
    created_at: datetime


# ── Case Update / Version Schemas ─────────────────────────────────────────────
class CaseUpdateRequest(BaseModel):
    """Request to upload new evidence to an existing case."""
    case_id: str
    label: Optional[str] = Field(None, description="Version label (e.g. 'After breach docs')")
    description: Optional[str] = None


class VersionSnapshot(BaseModel):
    """Summary of a case version."""
    version_id: str
    version_number: int
    label: Optional[str] = None
    description: Optional[str] = None
    document_count: int
    entity_count: int
    event_count: int
    relationship_count: int
    created_at: datetime


class VersionDiff(BaseModel):
    """Difference between two case versions."""
    version_a: int
    version_b: int
    new_entities: list[str] = Field(default_factory=list)
    removed_entities: list[str] = Field(default_factory=list)
    new_relationships: list[dict[str, str]] = Field(default_factory=list)
    new_events: list[str] = Field(default_factory=list)
    change_summary: str = ""


class CaseUpdateResponse(BaseModel):
    """Response after updating a case with new evidence."""
    case_id: str
    previous_version: int
    new_version: int
    diff: VersionDiff
    message: str


# ── Memory Schemas ────────────────────────────────────────────────────────────
class MemoryStateResponse(BaseModel):
    """Current memory/state of a case."""
    case_id: str
    cognee_dataset: Optional[str] = None
    status: CaseStatus
    document_count: int
    entity_count: int
    event_count: int
    relationship_count: int
    current_version: int
    versions: list[VersionSnapshot] = Field(default_factory=list)
    last_updated: Optional[datetime] = None


# ── Feedback Schemas ──────────────────────────────────────────────────────────
class FeedbackRequest(BaseModel):
    """Investigator feedback on an investigation result."""
    case_id: str
    query: str
    answer: str
    rating: int = Field(..., ge=1, le=5, description="1 (poor) to 5 (excellent)")
    feedback_text: Optional[str] = Field(None, max_length=2048)
    evidence_ids: list[str] = Field(
        default_factory=list, description="Evidence IDs marked as useful"
    )
    corrections: Optional[str] = Field(
        None, description="Investigator corrections or additional context"
    )


class FeedbackResponse(BaseModel):
    """Feedback submission response."""
    feedback_id: str
    case_id: str
    message: str
    reinforcement_applied: bool = False


# ── Entity Schemas ────────────────────────────────────────────────────────────
class EntityResponse(BaseResponse):
    """Entity detail."""
    id: str
    case_id: str
    name: str
    entity_type: EntityType
    description: Optional[str] = None
    aliases: Optional[list[str]] = None
    confidence: float
    created_at: datetime


# ── Health Schema ─────────────────────────────────────────────────────────────
class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    service: str
    environment: str
    version: str
    services: dict[str, str]
