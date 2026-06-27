"""
ChronosIntel — Custom Exception Hierarchy
==========================================
All domain exceptions inherit from ChronosIntelError.
Registered as FastAPI exception handlers in main.py.
"""

from __future__ import annotations


class ChronosIntelError(Exception):
    """Base exception for all ChronosIntel errors."""

    def __init__(self, message: str, detail: str | None = None) -> None:
        self.message = message
        self.detail = detail or message
        super().__init__(self.message)


# ── Case Errors ───────────────────────────────────────────────────────────────
class CaseNotFoundError(ChronosIntelError):
    """Raised when a requested case does not exist."""

    def __init__(self, case_id: str) -> None:
        super().__init__(
            message=f"Case not found: {case_id}",
            detail=f"No case with ID '{case_id}' exists in the database.",
        )
        self.case_id = case_id


class CaseAlreadyExistsError(ChronosIntelError):
    """Raised when attempting to create a case with a duplicate ID."""

    def __init__(self, case_id: str) -> None:
        super().__init__(message=f"Case already exists: {case_id}")


# ── Document / Ingestion Errors ───────────────────────────────────────────────
class DocumentProcessingError(ChronosIntelError):
    """Raised when a document cannot be parsed or ingested."""

    def __init__(self, filename: str, reason: str) -> None:
        super().__init__(
            message=f"Failed to process document '{filename}': {reason}",
            detail=reason,
        )
        self.filename = filename
        self.reason = reason


class UnsupportedFileTypeError(DocumentProcessingError):
    """Raised when an uploaded file extension is not supported."""

    def __init__(self, filename: str, extension: str) -> None:
        super().__init__(
            filename=filename,
            reason=f"Unsupported file extension: '{extension}'",
        )
        self.extension = extension


class FileTooLargeError(DocumentProcessingError):
    """Raised when an uploaded file exceeds the size limit."""

    def __init__(self, filename: str, size_mb: float, limit_mb: int) -> None:
        super().__init__(
            filename=filename,
            reason=f"File size {size_mb:.1f} MB exceeds limit of {limit_mb} MB.",
        )


# ── Knowledge Graph Errors ────────────────────────────────────────────────────
class GraphBuildError(ChronosIntelError):
    """Raised when the knowledge graph cannot be constructed."""

    def __init__(self, case_id: str, reason: str) -> None:
        super().__init__(
            message=f"Graph build failed for case '{case_id}': {reason}",
            detail=reason,
        )
        self.case_id = case_id


# ── AI Service Errors ─────────────────────────────────────────────────────────
class CogneeError(ChronosIntelError):
    """Raised when Cognee operations fail."""

    def __init__(self, operation: str, reason: str) -> None:
        super().__init__(
            message=f"Cognee '{operation}' operation failed: {reason}",
            detail=reason,
        )
        self.operation = operation


class GeminiError(ChronosIntelError):
    """Raised when Gemini API calls fail."""

    def __init__(self, reason: str) -> None:
        super().__init__(
            message=f"Gemini API error: {reason}",
            detail=reason,
        )


class InsufficientEvidenceError(ChronosIntelError):
    """Raised when there is not enough evidence to answer a query."""

    def __init__(self, query: str) -> None:
        super().__init__(
            message=f"Insufficient evidence to answer query: '{query}'",
            detail="No relevant evidence was found in the knowledge graph for this query.",
        )
        self.query = query


# ── Version Errors ────────────────────────────────────────────────────────────
class VersionNotFoundError(ChronosIntelError):
    """Raised when a requested version snapshot does not exist."""

    def __init__(self, case_id: str, version: int) -> None:
        super().__init__(
            message=f"Version {version} not found for case '{case_id}'",
        )
        self.case_id = case_id
        self.version = version
