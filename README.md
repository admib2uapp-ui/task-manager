# Orbit — Project Management Platform

A premium, production-grade project management platform (Linear / Jira / Notion
style) for software engineering, AI research, university work, robotics and
freelance projects.

> **Status:** Phase 0 — Foundation & core architecture complete.
> Built incrementally, phase by phase (see [Roadmap](#roadmap)).

---

## Tech stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · Framer Motion · lucide-react · dnd-kit · Zustand · TanStack Query |
| Backend   | FastAPI · SQLAlchemy 2.0 (async) · Alembic · Pydantic v2 · PyJWT · asyncpg |
| Database  | PostgreSQL (Neon serverless) — SQLite fallback for local smoke tests |

## Architecture

Monorepo with two independently deployable apps:

```
task/
├─ frontend/   # Next.js app (feature-based structure)
└─ backend/    # FastAPI app (layered: router → service → repository → model)
```

### Frontend (feature-based)
```
src/
├─ app/                    # App Router routes
│  ├─ (app)/               # authenticated shell (sidebar + topbar)
│  └─ layout.tsx           # providers, theme, fonts
├─ features/<feature>/     # components / hooks / api / store / types per feature
├─ components/  ui · layout · shared · providers
├─ lib/         api-client · query-client · env · format · utils
├─ stores/      global Zustand stores
├─ config/      navigation · constants · site
└─ types/       shared domain types (mirror the API contract)
```

### Backend (clean layered)
```
app/
├─ main.py                 # app factory + middleware + lifespan
├─ core/    config · database · security · deps · exceptions
├─ models/  SQLAlchemy ORM (multi-tenant-ready: User, Workspace, membership)
├─ schemas/ Pydantic DTOs
├─ repositories/  generic async data-access layer
├─ services/      business logic
└─ api/v1/routers/  thin HTTP controllers
alembic/   # database migrations
tests/     # pytest
```

**Design decisions**

- **FastAPI + SQLAlchemy 2.0 + Alembic** instead of Prisma (Prisma is a
  TS-first ORM; the Python client is less mature). This is the production
  standard for async Python APIs.
- **Multi-tenant-ready schema** (Workspace + membership) so the app works
  single-user today and scales to a SaaS team product with no rewrite.
- **Server state via TanStack Query**, UI state via Zustand — clear separation,
  optimistic updates ready for the Kanban board.
- Dark-first premium theme driven by CSS variables + Tailwind v4 tokens.

---

## Getting started

### Prerequisites
- Node.js ≥ 20 and npm
- Python ≥ 3.11
- (Recommended) A Neon Postgres database — free tier

### 1. Backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\python -m pip install -r requirements-dev.txt

# Configure environment
copy .env.example .env
# → edit .env and set DATABASE_URL to your Neon connection string
#   (leave the SQLite default to run without any external service)

# Apply migrations
.\.venv\Scripts\alembic upgrade head

# Run the API (http://localhost:8000, docs at /docs)
.\.venv\Scripts\uvicorn app.main:app --reload
```

Quality gates:
```powershell
.\.venv\Scripts\ruff check .
.\.venv\Scripts\mypy app
.\.venv\Scripts\python -m pytest
```

### 2. Frontend

```powershell
cd frontend
npm install

copy .env.example .env.local   # defaults to http://localhost:8000

npm run dev                    # http://localhost:3000
```

Quality gates:
```powershell
npm run typecheck
npm run lint
npm run format:check
```

---

## Connecting Neon

1. Create a project at [neon.tech](https://neon.tech) and copy the connection
   string (it looks like `postgresql://user:pass@ep-xxx.region.aws.neon.tech/db?sslmode=require`).
2. Paste it into `backend/.env` as `DATABASE_URL`. The app automatically switches
   to the `asyncpg` driver and handles `sslmode=require`.
3. Run `alembic upgrade head`.

---

## Roadmap

- [x] **Phase 0** — Foundation: monorepo, theme, app shell, API client,
      FastAPI skeleton, DB + migrations, health checks, quality gates.
- [ ] **Phase 1** — Authentication (JWT access/refresh, register/login, profile).
- [ ] **Phase 2** — Projects (CRUD, detail tabs, tags, favorites, archive).
- [ ] **Phase 3** — Tasks + Kanban board (dnd-kit, full task detail).
- [ ] **Phase 4** — Dashboard.
- [ ] **Phase 5** — Command palette, search, filters, shortcuts.
- [ ] **Phase 6** — Time tracking.
- [ ] **Phase 7** — Calendar.
- [ ] **Phase 8** — Analytics.
- [ ] **Phase 9** — Notifications, documents, GitHub integration, attachments.
- [ ] **Phase 10** — PWA/offline, undo/redo, OAuth, real-time, polish.
