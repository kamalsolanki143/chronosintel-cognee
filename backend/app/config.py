"""
ChronosIntel — Application Configuration
=========================================
All settings are loaded from environment variables (via .env file).
Never hardcode secrets. Use the singleton `settings` instance throughout the app.
"""

from __future__ import annotations

from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central application settings loaded from environment variables."""

    # ── Application ──────────────────────────────────────────────────────────
    app_name: str = "ChronosIntel"
    environment: str = "development"
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    log_level: str = "INFO"
    debug: bool = False

    # ── CORS ─────────────────────────────────────────────────────────────────
    frontend_url: str = "http://localhost:5173"
    allowed_origins: List[str] = ["http://localhost:5173", "http://localhost:3000"]

    # ── Database ─────────────────────────────────────────────────────────────
    # SQLite (dev): sqlite+aiosqlite:///./chronosintel.db
    # PostgreSQL  : postgresql+asyncpg://user:pass@host/dbname
    database_url: str = "sqlite+aiosqlite:///./chronosintel.db"

    # ── Cognee ───────────────────────────────────────────────────────────────
    cognee_api_key: str = ""
    cognee_llm_provider: str = "openai"          # override to "gemini" if supported
    cognee_llm_model: str = "gemini-2.0-flash"
    cognee_embedding_provider: str = "openai"
    cognee_embedding_model: str = "text-embedding-3-large"
    cognee_db_path: str = "./storage/cognee_db"  # local graph DB path

    # ── Google Gemini ─────────────────────────────────────────────────────────
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    gemini_temperature: float = 0.1              # low temp → deterministic reasoning
    gemini_max_output_tokens: int = 8192

    # ── Storage Paths ─────────────────────────────────────────────────────────
    upload_dir: str = "./storage/uploads"
    processed_dir: str = "./storage/processed"
    report_dir: str = "./storage/reports"
    max_upload_size_mb: int = 50

    # ── File Processing ───────────────────────────────────────────────────────
    allowed_extensions: List[str] = [
        ".txt", ".pdf", ".docx", ".doc",
        ".csv", ".json", ".md", ".eml",
        ".msg", ".log",
    ]
    chunk_size: int = 512          # tokens per chunk
    chunk_overlap: int = 64        # overlap between chunks

    # ── Investigation ─────────────────────────────────────────────────────────
    max_evidence_results: int = 20  # max Cognee search results per query
    evidence_score_threshold: float = 0.5

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    @property
    def is_development(self) -> bool:
        """True when running in development mode."""
        return self.environment.lower() == "development"

    @property
    def is_production(self) -> bool:
        """True when running in production mode."""
        return self.environment.lower() == "production"

    def cognee_dataset_name(self, case_id: str) -> str:
        """Return a namespaced Cognee dataset name for a given case."""
        return f"chronosintel_{case_id}"


# Singleton instance — import this everywhere
settings = Settings()
