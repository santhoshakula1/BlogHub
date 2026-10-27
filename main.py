import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from slowapi import Limiter
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from sqlalchemy import func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload
from starlette.responses import JSONResponse

from database.database import get_db, engine, Base

from models.post import Post
from models.user import User

from schemas import (
    PostCreate,
    PostOut,
    PostUpdate,
    UserCreate,
    UserOut,
    UserLogin,
    AdminUserOut
    
)

from utils.auth import (
    create_access_token,
    get_current_user,
    get_current_admin
)

from utils.password import (
    hash_password,
    verify_password
    
)


@asynccontextmanager
async def lifespan(app: FastAPI):

    

    yield
    
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)
# The folder that contains main.py, so the app works no matter which
# folder you start it from.
BASE_DIR = Path(__file__).resolve().parent
limiter = Limiter(
    key_func=get_remote_address,
    enabled=os.getenv("RATE_LIMIT_ENABLED", "true").lower() != "false"
)
app = FastAPI(
    lifespan=lifespan
)
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):

    return JSONResponse(
        status_code=429,
        content={
            "detail": "Too many attempts. Please wait a minute and try again."
        },
        headers={"Retry-After": "60"}
    )
app.mount(
    "/static",
    StaticFiles(directory=BASE_DIR / "static"),
    name="static"
)


templates = Jinja2Templates(
    directory=BASE_DIR / "templates"
)


# =========================================================
# HTML ROUTES
# =========================================================


@app.get("/")
def home(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="index.html",
        context={
            "request": request
        }
    )


@app.get("/login")
def login_page(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="login.html",
        context={
            "request": request
        }
    )


@app.get("/register")
def register_page(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="register.html",
        context={
            "request": request
        }
    )


@app.get("/profile")
def profile_page(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="profile.html",
        context={
            "request": request
        }
    )


@app.get("/new-post")
def new_post_page(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="new_post.html",
        context={
            "request": request
        }
    )
@app.get("/edit-post/{post_id}")
def edit_post_page(request: Request, post_id: int):

    return templates.TemplateResponse(
        request=request,
        name="edit_post.html",
        context={
            "request": request,
            "post_id": post_id
        }
    )


@app.get("/blog/{post_id}")
def blog_page(
    request: Request,
    post_id: int
):

    return templates.TemplateResponse(
        request=request,
        name="blog.html",
        context={
            "request": request,
            "post_id": post_id
        }
    )


# =========================================================
# POST APIs
# =========================================================


@app.get(
    "/api/posts",
    response_model=list[PostOut]
)
def get_posts(
    db: Session = Depends(get_db)
):

    posts = (
        db.query(Post)
        .options(joinedload(Post.author))
        .order_by(Post.created_at.desc(), Post.id.desc())
        .all()
    )

    return posts


@app.get(
    "/api/posts/{post_id}",
    response_model=PostOut
)
def get_post(
    post_id: int,
    db: Session = Depends(get_db)
):

    post = db.query(Post).filter(
        Post.id == post_id
    ).first()

    if not post:

        raise HTTPException(
            status_code=404,
            detail="Post not found"
        )

    return post


@app.post(
    "/api/posts",
    response_model=PostOut
)
def create_post(
    post: PostCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    new_post = Post(
        title=post.title,
        content=post.content,
        author_id=current_user.id
    )

    try:

        db.add(new_post)

        db.commit()

        db.refresh(new_post)

    except Exception:

        db.rollback()

        logger.exception("Could not save post")

        raise HTTPException(
            status_code=500,
            detail="Could not save post"
        )

    return new_post


@app.put(
    "/api/posts/{post_id}",
    response_model=PostOut
)
def update_post(
    post_id: int,
    post_data: PostUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    post = db.query(Post).filter(
        Post.id == post_id
    ).first()

    if not post:

        raise HTTPException(
            status_code=404,
            detail="Post not found"
        )

    if post.author_id != current_user.id:

        raise HTTPException(
            status_code=403,
            detail="You can only update your own posts"
        )

    post.title = post_data.title

    post.content = post_data.content

    db.commit()

    db.refresh(post)

    return post


@app.delete(
    "/api/posts/{post_id}"
)
def delete_post(
    post_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):

    post = db.query(Post).filter(
        Post.id == post_id
    ).first()

    if not post:

        raise HTTPException(
            status_code=404,
            detail="Post not found"
        )

    if post.author_id != current_user.id and not current_user.is_admin:

        raise HTTPException(
            status_code=403,
            detail="You can only delete your own posts"
        )

    db.delete(post)

    db.commit()

    return {
        "message": "Post deleted successfully"
    }




@app.post("/api/auth/register", response_model=UserOut)
def register_user(
    user_data: UserCreate,
    db: Session = Depends(get_db)
):

    existing_user = db.query(User).filter(
        (func.lower(User.username) == user_data.username.lower()) |
        (func.lower(User.email) == user_data.email.lower())
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username or email already exists"
        )

    new_user = User(
        username=user_data.username,
        email=user_data.email,
        password_hash=hash_password(user_data.password)
    )

    try:

        db.add(new_user)

        db.commit()

        db.refresh(new_user)
        
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail="Username or email already exists"
        )

    except Exception:

        db.rollback()

        logger.exception("Could not create user")
        raise HTTPException(
            status_code=500,
            detail="Could not create user"
        )

    return new_user
@app.get("/admin")
def admin_page(request: Request):

    return templates.TemplateResponse(
        request=request,
        name="admin.html",
        context={"request": request}
    )
@app.get("/api/admin/users", response_model=list[AdminUserOut])
def list_users(
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):

    return db.query(User).order_by(User.id).all()


@app.delete("/api/admin/users/{user_id}")
def delete_user(
    user_id: int,
    admin: User = Depends(get_current_admin),
    db: Session = Depends(get_db)
):

    if user_id == admin.id:

        raise HTTPException(
            status_code=400,
            detail="Admins cannot delete their own account"
        )

    user = db.query(User).filter(User.id == user_id).first()

    if not user:

        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)

    db.commit()

    return {"message": "User and their posts deleted successfully"}

@app.post("/api/auth/login")
@limiter.limit("5/minute")
def login_user( request: Request, user_data: UserLogin, db: Session = Depends(get_db) ):
    user = db.query(User).filter( User.username == user_data.username ).first() 
    if not user: 
        raise HTTPException(status_code=401, detail="Invalid username or password" ) 
    password_valid = verify_password( user_data.password, user.password_hash ) 
    if not password_valid: 
        raise HTTPException( status_code=401, detail="Invalid username or password" ) 
    access_token = create_access_token(
        data={ "sub": str(user.id) } )
    return { "access_token": access_token, "token_type": "bearer" }

@app.get("/api/auth/me") 
def get_me( current_user: User = Depends(get_current_user) ): 
    return { "id": current_user.id, "username": current_user.username, "email": current_user.email, "created_at": current_user.created_at ,"is_admin": current_user.is_admin }

