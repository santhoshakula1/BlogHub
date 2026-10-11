from datetime import datetime, timezone

from sqlalchemy import String, DateTime,Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database.database import Base


class User(Base):

    __tablename__ = "users"

    id: Mapped[int] = mapped_column(
    primary_key=True,
    index=True
   )

    username: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )

    email: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True
    )

    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    created_at: Mapped[datetime | None] = mapped_column(
    DateTime,
    nullable=True,
    default=lambda: datetime.now(timezone.utc)
    )
    bio: Mapped[str | None] = mapped_column(
    Text,
    nullable=True
   )

    posts = relationship(
        "Post",
        back_populates="author"
    )