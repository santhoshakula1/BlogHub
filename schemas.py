from pydantic import BaseModel, Field
from datetime import datetime


# =========================================================
# CREATE POST SCHEMA
# =========================================================
# Used when the client sends data to create a new post.
# =========================================================

class PostCreate(BaseModel):
    title: str = Field(
        ...,
        min_length=1,
        max_length=100
    )

    content: str = Field(
        ...,
        min_length=1
    )
# =========================================================
# POST OUTPUT SCHEMA
# =========================================================
# Used when FastAPI sends post data back to the frontend.
# =========================================================
class PostUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    content: str = Field(..., min_length=1)



class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    
class UserLogin(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime
    class Config:
        from_attributes = True

class PostOut(BaseModel):
    id: int
    title: str
    content: str
    author_id: int

    class Config:
        from_attributes = True