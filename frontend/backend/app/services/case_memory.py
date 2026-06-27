class CaseMemoryService:
    def remember(self, case_id: str, note: str) -> dict[str, str]:
        return {"case_id": case_id, "note": note}
