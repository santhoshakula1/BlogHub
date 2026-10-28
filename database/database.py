from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase
import os
from dotenv import load_dotenv

load_dotenv()

def normalize_database_url(url: str) -> str:
   
    for old_start in ("postgres://", "postgresql://"):

        if url.startswith(old_start):

            return "postgresql+psycopg://" + url[len(old_start):]

    return url


DATABASE_URL = normalize_database_url(
    (os.getenv("DATABASE_URL") or "").strip()
)

if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not configured")

engine = create_engine(
    DATABASE_URL,
    hide_parameters=True,
    pool_pre_ping=True
)


SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False
)


class Base(DeclarativeBase):
    pass


def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()