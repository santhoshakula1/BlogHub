from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from datetime import datetime
import re



class PostBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=100)
    content: str = Field(..., min_length=1, max_length=20000)

    # mode="before" = runs BEFORE the length rules, so a title made only of
    # spaces becomes "" and is rejected, and spaces don't count toward the limit.
    @field_validator("title", "content", mode="before")
    @classmethod
    def strip_text(cls, value):
        if isinstance(value, str):
            value = value.strip()
        return value


class PostCreate(PostBase):
    pass


class PostUpdate(PostBase):
    pass

class AuthorOut(BaseModel):
        username: str
        

USERNAME_PATTERN = re.compile(r"[A-Za-z0-9_]{3,30}")

COMMON_PASSWORDS = {
    "12345678", "123456789", "1234567890", "11111111", "00000000", "12341234",
    "password", "password1", "password123", "passw0rd", "p@ssw0rd",
    "qwerty123", "qwertyuiop", "qwerty12", "iloveyou", "abc12345",
    "admin123", "welcome1", "welcome123", "letmein123",
}


class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=30)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)

    # mode="before": trim first, then check the characters.
    @field_validator("username", mode="before")
    @classmethod
    def clean_username(cls, value):
        if isinstance(value, str):
            value = value.strip()
            if not USERNAME_PATTERN.fullmatch(value):
                raise ValueError(
                    "Username must be 3 to 30 characters: "
                    "letters, numbers and underscores only"
                )
        return value

    @field_validator("email", mode="before")
    @classmethod
    def clean_email(cls, value):
        if isinstance(value, str):
            value = value.strip().lower()
            if len(value) > 100:  # the database column is String(100)
                raise ValueError("Email must be 100 characters or fewer")
        return value

    # No mode: runs AFTER the length rules above passed.
    @field_validator("password")
    @classmethod
    def check_password(cls, value):
        if not value.strip():
            raise ValueError("Password cannot be only spaces")
        if value.lower() in COMMON_PASSWORDS:
            raise ValueError("This password is too common, please choose another")
        return value
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

class PostListOut(BaseModel):
    id: int
    title: str
    excerpt: str
    author_id: int
    author: AuthorOut
    created_at: datetime
    
class PostOut(BaseModel):
    id: int
    title: str
    content: str
    author_id: int
    author: AuthorOut
    created_at: datetime
    


    model_config = ConfigDict(from_attributes=True)