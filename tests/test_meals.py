from fastapi import status
from backend.db.models import Meal

# ---------------------------------------------------------------------------- #
#                                     POST                                     #
# ---------------------------------------------------------------------------- #

def test_create_meal(client, session):
    body = {
        "name": "comtois",
        "veggy": True
    }
    response = client.post("/meals", json=body)

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {
        **body,
        "meal_productions": [],
        "recipe_items": [],
        "id": 1
    }
    db_meal = session.get(Meal, 1)
    assert db_meal != None
    assert db_meal.model_dump() == {
        **body,
        "id": 1
    }

# ---------------------------------------------------------------------------- #
#                                      GET                                     #
# ---------------------------------------------------------------------------- #

def test_get_meal_list_on_empty_db(client):
    response = client.get("/meals")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []

def test_get_meal_list(client, seeded_db):
    response = client.get("/meals")
    assert response.status_code == status.HTTP_200_OK

    for i, meal in enumerate(seeded_db[Meal]):
        assert {
            **meal,
            "id": i + 1
        }.items() <= response.json()[i].items()
        assert response.json()[i]["meal_productions"] != []
        assert response.json()[i]["recipe_items"] != []

def test_get_meal_by_id_on_empty_db(client):
    response = client.get("/meals/1")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_get_meal_by_id(client, seeded_db):
    for i, meal in enumerate(seeded_db[Meal]):
        response = client.get(f"/meals/{i + 1}")
        assert response.status_code == status.HTTP_200_OK
        assert {
            **meal,
            "id": i + 1
        }.items() <= response.json().items()

# ---------------------------------------------------------------------------- #
#                                      PUT                                     #
# ---------------------------------------------------------------------------- #

def test_update_meal_by_id_on_empty_db(client):
    body = {
        "name": "c0mt0is",
        "veggy": False
    }
    response = client.put("/meals/2", json=body)

    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_update_meal_by_id(client, session, seeded_db):
    body = {
        "name": "c0mt0is",
        "veggy": False
    }
    response = client.put("/meals/2", json=body)

    assert response.status_code == status.HTTP_200_OK
    assert {
        **body,
        "id": 2
    }.items() <= response.json().items()
    db_meal = session.get(Meal, 2)
    assert db_meal != None
    assert db_meal.name == body["name"]
    assert db_meal.veggy == body["veggy"]

# ---------------------------------------------------------------------------- #
#                                    DELETE                                    #
# ---------------------------------------------------------------------------- #

def test_delete_meal_by_id_on_empty_db(client, session):
    assert session.get(Meal, 1) == None
    response = client.delete("/meals/1")
    assert response.status_code == status.HTTP_404_NOT_FOUND

def test_delete_meal_by_id_conflict_foreign_key(client, session, seeded_db):
    response = client.delete("/meals/1")

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    assert response.json()["detail"]["msg"] == "Foreign key violation ! Check recipe_items and meal_productions fields"
    assert response.json()["detail"].get("original error") != None
    assert session.get(Meal, 1) != None

def test_delete_meal_by_id(client, session, seeded_db):
    # Delete object which reference the meal to make it deletable
    meal = session.get(Meal, 1)
    for dep in meal.recipe_items + meal.meal_productions:
        session.delete(dep)
    session.commit()
    meal_id = meal.id

    response = client.delete("/meals/1")

    assert response.status_code == status.HTTP_204_NO_CONTENT
    assert session.get(Meal, 1) == None
