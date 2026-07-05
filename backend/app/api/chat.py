"""
ChronosIntel — Chat API Router
================================
Endpoints:
  POST /api/chat/ — Multi-turn investigation chat

Chat maintains conversation history while grounding every response
in freshly retrieved Cognee evidence. Gemini never answers directly
from user messages without an evidence context.
"""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.database import get_db
from app.database.schemas import ChatRequest, ChatResponse
from app.services.grounded_summary import grounded_summary_service
from app.utils.exceptions import CaseNotFoundError

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/",
    response_model=ChatResponse,
    status_code=status.HTTP_200_OK,
    summary="Chat with the investigation knowledge graph",
    description=(
        "Multi-turn chat interface grounded in Cognee evidence. "
        "Every response is backed by knowledge graph retrieval. "
        "Pass conversation_history to maintain context across turns."
    ),
)
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
) -> ChatResponse:
    """
    Send a chat message to ChronosIntel.

    Freshly retrieves evidence from Cognee for every message.
    Conversation history is included for multi-turn context.

    **Example messages:**
    - "What else do you know about Alice?"
    - "Can you explain the relationship between Bob and Project X?"
    - "Show me more evidence for that conclusion"
    """
    try:
        return await grounded_summary_service.chat(
            db=db,
            case_id=request.case_id,
            message=request.message,
            conversation_history=request.conversation_history,
            max_history=request.max_history,
        )
    except CaseNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        )
    except Exception as exc:
        logger.error("Chat failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat processing failed: {exc}",
        )
