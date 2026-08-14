from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.encoders import jsonable_encoder
from sqlmodel import Session, select, or_
from sqlalchemy.exc import IntegrityError
from ..db.models import *
from ..db import get_session
from ..tools.response_models import *

router = APIRouter(
    prefix="/ingredients",
    tags=["Ingredients"]
)

@router.post("/", response_model=IngredientPublicVerbose)
def create_ingredient(ingredient: IngredientCreate, session: Session = Depends(get_session)):
    """Create a new ingredient."""

    if ingredient.shelf_id and not session.get(Shelf, ingredient.shelf_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Shelf not found")
    if ingredient.brand_id and not session.get(Brand, ingredient.brand_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Brand not found")

    db_ingredient = Ingredient.model_validate(ingredient)
    session.add(db_ingredient)
    session.commit()
    session.refresh(db_ingredient)
    return db_ingredient

@router.get("/",  response_model=list[IngredientPublicVerbose])
def search_ingredients(q: str | None = None, session: Session = Depends(get_session)):
    """Search for ingredients by name or ID."""
    if q is None:
        return session.exec(select(Ingredient)).all()
    if q.isdigit():
        return session.exec(select(Ingredient).where(Ingredient.id == int(q))).all()
    else:
        return session.exec(select(Ingredient).where(or_(Ingredient.name.ilike(f"%{q}%"), Ingredient.remark.ilike(f"%{q}%")))).all() # type: ignore

@router.get("/{ingredient_id}",  response_model=IngredientPublicVerbose, responses={status.HTTP_404_NOT_FOUND: {"model": HTTPNotFound}})
def get_ingredient_by_id(ingredient_id: int, session: Session = Depends(get_session)):
    """Get an ingredient identified by its ID."""
    ingredient = session.get(Ingredient, ingredient_id)
    if not ingredient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingredient not found")
    session.refresh(ingredient)
    return ingredient

@router.put("/{ingredient_id}",  response_model=IngredientPublicVerbose, responses={status.HTTP_404_NOT_FOUND: {"model": HTTPNotFound}})
def update_ingredient(ingredient_id: int, ingredient: IngredientUpdate, session: Session = Depends(get_session)):
    """Update an ingredient identified by its ID."""
    db_ingredient = session.get(Ingredient, ingredient_id)
    if not db_ingredient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingredient not found")
    ingredient_data = ingredient.model_dump(exclude_unset=True)
    db_ingredient.sqlmodel_update(ingredient_data)
    session.add(db_ingredient)
    session.commit()
    session.refresh(db_ingredient)
    return db_ingredient

@router.delete("/{ingredient_id}", status_code=status.HTTP_204_NO_CONTENT, responses={status.HTTP_404_NOT_FOUND: {"model": HTTPNotFound}, status.HTTP_422_UNPROCESSABLE_CONTENT: {"model": HTTPUnprocessableContent_Ingredient}})
def delete_ingredient(ingredient_id: int, session: Session = Depends(get_session)):
    """Delete an ingredient identified by its ID."""
    ingredient = session.get(Ingredient, ingredient_id)
    if not ingredient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingredient not found")
    session.delete(ingredient)
    try:
        session.commit()
    except IntegrityError as error:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "msg": "Foreign key violation ! Check 'blocking_recipe_items' field",
                "blocking_recipe_items": jsonable_encoder(ingredient.recipe_items),
                "blocking_shopping_items": jsonable_encoder(ingredient.shopping_items),
                "original_error": str(error.orig)
            }
        )
