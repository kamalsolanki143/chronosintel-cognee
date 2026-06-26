from pydantic import BaseModel


class CaseSummary(BaseModel):
    id: str
    title: str
    status: str = "open"
