"""
ChronosIntel — Test Configuration
===================================
Provides shared fixtures:
  - Async test client
  - In-memory SQLite test database
  - Test case creation helpers

PATH SETUP
----------
`tests/` lives at the project root, while `app/` is inside `backend/`.
We manually add `backend/` and the project root to sys.path here so
that `app.*` and `ai.*` imports resolve correctly regardless of how
pytest is invoked (via IDE, CLI, or docker).
"""

from __future__ import annotations

# ── Path fix — MUST come before any app.* or ai.* imports ─────────────────
import sys
from pathlib import Path

# Project root: chronosintel-cognee/
_PROJECT_ROOT = Path(__file__).resolve().parent.parent
# Backend root: chronosintel-cognee/backend/
_BACKEND_ROOT = _PROJECT_ROOT / "backend"

for _p in [str(_BACKEND_ROOT), str(_PROJECT_ROOT)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)
# ─────────────────────────────────────────────────────────────────────────────

import asyncio
from typing import AsyncGenerator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from app.database.database import get_db
from app.database.models import Base
from app.main import app

# ── Test Database ─────────────────────────────────────────────────────────────
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)


@pytest_asyncio.fixture(scope="session")
def event_loop():
    """Create event loop for the entire test session."""
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session", autouse=True)
async def create_test_tables():
    """Create all DB tables at the start of the test session."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide a transactional test DB session that rolls back after each test."""
    async with TestSessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncGenerator[AsyncClient, None]:
    """
    Provide an AsyncClient with the test DB injected.
    All routes use the test database instead of production.
    """
    async def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as ac:
        yield ac

    app.dependency_overrides.clear()


# ── Helpers ───────────────────────────────────────────────────────────────────
async def create_test_case(
    client: AsyncClient,
    title: str = "Test Investigation Case",
) -> str:
    """Helper to create a case and return its ID."""
    resp = await client.post(
        "/api/investigation/cases",
        json={"title": title, "description": "Auto-created test case"},
    )
    assert resp.status_code == 201, resp.text
    return resp.json()["id"]
