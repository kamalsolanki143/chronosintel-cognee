from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def evidence_items() -> dict[str, list[str]]:
    return {"evidence": []}
