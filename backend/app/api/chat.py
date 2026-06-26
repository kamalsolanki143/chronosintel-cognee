from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def chat_status() -> dict[str, str]:
    return {"status": "ready"}
