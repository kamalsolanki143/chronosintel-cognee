class EvidenceChainService:
    def trace(self, evidence_id: str) -> list[dict[str, str]]:
        return [{"evidence_id": evidence_id, "source": "placeholder"}]
