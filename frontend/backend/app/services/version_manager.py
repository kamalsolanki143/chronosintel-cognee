class VersionManager:
    def create_version(self, case_id: str) -> dict[str, str]:
        return {"case_id": case_id, "version": "v1"}
