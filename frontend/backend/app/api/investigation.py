from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def investigation_status() -> dict[str, str]:
    return {"status": "ready"}
