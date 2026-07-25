# One-time bootstrap for a fresh Windows install on the Celeron deployment PC.
# Run this in an elevated PowerShell: powershell -ExecutionPolicy Bypass -File setup-windows.ps1
#
# Installs everything needed to run the app natively on Windows — no WSL2,
# no Docker Desktop, no VM of any kind:
#   - Python + Node.js + uv + pnpm (the app runtimes)
#   - MSYS2 + Pango (WeasyPrint's native PDF-rendering dependency)
#   - NSSM (runs backend/frontend as real, auto-starting Windows services)

$ErrorActionPreference = "Stop"

Write-Host "== Installing Python 3.12 =="
winget install --id Python.Python.3.12 -e --accept-package-agreements --accept-source-agreements

Write-Host "== Installing Node.js LTS =="
winget install --id OpenJS.NodeJS.LTS -e --accept-package-agreements --accept-source-agreements

Write-Host "== Installing uv (Python package/venv manager) =="
powershell -ExecutionPolicy Bypass -Command "irm https://astral.sh/uv/install.ps1 | iex"

Write-Host "== Enabling pnpm via corepack =="
corepack enable
corepack prepare pnpm@9 --activate

Write-Host "== Installing MSYS2 (provides Pango for WeasyPrint's PDF rendering) =="
winget install --id MSYS2.MSYS2 -e --accept-package-agreements --accept-source-agreements

Write-Host "== Installing Pango via MSYS2's pacman =="
# See: https://github.com/Kozea/WeasyPrint/blob/main/docs/first_steps.rst (Windows install)
# If this is MSYS2's very first run, pacman may ask you to close and reopen
# the shell after a core update — rerun this line if it reports nothing to do.
& "C:\msys64\usr\bin\bash.exe" -lc "pacman -Syu --noconfirm"
& "C:\msys64\usr\bin\bash.exe" -lc "pacman -S --noconfirm mingw-w64-ucrt-x86_64-pango"

Write-Host "== Installing NSSM (Windows service wrapper) =="
winget install -e --id NSSM.NSSM --accept-package-agreements --accept-source-agreements

Write-Host ""
Write-Host "Done. Close and reopen PowerShell so PATH updates (uv, pnpm, nssm) take"
Write-Host "effect, then follow production-celeron.md to copy the project in,"
Write-Host "configure it, and register the services with install-services.ps1."
