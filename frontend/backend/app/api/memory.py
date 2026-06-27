from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def memory_status() -> dict[str, str]:
    return {"status": "ready"}
