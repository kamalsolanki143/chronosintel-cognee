"""
api/auth.py
===========
FastAPI router for authentication endpoints.

Prefix : /auth
Tags   : ["Authentication"]

Endpoints
---------
POST  /auth/signup   → create user account, return UserOut
POST  /auth/login    → verify credentials, return JWT Token
GET   /auth/me       → return current user profile (protected)

Added by: Muskan Yeshminali (Auth Module)
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.database.models import User
from app.database.schemas import Token, UserCreate, UserLogin, UserOut
from app.services.auth_service import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/signup",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new user",
)
def signup(payload: UserCreate, db: Session = Depends(get_db)) -> User:
    """
    Create a new platform user.
    Returns HTTP 409 if the email is already registered.
    """
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"An account with email '{payload.email}' already exists.",
        )
    new_user = User(
        full_name=payload.full_name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post(
    "/login",
    response_model=Token,
    summary="Login and get a JWT access token",
)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> dict:
    """
    Authenticate with email + password, return a JWT Bearer token.
    Returns the same error for bad email and bad password (prevents
    email enumeration attacks).
    """
    _invalid = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid email or password.",
        headers={"WWW-Authenticate": "Bearer"},
    )
    user: User | None = db.query(User).filter(User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise _invalid
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact an administrator.",
        )
    return {
        "access_token": create_access_token({"sub": user.email}),
        "token_type": "bearer",
    }


@router.get(
    "/me",
    response_model=UserOut,
    summary="Get current user profile",
)
def get_me(current_user: User = Depends(get_current_user)) -> User:
    """Return the profile of the currently authenticated user."""
    return current_user
