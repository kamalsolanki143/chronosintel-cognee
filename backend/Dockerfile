# ─────────────────────────────────────────────────────────────────────────────
# ChronosIntel — Production Backend Dockerfile
# Python 3.12-slim base, non-root user, layered caching
# ─────────────────────────────────────────────────────────────────────────────
FROM python:3.12-slim AS base

# Build arguments
ARG APP_PORT=8000
ARG APP_USER=chronos

# Environment
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# System dependencies (required by pypdf, python-magic, etc.)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libmagic1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# ─────────────────────────────────────────────────────────────────────────────
# Dependency layer — install Python deps separately for cache efficiency
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS deps

WORKDIR /install
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --prefix=/install/python-packages -r requirements.txt

# ─────────────────────────────────────────────────────────────────────────────
# Application layer
# ─────────────────────────────────────────────────────────────────────────────
FROM base AS app

# Create non-root user
RUN groupadd --gid 1001 ${APP_USER} && \
    useradd --uid 1001 --gid ${APP_USER} --shell /bin/bash --create-home ${APP_USER}

WORKDIR /app

# Copy installed packages
COPY --from=deps /install/python-packages /usr/local

# Copy application code
COPY . .

# Copy AI module (sibling directory)
# Note: in docker-compose this is mounted as a volume
# COPY ../ai /ai

# Create storage directories
RUN mkdir -p /storage/uploads /storage/processed /storage/reports /storage/cognee_db && \
    chown -R ${APP_USER}:${APP_USER} /app /storage

USER ${APP_USER}

EXPOSE ${APP_PORT}

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:${APP_PORT}/health || exit 1

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
