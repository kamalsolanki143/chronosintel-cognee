"""
ChronosIntel — Document Ingestion Service
==========================================
Orchestrates the full document ingestion pipeline:

  1. Validate file type and size
  2. Save file to storage
  3. Parse content (text, PDF, DOCX, EML, etc.)
  4. Chunk text
  5. Store Document in database
  6. Send chunks to Cognee memory
  7. Update document status

Each step is atomic — failures are recorded on the Document record.
"""

from __future__ import annotations

import asyncio
import logging
import os
import shutil
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import aiofiles
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database.models import Document, DocumentStatus, DocumentType
from app.utils.exceptions import (
    DocumentProcessingError,
    FileTooLargeError,
    UnsupportedFileTypeError,
)
from app.utils.file_parser import file_parser
from app.utils.text_chunker import text_chunker

logger = logging.getLogger(__name__)


class IngestionService:
    """
    Full document ingestion pipeline service.

    Usage::

        service = IngestionService()
        document = await service.ingest_file(
            db=db,
            case_id="abc-123",
            file_content=bytes_data,
            filename="email.eml",
        )
    """

    async def ingest_file(
        self,
        db: AsyncSession,
        case_id: str,
        file_content: bytes,
        filename: str,
        document_type: DocumentType | None = None,
        author: str | None = None,
        document_date: datetime | None = None,
    ) -> Document:
        """
        Ingest a single file into the case knowledge base.

        Args:
            db:            Async database session.
            case_id:       Target case ID.
            file_content:  Raw file bytes.
            filename:      Original filename (used for extension detection).
            document_type: Override auto-detected document type.
            author:        Override auto-detected author.
            document_date: Override auto-detected document date.

        Returns:
            Created Document ORM object with updated status.

        Raises:
            UnsupportedFileTypeError: If the file extension is not supported.
            FileTooLargeError: If the file exceeds the size limit.
        """
        # 1. Validate file type
        path = Path(filename)
        extension = path.suffix.lower()
        if extension not in settings.allowed_extensions:
            raise UnsupportedFileTypeError(filename=filename, extension=extension)

        # 2. Validate file size
        size_bytes = len(file_content)
        size_mb = size_bytes / (1024 * 1024)
        if size_mb > settings.max_upload_size_mb:
            raise FileTooLargeError(
                filename=filename, size_mb=size_mb, limit_mb=settings.max_upload_size_mb
            )

        # 3. Save file to storage
        safe_filename, file_path = await self._save_file(case_id, filename, file_content)

        # 4. Create Document record (status=PENDING)
        doc = Document(
            case_id=case_id,
            filename=safe_filename,
            original_filename=filename,
            file_path=file_path,
            file_size=size_bytes,
            document_type=document_type or DocumentType.UNKNOWN,
            status=DocumentStatus.PROCESSING,
            author=author,
            document_date=document_date,
        )
        db.add(doc)
        await db.flush()  # Get ID

        logger.info(
            "Document created: id=%s filename='%s' case=%s",
            doc.id, filename, case_id,
        )

        # 5. Parse content (run in threadpool — CPU-bound)
        try:
            parsed = await asyncio.get_event_loop().run_in_executor(
                None, file_parser.parse, file_path
            )

            # Use parsed metadata if not overridden
            if document_type is None:
                doc.document_type = parsed.document_type
            if author is None and parsed.author:
                doc.author = parsed.author
            if document_date is None and parsed.document_date:
                doc.document_date = parsed.document_date

            doc.content_text = parsed.text
            doc.metadata_ = parsed.metadata

        except (UnsupportedFileTypeError, DocumentProcessingError) as exc:
            doc.status = DocumentStatus.FAILED
            doc.error_message = str(exc)
            await db.flush()
            logger.error("Document parsing failed: doc_id=%s error=%s", doc.id, exc)
            raise

        # 6. Chunk text
        chunks = text_chunker.chunk_to_strings(parsed.text)
        doc.chunk_count = len(chunks)

        # 7. Send to Cognee memory
        if chunks:
            try:
                from ai.cognee.memory_manager import cognee_memory

                cognee_docs = [
                    {
                        "text": chunk,
                        "doc_id": f"{doc.id}_chunk_{i}",
                        "metadata": {
                            "case_id": case_id,
                            "document_id": doc.id,
                            "filename": filename,
                            "chunk_index": i,
                            "document_type": doc.document_type.value,
                            "author": doc.author,
                        },
                    }
                    for i, chunk in enumerate(chunks)
                ]
                added = await cognee_memory.add_documents(case_id, cognee_docs)
                logger.info(
                    "Sent %d/%d chunks to Cognee for doc_id=%s",
                    added, len(chunks), doc.id,
                )
            except Exception as exc:
                # Cognee failure doesn't block document storage
                logger.error(
                    "Cognee ingestion failed for doc_id=%s: %s", doc.id, exc
                )
                doc.error_message = f"Cognee error: {exc}"

        # 8. Mark as processed
        doc.status = DocumentStatus.PROCESSED
        doc.updated_at = datetime.now(timezone.utc)
        await db.flush()

        logger.info(
            "Document ingested: doc_id=%s chunks=%d", doc.id, doc.chunk_count
        )
        return doc

    async def ingest_batch(
        self,
        db: AsyncSession,
        case_id: str,
        files: list[dict[str, Any]],
    ) -> tuple[list[Document], list[dict[str, str]]]:
        """
        Ingest multiple files, collecting successes and failures separately.

        Args:
            db:      Async database session.
            case_id: Target case ID.
            files:   List of dicts with keys: file_content (bytes), filename (str),
                     optional: document_type, author, document_date.

        Returns:
            Tuple of (successful_documents, failed_items).
        """
        successful: list[Document] = []
        failed: list[dict[str, str]] = []

        for file_data in files:
            try:
                doc = await self.ingest_file(
                    db=db,
                    case_id=case_id,
                    file_content=file_data["file_content"],
                    filename=file_data["filename"],
                    document_type=file_data.get("document_type"),
                    author=file_data.get("author"),
                    document_date=file_data.get("document_date"),
                )
                successful.append(doc)
            except Exception as exc:
                failed.append(
                    {"filename": file_data.get("filename", "unknown"), "error": str(exc)}
                )

        return successful, failed

    async def _save_file(
        self, case_id: str, filename: str, content: bytes
    ) -> tuple[str, str]:
        """
        Save file bytes to the upload directory.

        Returns:
            Tuple of (safe_filename, absolute_file_path).
        """
        import uuid

        # Create per-case directory
        case_dir = os.path.join(settings.upload_dir, case_id)
        os.makedirs(case_dir, exist_ok=True)

        # Generate unique filename to avoid collisions
        unique_id = str(uuid.uuid4())[:8]
        path = Path(filename)
        safe_filename = f"{path.stem}_{unique_id}{path.suffix}"
        file_path = os.path.join(case_dir, safe_filename)

        async with aiofiles.open(file_path, "wb") as f:
            await f.write(content)

        logger.debug("File saved: %s (%d bytes)", file_path, len(content))
        return safe_filename, file_path


# ── Module-level singleton ────────────────────────────────────────────────────
ingestion_service = IngestionService()
