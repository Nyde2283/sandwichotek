from fastapi import APIRouter
from fastapi.responses import FileResponse
from sqlalchemy_data_model_visualizer import generate_data_model_diagram, add_web_font_and_interactivity
from cairosvg import svg2png
from ..db.models import db_tables

router = APIRouter(
    tags=["Misc"]
)

@router.get("/")
@router.get("/ping")
def ping():
    """Endpoint to check if the server is running."""
    return "pong"

@router.get("/schema_diagram", response_class=FileResponse)
def get_schema_diagram():
    """Endpoint to get the database schema diagram as a PNG image."""
    filename = "/tmp/schema_diagram"
    generate_data_model_diagram(db_tables, filename)
    filename += ".svg"
    add_web_font_and_interactivity(filename, filename)
    png_file = filename[:-3] + "png"
    svg2png(url=filename, write_to=png_file, dpi=200)

    return FileResponse(png_file)

@router.get("/favicon.ico", response_class=FileResponse)
def get_favicon():
    """Endpoint to serve the favicon."""
    return FileResponse("assets/sandwich.png")
