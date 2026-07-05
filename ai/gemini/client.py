"""
ChronosIntel — Gemini Grounded Reasoning Client
================================================
Gemini is ONLY used for reasoning over pre-retrieved evidence.
It NEVER answers directly from user prompts without evidence context.

Every call follows this strict pattern:
  1. Evidence retrieved from Cognee
  2. Evidence passed to Gemini as context
  3. Gemini reasons over evidence and returns grounded answer

This prevents hallucination and ensures every conclusion is traceable.
"""

from __future__ import annotations

import logging
from typing import Any

import google.generativeai as genai
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
)

from app.config import settings
from app.utils.exceptions import GeminiError

logger = logging.getLogger(__name__)

# ── Gemini Configuration ──────────────────────────────────────────────────────
if settings.gemini_api_key:
    genai.configure(api_key=settings.gemini_api_key)
else:
    logger.warning("GEMINI_API_KEY not configured. Gemini calls will fail.")


class GeminiClient:
    """
    Grounded Gemini reasoning client.

    All methods require pre-retrieved evidence from Cognee.
    Gemini acts as a reasoning layer, not a knowledge source.

    Usage::

        client = GeminiClient()
        answer = await client.reason_over_evidence(
            query="Who knew about Project Phoenix before the leak?",
            evidence_items=[...],
        )
    """

    def __init__(self) -> None:
        self._model_name = settings.gemini_model
        self._model = genai.GenerativeModel(
            model_name=self._model_name,
            generation_config=genai.GenerationConfig(
                temperature=settings.gemini_temperature,
                max_output_tokens=settings.gemini_max_output_tokens,
            ),
            system_instruction=(
                "You are ChronosIntel, a forensic AI investigator. "
                "You ONLY answer based on the evidence provided to you. "
                "If the evidence is insufficient, clearly state that. "
                "Never invent facts, names, dates, or relationships. "
                "Always cite the evidence you used."
            ),
        )

    @retry(
        retry=retry_if_exception_type(Exception),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True,
    )
    async def reason_over_evidence(
        self,
        query: str,
        evidence_items: list[dict[str, Any]],
        additional_context: str | None = None,
    ) -> str:
        """
        Reason over retrieved evidence to answer an investigation query.

        Args:
            query:            The investigator's question.
            evidence_items:   List of evidence dicts from Cognee search.
            additional_context: Optional extra context (e.g. case description).

        Returns:
            Grounded answer string.

        Raises:
            GeminiError: If the Gemini API call fails.
        """
        if not evidence_items:
            return (
                "Insufficient evidence: No relevant information was found in the "
                "knowledge graph for this query. Please upload more documents or "
                "refine your question."
            )

        from ai.prompts.investigation import build_investigation_prompt

        prompt = build_investigation_prompt(
            query=query,
            evidence_items=evidence_items,
            additional_context=additional_context,
        )

        try:
            logger.info("Sending grounded query to Gemini | query='%s'", query[:80])
            response = await self._model.generate_content_async(prompt)
            answer = response.text.strip()
            logger.info("Gemini response received (%d chars)", len(answer))
            return answer

        except Exception as exc:
            logger.error("Gemini API error: %s", exc)
            raise GeminiError(reason=str(exc)) from exc

    async def synthesize_timeline(
        self,
        case_id: str,
        events: list[dict[str, Any]],
        query: str | None = None,
    ) -> str:
        """
        Synthesize a human-readable timeline narrative from extracted events.

        Args:
            case_id: The investigation case ID.
            events:  List of event dicts (title, event_time, description, participants).
            query:   Optional focus query for the synthesis.

        Returns:
            Narrative timeline string.
        """
        if not events:
            return "No temporal events were extracted for this case."

        from ai.prompts.timeline import build_timeline_prompt

        prompt = build_timeline_prompt(case_id=case_id, events=events, query=query)

        try:
            response = await self._model.generate_content_async(prompt)
            return response.text.strip()
        except Exception as exc:
            raise GeminiError(reason=str(exc)) from exc

    async def generate_report(
        self,
        case_id: str,
        case_title: str,
        evidence_items: list[dict[str, Any]],
        events: list[dict[str, Any]],
        entities: list[dict[str, Any]],
        query: str | None = None,
    ) -> str:
        """
        Generate a comprehensive investigation report.

        Args:
            case_id:        The investigation case ID.
            case_title:     Human-readable case title.
            evidence_items: Retrieved evidence from Cognee.
            events:         Extracted temporal events.
            entities:       Key entities involved.
            query:          Optional guiding investigation query.

        Returns:
            HTML-formatted report string.
        """
        from ai.prompts.report import build_report_prompt

        prompt = build_report_prompt(
            case_id=case_id,
            case_title=case_title,
            evidence_items=evidence_items,
            events=events,
            entities=entities,
            query=query,
        )

        try:
            response = await self._model.generate_content_async(prompt)
            return response.text.strip()
        except Exception as exc:
            raise GeminiError(reason=str(exc)) from exc

    async def extract_entities_from_text(self, text: str) -> list[dict[str, Any]]:
        """
        Use Gemini to extract named entities from a text chunk.

        Returns a list of entity dicts with keys: name, type, description.
        """
        prompt = (
            "Extract all named entities from the following text. "
            "Return a JSON array. Each item must have: "
            "name (string), type (person|organization|location|project|system|concept|datetime|other), "
            "description (brief, 1 sentence).\n\n"
            f"Text:\n{text[:4000]}\n\n"
            "JSON array only, no explanation:"
        )

        try:
            response = await self._model.generate_content_async(prompt)
            raw = response.text.strip()

            # Strip markdown code fences if present
            if raw.startswith("```"):
                raw = raw.split("```")[1]
                if raw.startswith("json"):
                    raw = raw[4:]

            import json
            entities: list[dict[str, Any]] = json.loads(raw)
            return entities if isinstance(entities, list) else []

        except Exception as exc:
            logger.warning("Entity extraction failed: %s", exc)
            return []

    async def chat_with_context(
        self,
        query: str,
        evidence_items: list[dict[str, Any]],
        conversation_history: list[dict[str, str]],
    ) -> str:
        """
        Continue a multi-turn chat with evidence-grounded context.

        Args:
            query:                 The latest investigator message.
            evidence_items:        Fresh evidence retrieved for this message.
            conversation_history:  Previous chat messages [{"role": ..., "content": ...}].

        Returns:
            Grounded assistant response.
        """
        # Build context from history + new evidence
        history_text = ""
        for msg in conversation_history[-10:]:  # keep last 10 messages
            role = "Investigator" if msg["role"] == "user" else "ChronosIntel"
            history_text += f"{role}: {msg['content']}\n"

        evidence_text = self._format_evidence_for_prompt(evidence_items)

        prompt = (
            f"Conversation history:\n{history_text}\n\n"
            f"New evidence retrieved from the knowledge graph:\n{evidence_text}\n\n"
            f"Investigator's new question: {query}\n\n"
            "Based ONLY on the conversation history and evidence above, provide a grounded response. "
            "If the evidence doesn't support an answer, say so clearly."
        )

        try:
            response = await self._model.generate_content_async(prompt)
            return response.text.strip()
        except Exception as exc:
            raise GeminiError(reason=str(exc)) from exc

    @staticmethod
    def _format_evidence_for_prompt(evidence_items: list[dict[str, Any]]) -> str:
        """Format evidence list as structured text for inclusion in prompts."""
        if not evidence_items:
            return "No evidence available."

        lines: list[str] = []
        for i, item in enumerate(evidence_items[:15], 1):
            content = (
                item.get("content")
                or item.get("text")
                or item.get("name")
                or str(item)
            )
            source = item.get("document_name") or item.get("source") or "Knowledge Graph"
            score = item.get("relevance_score") or item.get("score") or ""
            score_str = f" [relevance: {score:.2f}]" if isinstance(score, float) else ""
            lines.append(f"[Evidence {i}] Source: {source}{score_str}\n{str(content)[:500]}")

        return "\n\n".join(lines)


# ── Module-level singleton ────────────────────────────────────────────────────
gemini_client = GeminiClient()
