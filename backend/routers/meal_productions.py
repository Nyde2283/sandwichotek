from fastapi import APIRouter, HTTPException, Depends, status
from sqlmodel import Session, select
from ..db.models import *
from ..db import get_session
from ..tools.response_models import *

router = APIRouter(
    prefix="/meal_productions",
    tags=["Meal Productions"]
)

@router.post("/", response_model=MealProductionPublicVerbose, responses={status.HTTP_404_NOT_FOUND: {"model": HTTPNotFound}})
def create_meal_production(meal_production: MealProductionCreate, session: Session = Depends(get_session)):
    """Create a new meal production."""
    db_meal_production = MealProduction.model_validate(meal_production)

    if not session.get(Meal, db_meal_production.meal_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meal not found")

    session.add(db_meal_production)
    session.commit()
    session.refresh(db_meal_production)
    return db_meal_production

@router.get("/", response_model=list[MealProductionPublicVerbose])
def search_meal_productions(meal_id: int | None = None, before: date | None = None, after: date | None = None, session: Session = Depends(get_session)):
    """Search for meal productions by meal or date."""
    statement = select(MealProduction)
    if meal_id is not None:
        statement = statement.where(MealProduction.meal_id == meal_id)
    if before is not None:
        statement = statement.where(MealProduction.date <= before)
    if after is not None:
        statement = statement.where(MealProduction.date >= after)
    return session.exec(statement).all()

@router.get("/{meal_production_id}", response_model=MealProductionPublicVerbose, responses={status.HTTP_404_NOT_FOUND: {"model": HTTPNotFound}})
def get_meal_production_by_id(meal_production_id: int, session: Session = Depends(get_session)):
    """Get a meal production identified by its ID."""
    meal_production = session.get(MealProduction, meal_production_id)
    if not meal_production:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meal production not found")
    session.refresh(meal_production)
    return meal_production

@router.put("/{meal_production_id}", response_model=MealProductionPublicVerbose, responses={status.HTTP_404_NOT_FOUND: {"model": HTTPNotFound}})
def update_meal_production(meal_production_id: int, meal_production: MealProductionUpdate, session: Session = Depends(get_session)):
    """Update a meal production identified by its ID."""
    db_meal_production = session.get(MealProduction, meal_production_id)
    if not db_meal_production:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meal production not found")

    meal_production_data = meal_production.model_dump(exclude_unset=True)
    db_meal_production.sqlmodel_update(meal_production_data)

    session.add(db_meal_production)
    session.commit()
    session.refresh(db_meal_production)
    return db_meal_production

@router.delete("/{meal_production_id}", status_code=status.HTTP_204_NO_CONTENT, responses={status.HTTP_404_NOT_FOUND: {"model": HTTPNotFound}})
def delete_meal_production(meal_production_id: int, session: Session = Depends(get_session)):
    """Delete a meal production identified by its ID."""
    meal_production = session.get(MealProduction, meal_production_id)
    if not meal_production:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Meal production not found")
    session.delete(meal_production)
    session.commit()
