def build_entity_extraction_request(text: str) -> dict[str, str]:
    return {"task": "extract_entities", "text": text}
