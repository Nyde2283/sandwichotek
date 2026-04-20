from fastapi import status
from backend.db.models import Shelf

# ---------------------------------------------------------------------------- #
#                                     POST                                     #
# ---------------------------------------------------------------------------- #

def test_create_shelf(client, session):
    body = {"name": "fromages"}
    response = client.post("/shelfs", json=body)

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {
        **body,
        "ingredients": [],
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
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []

def test_get_shelf_list(client, seeded_db):
    response = client.get("/shelfs")
    assert response.status_code == status.HTTP_200_OK

    for i, shelf in enumerate(seeded_db[Shelf]):
        assert {
            **shelf,
            "id": i + 1
        }.items() <= response.json()[i].items()
        assert response.json()[i]["ingredients"] != []

def test_get_shelf_by_id_on_empty_db(client):
    response = client.get("/shelfs/1")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_get_shelf_by_id(client, seeded_db):
    for i, shelf in enumerate(seeded_db[Shelf]):
        response = client.get(f"/shelfs/{i + 1}")
        assert response.status_code == status.HTTP_200_OK
        assert {
            **shelf,
            "id": i + 1
        }.items() <= response.json().items()

# ---------------------------------------------------------------------------- #
#                                      PUT                                     #
# ---------------------------------------------------------------------------- #

def test_update_shelf_by_id_on_empty_db(client):
    body = {"name": "fromages"}
    response = client.put("/shelfs/1", json=body)

    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_update_shelf_by_id(client, session, seeded_db):
    body = {"name": "fr0m@g3"}
    response = client.put("/shelfs/3", json=body)

    assert response.status_code == status.HTTP_200_OK
    assert {
        **body,
        "id": 3
    }.items() <= response.json().items()
    db_shelf = session.get(Shelf, 3)
    assert db_shelf != None
    assert db_shelf.name == body["name"]

# ---------------------------------------------------------------------------- #
#                                    DELETE                                    #
# ---------------------------------------------------------------------------- #

def test_delete_shelf_by_id_on_empty_db(client, session):
    assert session.get(Shelf, 1) == None
    response = client.delete("/shelfs/1")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_delete_shelf_by_id_conflict_foreign_key(client, session, seeded_db):
    response = client.delete("/shelfs/3")

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    assert response.json()["detail"]["msg"] == "Foreign key violation ! Check 'blocking ingredients' field"
    assert response.json()["detail"]["blocking ingredients"] != []
    assert response.json()["detail"]["original error"] != None
    assert session.get(Shelf, 3) != None

def test_delete_shelf_by_id(client, session, seeded_db):
    # Create new object which is not referenced
    shelf = Shelf(name="to_delete")
    session.add(shelf)
    session.commit()
    shelf_id = shelf.id

    response = client.delete(f"/shelfs/{shelf.id}")

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert session.get(Shelf, shelf_id) == None
