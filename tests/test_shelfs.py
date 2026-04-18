import pytest
from typing import Any
from backend.db.models import Shelf

# ---------------------------------------------------------------------------- #
#                                     POST                                     #
# ---------------------------------------------------------------------------- #

def test_create_shelf(client, session):
    body = {"name": "fromages"}
    response = client.post("/shelfs", json=body)

    assert response.status_code == 200
    data = response.json()
    assert response.json() == {
        **body,
        "id": 1
    }
    db_shelf = session.get(Shelf, 1)
    assert db_shelf != None
    assert db_shelf.model_dump() == {
        **body,
        "id": 1
    }

# ---------------------------------------------------------------------------- #
#                                      GET                                     #
# ---------------------------------------------------------------------------- #

def test_get_shelf_list_on_empty_db(client):
    response = client.get("/shelfs")
    assert response.status_code == 200
    assert response.json() == []

def test_get_shelf_list(client, session, seeded_db):
    response = client.get("/shelfs")
    assert response.status_code == 200
    assert response.json() == [{
        **shelf,
        "id": i + 1
    } for i, shelf in enumerate(seeded_db[Shelf])]

def test_get_shelf_by_id_on_empty_db(client):
    response = client.get("/shelfs/1")
    assert response.status_code == 404

def test_get_shelf_by_id(client, session, seeded_db):
    for i in range(len(seeded_db[Shelf])):
        response = client.get(f"/shelfs/{i + 1}")
        assert response.status_code == 200
        assert response.json() == {
            **seeded_db[Shelf][i],
            "id": i + 1
        }

# ---------------------------------------------------------------------------- #
#                                      PUT                                     #
# ---------------------------------------------------------------------------- #

def test_update_shelf_by_id_on_empty_db(client):
    body = {"name": "fromages"}
    response = client.put("/shelfs/1", json=body)

    assert response.status_code == 404

def test_update_shelf_by_id(client, session, seeded_db):
    body = {"name": "fr0m@g3"}
    response = client.put("/shelfs/3", json=body)

    assert response.status_code == 200
    assert response.json() == {
        **body,
        "id": 3
    }
    db_shelf = session.get(Shelf, 3)
    assert db_shelf != None
    assert db_shelf.model_dump() == {
        **body,
        "id": 3
    }

# ---------------------------------------------------------------------------- #
#                                    DELETE                                    #
# ---------------------------------------------------------------------------- #

def test_delete_shelf_by_id_on_empty_db(client, session):
    assert session.get(Shelf, 1) == None
    response = client.delete("/shelfs/1")
    assert response.status_code == 404

def test_delete_shelf_by_id(client, session, seeded_db):
    response = client.delete("/shelfs/3")

    assert response.status_code == 200
    assert session.get(Shelf, 3) == None
