# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**abuelos-app** is an eldercare management application (Spanish-language domain). The project is in early planning — no code has been written yet.

## General Objective

To create an application that allows for the management of information in gerontological centers. Default language Spanish but the user can switch to English.

## Specific Objectives

1. To allow the entry, listing, searching, updating, and deletion of records in gerontological files, which are similar to the residents' medical records. The format is based on the document docs/FICHA GERONTOLOGICA.docx wich is in spanish language.

2. To allow the entry, listing, and searching of nursing progress notes, which are the daily follow-up reports for the residents. The format is based on the document docs/FORMATO EVOLUCION EN ENFERMERIA.docx wich is in spanish language.

3. To allow the updating and printing in PDF format of the service agreement template signed between the gerontological center and the residents' caregivers or legal representatives. The format is based on the document docs/PLANTILLA DE CONTRATO DE PRESTACION DE SERVICIOS.docx wich is in spanish language.

## Reference Documents

The `docs/` folder contains the source-of-truth business documents this app needs to digitize/implement:

| File | Purpose |
|------|---------|
| `PLANTILLA DE CONTRATO DE PRESTACION DE SERVICIOS.docx` | Resident/service contract template |
| `FICHA GERONTOLOGICA.docx` | Gerontological intake/assessment form |
| `FORMATO EVOLUCION EN ENFERMERIA.docx` | Nursing progress/evolution notes format |
| `FORMATOS.xlsx` | Additional form templates |

Read these documents first when implementing any data model, form, or report to ensure the fields and workflows match the real-world paperwork.

## Tech Stack

- **Frontend:** Next.js 16 (App Router, Turbopack, TypeScript, Tailwind CSS v4) — `frontend/`
- **Backend:** Python 3.12 + FastAPI, managed with `uv` — `backend/`
- **Database:** MongoDB via Motor (async driver)
- **PDF generation:** WeasyPrint + Jinja2 (added in Phase 4)
- **Auth:** JWT (access token 15 min, refresh token 7 days httpOnly cookie), built from scratch
- **Deployment:** Docker Compose

> **Next.js 16 notes:** Turbopack is on by default. `middleware.ts` is now `proxy.ts` — use `export function proxy(req)` not `export default function middleware(req)`. Read `node_modules/next/dist/docs/` for breaking changes before adding routing logic.

## Development Commands

### Full stack (Docker)
```bash
cp .env.example .env   # fill in values first
docker compose up
```

### Backend only (local)
```bash
cd backend
uv sync                                                # install deps
uv run uvicorn app.main:app --reload --port 8000       # dev server
uv run pytest                                          # tests
uv run ruff check .                                    # lint
uv run mypy app/                                       # type-check
```
MongoDB can be started alone with `docker compose up mongodb`.

### Frontend only (local)
```bash
cd frontend
pnpm install
pnpm dev          # dev server on :3000
pnpm build        # production build
pnpm lint         # ESLint
pnpm tsc --noEmit # type-check
```

## Architecture

```
backend/app/
  api/v1/        ← route handlers (one file per resource)
  core/config.py ← Settings (pydantic-settings, reads .env)
  db/mongodb.py  ← Motor client + get_db() FastAPI dependency
  models/        ← MongoDB document shapes (plain dataclasses / TypedDicts)
  schemas/       ← Pydantic request/response schemas
  services/      ← Business logic (called by route handlers)
  templates/     ← Jinja2 HTML templates for PDFs and emails

frontend/app/
  (public)/      ← login, register (no auth required)
  [company]/(protected)/  ← all authenticated pages; layout.tsx has auth guard + inactivity timer
frontend/lib/api.ts       ← axios instance (token injection added Phase 1)
frontend/messages/        ← i18n strings es.json / en.json (next-intl, Phase 6)
```

All backend queries are scoped by `company_id` (multi-tenancy enforced in the service layer, not routes).

## Front-end

The front-end must be coded using next.js

## Back-end

The back-end must be coded using python with FAST-API.

## Functional Requirements

1. Main ones: As stated at the Objectives section of this document.
2. The app must be multi-tenant (multi-company: The app will handle several gerontological centers). The logged in users will belong to a company, so as a result of the authentication and authorization processes the user will be redirected to their company page.
3. The loggin process will be only one managed by the typing of the email/userid and password.
4. The user's session will be closed after 3 mins of not doing anything.
5. There will be a page for the company's admin to be signed up, indicating the company's name, legal Identification number (CC, NIT in Colombia) and the email and password of the admin. After the company's admin is signed up, they will get an email to confirm the register.

