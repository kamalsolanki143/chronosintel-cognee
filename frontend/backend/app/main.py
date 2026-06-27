from fastapi import FastAPI

from app.api import chat, evidence, feedback, graph, investigation, memory, reports, timeline, upload
from app.api import case_updates
from app.config import settings

app = FastAPI(title=settings.app_name)

app.include_router(upload.router, prefix="/api/upload", tags=["upload"])
app.include_router(investigation.router, prefix="/api/investigation", tags=["investigation"])
app.include_router(graph.router, prefix="/api/graph", tags=["graph"])
app.include_router(timeline.router, prefix="/api/timeline", tags=["timeline"])
app.include_router(evidence.router, prefix="/api/evidence", tags=["evidence"])
app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(reports.router, prefix="/api/reports", tags=["reports"])
app.include_router(memory.router, prefix="/api/memory", tags=["memory"])
app.include_router(feedback.router, prefix="/api/feedback", tags=["feedback"])
app.include_router(case_updates.router, prefix="/api/case-updates", tags=["case-updates"])


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}
