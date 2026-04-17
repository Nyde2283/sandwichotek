import pytest
from sqlmodel import SQLModel, Session
from fastapi.testclient import TestClient
from backend import app
from backend.db import engine, get_session

client = TestClient(app)

@pytest.fixture(name="session")
def db_session():
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        yield session

@pytest.fixture(name="client")
def get_client(session):
    def get_session_override():
        yield session
    app.dependency_overrides[get_session] = get_session_override
    client = TestClient(app)
    yield client
    app.dependency_overrides.clear()
