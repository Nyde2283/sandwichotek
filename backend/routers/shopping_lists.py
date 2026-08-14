from fastapi import APIRouter, HTTPException, Depends, status
from sqlmodel import Session, select
from ..db.models import *
from ..db import get_session
from ..tools.response_models import *

router = APIRouter(
    prefix="/shopping_lists",
    tags=["Shopping Lists"]
)

@router.post("/", response_model=ShoppingListPublicVerbose)
def create_shopping_list(shopping_list: ShoppingListCreate, session: Session = Depends(get_session)):
    """Create a new shopping list."""
    db_shopping_list = ShoppingList.model_validate(shopping_list)
    session.add(db_shopping_list)
    session.commit()
    session.refresh(db_shopping_list)

    assert(db_shopping_list.id is not None)  # should never happen, but mypy doesn't know that

    meal_productions = session.exec(select(MealProduction).where(MealProduction.date >= db_shopping_list.range_begin, MealProduction.date <= db_shopping_list.range_end)).all()
    for meal_production in meal_productions:
        for recipe_item in meal_production.meal.recipe_items:
            shopping_item = session.get(ShoppingItem, (db_shopping_list.id, recipe_item.ingredient_id))

            if not shopping_item:
                shopping_item = ShoppingItem(
                    shopping_list_id=db_shopping_list.id,
                    ingredient_id=recipe_item.ingredient_id,
                )
                session.add(shopping_item)

            shopping_item.quantity += recipe_item.quantity * meal_production.quantity

            session.add(shopping_item)

    session.commit()
    session.refresh(db_shopping_list)
    return db_shopping_list

@router.post("/{shopping_list_id}/items", response_model=ShoppingListPublicVerbose, responses={status.HTTP_404_NOT_FOUND: {"model": HTTPNotFound}})
def create_shopping_item(shopping_list_id: int, shopping_item: ShoppingItemCreate, session: Session = Depends(get_session)):
    """Create a new shopping item."""
    if session.get(ShoppingItem, (shopping_list_id, shopping_item.ingredient_id)) is not None:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_CONTENT, detail="Shopping item already exists")

    db_shopping_item = ShoppingItem.model_validate(shopping_item)

    if not session.get(ShoppingList, db_shopping_item.shopping_list_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shopping list not found")
    if not session.get(Ingredient, db_shopping_item.ingredient_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingredient not found")

    session.add(db_shopping_item)
    session.commit()
    session.refresh(db_shopping_item)
    return db_shopping_item.shopping_list

# TODO : order by date
@router.get("/", response_model=list[ShoppingListPublic])
def search_shopping_lists(before: date | None = None, after: date | None = None, session: Session = Depends(get_session)):
    """Search for shopping lists by date range."""
    statement = select(ShoppingList)

    if before is not None:
        statement = statement.where(ShoppingList.shopping_date <= before)
    if after is not None:
        statement = statement.where(ShoppingList.shopping_date >= after)

    return session.exec(statement).all()

@router.get("/{shopping_list_id}", response_model=ShoppingListPublicVerbose, responses={status.HTTP_404_NOT_FOUND: {"model": HTTPNotFound}})
def get_shopping_list_by_id(shopping_list_id: int, session: Session = Depends(get_session)):
    """Get a shopping list identified by its ID."""
    shopping_list = session.get(ShoppingList, shopping_list_id)
    if not shopping_list:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shopping list not found")
    session.refresh(shopping_list)
    return shopping_list

@router.put("/{shopping_list_id}", response_model=ShoppingListPublicVerbose, responses={status.HTTP_404_NOT_FOUND: {"model": HTTPNotFound}})
def update_shopping_list(shopping_list_id: int, shopping_list: ShoppingListUpdate, session: Session = Depends(get_session)):
    """Update a shopping list identified by its ID."""
    db_shopping_list = session.get(ShoppingList, shopping_list_id)
    if not db_shopping_list:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shopping list not found")

    shopping_list_data = shopping_list.model_dump(exclude_unset=True)
    db_shopping_list.sqlmodel_update(shopping_list_data)

    session.add(db_shopping_list)
    session.commit()
    session.refresh(db_shopping_list)
    return db_shopping_list

@router.put("/{shopping_list_id}/items/{ingredient_id}", response_model=ShoppingListPublicVerbose, responses={status.HTTP_404_NOT_FOUND: {"model": HTTPNotFound}})
def update_shopping_item(shopping_list_id: int, ingredient_id: int, shopping_item: ShoppingItemUpdate, session: Session = Depends(get_session)):
    """Update a shopping item identified by its ID."""
    db_shopping_item = session.get(ShoppingItem, (shopping_list_id, ingredient_id))
    if not db_shopping_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shopping item not found")

    shopping_item_data = shopping_item.model_dump(exclude_unset=True)
    db_shopping_item.sqlmodel_update(shopping_item_data)

    session.add(db_shopping_item)
    session.commit()
    session.refresh(db_shopping_item)
    return db_shopping_item.shopping_list

@router.delete("/{shopping_list_id}/items/{ingredient_id}", response_model=ShoppingListPublicVerbose, responses={status.HTTP_404_NOT_FOUND: {"model": HTTPNotFound}})
def delete_shopping_item(shopping_list_id: int, ingredient_id: int, session: Session = Depends(get_session)):
    """Delete a shopping item identified by its ID."""
    shopping_item = session.get(ShoppingItem, (shopping_list_id, ingredient_id))
    if not shopping_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shopping item not found")

    shopping_list = shopping_item.shopping_list

    session.delete(shopping_item)
    session.commit()
    session.refresh(shopping_list)
    return shopping_list

@router.delete("/{shopping_list_id}", status_code=status.HTTP_204_NO_CONTENT, responses={status.HTTP_404_NOT_FOUND: {"model": HTTPNotFound}})
def delete_shopping_list(shopping_list_id: int, session: Session = Depends(get_session)):
    """Delete a shopping list identified by its ID."""
    shopping_list = session.get(ShoppingList, shopping_list_id)
    if not shopping_list:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Shopping list not found")

    session.delete(shopping_list)
    session.commit()
