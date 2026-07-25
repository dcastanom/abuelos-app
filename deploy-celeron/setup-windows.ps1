# One-time bootstrap for a fresh Windows install on the Celeron deployment PC.
# Run this in an elevated PowerShell: powershell -ExecutionPolicy Bypass -File setup-windows.ps1
#
# Installs everything needed to run the app natively on Windows — no WSL2,
# no Docker Desktop, no VM of any kind:
#   - Python + Node.js + uv + pnpm (the app runtimes)
#   - MSYS2 + Pango (WeasyPrint's native PDF-rendering dependency)
#   - NSSM (runs backend/frontend as real, auto-starting Windows services)

$ErrorActionPreference = "Stop"

if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
    throw "winget (App Installer) was not found. It ships by default on current " +
        "Windows 10/11 images but is missing on some older OEM builds and is " +
        "unsupported on Windows 10 LTSC. Install 'App Installer' from the " +
        "Microsoft Store, then rerun this script."
}

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

Write-Host "== Adding MSYS2's ucrt64\bin to the System PATH =="
# Pango's DLLs (libgobject-2.0-0.dll, libpango-1.0-0.dll, libcairo-2.dll, ...)
# live in ucrt64\bin. This must be the System (Machine) PATH, not the current
# user's — NSSM-managed services (registered later by install-services.ps1)
# run outside any interactive shell and only read the Machine environment.
$msys2Bin = "C:\msys64\ucrt64\bin"
$machinePath = [Environment]::GetEnvironmentVariable("Path", "Machine")
if (($machinePath -split ";") -notcontains $msys2Bin) {
    [Environment]::SetEnvironmentVariable("Path", "$machinePath;$msys2Bin", "Machine")
    Write-Host "Added $msys2Bin to the System PATH."
} else {
    Write-Host "$msys2Bin is already on the System PATH."
}

Write-Host "== Setting WEASYPRINT_DLL_DIRECTORIES (System) =="
# PATH alone is NOT enough: WeasyPrint's ffi.py loads its native libraries
# with the LOAD_LIBRARY_SEARCH_DEFAULT_DIRS flag, which does NOT consult
# PATH — it only searches directories registered via os.add_dll_directory().
# WeasyPrint hardcodes that call for C:\msys64\mingw64\bin (the classic
# MinGW64 MSYS2 environment), but we install the UCRT64 package
# (mingw-w64-ucrt-x86_64-pango), which lands in ucrt64\bin instead — a
# directory WeasyPrint never registers on its own. Without this env var,
# import fails with "OSError: cannot load library '...libgobject-2.0-0.dll':
# error 0x7e" (a dependency of that DLL, e.g. libglib/libintl/libiconv,
# can't be found). Setting WEASYPRINT_DLL_DIRECTORIES makes ffi.py call
# os.add_dll_directory() on OUR path instead of its hardcoded default.
# Must be System scope so the NSSM-managed service inherits it too.
[Environment]::SetEnvironmentVariable("WEASYPRINT_DLL_DIRECTORIES", $msys2Bin, "Machine")
Write-Host "Set WEASYPRINT_DLL_DIRECTORIES=$msys2Bin at System scope."

Write-Host "== Installing NSSM (Windows service wrapper) =="
winget install -e --id NSSM.NSSM --accept-package-agreements --accept-source-agreements

Write-Host ""
Write-Host "Done. Close and reopen PowerShell so PATH updates (uv, pnpm, nssm, and"
Write-Host "MSYS2's ucrt64\bin) take effect, then follow production-celeron.md to"
Write-Host "copy the project in, configure it, and register the services with"
Write-Host "install-services.ps1. Since the PATH update above was made at System"
Write-Host "scope, services registered afterward will pick it up automatically."
