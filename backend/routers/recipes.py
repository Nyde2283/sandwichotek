from fastapi import APIRouter, HTTPException, Depends, status
from sqlmodel import Session, select
from ..db.models import *
from ..db import get_session
from ..tools.response_models import *

router = APIRouter()

def build_recipe(meal: Meal) -> Recipe:
    if not meal.id:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Meal id missing while building recipe")

    return Recipe(
        meal=MealPublic.model_validate(meal),
        recipe_items=[
            RecipeItemPublicVerbose(
                meal_id=meal.id,
                ingredient_id=recipe_item.ingredient_id,
                ingredient=IngredientPublicVerbose.model_validate(recipe_item.ingredient),
                quantity=recipe_item.quantity
            )
            for recipe_item in meal.recipe_items
        ]
    )

@router.post("/{meal_id}/ingredients", response_model=Recipe, responses={status.HTTP_404_NOT_FOUND: {"model": HTTPNotFound}})
def create_recipe_item(meal_id: int, recipe_item: RecipeItemCreate, session: Session = Depends(get_session)):
    """Create a new recipe item."""
    if session.get(RecipeItem, (meal_id, recipe_item.ingredient_id)) is not None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Recipe item already exists")

    db_recipe_item = RecipeItem.model_validate(recipe_item)

    if not session.get(Meal, db_recipe_item.meal_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meal not found")
    if not session.get(Ingredient, db_recipe_item.ingredient_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingredient not found")

    session.add(db_recipe_item)
    session.commit()
    session.refresh(db_recipe_item)
    return build_recipe(db_recipe_item.meal)

@router.put("/{meal_id}/ingredients/{ingredient_id}", response_model=Recipe, responses={status.HTTP_404_NOT_FOUND: {"model": HTTPNotFound}})
def update_recipe_item(meal_id: int, ingredient_id: int, recipe_item: RecipeItemUpdate, session: Session = Depends(get_session)):
    """Update a recipe item."""
    db_recipe_item = session.get(RecipeItem, (meal_id, ingredient_id))
    if not db_recipe_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe item not found")

    recipe_item_data = recipe_item.model_dump(exclude_unset=True)
    db_recipe_item.sqlmodel_update(recipe_item_data)

    session.add(db_recipe_item)
    session.commit()
    session.refresh(db_recipe_item)
    return build_recipe(db_recipe_item.meal)

@router.delete("/{meal_id}/ingredients/{ingredient_id}", response_model=Recipe, responses={status.HTTP_404_NOT_FOUND: {"model": HTTPNotFound}})
def delete_recipe_item(meal_id: int, ingredient_id: int, session: Session = Depends(get_session)):
    """Delete a recipe item."""
    recipe_item = session.get(RecipeItem, (meal_id, ingredient_id))
    if not recipe_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Recipe item not found")

    meal = recipe_item.meal

    session.delete(recipe_item)
    session.commit()
    session.refresh(meal)
    return build_recipe(meal)
