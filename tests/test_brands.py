from fastapi import status
from backend.db.models import Brand

# ---------------------------------------------------------------------------- #
#                                     POST                                     #
# ---------------------------------------------------------------------------- #

def test_create_brand(client, session):
    body = {"name": "pouce"}
    response = client.post("/brands", json=body)

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {
        **body,
        "ingredients": [],
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
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []

def test_search_brands_by_name_on_empty_db(client):
    response = client.get("/brands?q=pouce")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []

def test_search_brands_by_id_on_empty_db(client):
    response = client.get("/brands?q=1")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []

def test_get_brand_list(client, session, seeded_db):
    response = client.get("/brands")
    assert response.status_code == status.HTTP_200_OK

    for i, brand in enumerate(seeded_db[Brand]):
        assert {
            **brand,
            "id": i + 1
        }.items() <= response.json()[i].items()
        assert response.json()[i]["ingredients"] != []

def test_search_brands_by_id(client, seeded_db):
    response = client.get("/brands?q=1")
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1
    assert {
        **seeded_db[Brand][0],
        "id": 1
    }.items() <= response.json()[0].items()

def test_search_brands_by_name(client, seeded_db):
    response = client.get("/brands?q=pouce")
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1
    assert {
        **seeded_db[Brand][1],
        "id": 2
    }.items() <= response.json()[0].items()

def test_get_brand_by_id_on_empty_db(client):
    response = client.get("/brands/1")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Brand not found"}

def test_get_brand_by_id(client, seeded_db):
    for i, brand in enumerate(seeded_db[Brand]):
        response = client.get(f"/brands/{i + 1}")
        assert response.status_code == status.HTTP_200_OK
        assert {
            **brand,
            "id": i + 1
        }.items() <= response.json().items()

# ---------------------------------------------------------------------------- #
#                                      PUT                                     #
# ---------------------------------------------------------------------------- #

def test_update_brand_by_id_on_empty_db(client):
    body = {"name": "pouce"}
    response = client.put("/brands/1", json=body)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Brand not found"}

def test_update_brand_by_id(client, session, seeded_db):
    body = {"name": "p0uc3"}
    response = client.put("/brands/2", json=body)

    assert response.status_code == status.HTTP_200_OK
    assert {
        **body,
        "id": 2
    }.items() <= response.json().items()
    db_brand = session.get(Brand, 2)
    assert db_brand != None
    assert db_brand.name == body["name"]

# ---------------------------------------------------------------------------- #
#                                    DELETE                                    #
# ---------------------------------------------------------------------------- #

def test_delete_brand_by_id_on_empty_db(client, session):
    assert session.get(Brand, 1) == None
    response = client.delete("/brands/1")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Brand not found"}

def test_delete_brand_by_id_conflict_foreign_key(client, session, seeded_db):
    response = client.delete("/brands/2")

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    assert response.json()["detail"]["msg"] == "Foreign key violation ! Check 'blocking_ingredients' field"
    assert response.json()["detail"]["blocking_ingredients"] != []
    assert response.json()["detail"]["original_error"] != None
    assert session.get(Brand, 2) != None

def test_delete_brand_by_id(client, session, seeded_db):
    # Create new object which is not referenced
    brand = Brand(name="to_delete")
    session.add(brand)
    session.commit()
    brand_id = brand.id

    response = client.delete(f"/brands/{brand.id}")

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert session.get(Brand, brand_id) == None
