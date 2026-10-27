from datetime import datetime, timezone

from sqlalchemy import String, DateTime,Text,Boolean,false,Index,func
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
    DateTime(timezone=True),
    nullable=True,
    default=lambda: datetime.now(timezone.utc)
    )
    bio: Mapped[str | None] = mapped_column(
    Text,
    nullable=True
   )
    is_admin: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        server_default=false()
    )

    posts = relationship(
        "Post",
        back_populates="author",
        cascade="all, delete-orphan"
    )
    

Index("uq_users_username_lower", func.lower(User.username), unique=True)
Index("uq_users_email_lower", func.lower(User.email), unique=True)