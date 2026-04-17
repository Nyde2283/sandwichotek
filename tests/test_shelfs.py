import pytest
from typing import Any
from backend.db.models import Shelf

def test_empty_shelf_list_at_startup(client):
    response = client.get("/shelfs")
    assert response.status_code == 200
    assert response.json() == []

def test_get_shelf_by_id(client, session):
    data: list[dict[str, Any]] = [
        {"name": "fruits"},
        {"name": "fromages"}
    ]
    session.add_all(Shelf(**data_sample) for data_sample in data)
    session.commit()

    response = client.get("/shelfs/1")
    assert response.status_code == 200
    assert response.json() == {
        **data[0],
        "id": 1
    }

def test_singleton_shelf_list(client, session):
    data: dict[str, Any] = {"name": "fromages"}
    shelf = Shelf(**data)
    session.add(shelf)
    session.commit()

    response = client.get("/shelfs")
    assert response.status_code == 200
    assert response.json() == [{
        **data,
        "id": 1
    }]

def test_create_shelf(client):
    body = {"name": "fromages"}
    response = client.post("/shelfs", json=body)

    assert response.status_code == 200
    data = response.json()
    for key, expected_value in body.items():
        assert data[key] == expected_value
    assert "id" in data
