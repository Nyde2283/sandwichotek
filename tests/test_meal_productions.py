from fastapi import status
from fastapi.encoders import jsonable_encoder
from datetime import date
from backend.db.models import MealProduction

# ---------------------------------------------------------------------------- #
#                                     POST                                     #
# ---------------------------------------------------------------------------- #

def test_create_meal_production_with_non_existent_meal(client, session, seeded_db):
    body = jsonable_encoder({
        "meal_id": 999,   # non existent meal id
        "date": date(2026, 1, 1),
        "quantity": 10
    })
    response = client.post("/meal_productions", json=body)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Meal not found"}

def test_create_meal_production(client, session, seeded_db):
    body = jsonable_encoder({
        "meal_id": 1,
        "date": date(2026, 1, 1),
        "quantity": 10
    })
    response = client.post("/meal_productions", json=body)

    assert response.status_code == status.HTTP_200_OK
    assert {
        **body,
        "id": 3
    }.items() <= response.json().items()
    assert response.json()["meal"] != None
    assert response.json()["meal"]["id"] == 1

    db_meal_production = session.get(MealProduction, 3)
    assert db_meal_production != None
    assert {
        "meal_id": 1,
        "date": date(2026, 1, 1),
        "quantity": 10,
        "id": 3
    }.items() <= db_meal_production.model_dump().items()
    assert db_meal_production.meal != None
    assert db_meal_production.meal.id == 1

# ---------------------------------------------------------------------------- #
#                                      GET                                     #
# ---------------------------------------------------------------------------- #

def test_get_meal_production_list_on_empty_db(client):
    response = client.get("/meal_productions")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []

def test_search_meal_productions_by_meal_id_on_empty_db(client):
    response = client.get("/meal_productions?meal_id=1")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []

def test_search_meal_productions_by_before_date_on_empty_db(client):
    response = client.get("/meal_productions?before=2026-01-01")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []

def test_search_meal_productions_by_after_date_on_empty_db(client):
    response = client.get("/meal_productions?after=2026-01-01")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []

def test_get_meal_production_list(client, seeded_db):
    response = client.get("/meal_productions")
    assert response.status_code == status.HTTP_200_OK

    assert response.json() == [
        {
            "meal_id": 1,
            "date": "2026-04-17",
            "quantity": 14,
            "id": 1,
            "meal": {
                "name": "norvégien",
                "veggy": False,
                "id": 1
            }
        },
        {
            "meal_id": 2,
            "date": "2026-04-15",
            "quantity": 14,
            "id": 2,
            "meal": {
                "name": "comtois",
                "veggy": True,
                "id": 2
            }
        }
    ]

def test_search_meal_productions_by_meal_id(client, seeded_db):
    response = client.get("/meal_productions?meal_id=1")
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1
    assert response.json()[0]["meal_id"] == 1

def test_search_meal_productions_by_before_date(client, seeded_db):
    response = client.get("/meal_productions?before=2026-04-17")
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 2

def test_search_meal_productions_by_after_date(client, seeded_db):
    response = client.get("/meal_productions?after=2026-04-17")
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1
    assert response.json()[0]["meal_id"] == 1

def test_get_meal_production_by_id_on_empty_db(client):
    response = client.get("/meal_productions/1")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Meal production not found"}

def test_get_meal_production_by_id(client, seeded_db):
    response = client.get("/meal_productions/1")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {
        "meal_id": 1,
        "date": "2026-04-17",
        "quantity": 14,
        "id": 1,
        "meal": {
            "name": "norvégien",
            "veggy": False,
            "id": 1
        }
    }

# ---------------------------------------------------------------------------- #
#                                      PUT                                     #
# ---------------------------------------------------------------------------- #

def test_update_meal_production_by_id_on_empty_db(client):
    body = jsonable_encoder({
        "meal_id": 1,
        "date": date(2026, 1, 1),
        "quantity": 10
    })
    response = client.put("/meal_productions/1", json=body)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Meal production not found"}

def test_update_meal_production_by_id(client, session, seeded_db):
    body = jsonable_encoder({
        "meal_id": 1,
        "date": date(2026, 1, 1),
        "quantity": 10
    })
    response = client.put("/meal_productions/1", json=body)

    assert response.status_code == status.HTTP_200_OK
    assert response.json() == {
            "meal_id": 1,
            "date": "2026-01-01",
            "quantity": 10,
            "id": 1,
            "meal": {
                "name": "norvégien",
                "veggy": False,
                "id": 1
            }
        }

    db_meal_production = session.get(MealProduction, 1)
    assert db_meal_production != None
    assert {
        "meal_id": 1,
        "date": date(2026, 1, 1),
        "quantity": 10,
        "id": 1
    }.items() <= db_meal_production.model_dump().items()
    assert db_meal_production.meal != None
    assert db_meal_production.meal.id == 1

# ---------------------------------------------------------------------------- #
#                                    DELETE                                    #
# ---------------------------------------------------------------------------- #

def test_delete_meal_production_by_id_on_empty_db(client):
    response = client.delete("/meal_productions/1")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Meal production not found"}

def test_delete_meal_production_by_id(client, session, seeded_db):
    response = client.delete("/meal_productions/1")
    assert response.status_code == status.HTTP_204_NO_CONTENT

    assert session.get(MealProduction, 1) == None
