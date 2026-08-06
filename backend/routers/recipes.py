from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.encoders import jsonable_encoder
from sqlmodel import Session, select
from sqlalchemy.exc import IntegrityError
from ..db.models import *
from ..db import get_session
from ..tools.response_models import *

router = APIRouter(
    prefix="/recipes",
    tags=["Recipes"]
)

def build_recipe(meal: Meal) -> Recipe:
    if not meal.id:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Meal id missing while building recipe")

    return Recipe(
        meal_id=meal.id,
        items=[
            IngredientItem(
                ingredient=IngredientPublic.model_validate(recipe_item.ingredient),
                quantity=recipe_item.quantity
            )
            for recipe_item in meal.recipe_items
        ]
    )

@router.put("/{meal_id}/ingredients", response_model=Recipe, responses={status.HTTP_404_NOT_FOUND: {"model": HTTPNotFound}})
def manage_recipe(meal_id: int, recipe: list[IngredientItemUpdate], session: Session = Depends(get_session)):
    """Add ingredients to the recipe of a meal, or update their quantity."""
    meal = session.get(Meal, meal_id)

    if not meal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meal not found")

    recipe_items = {recipe_item.ingredient_id: recipe_item for recipe_item in meal.recipe_items}

    for item_param in recipe:   # we use a copy to avoid modifying the list while iterating on it
        if not session.get(Ingredient, item_param.ingredient_id):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Ingredient with id {item_param.ingredient_id} not found")

        if item_param.ingredient_id in recipe_items:   # update existing recipe item
            recipe_item = recipe_items[item_param.ingredient_id]
            recipe_item.quantity = item_param.quantity
            session.add(recipe_item)
        else:   # create new recipe item
            new_recipe_item = RecipeItem(
                meal_id=meal_id,
                ingredient_id=item_param.ingredient_id,
                quantity=item_param.quantity
            )
            session.add(new_recipe_item)
    session.commit()
    session.refresh(meal)
    return build_recipe(meal)

@router.get("/", response_model=list[Recipe])
def get_all_recipes(session: Session = Depends(get_session)):
    """Get a list of all recipes."""
    meals = session.exec(select(Meal)).all()

    return [build_recipe(meal) for meal in meals if meal.recipe_items != []]

@router.get("/{meal_id}", response_model=Recipe, responses={status.HTTP_404_NOT_FOUND: {"model": HTTPNotFound}})
def get_recipe_by_meal_id(meal_id: int, session: Session = Depends(get_session)):
    """Get a recipe identified by the ID of the meal it belongs to."""
    meal = session.get(Meal, meal_id)

    if not meal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meal not found")

    return build_recipe(meal)

@router.delete("/{meal_id}", response_model=Recipe, responses={status.HTTP_404_NOT_FOUND: {"model": HTTPNotFound}})
def delete_recipe(meal_id: int, session: Session = Depends(get_session)):
    """Delete a recipe identified by the ID of the meal it belongs to."""
    meal = session.get(Meal, meal_id)

    if not meal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meal not found")

    for recipe_item in meal.recipe_items:
        session.delete(recipe_item)

    session.commit()
    session.refresh(meal)
    return build_recipe(meal)

@router.put("/{meal_id}/delete-ingredients", response_model=Recipe, responses={status.HTTP_404_NOT_FOUND: {"model": HTTPNotFound}})
def delete_ingredient_from_recipe(meal_id: int, ingredients_to_delete: RecipeDeleteItems, session: Session = Depends(get_session)):
    """Delete one or several ingredients from the recipe of a meal."""
    meal = session.get(Meal, meal_id)

    if not meal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meal not found")

    ingredients_id = ingredients_to_delete.ingredients_id

    for recipe_item in meal.recipe_items:
        if recipe_item.ingredient_id in ingredients_id:
            session.delete(recipe_item)

    session.commit()
    session.refresh(meal)
    return build_recipe(meal)
