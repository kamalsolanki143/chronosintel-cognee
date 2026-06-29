"""
services/auth_service.py
========================
Auth business logic: password hashing, JWT creation/decoding,
and the reusable `get_current_user` FastAPI dependency.

Added by: Muskan Yeshminali (Auth Module)

TEAM USAGE — protecting your endpoints
----------------------------------------
    from app.services.auth_service import get_current_user
    from app.database.models import User

    @router.get("/your-route")
    async def protected(current_user: User = Depends(get_current_user)):
        return {"user": current_user.email}
"""

from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.config import settings
from app.database.database import get_db
from app.database.models import User

# ---------------------------------------------------------------------------
# bcrypt work factor
# ---------------------------------------------------------------------------
_BCRYPT_ROUNDS = 12

# ---------------------------------------------------------------------------
# OAuth2 bearer scheme — tokenUrl shown in Swagger UI /docs
# ---------------------------------------------------------------------------
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


# ===========================================================================
# Password helpers
# ===========================================================================

def hash_password(password: str) -> str:
    """Return a bcrypt hash of `password`."""
    salt = bcrypt.gensalt(rounds=_BCRYPT_ROUNDS)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Return True if `plain_password` matches `hashed_password`."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )


# ===========================================================================
# JWT helpers
# ===========================================================================

def create_access_token(
    data: dict,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Encode a signed JWT.

    Parameters
    ----------
    data          : Claims dict. Must include {"sub": <email>}.
    expires_delta : Override default expiry from settings.
    """
    payload = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta
        if expires_delta is not None
        else timedelta(minutes=settings.access_token_expire_minutes)
    )
    payload["exp"] = expire
    payload["iat"] = datetime.now(timezone.utc)
    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(token: str) -> dict:
    """
    Decode and validate a JWT string.

    Raises HTTP 401 if the token is malformed, expired, or missing `sub`.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
        )
        sub: Optional[str] = payload.get("sub")
        if sub is None:
            raise credentials_exception
        return payload
    except JWTError:
        raise credentials_exception


# ===========================================================================
# FastAPI dependency — import this in any route to protect it
# ===========================================================================

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    FastAPI dependency: validates JWT and returns the authenticated User.

    Raises HTTP 401 for invalid/missing token.
    Raises HTTP 403 if the account is deactivated.
    """
    payload = decode_access_token(token)
    email: Optional[str] = payload.get("sub")

    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token payload missing 'sub' claim",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user: Optional[User] = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found — token may be stale",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated — contact an administrator",
        )
    return user


async def get_current_active_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    """Stricter dependency — only allows users with role == 'admin'."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator privileges required",
        )
    return current_user
