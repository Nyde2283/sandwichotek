import os
import uvicorn
from fastapi import FastAPI

APP_HOST = os.getenv("APP_HOST")
APP_PORT = os.getenv("APP_PORT")
if APP_PORT is None:
    APP_PORT = os.getenv("TEST_APP_PORT")

if None in (APP_HOST, APP_PORT):
    raise Exception("ERROR: missing environment variable APP_HOST or APP_PORT")

app = FastAPI()

def run_server():
    if APP_HOST is not None and APP_PORT is not None:
        uvicorn.run(app, host=APP_HOST, port=int(APP_PORT))

def run_dev_server(app_debug_path: str = "backend:app"):
    if APP_HOST is not None and APP_PORT is not None:
        uvicorn.run(app_debug_path, host=APP_HOST, port=int(APP_PORT), reload=True)
