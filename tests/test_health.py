"""
ChronosIntel — Health Endpoint Tests
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check_returns_ok(client: AsyncClient) -> None:
    """GET /health should return 200 with status=ok."""
    resp = await client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["service"] == "ChronosIntel"
    assert "environment" in data
    assert "services" in data


@pytest.mark.asyncio
async def test_health_check_has_service_statuses(client: AsyncClient) -> None:
    """Health check should report individual service statuses."""
    resp = await client.get("/health")
    data = resp.json()
    services = data["services"]
    assert "database" in services
    assert "cognee" in services
    assert "gemini" in services


@pytest.mark.asyncio
async def test_docs_available_in_dev(client: AsyncClient) -> None:
    """FastAPI /docs should be accessible in development mode."""
    resp = await client.get("/docs")
    # May redirect or return HTML — just check it's not 404
    assert resp.status_code in (200, 307)
