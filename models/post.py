from sqlalchemy import String, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime
from sqlalchemy import  DateTime, func
from database.database import Base


class Post(Base):

    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(
        primary_key=True
    )

    title: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )

    content: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )

    author_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

    author = relationship(
        "User",
        back_populates="posts"
    )
    created_at: Mapped[datetime] = mapped_column(
           DateTime(timezone=True),
           server_default=func.now()
       )