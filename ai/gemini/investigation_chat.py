def build_chat_request(message: str, case_context: dict) -> dict[str, object]:
    return {"message": message, "case_context": case_context}
