"""
ChronosIntel — Investigation Prompt Templates
=============================================
Prompt builders for investigation queries.
Every prompt enforces grounded reasoning over provided evidence.
"""

from __future__ import annotations

from typing import Any


def build_investigation_prompt(
    query: str,
    evidence_items: list[dict[str, Any]],
    additional_context: str | None = None,
) -> str:
    """
    Build a grounded investigation prompt for Gemini.

    The prompt structure:
      1. System context
      2. Evidence block (from Cognee)
      3. Investigation query
      4. Instructions (cite evidence, acknowledge gaps)

    Args:
        query:              The investigator's question.
        evidence_items:     Retrieved evidence from Cognee.
        additional_context: Optional case description or metadata.

    Returns:
        Complete prompt string for Gemini.
    """
    evidence_block = _format_evidence_block(evidence_items)

    context_section = ""
    if additional_context:
        context_section = f"\n## Case Context\n{additional_context}\n"

    prompt = f"""You are ChronosIntel — a forensic AI investigation assistant.
Your role is to analyze evidence and answer investigation queries with precision.

CRITICAL RULES:
- Base your answer ONLY on the evidence provided below.
- If the evidence is insufficient, clearly state what is missing.
- Never invent facts, names, dates, communications, or relationships.
- Always cite which evidence item supports each claim (e.g., [Evidence 3]).
- If multiple evidence items conflict, flag the contradiction explicitly.
- Use precise language. Avoid speculation.
{context_section}
## Retrieved Evidence from Knowledge Graph
{evidence_block}

## Investigation Query
{query}

## Your Analysis
Provide a structured, grounded analysis. Format:

**Finding:** [Direct answer to the query, or "Insufficient evidence"]

**Supporting Evidence:**
[For each key claim, cite the evidence item that supports it]

**Confidence:** [High / Medium / Low] — [brief justification]

**Gaps / Limitations:**
[What evidence is missing or ambiguous]

Analysis:"""

    return prompt


def _format_evidence_block(evidence_items: list[dict[str, Any]]) -> str:
    """Format evidence items into a structured block for the prompt."""
    if not evidence_items:
        return "[NO EVIDENCE RETRIEVED — Cannot answer this query]"

    lines: list[str] = []
    for i, item in enumerate(evidence_items[:20], 1):
        content = (
            item.get("content")
            or item.get("text")
            or item.get("name")
            or str(item)
        )
        source = item.get("document_name") or item.get("source") or "Knowledge Graph"
        timestamp = item.get("timestamp") or item.get("event_time") or ""
        ts_str = f"\n  Time: {timestamp}" if timestamp else ""

        lines.append(
            f"[Evidence {i}]\n"
            f"  Source: {source}{ts_str}\n"
            f"  Content: {str(content)[:600]}"
        )

    return "\n\n".join(lines)
