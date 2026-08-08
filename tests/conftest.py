import pytest
from typing import Any
from sqlmodel import SQLModel, Session
from fastapi.testclient import TestClient
from backend import app
from backend.db import engine, get_session
from backend.db.models import *

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

@pytest.fixture(name="seeded_db")
def seeded_db(session):
    """Seed one row per SQL table model for integration tests."""
    test_data_set: dict[Type[SQLModel], list[dict[str, Any]]] = {
        Shelf: [
            {
                "name": "fruits et légumes",
            },
            {
                "name": "poisson",
            },
            {
                "name": "fromages",
            },
        ],
        Brand: [
            {
                "name": "auchan rouge",
            },
            {
                "name": "pouce",
            },
        ],
        Meal: [
            {
                "name": "norvégien",
                "veggy": False,
            },
            {
                "name": "comtois",
                "veggy": True,
            },
            {
                "name": "RSAv",
                "veggy": True,
            },
        ],
        Ingredient: [
            {
                "name": "tomate",
                "unit": "unit",
                "remark": "",
                "shelf_id": 1,
            },
            {
                "name": "saumon",
                "unit": "g",
                "remark": "",
                "shelf_id": 2,
                "brand_id": 2,
            },
            {
                "name": "comté",
                "unit": "g",
                "remark": "",
                "shelf_id": 3,
                "brand_id": 1,
            },
        ],
        RecipeItem: [
            {
                "quantity": 0.25,
                "meal_id": 1,
                "ingredient_id": 1,
            },
            {
                "quantity": 20.0,
                "meal_id": 1,
                "ingredient_id": 2,
            },
            {
                "quantity": 0.5,
                "meal_id": 2,
                "ingredient_id": 1,
            },
            {
                "quantity": 25.0,
                "meal_id": 2,
                "ingredient_id": 3,
            },
            {
                "quantity": 30.0,
                "meal_id": 3,
                "ingredient_id": 1,
            },
        ],
        MealProduction: [
            {
                "meal_id": 1,
                "date": date(2026, 4, 17),
                "quantity": 14,
            },
            {
                "meal_id": 2,
                "date": date(2026, 4, 17),
                "quantity": 14,
            },
        ],
    }

    for model in db_tables:
        try:
            test_data = test_data_set[model]
        except KeyError:
            raise Exception("Missing table in test data set")
        rows = [model(**data_sample) for data_sample in test_data]
        session.add_all(rows)
        session.commit()

    return test_data_set
