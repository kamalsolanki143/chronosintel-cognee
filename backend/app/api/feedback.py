from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def feedback_status() -> dict[str, str]:
    return {"status": "ready"}
