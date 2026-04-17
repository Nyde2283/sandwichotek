from fastapi import APIRouter
from fastapi.responses import FileResponse
from sqlalchemy_data_model_visualizer import generate_data_model_diagram, add_web_font_and_interactivity
from ..db.models import db_tables

router = APIRouter(
    tags=["Misc"]
)

@router.get("/")
@router.get("/ping")
def ping():
    return "pong"

@router.get("/schema_diagram", response_class=FileResponse)
def get_schema_diagram():
    filename = "/tmp/schema_diagram"
    generate_data_model_diagram(db_tables, filename)
    filename += ".svg"
    add_web_font_and_interactivity(filename, filename)

    return FileResponse(filename)
