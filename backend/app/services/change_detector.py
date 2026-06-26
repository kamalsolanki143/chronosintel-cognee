class ChangeDetector:
    def detect(self, previous: dict, current: dict) -> dict[str, list[str]]:
        return {"added": [], "removed": [], "changed": []}
