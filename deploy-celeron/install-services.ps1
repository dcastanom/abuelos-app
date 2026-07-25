# Registers the backend and frontend as native Windows services via NSSM.
# Run from the project root after `uv sync` / `pnpm build` have completed:
#   powershell -ExecutionPolicy Bypass -File install-services.ps1
#
# Replaces pm2 + ecosystem.config.js: NSSM-registered services auto-restart
# on crash and auto-start on boot with no extra Task Scheduler step needed.

param(
    [string]$ProjectRoot = "C:\abuelos-app",
    [string]$UvPath = "$env:USERPROFILE\.local\bin\uv.exe"
)

$ErrorActionPreference = "Stop"

$backendDir = Join-Path $ProjectRoot "backend"
$frontendDir = Join-Path $ProjectRoot "frontend"
$logsDir = Join-Path $ProjectRoot "logs"
New-Item -ItemType Directory -Force -Path $logsDir | Out-Null

Write-Host "== Registering abuelos-backend =="
nssm install abuelos-backend $UvPath "run uvicorn app.main:app --host 0.0.0.0 --port 8000"
nssm set abuelos-backend AppDirectory $backendDir
nssm set abuelos-backend AppRestartDelay 5000
nssm set abuelos-backend AppStdout (Join-Path $logsDir "backend.out.log")
nssm set abuelos-backend AppStderr (Join-Path $logsDir "backend.err.log")
nssm set abuelos-backend Start SERVICE_AUTO_START

Write-Host "== Registering abuelos-frontend =="
$pnpmPath = (Get-Command pnpm).Source
nssm install abuelos-frontend $pnpmPath "start"
nssm set abuelos-frontend AppDirectory $frontendDir
nssm set abuelos-frontend AppEnvironmentExtra "PORT=3000"
nssm set abuelos-frontend AppRestartDelay 5000
nssm set abuelos-frontend AppStdout (Join-Path $logsDir "frontend.out.log")
nssm set abuelos-frontend AppStderr (Join-Path $logsDir "frontend.err.log")
nssm set abuelos-frontend Start SERVICE_AUTO_START

Write-Host ""
Write-Host "Services registered (auto-start on boot). Start them now with:"
Write-Host "  Start-Service abuelos-backend"
Write-Host "  Start-Service abuelos-frontend"
