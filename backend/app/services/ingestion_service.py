class IngestionService:
    def ingest(self, case_id: str, paths: list[str]) -> dict[str, object]:
        return {"case_id": case_id, "files": paths, "status": "queued"}
