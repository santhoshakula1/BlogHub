# BlogHub — Full-Stack Blog Platform


A multi-user blogging web app where people can register, write posts, and manage their own content, with an **admin role** that can moderate posts and users. Built end to end: a **FastAPI** REST backend, a **PostgreSQL** database managed with **SQLAlchemy 2.0 + Alembic migrations**, and a responsive front end in **plain HTML, CSS and JavaScript** (no framework).

---

## Features

**For readers and writers**
- Register and log in with a username and password (login ignores capitalization, so `Anita` and `anita` are the same account)
- Create, edit and delete your own blog posts
- Home page with a card and short preview for every post, newest first, loaded 10 at a time with a **Load more** button; each post has its own page
- **Drafts are never lost:** if your login expires while you are writing, the text is saved in your browser and restored after you log in again
- Profile page showing account details
- Share a post by copying the link, WhatsApp or email
- Dark mode (remembered between visits) and a layout that adapts to tablet and mobile
- Friendly 404 page for wrong web addresses

**Access control**
- Only the **author** can edit a post. Only the **author or an admin** can delete it
- Edit and Delete buttons are shown only to people allowed to use them, and the **server enforces the same rules**, so hiding a button is never the only protection
- Usernames and emails are unique **regardless of capitalization**, so `Admin` and `admin` cannot both exist

**Admin panel** (`/admin`)
- Lists all registered users
- Deletes regular users, together with all of that user's posts
- Admin accounts are protected: they cannot be deleted from the panel
- Admin status cannot be obtained through the sign-up form; it is granted directly in the database

---

## Security and reliability

| Protection | How it works |
|---|---|
| **Input validation** | Usernames: 3–30 letters, numbers or underscores. Emails: real email format. Passwords: 8–128 characters, and very common ones (like `password123`) are refused. Posts: title up to 100 characters, content up to 20,000 |
| **Rate limiting** | Per visitor IP address: login 5 per minute, registration 10 per hour, new posts 30 per hour. Too many attempts get a clear "please wait" message. Limits are kept in memory, per running process |
| **Strong secrets enforced** | The app refuses to start if `SECRET_KEY` is missing, shorter than 32 characters, or still an example value, or if `ALGORITHM` is not a supported HMAC type |
| **Password storage** | Argon2id salted hashes only; plain passwords are never stored or logged |
| **Security headers** | Every response carries `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy` and `Permissions-Policy`; `Strict-Transport-Security` is added over HTTPS |
| **Safe errors and logs** | Server problems are logged with Python `logging`; database values are hidden from error messages |
| **XSS-safe pages** | Text from users is inserted as plain text, never as HTML |
| **Resilient database connection** | `pool_pre_ping` re-checks a connection before use, so a restarted database does not cause errors |

---

## Tech stack

| Layer | Technology | What it does here |
|---|---|---|
| Language | Python 3.13 | Backend |
| Web framework | FastAPI | REST API, dependency injection, automatic interactive docs at `/docs` |
| Validation | Pydantic v2 | Checks every request and shapes every response |
| Database | PostgreSQL + psycopg 3 | Stores users and posts |
| ORM | SQLAlchemy 2.0 (typed `Mapped` models) | Tables as Python classes, one-to-many relationship, cascade delete |
| Migrations | Alembic | Builds the whole schema from an empty database and versions every change (6 revisions) |
| Authentication | JWT (python-jose) | Stateless login tokens that expire (30 minutes by default) |
| Password security | Argon2id (pwdlib) | Passwords are stored only as salted hashes |
| Rate limiting | slowapi | Limits repeated logins, sign-ups and posts per IP address |
| Templates | Jinja2 | Serves the HTML pages |
| Front end | Vanilla JavaScript, CSS | `fetch` + `async/await`, DOM updates, `localStorage`, responsive CSS |
| Config | python-dotenv | Secrets and database URL kept out of the code |

---

## Skills demonstrated

