import os
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from google.oauth2 import id_token
from google.auth.transport import requests
from sqlmodel import Session, select

from ..db import get_session
from ..db.models import User

security = HTTPBearer()

GOOGLE_CLIENT_ID = os.getenv("OAUTH_ID", "")
ALLOWED_EMAILS = [
    email.strip().lower() 
    for email in os.getenv("ALLOWED_EMAILS", "").split(",") 
    if email.strip()
]

def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session)
) -> User:
    token = credentials.credentials
    try:
        # 1. Validation du token Google
        user_info = id_token.verify_oauth2_token(
            token, 
            requests.Request(), 
            GOOGLE_CLIENT_ID
        )

        email = user_info.get("email", "").lower()

        statement = select(User).where(User.email == email)
        user = session.exec(statement).first()

        if not user:
            if ALLOWED_EMAILS and email in ALLOWED_EMAILS:
                user = User(
                    email=email,
                )
                session.add(user)
                session.commit()
                session.refresh(user)

        if user:
            return user

        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"L'adresse email {email} n'est pas autorisée à accéder à l'application."
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token invalide ou expiré : {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )