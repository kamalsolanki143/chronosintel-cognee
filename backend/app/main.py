"""
ChronosIntel — FastAPI Application Entry Point
================================================
Configures:
  - CORS middleware
  - Lifespan context (DB init, Cognee config, storage dirs)
  - All API routers
  - Global exception handlers
  - Health check endpoint
"""

from __future__ import annotations

import logging
import os
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import cognee
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api import (
    case_updates,
    chat,
    evidence,
    feedback,
    graph,
    investigation,
    memory,
    reports,
    timeline,
    upload,
)
from app.config import settings
from app.database.database import engine
from app.database.models import Base
from app.utils.exceptions import (
    CaseNotFoundError,
    CogneeError,
    DocumentProcessingError,
    GeminiError,
    GraphBuildError,
)

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


# ── Lifespan ─────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """
    Application lifespan handler.
    Runs startup logic before yield and cleanup after yield.
    """
    # 1. Create storage directories
    for directory in [settings.upload_dir, settings.processed_dir, settings.report_dir]:
        os.makedirs(directory, exist_ok=True)
        logger.info("Storage directory ensured: %s", directory)

    # 2. Create database tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created/verified.")

    # 3. Configure Cognee
    if settings.gemini_api_key:
        cognee.config.set_llm_config(
            {
                "llm_provider": "gemini",
                "llm_model": settings.cognee_llm_model,
                "llm_api_key": settings.gemini_api_key,
            }
        )
        cognee.config.set_embedding_config(
            {
                "embedding_provider": "gemini",
                "embedding_model": "models/text-embedding-004",
                "embedding_api_key": settings.gemini_api_key,
            }
        )
        logger.info("Cognee configured with Gemini LLM + Embeddings.")
    else:
        logger.warning(
            "GEMINI_API_KEY not set. Cognee will use default configuration."
        )

    os.makedirs(settings.cognee_db_path, exist_ok=True)
    logger.info("ChronosIntel API started — environment: %s", settings.environment)

    yield  # Application runs here

    # Shutdown
    logger.info("ChronosIntel API shutting down.")


# ── App Factory ───────────────────────────────────────────────────────────────
def create_application() -> FastAPI:
    """Create and configure the FastAPI application."""
    application = FastAPI(
        title=settings.app_name,
        description=(
            "ChronosIntel — AI-powered temporal investigation platform. "
            "Builds knowledge graphs from evidence corpora and answers "
            "grounded temporal queries."
        ),
        version="1.0.0",
        docs_url="/docs" if not settings.is_production else None,
        redoc_url="/redoc" if not settings.is_production else None,
        lifespan=lifespan,
    )

    # ── CORS Middleware ───────────────────────────────────────────────────────
    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Exception Handlers ────────────────────────────────────────────────────
    @application.exception_handler(CaseNotFoundError)
    async def case_not_found_handler(
        request: Request, exc: CaseNotFoundError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"error": "Case not found", "detail": str(exc)},
        )

    @application.exception_handler(DocumentProcessingError)
    async def document_processing_handler(
        request: Request, exc: DocumentProcessingError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={"error": "Document processing failed", "detail": str(exc)},
        )

    @application.exception_handler(GraphBuildError)
    async def graph_build_handler(
        request: Request, exc: GraphBuildError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"error": "Knowledge graph build failed", "detail": str(exc)},
        )

    @application.exception_handler(CogneeError)
    async def cognee_error_handler(
        request: Request, exc: CogneeError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "Cognee service error", "detail": str(exc)},
        )

    @application.exception_handler(GeminiError)
    async def gemini_error_handler(
        request: Request, exc: GeminiError
    ) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            content={"error": "Gemini reasoning error", "detail": str(exc)},
        )

    # ── Routers ───────────────────────────────────────────────────────────────
    application.include_router(
        upload.router, prefix="/api/upload", tags=["Upload"]
    )
    application.include_router(
        investigation.router, prefix="/api/investigation", tags=["Investigation"]
    )
    application.include_router(
        chat.router, prefix="/api/chat", tags=["Chat"]
    )
    application.include_router(
        case_updates.router, prefix="/api/case", tags=["Case Updates"]
    )
    application.include_router(
        timeline.router, prefix="/api/timeline", tags=["Timeline"]
    )
    application.include_router(
        graph.router, prefix="/api/graph", tags=["Knowledge Graph"]
    )
    application.include_router(
        evidence.router, prefix="/api/evidence", tags=["Evidence"]
    )
    application.include_router(
        reports.router, prefix="/api/report", tags=["Reports"]
    )
    application.include_router(
        memory.router, prefix="/api/memory", tags=["Case Memory"]
    )
    application.include_router(
        feedback.router, prefix="/api/feedback", tags=["Feedback"]
    )

    # ── Health Endpoint ───────────────────────────────────────────────────────
    @application.get(
        "/health",
        tags=["Health"],
        summary="Service health check",
        response_description="Service health status",
    )
    async def health_check() -> dict:
        """
        Returns the health status of the ChronosIntel API.
        Checks database connectivity and AI service availability.
        """
        health: dict = {
            "status": "ok",
            "service": settings.app_name,
            "environment": settings.environment,
            "version": "1.0.0",
            "services": {
                "database": "ok",
                "cognee": "ok" if settings.cognee_api_key or settings.gemini_api_key else "unconfigured",
                "gemini": "ok" if settings.gemini_api_key else "unconfigured",
            },
        }
        return health

    return application


# ── Application Instance ──────────────────────────────────────────────────────
app = create_application()
