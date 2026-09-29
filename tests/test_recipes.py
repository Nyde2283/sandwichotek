from fastapi import status
from backend.db.models import Meal, RecipeItem

# ---------------------------------------------------------------------------- #
#                                     POST                                     #
# ---------------------------------------------------------------------------- #

def test_create_recipe_item_with_non_existent_meal(client, session, seeded_db):
    body = {
        "meal_id": 999,
        "ingredient_id": 1,
        "quantity": 0.5,
    }
    response = client.post("/meals/999/ingredients", json=body)

    assert session.get(RecipeItem, (999, 1)) is None
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Meal not found"}

def test_create_recipe_item_with_non_existent_ingredient(client, session, seeded_db):
    body = {
        "meal_id": 1,
        "ingredient_id": 999,   # non existent ingredient id
        "quantity": 0.5,
    }

    response = client.post("/meals/1/ingredients", json=body)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Ingredient not found"}

def test_create_recipe_item_with_non_existent_meal_and_ingredient(client, session, seeded_db):
    body = {
        "meal_id": 999,   # non existent ingredient id
        "ingredient_id": 999,   # non existent ingredient id
        "quantity": 0.5,
    }

    response = client.post("/meals/999/ingredients", json=body)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Meal not found"}

def test_create_duplicate_recipe_item(client, session, seeded_db):
    body = {
        "meal_id": 1,
        "ingredient_id": 1,
        "quantity": 0.5,
    }

    response = client.post("/meals/1/ingredients", json=body)

    assert response.status_code == status.HTTP_422_UNPROCESSABLE_CONTENT
    assert response.json() == {"detail": "Recipe item already exists"}

def test_create_recipe_item(client, session, seeded_db):
    body = {
        "meal_id": 1,
        "ingredient_id": 3,
        "quantity": 22.5,
    }
    response = client.post("/meals/1/ingredients", json=body)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()["recipe_items"]) == 3
    assert response.json()["recipe_items"][2]["quantity"] == 22.5
    meal = session.get(Meal, 1)
    assert meal != None
    assert len(meal.recipe_items) == 3

# ---------------------------------------------------------------------------- #
#                                      PUT                                     #
# ---------------------------------------------------------------------------- #

def test_update_recipe_item_by_id_on_empty_db(client):
    body = {
        "meal_id": 1,
        "ingredient_id": 1,
        "quantity": 0.75,
    }
    response = client.put("/meals/1/ingredients/1", json=body)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Recipe item not found"}

def test_update_recipe_item_by_id(client, session, seeded_db):
    body = {
        "meal_id": 1,
        "ingredient_id": 1,
        "quantity": 42,
    }
    response = client.put("/meals/1/ingredients/1", json=body)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()["recipe_items"]) == 2
    assert response.json()["recipe_items"][0]["ingredient"]["id"] == 1
    assert response.json()["recipe_items"][0]["quantity"] == 42
    assert response.json()["recipe_items"][1]["ingredient"]["id"] == 2
    assert response.json()["recipe_items"][1]["quantity"] == 20.0

# ---------------------------------------------------------------------------- #
#                                    DELETE                                    #
# ---------------------------------------------------------------------------- #

def test_delete_recipe_item_by_id_on_empty_db(client):
    response = client.delete("/meals/1/ingredients/1")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Recipe item not found"}

def test_delete_recipe_item_by_id_from_non_existent_meal(client, session, seeded_db):
    response = client.delete("/meals/999/ingredients/1")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Recipe item not found"}

def test_delete_recipe_item(client, session, seeded_db):
    meal = session.get(Meal, 1)
    assert meal != None
    assert meal.recipe_items != []

    response = client.delete(f"/meals/1/ingredients/{meal.recipe_items[0].ingredient_id}")
    assert response.status_code == status.HTTP_200_OK

    assert response.json()["meal"]["id"] == 1
    assert len(response.json()["recipe_items"]) == 1

    session.refresh(meal)
    assert len(meal.recipe_items) == 1
