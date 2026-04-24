from fastapi import status
from backend.db.models import Meal

# ---------------------------------------------------------------------------- #
#                                  POST / PUT                                  #
# ---------------------------------------------------------------------------- #

def test_create_recipe_with_non_existent_meal(client, session, seeded_db):
    body = [
        {
            "ingredient_id": 1,
            "quantity": 0.5,
        },
    ]
    response = client.post("/recipes/999/ingredients", json=body)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Meal not found"}

def test_create_recipe_with_non_existent_ingredient(client, session, seeded_db):
    body = [
        {
            "ingredient_id": 999,   # non existent ingredient id
            "quantity": 0.5,
        },
    ]

    response = client.post("/recipes/1/ingredients", json=body)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Ingredient with id 999 not found"}

def test_create_recipe_with_non_existent_meal_and_ingredient(client, session, seeded_db):
    body = [
            {
            "ingredient_id": 999,   # non existent ingredient id
            "quantity": 0.5,
        },
    ]

    response = client.post("/recipes/999/ingredients", json=body)

    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Meal not found"}

def test_create_recipe(client, session, seeded_db):
    new_meal = Meal(name="new meal", veggy=False)   # create a meal not linked to any recipe
    session.add(new_meal)
    session.commit()

    body = [
        {
            "ingredient_id": 1,
            "quantity": 0.5,
        },
        {
            "ingredient_id": 2,
            "quantity": 10.0,
        },
    ]

    response = client.post(f"/recipes/{new_meal.id}/ingredients", json=body)

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["meal_id"] == new_meal.id
    assert len(response.json()["items"]) == 2
    assert response.json()["items"][0]["ingredient"]["id"] == 1
    assert response.json()["items"][0]["quantity"] == 0.5
    assert response.json()["items"][1]["ingredient"]["id"] == 2
    assert response.json()["items"][1]["quantity"] == 10.0

    recipe_items = new_meal.recipe_items

    assert len(recipe_items) == 2
    assert (
        (
            recipe_items[0].ingredient_id == 1
            and recipe_items[0].quantity == 0.5
            and recipe_items[1].ingredient_id == 2
            and recipe_items[1].quantity == 10.0)
        or (
            recipe_items[0].ingredient_id == 2
            and recipe_items[0].quantity == 10.0
            and recipe_items[1].ingredient_id == 1
            and recipe_items[1].quantity == 0.5)
    )

def test_update_recipe(client, session, seeded_db):
    body = [
        {
            "ingredient_id": 1,
            "quantity": 0.75,
        },
    ]

    response = client.put("/recipes/1/ingredients", json=body)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.json()["items"]) == 2
    assert response.json()["items"][0]["ingredient"]["id"] == 1
    assert response.json()["items"][0]["quantity"] == 0.75
    assert response.json()["items"][1]["ingredient"]["id"] == 2
    assert response.json()["items"][1]["quantity"] == 20.0

# ---------------------------------------------------------------------------- #
#                                      GET                                     #
# ---------------------------------------------------------------------------- #

def test_get_recipe_list_on_empty_db(client):
    response = client.get("/recipes")
    assert response.status_code == status.HTTP_200_OK
    assert response.json() == []

def test_get_recipe_list(client, session, seeded_db):
    new_meal = Meal(name="new meal", veggy=False)   # add a meal without recipe to that it is not in recipes
    session.add(new_meal)
    session.commit()

    response = client.get("/recipes")
    assert response.status_code == status.HTTP_200_OK

    assert len(response.json()) == 2
    assert response.json()[0]["meal_id"] == 1
    assert response.json()[0]["items"][0]["ingredient"]["id"] == 1
    assert response.json()[0]["items"][0]["quantity"] == 0.25
    assert response.json()[0]["items"][1]["ingredient"]["id"] == 2
    assert response.json()[0]["items"][1]["quantity"] == 20.0
    assert response.json()[1]["meal_id"] == 2
    assert response.json()[1]["items"][0]["ingredient"]["id"] == 1
    assert response.json()[1]["items"][0]["quantity"] == 0.5
    assert response.json()[1]["items"][1]["ingredient"]["id"] == 3
    assert response.json()[1]["items"][1]["quantity"] == 25.0

def test_get_recipe_by_meal_id_on_empty_db(client):
    response = client.get("/recipes/1")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Meal not found"}

def test_get_empty_recipe_by_meal_id(client, session):
    new_meal = Meal(name="new meal", veggy=False)   # create a meal not linked to any recipe
    session.add(new_meal)
    session.commit()

    response = client.get(f"/recipes/{new_meal.id}")

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["meal_id"] == new_meal.id
    assert response.json()["items"] == []

def test_get_recipe_by_meal_id(client, seeded_db):
    response = client.get("/recipes/1")
    assert response.status_code == status.HTTP_200_OK

    assert response.json()["meal_id"] == 1
    assert response.json()["items"][0]["ingredient"]["id"] == 1
    assert response.json()["items"][0]["quantity"] == 0.25
    assert response.json()["items"][1]["ingredient"]["id"] == 2
    assert response.json()["items"][1]["quantity"] == 20.0

# ---------------------------------------------------------------------------- #
#                                    DELETE                                    #
# ---------------------------------------------------------------------------- #

def test_delete_recipe_by_meal_id_on_empty_db(client):
    response = client.delete("/recipes/1")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Meal not found"}

def test_delete_recipe_by_meal_id(client, session, seeded_db):
    meal = session.get(Meal, 1)
    assert meal != None
    assert meal.recipe_items != []

    response = client.delete("/recipes/1")
    assert response.status_code == status.HTTP_200_OK

    session.refresh(meal)
    assert meal.recipe_items == []

def test_delete_ingredient_from_non_existent_meal(client, session, seeded_db):
    # body = {"ingredients_id": [1, 2]}
    body = {
        "ingredients_id": [
            1
        ]
    }
    response = client.post("/recipes/999/delete-ingredients", json=body)
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert response.json() == {"detail": "Meal not found"}

def test_delete_non_existent_ingredient_from_recipe(client, session, seeded_db):
    meal = session.get(Meal, 1)
    assert meal.recipe_items != []
    old_recipe_items = meal.recipe_items.copy()

    body = {"ingredients_id": [999]}

    response = client.post("/recipes/1/delete-ingredients", json=body)
    assert response.status_code == status.HTTP_200_OK

    assert response.json()["meal_id"] == 1
    assert len(response.json()["items"]) == 2

    session.refresh(meal)
    assert meal.recipe_items == old_recipe_items

def test_delete_ingredient_from_recipe(client, session, seeded_db):
    meal = session.get(Meal, 1)
    assert meal != None
    assert meal.recipe_items != []

    body = {"ingredients_id": [meal.recipe_items[0].ingredient_id]}

    response = client.post("/recipes/1/delete-ingredients", json=body)
    assert response.status_code == status.HTTP_200_OK

    assert response.json()["meal_id"] == 1
    assert len(response.json()["items"]) == 1

    session.refresh(meal)
    assert len(meal.recipe_items) == 1
    assert meal.recipe_items[0].ingredient_id != body["ingredients_id"][0]
