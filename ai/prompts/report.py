"""
ChronosIntel — Report Prompt Templates
========================================
Prompt builders for generating comprehensive investigation reports.
"""

from __future__ import annotations

from typing import Any


def build_report_prompt(
    case_id: str,
    case_title: str,
    evidence_items: list[dict[str, Any]],
    events: list[dict[str, Any]],
    entities: list[dict[str, Any]],
    query: str | None = None,
) -> str:
    """
    Build a prompt to generate a comprehensive investigation report.

    The report includes: executive summary, key findings,
    entity analysis, timeline, evidence trail, and conclusions.

    Args:
        case_id:        The investigation case ID.
        case_title:     Human-readable case title.
        evidence_items: Retrieved evidence from Cognee.
        events:         Extracted temporal events.
        entities:       Key entities involved.
        query:          Optional guiding investigation query.

    Returns:
        Report generation prompt string.
    """
    evidence_block = _format_evidence_section(evidence_items)
    events_block = _format_events_section(events)
    entities_block = _format_entities_section(entities)
    focus = f"\nInvestigation Focus: {query}" if query else ""

    prompt = f"""You are ChronosIntel — a forensic AI investigation system.
Generate a comprehensive, structured investigation report.

Case ID: {case_id}
Case Title: {case_title}{focus}

REPORT REQUIREMENTS:
1. Base EVERY claim on the provided evidence, events, and entities.
2. Never speculate beyond what the evidence supports.
3. Clearly distinguish direct evidence from inferred conclusions.
4. Include confidence levels for each major finding.
5. Format as a professional investigation report.

## Evidence Retrieved ({len(evidence_items)} items)
{evidence_block}

## Temporal Events ({len(events)} events)
{events_block}

## Key Entities ({len(entities)} entities)
{entities_block}

## Report Structure Required

### Executive Summary
[2-3 sentence overview of what the investigation found]

### Key Findings
[Numbered list of the most significant findings, each with evidence citations]

### Entity Analysis
[Key persons, organizations, and systems involved with their roles]

### Timeline of Events
[Chronological summary of significant events]

### Evidence Trail
[How the evidence chain supports the conclusions]

### Confidence Assessment
[Overall confidence in the findings: High/Medium/Low with rationale]

### Gaps & Recommendations
[What evidence is missing; what further investigation is recommended]

Generate the full report now:"""

    return prompt


def _format_evidence_section(evidence_items: list[dict[str, Any]]) -> str:
    """Format evidence for the report prompt."""
    if not evidence_items:
        return "[No evidence retrieved]"
    lines: list[str] = []
    for i, item in enumerate(evidence_items[:15], 1):
        content = item.get("content") or item.get("text") or item.get("name") or str(item)
        source = item.get("document_name") or item.get("source") or "Knowledge Graph"
        lines.append(f"E{i}. [{source}] {str(content)[:400]}")
    return "\n".join(lines)


def _format_events_section(events: list[dict[str, Any]]) -> str:
    """Format events for the report prompt."""
    if not events:
        return "[No events extracted]"
    lines: list[str] = []
    for i, e in enumerate(events[:20], 1):
        title = e.get("title") or e.get("name") or f"Event {i}"
        time = e.get("event_time") or e.get("timestamp") or "Unknown"
        lines.append(f"{i}. [{time}] {title}")
    return "\n".join(lines)


def _format_entities_section(entities: list[dict[str, Any]]) -> str:
    """Format entities for the report prompt."""
    if not entities:
        return "[No entities identified]"
    lines: list[str] = []
    for i, e in enumerate(entities[:20], 1):
        name = e.get("name") or e.get("label") or f"Entity {i}"
        etype = e.get("entity_type") or e.get("type") or "unknown"
        desc = e.get("description") or ""
        lines.append(f"{i}. {name} [{etype}]{' — ' + desc[:100] if desc else ''}")
    return "\n".join(lines)
