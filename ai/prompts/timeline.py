"""
ChronosIntel — Timeline Prompt Templates
==========================================
Prompt builders for timeline synthesis queries.
"""

from __future__ import annotations

from typing import Any


def build_timeline_prompt(
    case_id: str,
    events: list[dict[str, Any]],
    query: str | None = None,
) -> str:
    """
    Build a prompt to synthesize a chronological timeline narrative.

    Args:
        case_id: The investigation case ID.
        events:  List of event dicts sorted by time.
        query:   Optional investigation focus for the narrative.

    Returns:
        Timeline synthesis prompt string.
    """
    focus = f"\nFocus: {query}" if query else ""
    events_block = _format_events_block(events)

    prompt = f"""You are ChronosIntel — a forensic timeline analyst.
Case ID: {case_id}{focus}

Synthesize the following extracted events into a clear, chronological narrative.

RULES:
- Present events in strict chronological order.
- Highlight significant temporal gaps (hours, days between events).
- Identify causal chains where evidence supports them.
- Note which events involve the same participants.
- Do NOT infer relationships not supported by the events.
- Use precise timestamps where available.

## Extracted Events
{events_block}

## Chronological Narrative
Write a clear, structured timeline narrative:"""

    return prompt


def _format_events_block(events: list[dict[str, Any]]) -> str:
    """Format events into a structured list for the prompt."""
    if not events:
        return "[No events extracted]"

    lines: list[str] = []
    for i, event in enumerate(events[:50], 1):
        title = event.get("title") or event.get("name") or f"Event {i}"
        time_str = event.get("event_time") or event.get("timestamp") or "Unknown time"
        desc = event.get("description") or ""
        participants = event.get("participants") or []
        part_str = f"\n  Participants: {', '.join(str(p) for p in participants)}" if participants else ""
        loc = event.get("location") or ""
        loc_str = f"\n  Location: {loc}" if loc else ""

        lines.append(
            f"[Event {i}] {time_str}\n"
            f"  {title}{part_str}{loc_str}"
            + (f"\n  {desc[:300]}" if desc else "")
        )

    return "\n\n".join(lines)
