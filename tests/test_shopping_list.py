from fastapi import status
from fastapi.encoders import jsonable_encoder
from datetime import date
from backend.db.models import ShoppingList, ShoppingItem

# ---------------------------------------------------------------------------- #
#                                     POST                                     #
# ---------------------------------------------------------------------------- #

def test_create_shopping_list_on_empty_range(client, session, seeded_db):
    body = jsonable_encoder({
        "shopping_date": date(2024, 4, 1),
        "range_begin": date(2024, 5, 1),
        "range_end": date(2024, 5, 31)
    })
    response = client.post("/shopping_lists", json=body)

    assert response.status_code == status.HTTP_200_OK
    assert {
        **body,
        "id": 2,
    }.items() <= response.json().items()
    db_shopping_list = session.get(ShoppingList, 2)
    assert db_shopping_list != None
    assert {
        "id": 2,
        "shopping_date": date(2024, 4, 1),
        "range_begin": date(2024, 5, 1),
        "range_end": date(2024, 5, 31),
    } == db_shopping_list.model_dump()
    assert db_shopping_list.shopping_items == []

def test_create_shopping_list_with_meal_productions(client, session, seeded_db):
    body = jsonable_encoder({
        "shopping_date": date(2024, 4, 10),
        "range_begin": date(2026, 4, 17),
        "range_end": date(2026, 4, 20)
    })
    response = client.post("/shopping_lists", json=body)

    assert response.status_code == status.HTTP_200_OK
    assert {
        **body,
        "id": 2,
    }.items() <= response.json().items()
    db_shopping_list = session.get(ShoppingList, 2)
    assert db_shopping_list != None
    assert {
        "id": 2,
        "shopping_date": date(2024, 4, 10),
        "range_begin": date(2026, 4, 17),
        "range_end": date(2026, 4, 20),
    } == db_shopping_list.model_dump()
    assert db_shopping_list.shopping_items != None
    assert len(db_shopping_list.shopping_items) == 2

def test_create_shopping_item_on_non_existing_shopping_list(client, session, seeded_db):
    body = {
        "shopping_list_id": 999,
        "ingredient_id": 1,
        "quantity": 10.0,
        "bought": False
    }
    response = client.post("/shopping_lists/999/items", json=body)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {
        "detail": "Shopping list not found"
    }

def test_create_shopping_item_on_non_existing_ingredient(client, session, seeded_db):
    body = {
        "shopping_list_id": 1,
        "ingredient_id": 999,
        "quantity": 10.0,
        "bought": False
    }
    response = client.post("/shopping_lists/1/items", json=body)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {
        "detail": "Ingredient not found"
    }

def test_create_duplicate_shopping_item(client, session, seeded_db):
    body = {
        "shopping_list_id": 1,
        "ingredient_id": 1,
        "quantity": 10.0,
        "bought": False
    }
    response = client.post("/shopping_lists/1/items", json=body)

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    assert response.json() == {
        "detail": "Shopping item already exists"
    }
    db_shopping_list = session.get(ShoppingList, 1)
    assert db_shopping_list != None
    assert len(db_shopping_list.shopping_items) == 2

def test_create_shopping_item(client, session, seeded_db):
    body = {
        "shopping_list_id": 1,
        "ingredient_id": 3,
        "quantity": 15.0,
        "bought": False
    }
    response = client.post("/shopping_lists/1/items", json=body)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()["shopping_items"]) == 3
    db_shopping_list = session.get(ShoppingList, 1)
    assert db_shopping_list != None
    assert len(db_shopping_list.shopping_items) == 3

# ---------------------------------------------------------------------------- #
#                                      GET                                     #
# ---------------------------------------------------------------------------- #

def test_get_shopping_list_on_empty_db(client):
    response = client.get("/shopping_lists")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []

def test_search_shopping_lists_by_before_date_on_empty_db(client):
    response = client.get("/shopping_lists?before=2026-01-01")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []

def test_search_shopping_lists_by_after_date_on_empty_db(client):
    response = client.get("/shopping_lists?after=2026-01-01")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []

def test_get_shopping_list_list(client, seeded_db):
    response = client.get("/shopping_lists")
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1
    assert {
        "shopping_date": "2026-08-13",
        "range_begin": "2026-08-17",
        "range_end": "2026-08-21",
        "id": 1,
    }.items() <= response.json()[0].items()

