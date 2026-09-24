from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Field, SQLModel, Session, select
from typing import List, Optional
from ..db.models import *
from ..tools.auth import *

router = APIRouter(
    prefix="/users",
    tags=["Users"],
    dependencies=[Depends(verify_token)]
)

@router.get("/", response_model=List[UserPublic])
def search_users(q: Optional[str] = None, session: Session = Depends(get_session)):
    """Search for users by email or ID."""
    if q is None:
        return session.exec(select(User)).all()
    if q.isdigit():
        return session.exec(select(User).where(User.id == int(q))).all()
    else:
        return session.exec(select(User).where(User.email.ilike(f"%{q}%"))).all()


@router.post("/", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def create_user(user: UserCreate, session: Session = Depends(get_session)):
    """Create a new user."""
    db_user = User.model_validate(user)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


@router.put("/{user_id}", response_model=UserPublic)
def update_user_status(user_id: int, user_update: UserUpdateActive, session: Session = Depends(get_session)):
    """Update only the active status of a user."""
    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db_user.is_active = user_update.is_active
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: int, session: Session = Depends(get_session)):
    """Delete a user."""
    db_user = session.get(User, user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    session.delete(db_user)
    session.commit()
    return None