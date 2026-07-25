# Running abuelos-app on the Celeron N4500 / 4GB deployment PC

This directory is a standalone deployment guide for running the finished app on
a low-spec PC used **only to serve the app to end users**, not for development.
It does not touch or replace the existing Docker Compose dev setup at the
project root (Docker there is a dev convenience only — this production guide
never uses Docker or any VM).

## Hardware findings (why this setup looks the way it does)

Target machine: Intel Celeron N4500 (2 cores / 2 threads, 1.1 GHz base),
4 GB RAM, ~130 GB free disk.

- **Disk is not a constraint.** The whole project is ~560 MB (frontend
  `node_modules` alone is ~513 MB); 130 GB free is overkill.
- **RAM is the binding constraint**, and this guide runs everything natively
  on Windows specifically to stay inside it. Earlier iterations of this setup
  ran under WSL2 to avoid Docker Desktop, with MongoDB offloaded to Atlas to
  avoid a local database container. Both of those workarounds are gone now:
  - The database is **SQLite** — an embedded file, not a server process, so
    there is no local database container to avoid in the first place and no
    cloud database to depend on.
  - WeasyPrint (PDF generation) no longer needs a Linux environment for its
    native dependencies. Its own current Windows install docs recommend
    **MSYS2** — a lightweight native package manager, not a VM — to install
    Pango, after which it runs as a plain Windows Python package.
  - With both of those settled, WSL2 itself is no longer buying anything:
    it was a VM whose only job was making Docker Desktop and Linux-only
    dependencies unnecessary, and now nothing here needs Linux at all.
  Removing WSL2 also removes its own idle RAM overhead (the thing
  `.wslconfig` used to cap) — this is a bigger simplification than the
  database swap by itself.
- **CPU (2 threads @1.1 GHz) is workable for serving, not for building.**
  Compiling (`pnpm build`) is slow on this chip. Serving already-built output
  to a handful of concurrent users is fine.
- **Process supervision uses NSSM, not pm2.** NSSM registers the backend and
  frontend as genuine Windows services: they auto-restart on crash and
  auto-start on boot with no extra step. (The previous WSL2 setup needed a
  Task Scheduler workaround for the boot case, since WSL2 itself doesn't
  start automatically with Windows — that workaround is gone too.)

## Files in this directory

| File | Purpose |
|---|---|
| `production-celeron.md` | This document |
| `setup-windows.ps1` | One-time bootstrap script — installs Python, Node/pnpm, uv, MSYS2+Pango, NSSM |
| `install-services.ps1` | Registers the backend and frontend as NSSM-managed Windows services |
| `.env.production.example` | Env vars for the app, including the SQLite `DATABASE_URL` |

**Everything below is meant to be run on the target Celeron PC**, not on the
dev machine.

## Setup steps

### 1. Bootstrap the environment

In an elevated PowerShell on the Celeron PC:

```powershell
powershell -ExecutionPolicy Bypass -File setup-windows.ps1
```

