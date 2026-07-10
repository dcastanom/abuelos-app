# Running abuelos-app on the Celeron N4500 / 4GB deployment PC

This directory is a standalone deployment guide for running the finished app on
a low-spec PC used **only to serve the app to end users**, not for development.
It does not touch or replace the existing Docker Compose dev setup at the
project root.

## Hardware findings (why this setup looks the way it does)

Target machine: Intel Celeron N4500 (2 cores / 2 threads, 1.1 GHz base),
4 GB RAM, ~130 GB free disk.

- **Disk is not a constraint.** The whole project is ~560 MB (frontend
  `node_modules` alone is ~513 MB); 130 GB free is overkill.
- **RAM is the binding constraint.** Docker Desktop on Windows needs a WSL2 VM
  that alone can reserve 1-2 GB by default, plus a local MongoDB container
  (~1 GB+), plus Windows 11 idle (~2-3 GB) — that adds up past 4 GB before the
  app itself even runs.
- **CPU (2 threads @1.1 GHz) is workable for serving, not for building.**
  Compiling (`pnpm build`, Docker image builds) is slow on this chip. Serving
  already-built output to a handful of concurrent users is fine.

Decisions made to fit inside 4 GB:
1. **No Docker Desktop.** Use WSL2 directly (Ubuntu), skipping the Docker
   daemon/GUI/image-layer overhead. WSL2 also gives WeasyPrint (PDF
   generation) its native Linux dependencies via `apt`, avoiding a native
   Windows GTK install.
2. **MongoDB → Atlas cloud (free tier)**, not local. Removes the single
   biggest local RAM consumer entirely.
3. **Single-machine access only** — the app is only opened from a browser on
   this same PC, so plain `localhost` URLs and WSL2's default localhost
   forwarding are sufficient. No LAN/mirrored-networking setup needed.
4. **Production builds only** (`next start`, no `--reload` on uvicorn) — far
   lighter than dev-mode watch/HMR.

## Files in this directory

| File | Purpose |
|---|---|
| `production-celeron.md` | This document |
| `setup-wsl.sh` | One-time bootstrap script — installs system deps, `uv`, Node/pnpm, `pm2` inside Ubuntu |
| `.wslconfig.example` | Caps the WSL2 VM's memory/CPU so it doesn't eat half the host's RAM at idle |
| `.env.production.example` | Env vars for the app, including the Atlas connection string |
| `ecosystem.config.js` | `pm2` config that runs backend + frontend as supervised processes |

**Everything below is meant to be run on the target Celeron PC**, not on the
dev machine.

## Setup steps

### 1. Enable WSL2 and install Ubuntu

In an elevated PowerShell on the Celeron PC:

```powershell
wsl --install -d Ubuntu
```

Reboot if prompted, then finish the Ubuntu first-run (creates a Linux user).

### 2. Cap WSL2's resource usage

Copy `.wslconfig.example` to `C:\Users\<you>\.wslconfig`, then from PowerShell:

```powershell
wsl --shutdown
```

(This makes WSL2 pick up the new memory/processor limits on next start.)

### 3. Bootstrap the Ubuntu environment

Open the Ubuntu app (or `wsl` from PowerShell), then copy `setup-wsl.sh` in
and run it:

```bash
bash setup-wsl.sh
source ~/.bashrc   # or log out/in so uv, pnpm, pm2 are on PATH
```

### 4. Copy the project into the Linux filesystem

Do **not** run the app from `/mnt/c/...` — cross-filesystem I/O between
Windows and WSL2 is slow. Copy the project into WSL2's own filesystem:

```bash
mkdir -p ~/abuelos-app
cp -r /mnt/c/path/to/abuelos-app/{backend,frontend} ~/abuelos-app/
cp ~/abuelos-app-deploy-files/ecosystem.config.js ~/abuelos-app/   # from this deploy-celeron dir
mkdir -p ~/abuelos-app/logs
```

(Transfer this whole repo to the Celeron PC however is convenient — USB
drive, network share, git clone — then copy `backend/`, `frontend/`, and this
directory's `ecosystem.config.js` into `~/abuelos-app` as shown.)

### 5. Set up MongoDB Atlas

1. Create a free cluster at https://cloud.mongodb.com
2. Create a database user (username/password)
3. Network Access → allow-list this PC's public IP (avoid `0.0.0.0/0` if you
   can help it, since this holds resident health data)
4. Copy the `mongodb+srv://...` connection string

### 6. Configure environment variables

```bash
cd ~/abuelos-app
cp /path/to/deploy-celeron/.env.production.example backend/.env
```

Edit `backend/.env` and fill in:
- `MONGODB_URL` — the Atlas connection string from step 5
- `JWT_SECRET` — a real random secret (`openssl rand -hex 32`)
- SMTP_* — real credentials, needed for company registration confirmation emails

The frontend needs `NEXT_PUBLIC_API_URL=http://localhost:8000` available at
**build time** — either export it before building or add a `frontend/.env.production`
with that one line (Next.js picks up `.env.production` automatically for
`next build`/`next start`).

### 7. Install dependencies and build

```bash
cd ~/abuelos-app/backend
uv sync --no-dev

cd ~/abuelos-app/frontend
pnpm install --prod=false   # devDeps are needed for the build step itself
pnpm build
```

### 8. Start under pm2

```bash
cd ~/abuelos-app
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # prints a command — copy/paste and run it as instructed
```

`pm2 startup` configures pm2 to resurrect saved processes when WSL2's init
starts. WSL2 itself still needs to actually be running for that to matter —
see the next section for making that happen on boot.

### 9. Make it survive a Windows reboot

WSL2 doesn't start automatically when Windows boots. Create a Windows Task
Scheduler task (`taskschd.msc`) that runs at user logon:

- Program: `wsl.exe`
- Arguments: `-d Ubuntu -u <your-linux-user> -- pm2 resurrect`
- Trigger: "At log on", with "Run whether user is logged on or not" if you
  want it to come up without an interactive session

### 10. Verify

- `curl http://localhost:8000/docs` should return the FastAPI Swagger page
- Open `http://localhost:3000` in a browser on the same PC
- `pm2 status` should show both `abuelos-backend` and `abuelos-frontend` as `online`

## Day-to-day operations

- **Logs:** `pm2 logs` (or `pm2 logs abuelos-backend` / `abuelos-frontend`)
- **Memory check:** `free -h` inside WSL2, Task Manager on the Windows side
- **Restart after a crash:** pm2 does this automatically (`autorestart: true`,
  up to `max_restarts: 10`); manually with `pm2 restart all`
- **Updating the app:** copy in new `backend/`/`frontend` source, then:
  ```bash
  cd ~/abuelos-app/backend && uv sync --no-dev
  cd ~/abuelos-app/frontend && pnpm install --prod=false && pnpm build
  pm2 restart all
  ```
- **Uninstalling:** `pm2 delete all`, then `wsl --unregister Ubuntu` from
  PowerShell removes the whole WSL2 instance if no longer needed
