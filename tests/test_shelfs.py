from fastapi import status
from backend.db.models import Shelf

# ---------------------------------------------------------------------------- #
#                                     POST                                     #
# ---------------------------------------------------------------------------- #

def test_create_shelf(client, session):
    body = {"name": "fromages"}
    response = client.post("/shelves", json=body)

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
    response = client.get("/shelves")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []

def test_search_shelves_by_name_on_empty_db(client):
    response = client.get("/shelves?q=fromages")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []

def test_search_shelves_by_id_on_empty_db(client):
    response = client.get("/shelves?q=1")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []

def test_get_shelf_list(client, seeded_db):
    response = client.get("/shelves")
    assert response.status_code == status.HTTP_200_OK

    for i, shelf in enumerate(seeded_db[Shelf]):
        assert {
            **shelf,
            "id": i + 1
        }.items() <= response.json()[i].items()
        assert response.json()[i]["ingredients"] != []

def test_search_shelves_by_id(client, seeded_db):
    response = client.get("/shelves?q=1")
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1
    assert {
        **seeded_db[Shelf][0],
        "id": 1
    }.items() <= response.json()[0].items()

def test_search_shelves_by_name(client, seeded_db):
    response = client.get("/shelves?q=fromages")
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1
    assert {
        **seeded_db[Shelf][2],
        "id": 3
    }.items() <= response.json()[0].items()

def test_get_shelf_by_id_on_empty_db(client):
    response = client.get("/shelves/1")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Shelf not found"}

def test_get_shelf_by_id(client, seeded_db):
    for i, shelf in enumerate(seeded_db[Shelf]):
        response = client.get(f"/shelves/{i + 1}")
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
    response = client.put("/shelves/1", json=body)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Shelf not found"}

def test_update_shelf_by_id(client, session, seeded_db):
    body = {"name": "fr0m@g3"}
    response = client.put("/shelves/3", json=body)

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
    response = client.delete("/shelves/1")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Shelf not found"}

def test_delete_shelf_by_id_conflict_foreign_key(client, session, seeded_db):
    response = client.delete("/shelves/3")

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    assert response.json()["detail"]["msg"] == "Foreign key violation ! Check 'blocking_ingredients' field"
    assert response.json()["detail"]["blocking_ingredients"] != []
    assert response.json()["detail"]["original_error"] != None
    assert session.get(Shelf, 3) != None

def test_delete_shelf_by_id(client, session, seeded_db):
    # Create new object which is not referenced
    shelf = Shelf(name="to_delete")
    session.add(shelf)
    session.commit()
    shelf_id = shelf.id

    response = client.delete(f"/shelves/{shelf.id}")

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert session.get(Shelf, shelf_id) == None
