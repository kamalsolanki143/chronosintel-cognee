from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def case_update_status() -> dict[str, str]:
    return {"status": "ready"}
