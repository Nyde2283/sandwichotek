from fastapi import APIRouter, HTTPException, Depends
from sqlmodel import Session, select
from ..db.models import *
from ..db import get_session

router = APIRouter(
    prefix="/shelfs",
    tags=["Shelfs"]
)

@router.post("/", response_model=Shelf)
def create_shelf(shelf: ShelfCreate, session: Session = Depends(get_session)):
        db_shelf = Shelf.model_validate(shelf)
        session.add(db_shelf)
        session.commit()
        session.refresh(db_shelf)
        return db_shelf

@router.get("/",  response_model=list[ShelfPublic])
def get_all_ingredients(session: Session = Depends(get_session)):
    return session.exec(select(Shelf)).all()

@router.get("/{shelf_id}",  response_model=ShelfPublic)
def get_shelf_by_id(shelf_id: int, session: Session = Depends(get_session)):
    shelf = session.get(Shelf, shelf_id)
    if not shelf:
        raise HTTPException(status_code=404, detail="Shelf not found")
    session.refresh(shelf)
    return shelf

@router.put("/{shelf_id}",  response_model=ShelfPublic)
def update_shelf(shelf_id: int, shelf: ShelfUpdate, session: Session = Depends(get_session)):
    db_shelf = session.get(Shelf, shelf_id)
    if not db_shelf:
        raise HTTPException(status_code=404, detail="Shelf not found")
    shelf_data = shelf.model_dump(exclude_unset=True)
    db_shelf.sqlmodel_update(shelf_data)
    session.add(db_shelf)
    session.commit()
    session.refresh(db_shelf)
    return db_shelf

@router.delete("/{shelf_id}")
def delete_shelf(shelf_id: int, session: Session = Depends(get_session)):
    shelf = session.get(Shelf, shelf_id)
    if not shelf:
        return HTTPException(status_code=404, detail="Shelf not found")
    session.delete(shelf)
    session.commit()
    return "ok"