| Skill | Where to see it in this project |
|---|---|
| **REST API design** | 10 endpoints with correct status codes (200, 400, 401, 403, 404, 422, 429) and typed request/response schemas in `main.py` and `schemas.py` |
| **Authentication** | Login issues a signed JWT; a `get_current_user` dependency in `utils/auth.py` protects routes |
| **Authorization (roles)** | Owner-only edit, owner-or-admin delete, admin-only user management through a reusable `get_current_admin` dependency |
| **Database design** | Users → Posts one-to-many with a foreign key, unique and indexed columns, case-insensitive unique indexes, ORM-level cascade delete |
| **Performance** | The home page loads one page of posts at a time (`limit` / `offset`) and the database sends only a short preview of each post, not the full text |
| **Schema migrations** | 6 Alembic revisions that build the database from scratch (`alembic upgrade head`) and can be rolled back; includes adding a `NOT NULL` column with a server default to a table that already contains rows |
| **Security basics** | Argon2id hashing, input validation, rate limiting, enforced strong secrets, security headers, XSS-safe rendering, secrets in `.env` and ignored by Git, privilege escalation blocked at sign-up, look-alike duplicate accounts blocked |
| **Front-end fundamentals** | A multi-page UI without a framework: authenticated API calls, role-based UI, saved drafts, clear error messages, dark mode, responsive breakpoints |
| **Debugging & review** | Reviewed the whole project and fixed issues one at a time, each tested before and after (for example a Delete button shown to every visitor, and an expired login that used to lose a half-written post) |
| **Git & GitHub** | Feature-by-feature commit history on GitHub |

---

## Project structure

```
BlogHub/
├── main.py                 # FastAPI app: HTML page routes + REST API endpoints
├── schemas.py              # Pydantic request / response models and validation
├── models/
│   ├── user.py             # User table (is_admin flag, posts relationship)
│   └── post.py             # Post table (author foreign key, created_at)
├── utils/
│   ├── auth.py             # JWT creation, get_current_user, get_current_admin
│   └── password.py         # Argon2id hashing and verification
├── database/
│   └── database.py         # Engine, session, get_db dependency
├── alembic/                # Migration environment and versions
├── templates/              # Jinja2 pages: home, login, register, profile, post, new post, edit, admin, 404
├── static/
│   ├── css/style.css       # Styling, dark mode, responsive breakpoints
│   └── js/app.js           # Front-end logic (auth, posts, drafts, admin)
├── .env.example            # Template for required settings
├── pyproject.toml          # Project metadata and dependencies (uv)
└── requirements.txt        # Pinned dependencies (pip)
```

---

## API overview

Interactive documentation is available at **`/docs`** once the app is running.

| Method | Endpoint | Who can use it |
|---|---|---|
| `POST` | `/api/auth/register` | Anyone |
| `POST` | `/api/auth/login` | Anyone (returns a JWT) |
| `GET` | `/api/auth/me` | Logged-in user |
| `GET` | `/api/posts?limit=10&offset=0` | Anyone (a page of posts with short previews) |
| `GET` | `/api/posts/{id}` | Anyone (the full post) |
| `POST` | `/api/posts` | Logged-in user |
| `PUT` | `/api/posts/{id}` | Post author |
| `DELETE` | `/api/posts/{id}` | Post author or admin |
| `GET` | `/api/admin/users` | Admin |
| `DELETE` | `/api/admin/users/{id}` | Admin (regular users only) |

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

(Prefer [uv](https://docs.astral.sh/uv/)? Run `uv sync` instead.)

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

Generate a strong secret key (the app refuses to start with a short or example one):

```bash
python -c "import secrets; print(secrets.token_hex(32))"
```

**4. Create the tables**

```bash
alembic upgrade head
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

## Running it for real users

The steps above are for development. When you put the app on a server:

- Use a **new** random `SECRET_KEY` (never the one from your laptop) and a hosted PostgreSQL database, set as environment variables on the host
- Run `alembic upgrade head` once against that database
- Start without `--reload`. Behind a proxy or hosting platform that provides HTTPS, use:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips="*"
```

The proxy flags make rate limits count each visitor's real IP address instead of the proxy's.

---

## Database migrations

Alembic builds the entire schema from an empty database (step 4 above) and tracks every later change. After editing a model:

```bash
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```

---

## Roadmap

Ideas for taking the project further:

- [x] Pagination on the home page
- [x] Proper email format validation
- [x] Rate limiting and security headers
- [ ] Automated tests with `pytest` and a CI workflow
- [ ] Docker setup and a live deployment
- [ ] Comments, likes and post categories

---

## Author

**Santhosh** · [GitHub: @santhoshakula1](https://github.com/santhoshakula1)
