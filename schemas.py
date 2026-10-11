from pydantic import BaseModel, Field,ConfigDict
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
    email: str = Field(..., min_length=5, max_length=100)
    password: str = Field(..., min_length=6)
    
class UserLogin(BaseModel):
    username: str
    password: str


class UserOut(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime
    

class PostOut(BaseModel):
    id: int
    title: str
    content: str
    author_id: int
    author: AuthorOut
    created_at: datetime
    


    model_config = ConfigDict(from_attributes=True)