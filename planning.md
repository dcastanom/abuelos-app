# Planning — abuelos-app

## Phases Overview

| Phase | Focus | Deliverable |
|-------|-------|-------------|
| 0 | Repository & tooling setup | Runnable skeleton, CI ready |
| 1 | Auth & multi-tenancy | Login, company signup, session management |
| 2 | Residents — Gerontological Files | Full CRUD for resident records |
| 3 | Nursing Notes | Append-only progress notes per resident |
| 4 | Contracts & PDF | Contract management + PDF export |
| 5 | User management & RBAC | Admin manages staff accounts |
| 6 | i18n, UX polish & hardening | Spanish/English switch, error handling, accessibility |
| 7 | Deployment | Dockerized production setup |

---

## Phase 0 — Repository & Tooling

**Goal:** Both services start locally with a single command; CI lints and type-checks on every push.

### Backend (FastAPI)
- [x] Initialize Python project with `pyproject.toml` (Poetry or uv)
- [x] Add FastAPI, Uvicorn, Motor (async MongoDB driver), PyJWT, WeasyPrint, python-dotenv
- [x] Folder structure: `backend/app/{api,core,db,models,schemas,services,templates}/`
- [x] MongoDB connection via Motor (configured through env vars)
- [x] Health check endpoint `GET /health`
- [x] Dockerfile for backend

### Frontend (Next.js)
- [x] `npx create-next-app@latest` with TypeScript, App Router, Tailwind CSS
- [x] Add `next-intl`, `react-hook-form`, `zod`, `axios` (or `ky`)
- [x] Folder structure per `design.md` Section 7
- [x] Dockerfile for frontend

### Project root
- [x] `docker-compose.yml`: frontend + backend + MongoDB
- [x] `.env.example` with all required variables documented
- [ ] GitHub Actions workflow: lint + type-check on push

---

## Phase 1 — Authentication & Multi-tenancy

**Goal:** Users can register a company, confirm their email, log in, and be redirected to their company workspace. Session expires after 3 minutes of inactivity.

### Backend
- [ ] `Company` and `User` Pydantic models + MongoDB collections
- [ ] `POST /auth/register-company`: create company (inactive) + admin user + send confirmation email
- [ ] `GET /auth/confirm/:token`: activate company
- [ ] `POST /auth/login`: validate credentials → return access token (15 min) + set refresh token cookie
- [ ] `POST /auth/refresh`: validate refresh cookie → issue new access token
- [ ] `POST /auth/logout`: clear refresh cookie
- [ ] JWT middleware: validates access token, injects `current_user` into request state
- [ ] RBAC dependency: `require_role(...)` FastAPI dependency
- [ ] Email utility (Jinja2 template + SMTP)

### Frontend
- [ ] `/login` page — email + password form, error states
- [ ] `/register` page — company name, legal ID, admin email + password
- [ ] `/confirm/[token]` page — calls confirm endpoint, shows success/error
- [ ] Next.js middleware: redirect unauthenticated users to `/login`
- [ ] Axios interceptor: attach access token, auto-refresh on 401
- [ ] Inactivity timer component (3-minute idle → logout + redirect)
- [ ] Auth context/store (user info, company slug, role)

---

## Phase 2 — Residents (Gerontological Files)

**Goal:** Authorized users can create, view, search, update, and (admins) delete resident records.

**Prerequisite:** Read `docs/residents_file.md` and map all fields before writing any schema or form.

### Backend
- [ ] `Resident` model: check the docs/residents_file.md
- [ ] `GET /residents` — paginated list with search by name and ID number
- [ ] `POST /residents`
- [ ] `GET /residents/:id`
- [ ] `PUT /residents/:id`
- [ ] `DELETE /residents/:id` (admin only)
- [ ] All queries scoped to `company_id`

### Frontend
- [ ] `/[company]/residents` — searchable, paginated list table with 20 records by page.
- [ ] `/[company]/residents/new` — multi-step form (group fields by section matching the residents collection structure in design.md). 
- [ ] `/[company]/residents/[id]` — view mode with edit button (role-gated)
- [ ] Delete confirmation dialog (admin only)
- [ ] Form validation with Zod schema matching backend
- [ ] Allow the export of the residents detail view to pdf.

