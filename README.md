# ChronosIntel

AI-powered temporal investigation platform that transforms enterprise evidence into a time-aware knowledge graph using Cognee for explainable investigations.

## Overview

ChronosIntel helps investigators upload enterprise data, extract entities and events, build evidence chains, replay timelines, and generate grounded reports. The project is organized into frontend, backend, AI orchestration, datasets, storage, tests, assets, and documentation.

## Project Structure

- `frontend/` - React user interface for cases, investigation chat, timelines, graphs, and reports.
- `backend/` - FastAPI service layer for ingestion, investigation APIs, evidence, reports, and memory.
- `ai/` - Cognee and Gemini integrations, prompts, and graph reasoning helpers.
- `docs/` - Architecture, workflow, deployment, and presentation notes.
- `datasets/` - Sample case and updated evidence folders.
- `storage/` - Runtime upload, processed, report, and graph export folders.
- `tests/` - Backend, frontend, and AI test suites.
- `assets/` - Logo, screenshots, icons, demo video, and presentation assets.

## Quick Start

```bash
cp .env.example .env
docker compose up --build
```

Backend-only setup:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Frontend-only setup:

```bash
cd frontend
npm install
npm run dev
```
