# BlogHub — Full-Stack Blog Platform



A multi-user blogging web app where people can register, write posts, and manage their own content, with an **admin role** that can moderate posts and users. Built end to end: a **FastAPI** REST backend, a **PostgreSQL** database managed with **SQLAlchemy 2.0 + Alembic migrations**, and a responsive front end in **plain HTML, CSS and JavaScript** (no framework).

<!--
  Add 2–3 screenshots here, they help a lot. Save the images in a docs/screenshots/ folder, then:
  ![Home page](docs/screenshots/home.png)
  ![Blog post with owner buttons](docs/screenshots/post.png)
  ![Admin panel](docs/screenshots/admin.png)
-->

---

## Features

**For readers and writers**
- Register and log in with a username and password
- Create, edit and delete your own blog posts
- Home page with a card for every post (author and date shown); each post has its own page
- Profile page showing account details
- Share a post by copying the link, WhatsApp or email
- Dark mode (remembered between visits) and a layout that adapts to tablet and mobile

**Access control**
- Only the **author** can edit a post. Only the **author or an admin** can delete it
- Edit and Delete buttons are shown only to people allowed to use them, and the **server enforces the same rules**, so hiding a button is never the only protection

**Admin panel** (`/admin`)
- Lists all registered users
- Deletes any user, together with all of that user's posts
- An admin cannot delete their own account
- Admin status cannot be obtained through the sign-up form; it is granted directly in the database

---

## Tech stack

| Layer | Technology | What it does here |
|---|---|---|
| Language | Python 3.13 | Backend |
| Web framework | FastAPI | REST API, dependency injection, automatic interactive docs at `/docs` |
| Validation | Pydantic v2 | Checks every request (title 1–100 characters, username 3–50, password 6+) and shapes every response |
| Database | PostgreSQL + psycopg 3 | Stores users and posts |
| ORM | SQLAlchemy 2.0 (typed `Mapped` models) | Tables as Python classes, one-to-many relationship, cascade delete |
| Migrations | Alembic | Versioned schema changes (`bio`, `posts.created_at`, `users.is_admin`) |
| Authentication | JWT (python-jose) | Stateless login tokens that expire (30 minutes by default) |
| Password security | Argon2id (pwdlib) | Passwords are stored only as salted hashes |
| Templates | Jinja2 | Serves the HTML pages |
| Front end | Vanilla JavaScript, CSS | `fetch` + `async/await`, DOM updates, `localStorage`, responsive CSS |
| Config | python-dotenv | Secrets and database URL kept out of the code |

---

## Skills demonstrated

| Skill | Where to see it in this project |
|---|---|
| **REST API design** | 10 endpoints with correct status codes (200, 400, 401, 403, 404, 422) and typed request/response schemas in `main.py` and `schemas.py` |
| **Authentication** | Login issues a signed JWT; a `get_current_user` dependency in `utils/auth.py` protects routes |
| **Authorization (roles)** | Owner-only edit, owner-or-admin delete, admin-only user management through a reusable `get_current_admin` dependency |
| **Database design** | Users → Posts one-to-many with a foreign key, unique and indexed columns, and ORM-level cascade delete |
| **Schema migrations** | 4 Alembic revisions, including adding a `NOT NULL` column with a server default to a table that already contains rows |
| **Security basics** | Argon2id password hashing, XSS-safe rendering (escaped HTML / `textContent`), secrets in `.env` and ignored by Git, startup fails fast if config is missing, privilege escalation blocked at sign-up |
| **Front-end fundamentals** | A multi-page UI without a framework: authenticated API calls, role-based UI, dark mode, responsive breakpoints |
| **Debugging & review** | Found and fixed a role-visibility bug (a Delete button shown to every visitor) while reviewing the delete feature |
| **Git & GitHub** | Feature-by-feature commit history on GitHub |

---

## Project structure

