class TemporalReasoningService:
    def order_events(self, events: list[dict]) -> list[dict]:
        return sorted(events, key=lambda event: event.get("timestamp", ""))
