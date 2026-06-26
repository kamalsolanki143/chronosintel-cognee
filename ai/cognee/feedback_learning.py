class FeedbackLearning:
    def record(self, case_id: str, feedback: str) -> dict[str, str]:
        return {"case_id": case_id, "status": "recorded", "feedback": feedback}
