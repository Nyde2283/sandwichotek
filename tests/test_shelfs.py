import pytest
from typing import Any
from backend.db.models import Shelf

def test_empty_shelf_list_at_startup(client):
    response = client.get("/shelfs")
    assert response.status_code == 200
    assert response.json() == []

def test_get_shelf_by_id(client, session, seeded_db):
    response = client.get("/shelfs/1")
    assert response.status_code == 200
    assert response.json() == {
        **seeded_db[Shelf][0],
        "id": 1
    }

def test_get_shelf_list(client, session, seeded_db):
    response = client.get("/shelfs")
    assert response.status_code == 200
    assert response.json() == [{
        **shelf,
        "id": id + 1
    } for id, shelf in enumerate(seeded_db[Shelf])]

def test_create_shelf(client):
    body = {"name": "fromages"}
    response = client.post("/shelfs", json=body)

    assert response.status_code == 200
    data = response.json()
    for key, expected_value in body.items():
        assert data[key] == expected_value
    assert "id" in data
