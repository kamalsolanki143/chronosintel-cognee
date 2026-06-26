from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def timeline_events() -> dict[str, list[str]]:
    return {"events": []}