```
BlogHub/
├── main.py                 # FastAPI app: HTML page routes + REST API endpoints
├── schemas.py              # Pydantic request / response models
├── models/
│   ├── user.py             # User table (is_admin flag, posts relationship)
│   └── post.py             # Post table (author foreign key, created_at)
├── utils/
│   ├── auth.py             # JWT creation, get_current_user, get_current_admin
│   └── password.py         # Argon2id hashing and verification
├── database/
│   └── database.py         # Engine, session, get_db dependency
├── alembic/                # Migration environment and versions
├── templates/              # Jinja2 pages: home, login, register, profile, post, edit, admin
├── static/
│   ├── css/style.css       # Styling, dark mode, responsive breakpoints
│   └── js/app.js           # Front-end logic (auth, posts, admin)
├── .env.example            # Template for required settings
└── requirements.txt        # Pinned dependencies
```

---

## API overview

Interactive documentation is available at **`/docs`** once the app is running.

| Method | Endpoint | Who can use it |
|---|---|---|
| `POST` | `/api/auth/register` | Anyone |
| `POST` | `/api/auth/login` | Anyone (returns a JWT) |
| `GET` | `/api/auth/me` | Logged-in user |
| `GET` | `/api/posts` | Anyone |
| `GET` | `/api/posts/{id}` | Anyone |
| `POST` | `/api/posts` | Logged-in user |
| `PUT` | `/api/posts/{id}` | Post author |
| `DELETE` | `/api/posts/{id}` | Post author or admin |
| `GET` | `/api/admin/users` | Admin |
| `DELETE` | `/api/admin/users/{id}` | Admin |

Protected endpoints expect the header `Authorization: Bearer <token>`.

Pages: `/` · `/login` · `/register` · `/profile` · `/new-post` · `/blog/{id}` · `/edit-post/{id}` · `/admin`

---

## Run it locally

**You need:** Python 3.13 and PostgreSQL.

**1. Get the code and install dependencies**

```bash
git clone https://github.com/santhoshakula1/BlogHub.git
cd BlogHub
python -m venv venv
```

Activate the virtual environment (Windows PowerShell: `venv\Scripts\Activate.ps1`, macOS/Linux: `source venv/bin/activate`), then:

```bash
pip install -r requirements.txt
```

**2. Create an empty database** (with `psql` or pgAdmin)

```sql
CREATE DATABASE blog_platform;
```

**3. Configure settings**

Copy `.env.example` to `.env` and fill in your values:

```env
DATABASE_URL="postgresql+psycopg://postgres:YOUR_PASSWORD@localhost:5432/blog_platform"
SECRET_KEY=paste-a-long-random-string
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

Generate a strong secret key with:

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

**4. Create the tables and record the migration state**

```bash
python -c "from database.database import Base, engine; import models.user, models.post; Base.metadata.create_all(engine)"
alembic stamp head
```

**5. Start the app**

```bash
uvicorn main:app --reload
```

Open **http://127.0.0.1:8000**, register an account, and create a post. API docs are at http://127.0.0.1:8000/docs.

**6. (Optional) Make yourself an admin**

Register first, then run this in `psql` or pgAdmin using your own username:

```sql
UPDATE users SET is_admin = true WHERE username = 'your_username';
```

Refresh the site: an **Admin** link appears in the home page navbar.

---

## Database migrations

The initial `users` and `posts` tables are created from the models (step 4 above). From then on, Alembic tracks every schema change. After editing a model:

```bash
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```

---

## Roadmap

Ideas for taking the project further:

- [ ] Automated tests with `pytest` and a CI workflow
- [ ] Pagination and newest-first ordering on the home page
- [ ] Case-insensitive unique usernames and proper email validation
- [ ] Docker setup and a live deployment
- [ ] Comments, likes and post categories

---

## Author

**Santhosh** · [GitHub: @santhoshakula1](https://github.com/santhoshakula1)

<!-- Add your LinkedIn and/or email here so recruiters can reach you. -->
