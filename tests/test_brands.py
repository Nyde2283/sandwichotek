import pytest
from typing import Any
from backend.db.models import Brand

# ---------------------------------------------------------------------------- #
#                                     POST                                     #
# ---------------------------------------------------------------------------- #

def test_create_brand(client, session):
    body = {"name": "pouce"}
    response = client.post("/brands", json=body)

    assert response.status_code == 200
    data = response.json()
    assert response.json() == {
        **body,
        "id": 1
    }
    db_brand = session.get(Brand, 1)
    assert db_brand != None
    assert db_brand.model_dump() == {
        **body,
        "id": 1
    }

# ---------------------------------------------------------------------------- #
#                                      GET                                     #
# ---------------------------------------------------------------------------- #

def test_get_brand_list_on_empty_db(client):
    response = client.get("/brands")
    assert response.status_code == 200
    assert response.json() == []

def test_get_brand_list(client, session, seeded_db):
    response = client.get("/brands")
    assert response.status_code == 200
    assert response.json() == [{
        **brand,
        "id": i + 1
    } for i, brand in enumerate(seeded_db[Brand])]

def test_get_brand_by_id_on_empty_db(client):
    response = client.get("/brands/1")
    assert response.status_code == 404

def test_get_brand_by_id(client, session, seeded_db):
    for i in range(len(seeded_db[Brand])):
        response = client.get(f"/brands/{i + 1}")
        assert response.status_code == 200
        assert response.json() == {
            **seeded_db[Brand][i],
            "id": i + 1
        }

# ---------------------------------------------------------------------------- #
#                                      PUT                                     #
# ---------------------------------------------------------------------------- #

def test_update_brand_by_id_on_empty_db(client):
    body = {"name": "pouce"}
    response = client.put("/brands/1", json=body)

    assert response.status_code == 404

def test_update_brand_by_id(client, session, seeded_db):
    body = {"name": "p0uc3"}
    response = client.put("/brands/2", json=body)

    assert response.status_code == 200
    assert response.json() == {
        **body,
        "id": 2
    }
    db_brand = session.get(Brand, 2)
    assert db_brand != None
    assert db_brand.model_dump() == {
        **body,
        "id": 2
    }

# ---------------------------------------------------------------------------- #
#                                    DELETE                                    #
# ---------------------------------------------------------------------------- #

def test_delete_brand_by_id_on_empty_db(client, session):
    assert session.get(Brand, 1) == None
    response = client.delete("/brands/1")
    assert response.status_code == 404

def test_delete_brand_by_id(client, session, seeded_db):
    response = client.delete("/brands/2")

    assert response.status_code == 200
    assert session.get(Brand, 2) == None
