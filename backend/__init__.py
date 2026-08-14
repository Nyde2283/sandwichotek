import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .db import init_db
from .db.models import *
from .routers import misc, shelfs, brands, meals, ingredients, meal_productions, shopping_lists

APP_HOST = os.getenv("APP_HOST")
APP_PORT = os.getenv("APP_PORT")

if None in (APP_HOST, APP_PORT):
    raise Exception("ERROR: missing environment variable APP_HOST or APP_PORT")

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield

app = FastAPI(
    lifespan=lifespan,
    swagger_ui_parameters={"operationsSorter": "method"}
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # En prod, remplacer par l'url du frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.openapi_schema = None # disable caching of the OpenAPI schema to avoid issues with reloading in development

app.include_router(misc.router)
app.include_router(shelfs.router)
app.include_router(brands.router)
app.include_router(meals.router)
app.include_router(ingredients.router)
app.include_router(meal_productions.router)
app.include_router(shopping_lists.router)

def run_server():
    if APP_HOST is not None and APP_PORT is not None:
        uvicorn.run(app, host=APP_HOST, port=int(APP_PORT))

def run_dev_server(app_debug_path: str = "backend:app"):
    if APP_HOST is not None and APP_PORT is not None:
        uvicorn.run(app_debug_path, host=APP_HOST, port=int(APP_PORT), reload=True)
