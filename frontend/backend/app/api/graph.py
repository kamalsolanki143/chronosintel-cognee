from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def graph_summary() -> dict[str, int]:
    return {"nodes": 0, "edges": 0}
