def build_summary_request(evidence: list[dict]) -> dict[str, object]:
    return {"task": "summarize_evidence", "evidence": evidence}
