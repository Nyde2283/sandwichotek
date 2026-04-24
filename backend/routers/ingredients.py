from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.encoders import jsonable_encoder
from sqlmodel import Session, select
from sqlalchemy.exc import IntegrityError
from ..db.models import *
from ..db import get_session

router = APIRouter(
    prefix="/ingredients",
    tags=["Ingredients"]
)

@router.post("/", response_model=IngredientPublicVerbose)
def create_ingredient(ingredient: IngredientCreate, session: Session = Depends(get_session)):
        db_ingredient = Ingredient.model_validate(ingredient)
        session.add(db_ingredient)
        session.commit()
        session.refresh(db_ingredient)
        return db_ingredient

@router.get("/",  response_model=list[IngredientPublicVerbose])
def get_all_ingredients(session: Session = Depends(get_session)):
    return session.exec(select(Ingredient)).all()

@router.get("/{ingredient_id}",  response_model=IngredientPublicVerbose)
def get_ingredient_by_id(ingredient_id: int, session: Session = Depends(get_session)):
    ingredient = session.get(Ingredient, ingredient_id)
    if not ingredient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingredient not found")
    session.refresh(ingredient)
    return ingredient

@router.put("/{ingredient_id}",  response_model=IngredientPublicVerbose)
def update_ingredient(ingredient_id: int, ingredient: IngredientUpdate, session: Session = Depends(get_session)):
    db_ingredient = session.get(Ingredient, ingredient_id)
    if not db_ingredient:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ingredient not found")
    ingredient_data = ingredient.model_dump(exclude_unset=True)
    db_ingredient.sqlmodel_update(ingredient_data)
    session.add(db_ingredient)
    session.commit()
    session.refresh(db_ingredient)
    return db_ingredient

@router.delete("/{ingredient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ingredient(ingredient_id: int, session: Session = Depends(get_session)):
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
                "msg": "Foreign key violation ! Check 'blocking recipe_items' field",
                "blocking recipe_items": jsonable_encoder(ingredient.recipe_items),
                "original error": str(error.orig)
            }
        )