This installs Python, Node.js, `uv`, `pnpm` (via corepack), MSYS2 + Pango
(WeasyPrint's PDF-rendering dependency), and NSSM. Close and reopen
PowerShell afterward so PATH updates take effect.

### 2. Copy the project onto the machine

```powershell
mkdir C:\abuelos-app
# copy backend/, frontend/, and this deploy-celeron/ directory in —
# USB drive, network share, or git clone, whichever is convenient
mkdir C:\abuelos-app\logs
```

Avoid placing this folder inside a OneDrive-synced directory: OneDrive can
lock files mid-write, which conflicts with SQLite's WAL-mode database file.

### 3. Configure environment variables

```powershell
Copy-Item .\deploy-celeron\.env.production.example C:\abuelos-app\backend\.env
```

Edit `C:\abuelos-app\backend\.env` and fill in:
- `DATABASE_URL` — defaults to `sqlite+aiosqlite:///C:/abuelos-app/data/abuelos.db`.
  **This must stay an absolute path outside `backend/`.** The "update the app"
  step later overwrites `backend/`'s contents wholesale from the new source
  tree — an in-tree database file would be destroyed on every update.
- `JWT_SECRET` — a real random secret (`openssl rand -hex 32`, or
  `[System.Convert]::ToHexString((1..32 | ForEach-Object { Get-Random -Max 256 }))`
  in PowerShell if `openssl` isn't installed).
- `SMTP_*` — real credentials, needed for company registration confirmation emails.

The frontend needs `NEXT_PUBLIC_API_URL=http://localhost:8000` available at
**build time** — either export it before building or add a
`frontend/.env.production` with that one line (Next.js picks up
`.env.production` automatically for `next build`/`next start`).

### 4. Install dependencies, run migrations, and build

```powershell
cd C:\abuelos-app\backend
uv sync --no-dev
uv run alembic upgrade head    # creates the SQLite schema

cd C:\abuelos-app\frontend
pnpm install --prod=false      # devDeps are needed for the build step itself
pnpm build
```

### 5. Register and start the services

```powershell
cd C:\abuelos-app
powershell -ExecutionPolicy Bypass -File deploy-celeron\install-services.ps1

Start-Service abuelos-backend
Start-Service abuelos-frontend
```

Both are now real Windows services: `Start`/`Stop`/`Restart-Service`,
visible in `services.msc`, auto-restarting on crash and auto-starting on
boot. No Task Scheduler step is needed.

### 6. Verify

- `curl http://localhost:8000/docs` should return the FastAPI Swagger page
- Open `http://localhost:3000` in a browser on the same PC
- `Get-Service abuelos-backend, abuelos-frontend` should show both `Running`

## Day-to-day operations

- **Logs:** `C:\abuelos-app\logs\backend.out.log` / `backend.err.log` (and
  the `frontend.*` equivalents), or `Get-EventLog` / `services.msc` for
  service-level status.
- **Memory check:** Task Manager, or `Get-Process uv,node | Select
  WorkingSet` in PowerShell.
- **Restart after a crash:** NSSM does this automatically
  (`AppRestartDelay` configured in `install-services.ps1`); manually with
  `Restart-Service abuelos-backend` / `abuelos-frontend`.
- **Updating the app:** copy in new `backend/`/`frontend` source (the
  `DATABASE_URL` hazard from step 3 applies here — the database file must
  stay outside `backend/`), then:
  ```powershell
  cd C:\abuelos-app\backend
  uv sync --no-dev
  uv run alembic upgrade head

  cd C:\abuelos-app\frontend
  pnpm install --prod=false
  pnpm build

  Restart-Service abuelos-backend
  Restart-Service abuelos-frontend
  ```
- **Uninstalling:** `Stop-Service abuelos-backend, abuelos-frontend`, then
  `nssm remove abuelos-backend confirm` / `nssm remove abuelos-frontend confirm`.

## SQLite specifics

- **No daemon or service to install** — it ships as part of `aiosqlite`
  inside the backend's own dependencies (`uv sync` already installed it).
- **Location matters less than under the old WSL2 setup.** There is no
  cross-filesystem boundary to worry about anymore: native NTFS handles
  WAL mode's `-wal`/`-shm` sidecar files reliably for a single local process,
  which is what removed the old "must stay off `/mnt/c`" caveat entirely.
  The only remaining constraint is keeping the file outside `backend/`
  (see step 3) and outside a OneDrive-synced folder (see step 2).
- **Viewing the DB directly:** "DB Browser for SQLite"
  (https://sqlitebrowser.org) or the `sqlite3.exe` CLI, pointed at
  `C:\abuelos-app\data\abuelos.db`. Open it read-only while the app is
  running to avoid interfering with the live WAL file.
- **Backup:** use SQLite's own backup mechanism, never a raw file copy of a
  live WAL-mode database:
  ```powershell
  sqlite3 C:\abuelos-app\data\abuelos.db ".backup 'C:\abuelos-app\backups\abuelos-2026-07-25.db'"
  ```
  or `VACUUM INTO 'path'` for a compacted copy. A plain `Copy-Item` while the
  app is running can capture a torn, inconsistent snapshot.
- **What's no longer needed, compared to the old MongoDB Atlas setup:**
  cluster creation, database user management, IP allow-listing, and the
  `mongodb+srv://...` connection string — none of that exists anymore.
