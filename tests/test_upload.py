"""
ChronosIntel — Upload & Case API Tests
"""

from __future__ import annotations

import pytest
from httpx import AsyncClient

from tests.conftest import create_test_case


# ── Case CRUD ─────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_case(client: AsyncClient) -> None:
    """POST /api/investigation/cases should create a case and return its ID."""
    resp = await client.post(
        "/api/investigation/cases",
        json={
            "title": "Project Phoenix Leak",
            "description": "Investigating the source of the leak",
            "investigator": "Jane Smith",
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "id" in data
    assert data["title"] == "Project Phoenix Leak"
    assert data["status"] == "created"
    assert data["cognee_dataset"].startswith("chronosintel_")


@pytest.mark.asyncio
async def test_get_case(client: AsyncClient) -> None:
    """GET /api/investigation/cases/{id} should return case details."""
    case_id = await create_test_case(client, "Test Case for GET")
    resp = await client.get(f"/api/investigation/cases/{case_id}")
    assert resp.status_code == 200
    assert resp.json()["id"] == case_id


@pytest.mark.asyncio
async def test_get_nonexistent_case_returns_404(client: AsyncClient) -> None:
    """GET /api/investigation/cases/unknown should return 404."""
    resp = await client.get("/api/investigation/cases/nonexistent-id-12345")
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_list_cases(client: AsyncClient) -> None:
    """GET /api/investigation/cases should return paginated list."""
    # Create 2 cases
    await create_test_case(client, "List Test Case 1")
    await create_test_case(client, "List Test Case 2")

    resp = await client.get("/api/investigation/cases?page=1&page_size=10")
    assert resp.status_code == 200
    data = resp.json()
    assert "cases" in data
    assert "total" in data
    assert isinstance(data["cases"], list)


# ── Upload ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_upload_txt_file(client: AsyncClient) -> None:
    """POST /api/upload/ should accept a .txt file and create a document record."""
    case_id = await create_test_case(client, "Upload Test Case")

    file_content = b"On January 15, John Doe sent an email to Alice regarding Project Phoenix."
    resp = await client.post(
        "/api/upload/",
        data={
            "case_id": case_id,
            "build_graph": "false",  # Skip graph build in unit tests
        },
        files={"files": ("test_email.txt", file_content, "text/plain")},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["total_uploaded"] == 1
    assert data["total_failed"] == 0
    assert len(data["uploaded"]) == 1
    assert data["uploaded"][0]["filename"] == "test_email.txt"


@pytest.mark.asyncio
async def test_upload_unsupported_file_type(client: AsyncClient) -> None:
    """POST /api/upload/ should reject unsupported file types."""
    case_id = await create_test_case(client, "Unsupported File Test")

    resp = await client.post(
        "/api/upload/",
        data={"case_id": case_id, "build_graph": "false"},
        files={"files": ("malware.exe", b"binary content", "application/octet-stream")},
    )
    assert resp.status_code == 201  # Batch returns 201 but with failures
    data = resp.json()
    assert data["total_uploaded"] == 0
    assert data["total_failed"] == 1


@pytest.mark.asyncio
async def test_upload_to_nonexistent_case_returns_404(client: AsyncClient) -> None:
    """POST /api/upload/ should return 404 for unknown case_id."""
    resp = await client.post(
        "/api/upload/",
        data={"case_id": "nonexistent-case-id", "build_graph": "false"},
        files={"files": ("test.txt", b"some content", "text/plain")},
    )
    assert resp.status_code == 404


@pytest.mark.asyncio
async def test_list_documents_for_case(client: AsyncClient) -> None:
    """GET /api/upload/{case_id} should return list of uploaded documents."""
    case_id = await create_test_case(client, "List Documents Test")

    # Upload a file first
    await client.post(
        "/api/upload/",
        data={"case_id": case_id, "build_graph": "false"},
        files={"files": ("doc.txt", b"test document content", "text/plain")},
    )

    resp = await client.get(f"/api/upload/{case_id}")
    assert resp.status_code == 200
    docs = resp.json()
    assert isinstance(docs, list)
    assert len(docs) >= 1


# ── Memory ────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_memory_state(client: AsyncClient) -> None:
    """GET /api/memory/{case_id} should return memory state."""
    case_id = await create_test_case(client, "Memory State Test")
    resp = await client.get(f"/api/memory/{case_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["case_id"] == case_id
    assert "document_count" in data
    assert "entity_count" in data
    assert "versions" in data


@pytest.mark.asyncio
async def test_create_version_snapshot(client: AsyncClient) -> None:
    """POST /api/memory/{case_id}/snapshot should create a version."""
    case_id = await create_test_case(client, "Snapshot Test")
    resp = await client.post(
        f"/api/memory/{case_id}/snapshot",
        params={"label": "Initial state", "description": "Before any uploads"},
    )
    assert resp.status_code == 201
    data = resp.json()
    assert data["version_number"] == 1
    assert data["label"] == "Initial state"


# ── Evidence ──────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_evidence_chain_empty(client: AsyncClient) -> None:
    """GET /api/evidence/{case_id} should return empty chain for new case."""
    case_id = await create_test_case(client, "Evidence Test")
    resp = await client.get(f"/api/evidence/{case_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["case_id"] == case_id
    assert data["total_evidence"] == 0
    assert data["evidence_chain"] == []


# ── Timeline ──────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_timeline_empty(client: AsyncClient) -> None:
    """GET /api/timeline/{case_id} should return empty timeline for new case."""
    case_id = await create_test_case(client, "Timeline Test")
    resp = await client.get(f"/api/timeline/{case_id}")
    assert resp.status_code == 200
    data = resp.json()
    assert data["case_id"] == case_id
    assert data["total_events"] == 0


# ── Feedback ──────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_submit_feedback(client: AsyncClient) -> None:
    """POST /api/feedback/ should accept feedback without corrections."""
    case_id = await create_test_case(client, "Feedback Test")

    resp = await client.post(
        "/api/feedback/",
        json={
            "case_id": case_id,
            "query": "Who sent the email?",
            "answer": "John Doe",
            "rating": 4,
            "feedback_text": "Good answer but missing context",
            "evidence_ids": [],
        },
    )
    assert resp.status_code == 201
    data = resp.json()
    assert "feedback_id" in data
    assert data["case_id"] == case_id