def test_search_shopping_lists_by_before_date(client, seeded_db):
    response = client.get("/shopping_lists?before=2026-08-13")
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1

def test_search_shopping_lists_by_after_date(client, seeded_db):
    response = client.get("/shopping_lists?after=2026-08-13")
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1

def test_search_shopping_lists_by_before_and_after_date(client, seeded_db):
    response = client.get("/shopping_lists?before=2026-08-13&after=2026-08-13")
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 1

def test_search_shopping_lists_by_before_and_after_date_no_results(client, seeded_db):
    response = client.get("/shopping_lists?before=2026-08-13&after=2026-08-14")
    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()) == 0

def test_get_shopping_list_by_id_on_empty_db(client):
    response = client.get("/shopping_lists/1")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {
        "detail": "Shopping list not found"
    }

def test_get_shopping_list_by_id(client, seeded_db):
    response = client.get("/shopping_lists/1")
    assert response.status_code == status.HTTP_200_OK
    assert {
        "shopping_date": "2026-08-13",
        "range_begin": "2026-08-17",
        "range_end": "2026-08-21",
        "id": 1,
    }.items() <= response.json().items()

# ---------------------------------------------------------------------------- #
#                                      PUT                                     #
# ---------------------------------------------------------------------------- #

def test_update_shopping_list_by_id_on_empty_db(client):
    body = jsonable_encoder({
        "shopping_date": date(2024, 4, 1)
    })
    response = client.put("/shopping_lists/1", json=body)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {
        "detail": "Shopping list not found"
    }

def test_update_shopping_list_by_id(client, session, seeded_db):
    body = jsonable_encoder({
        "shopping_date": date(2024, 4, 1)
    })
    response = client.put("/shopping_lists/1", json=body)

    assert response.status_code == status.HTTP_200_OK
    assert {
        **body,
        "range_begin": "2026-08-17",
        "range_end": "2026-08-21",
        "id": 1,
    }.items() <= response.json().items()
    db_shopping_list = session.get(ShoppingList, 1)
    assert db_shopping_list != None
    assert {
        "id": 1,
        "shopping_date": date(2024, 4, 1),
        "range_begin": date(2026, 8, 17),
        "range_end": date(2026, 8, 21),
    } == db_shopping_list.model_dump()

def test_update_shopping_item_by_id_on_empty_db(client):
    body = {
        "quantity": 15.0,
        "bought": True
    }
    response = client.put("/shopping_lists/1/items/1", json=body)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {
        "detail": "Shopping item not found"
    }

def test_update_shopping_item_by_id(client, session, seeded_db):
    body = {
        "quantity": 15.0,
        "bought": True
    }
    response = client.put("/shopping_lists/1/items/1", json=body)

    assert response.status_code == status.HTTP_200_OK
    assert {
        **body,
        "ingredient_id": 1,
        "shopping_list_id": 1
    }.items() <= response.json()["shopping_items"][0].items()
    db_shopping_item = session.get(ShoppingItem, (1, 1))
    assert db_shopping_item != None
    assert {
        "shopping_list_id": 1,
        "ingredient_id": 1,
        "quantity": 15.0,
        "bought": True
    } == db_shopping_item.model_dump()

# ---------------------------------------------------------------------------- #
#                                    DELETE                                    #
# ---------------------------------------------------------------------------- #

def test_delete_shopping_list_by_id_on_empty_db(client):
    response = client.delete("/shopping_lists/1")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Shopping list not found"}

def test_delete_shopping_list_by_id(client, session, seeded_db):
    response = client.delete("/shopping_lists/1")
    assert response.status_code == status.HTTP_204_NO_CONTENT
    db_shopping_list = session.get(ShoppingList, 1)
    assert db_shopping_list == None

def test_delete_shopping_item_by_id_on_empty_db(client):
    response = client.delete("/shopping_lists/1/items/1")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Shopping item not found"}

def test_delete_shopping_item_by_id(client, session, seeded_db):
    response = client.delete("/shopping_lists/1/items/1")

    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()["shopping_items"]) == 1
    db_shopping_list = session.get(ShoppingList, 1)
    assert db_shopping_list != None
    assert len(db_shopping_list.shopping_items) == 1
    db_shopping_item = session.get(ShoppingItem, (1, 1))
    assert db_shopping_item == None
