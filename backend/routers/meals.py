from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.encoders import jsonable_encoder
from sqlmodel import Session, select
from sqlalchemy.exc import IntegrityError
from ..db.models import *
from ..db import get_session

router = APIRouter(
    prefix="/meals",
    tags=["Meals"]
)

@router.post("/", response_model=MealPublicVerbose)
def create_meal(meal: MealCreate, session: Session = Depends(get_session)):
        db_meal = Meal.model_validate(meal)
        session.add(db_meal)
        session.commit()
        session.refresh(db_meal)
        return db_meal

@router.get("/",  response_model=list[MealPublicVerbose])
def get_all_meals(session: Session = Depends(get_session)):
    return session.exec(select(Meal)).all()

@router.get("/{meal_id}",  response_model=MealPublicVerbose)
def get_meal_by_id(meal_id: int, session: Session = Depends(get_session)):
    meal = session.get(Meal, meal_id)
    if not meal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meal not found")
    session.refresh(meal)
    return meal

@router.put("/{meal_id}",  response_model=MealPublicVerbose)
def update_meal(meal_id: int, meal: MealUpdate, session: Session = Depends(get_session)):
    db_meal = session.get(Meal, meal_id)
    if not db_meal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meal not found")
    meal_data = meal.model_dump(exclude_unset=True)
    db_meal.sqlmodel_update(meal_data)
    session.add(db_meal)
    session.commit()
    session.refresh(db_meal)
    return db_meal

@router.delete("/{meal_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meal(meal_id: int, session: Session = Depends(get_session)):
    meal = session.get(Meal, meal_id)
    if not meal:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meal not found")
    session.delete(meal)
    try:
        session.commit()
    except IntegrityError as error:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail={
                "msg": "Foreign key violation ! Check 'blocking recipe_items' and 'blocking meal_productions' fields",
                "blocking recipe_items": jsonable_encoder(meal.recipe_items),
                "blocking meal_productions": jsonable_encoder(meal.meal_productions),
                "original error": str(error.orig)
            }
        )
