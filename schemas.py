from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from datetime import datetime



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


class PostUpdate(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    content: str = Field(..., min_length=1)


class AuthorOut(BaseModel):
        username: str
        
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)

    @field_validator("username")
    @classmethod
    def clean_username(cls, value):
        value = value.strip()
        if len(value) < 3:
            raise ValueError("Username must be at least 3 characters")
        return value

    @field_validator("email",mode="before")
    @classmethod
    def clean_email(cls, value):
        return value.strip().lower()


class UserLogin(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime
    
class AdminUserOut(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime | None = None
    is_admin: bool

    
class PostOut(BaseModel):
    id: int
    title: str
    content: str
    author_id: int
    author: AuthorOut
    created_at: datetime
    


    model_config = ConfigDict(from_attributes=True)