class GraphBuilder:
    def build(self, entities: list[dict], relationships: list[dict]) -> dict[str, list[dict]]:
        return {"nodes": entities, "edges": relationships}
