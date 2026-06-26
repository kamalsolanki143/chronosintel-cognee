def build_grounded_reasoning_request(question: str, evidence: list[dict]) -> dict[str, object]:
    return {"question": question, "evidence": evidence}
