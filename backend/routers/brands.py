from fastapi import APIRouter, HTTPException, Depends, status
from sqlmodel import Session, select
from ..db.models import *
from ..db import get_session

router = APIRouter(
    prefix="/brands",
    tags=["Brands"]
)

@router.post("/", response_model=BrandPublicVerbose)
def create_brand(brand: BrandCreate, session: Session = Depends(get_session)):
        db_brand = Brand.model_validate(brand)
        session.add(db_brand)
        session.commit()
        session.refresh(db_brand)
        return db_brand

@router.get("/",  response_model=list[BrandPublicVerbose])
def get_all_brands(session: Session = Depends(get_session)):
    return session.exec(select(Brand)).all()

@router.get("/{brand_id}",  response_model=BrandPublicVerbose)
def get_brand_by_id(brand_id: int, session: Session = Depends(get_session)):
    brand = session.get(Brand, brand_id)
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")
    session.refresh(brand)
    return brand

@router.put("/{brand_id}",  response_model=BrandPublicVerbose)
def update_brand(brand_id: int, brand: BrandUpdate, session: Session = Depends(get_session)):
    db_brand = session.get(Brand, brand_id)
    if not db_brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")
    brand_data = brand.model_dump(exclude_unset=True)
    db_brand.sqlmodel_update(brand_data)
    session.add(db_brand)
    session.commit()
    session.refresh(db_brand)
    return db_brand

@router.delete("/{brand_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_brand(brand_id: int, session: Session = Depends(get_session)):
    brand = session.get(Brand, brand_id)
    if not brand:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Brand not found")
    session.delete(brand)
    session.commit()
    return "ok"
