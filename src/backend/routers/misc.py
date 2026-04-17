from fastapi import APIRouter

router = APIRouter(
    tags=["Misc"]
)

@router.get("/")
@router.get("/ping")
def ping():
    return "pong"
