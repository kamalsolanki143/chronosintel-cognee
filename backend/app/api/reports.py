from fastapi import APIRouter

router = APIRouter()


@router.get("/")
def reports() -> dict[str, list[str]]:
    return {"reports": []}
