from fastapi import status
from backend.db.models import Ingredient

# ---------------------------------------------------------------------------- #
#                                     POST                                     #
# ---------------------------------------------------------------------------- #

def test_create_ingredient_without_optionals(client, session):
    body = {
        "name": "tomate",
        "unit": "unit",
    }
    response = client.post("/ingredients", json=body)

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {
        **body,
        "remark": None,
        "shelf_id": None,
        "brand_id": None,
        "shelf": None,
        "brand": None,
        "recipe_items": [],
        "id": 1
    }
    db_ingredient = session.get(Ingredient, 1)
    assert db_ingredient != None
    assert db_ingredient.model_dump() == {
        **body,
        "remark": None,
        "shelf_id": None,
        "brand_id": None,
        "id": 1
    }

def test_create_ingredient_with_non_existent_shelf(client, session):
    body = {
        "name": "tomate",
        "unit": "unit",
        "shelf_id": 1
    }
    response = client.post("/ingredients", json=body)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Shelf not found"}
    assert session.get(Ingredient, 1) == None

def test_create_ingredient_with_non_existent_brand(client, session):
    body = {
        "name": "tomate",
        "unit": "unit",
        "brand_id": 1
    }
    response = client.post("/ingredients", json=body)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Brand not found"}
    assert session.get(Ingredient, 1) == None

def test_create_ingredient_with_optionals(client, session, seeded_db):
    body = {
        "name": "tomate",
        "unit": "unit",
        "remark": "des grosses tomates",
        "shelf_id": 1,
        "brand_id": 1
    }
    response = client.post("/ingredients", json=body)

    assert response.status_code == status.HTTP_200_OK
    assert {
        **body,
        "recipe_items": [],
    }.items() <= response.json().items()
    assert response.json().get("id") != None
    assert response.json()["shelf"] != None
    assert response.json()["shelf"]["id"] == 1
    assert response.json()["brand"] != None
    assert response.json()["brand"]["id"] == 1

    db_ingredient = session.get(Ingredient, 4)
    assert db_ingredient != None
    assert {
        **body,
        "id": 4
    }.items() <= db_ingredient.model_dump().items()
    assert db_ingredient.shelf != None
    assert db_ingredient.shelf.id == 1
    assert db_ingredient.brand != None
    assert db_ingredient.brand.id == 1

# ---------------------------------------------------------------------------- #
#                                      GET                                     #
# ---------------------------------------------------------------------------- #

def test_get_ingredient_list_on_empty_db(client):
    response = client.get("/ingredients")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []

def test_get_ingredient_list(client, seeded_db):
    response = client.get("/ingredients")
    assert response.status_code == status.HTTP_200_OK

    for i, ingredient in enumerate(seeded_db[Ingredient]):
        assert {
            **ingredient,
            "id": i + 1
        }.items() <= response.json()[i].items()

def test_get_ingredient_by_id_on_empty_db(client):
    response = client.get("/ingredients/1")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Ingredient not found"}

def test_get_ingredient_by_id(client, seeded_db):
    for i, ingredient in enumerate(seeded_db[Ingredient]):
        response = client.get(f"/ingredients/{i + 1}")
        assert response.status_code == status.HTTP_200_OK
        assert {
            **ingredient,
            "id": i + 1
        }.items() <= response.json().items()

# ---------------------------------------------------------------------------- #
#                                      PUT                                     #
# ---------------------------------------------------------------------------- #

def test_update_ingredient_by_id_on_empty_db(client):
    body = {"name": "t0m@t3"}
    response = client.put("/ingredients/1", json=body)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Ingredient not found"}

def test_udpate_ingredient_by_id(client, session, seeded_db):
    body = {"name": "t0m@t3"}
    response = client.put("/ingredients/1", json=body)

    assert response.status_code == status.HTTP_200_OK
    assert {
        **body,
        "id": 1
    }.items() <= response.json().items()
    db_ingredient = session.get(Ingredient, 1)
    assert db_ingredient != None
    assert db_ingredient.name == body["name"]

# ---------------------------------------------------------------------------- #
#                                    DELETE                                    #
# ---------------------------------------------------------------------------- #

def test_delete_ingredient_by_id_on_empty_db(client, session):
    assert session.get(Ingredient, 1) == None
    response = client.delete("/ingredients/1")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Ingredient not found"}

def test_delete_ingredient_by_id_conflict_foreign_key(client, session, seeded_db):
    response = client.delete("/ingredients/1")

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    assert response.json()["detail"]["msg"] == "Foreign key violation ! Check 'blocking_recipe_items' field"
    assert response.json()["detail"]["blocking_recipe_items"] != []
    assert response.json()["detail"]["original_error"] != None
    assert session.get(Ingredient, 3) != None

def test_delete_ingredient_by_id(client, session, seeded_db):
    # Create new object which is not referenced
    ingredient = Ingredient(name="to_delete", unit="unit")
    session.add(ingredient)
    session.commit()
    ingr_id = ingredient.id

    response = client.delete(f"/ingredients/{ingredient.id}")

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert session.get(Ingredient, ingr_id) == None
