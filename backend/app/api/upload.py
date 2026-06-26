from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def list_uploads() -> dict[str, list[str]]:
    return {"uploads": []}
