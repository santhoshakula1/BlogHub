from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

from jose import JWTError, jwt

from sqlalchemy.orm import Session

from database.database import get_db
from models.user import User


import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = (os.getenv("SECRET_KEY") or "").strip()
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(
    os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30")
)

MIN_SECRET_KEY_LENGTH = 32


EXAMPLE_SECRET_KEYS = {
    "your-secret-key",
    "paste-a-long-random-string",
    "changeme",
    "secret",
}

if not SECRET_KEY:
    raise RuntimeError("SECRET_KEY is not configured")

if (
    SECRET_KEY.lower() in EXAMPLE_SECRET_KEYS
    or len(SECRET_KEY) < MIN_SECRET_KEY_LENGTH
):
    raise RuntimeError(
        "SECRET_KEY is too weak: use at least 32 random characters, never "
        "an example value. Create one with: "
        'python -c "import secrets; print(secrets.token_hex(32))"'
    )


if ALGORITHM not in ("HS256", "HS384", "HS512"):
    raise RuntimeError("ALGORITHM must be HS256, HS384 or HS512")

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/auth/login"
)


def create_access_token(data: dict):

    to_encode = data.copy()

    expire = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({
        "exp": expire
    })

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={
            "WWW-Authenticate": "Bearer"
        }
    )

    try:

        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception

        user_id = int(user_id)

    except (JWTError, ValueError, TypeError):

        raise credentials_exception

    user = db.query(User).filter(
        User.id == user_id
    ).first()

    if user is None:
        raise credentials_exception

    return user

def get_current_admin(
    current_user: User = Depends(get_current_user)
):

    if not current_user.is_admin:

        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )

    return current_user