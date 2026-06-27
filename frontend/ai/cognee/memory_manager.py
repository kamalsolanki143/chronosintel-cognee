class CogneeMemoryManager:
    def add_case_memory(self, case_id: str, content: str) -> dict[str, str]:
        return {"case_id": case_id, "status": "stored", "content": content}
