import os
from sqlmodel import SQLModel, Session, create_engine

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT")
DB_NAME = os.getenv("DB_NAME")

if None in (DB_USER, DB_PASSWORD, DB_HOST, DB_PORT, DB_NAME):
    raise Exception("ERROR: missing environment variable DB_USER, DB_PASSWORD, DB_HOST, DB_PORT or DB_NAME")

DATABASE_URL = f'postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}'

engine = create_engine(DATABASE_URL, echo=False)

def init_db():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
