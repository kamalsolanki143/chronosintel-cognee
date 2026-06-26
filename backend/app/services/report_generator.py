class ReportGenerator:
    def generate(self, case_id: str) -> dict[str, str]:
        return {"case_id": case_id, "status": "draft"}