---

## Phase 3 — Nursing Notes

**Goal:** Nurses and doctors can log progress notes per resident; all roles can search and view them.

### Backend
- [x] `NursingNote` model: `backend/app/models/nursing_note.py`
- [x] `GET /residents/:id/notes` — paginated, filterable by date range, shift, keyword
- [x] `POST /residents/:id/notes`
- [x] `GET /residents/:id/notes/:note_id`
- [x] No PUT or DELETE (append-only)
- [x] `GET /residents` — list/search residents (needed for photo grid)
- [x] Seed script: `backend/scripts/seed_notes.py`

### Frontend
- [x] `/[company]/notes` — split-panel page: resident photo grid + notes panel
- [x] Note list: paginated (20/page), sorted newest first, filterable by date range + shift + keyword
- [x] New note form: textarea + Guardar button at top of notes panel
- [x] Note detail view: modal with all fields (resident name, company name, date, shift, nurse, notes)
---

## Phase 4 — Contracts & PDF

**Goal:** Admins and receptionists can fill in and update a contract per resident and download it as a PDF.

**Prerequisite:** Read `docs/PLANTILLA DE CONTRATO DE PRESTACION DE SERVICIOS.docx` and map all fields before writing any schema or form.

### Backend
- [ ] `Contract` model: finalize fields from source document
- [ ] `GET /residents/:id/contract`
- [ ] `POST /residents/:id/contract`
- [ ] `PUT /residents/:id/contract/:contract_id`
- [ ] `GET /residents/:id/contract/:contract_id/pdf`
  - Jinja2 HTML template that mirrors the Word document layout
  - WeasyPrint renders to PDF, streamed in response

### Frontend
- [ ] Contract tab/section within resident detail page
- [ ] Contract form (role-gated: admin and receptionist)
- [ ] "Download PDF" button → triggers PDF endpoint → browser download

---

## Phase 5 — User Management

**Goal:** Company admin can invite staff, assign roles, activate/deactivate accounts.

### Backend
- [ ] `GET /users` (company-scoped)
- [ ] `POST /users` — create user with assigned role (admin only)
- [ ] `PUT /users/:id` — update name, role, active status
- [ ] `DELETE /users/:id` (soft delete: set `is_active = false`)

### Frontend
- [ ] `/[company]/users` — user list (admin only, hidden from other roles)
- [ ] Add user form (email, full name, role selector)
- [ ] Edit user modal
- [ ] Deactivate toggle

---

## Phase 6 — i18n, UX Polish & Hardening

- [ ] Extract all UI strings to `messages/es.json` and `messages/en.json`
- [ ] Language switcher component in the global navbar
- [ ] Loading skeletons for all list and detail pages
- [ ] Global error boundary and 404/403 pages
- [ ] Form accessibility audit (labels, ARIA, keyboard navigation)
- [ ] Backend input validation review (Pydantic v2 strict mode)
- [ ] Rate limiting on auth endpoints (e.g., `slowapi`)
- [ ] CORS configuration locked to production domain
- [ ] Secure cookie flags (`HttpOnly`, `SameSite=Strict`, `Secure`)
- [ ] Password policy enforcement (min length, complexity)

---

## Phase 7 — Deployment

- [ ] Production `docker-compose.yml` (or separate Dockerfiles for orchestrator)
- [ ] Environment variable documentation for production (secrets, DB URI, SMTP, domain)
- [ ] Nginx reverse proxy config (SSL termination, route `/api` → backend, `/` → frontend)
- [ ] MongoDB backup strategy (cron + `mongodump` or Atlas scheduled snapshots)
- [ ] Health check monitoring

---

## Implementation Order Rationale

Phases 0 → 1 are strict prerequisites. Phases 2, 3, and 4 can be developed in parallel once Phase 1 is stable, but Phase 2 (residents) should come first since nursing notes and contracts both reference `resident_id`. Phase 5 can be developed in parallel with Phases 2–4. Phase 6 should be threaded in throughout rather than left entirely to the end, but a final sweep is still needed.
