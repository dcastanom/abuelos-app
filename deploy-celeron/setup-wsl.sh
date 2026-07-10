#!/usr/bin/env bash
# One-time bootstrap for a fresh Ubuntu WSL2 instance on the Celeron deployment PC.
# Run this INSIDE WSL2 (not on Windows): bash setup-wsl.sh
set -euo pipefail

echo "== Updating apt and installing WeasyPrint system deps =="
sudo apt-get update
sudo apt-get install -y --no-install-recommends \
  libpango-1.0-0 libpangoft2-1.0-0 libpangocairo-1.0-0 \
  libcairo2 fonts-liberation \
  curl ca-certificates

echo "== Installing uv (Python package/venv manager) =="
curl -LsSf https://astral.sh/uv/install.sh | sh

echo "== Installing Node.js LTS + pnpm via corepack =="
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
corepack enable
corepack prepare pnpm@9 --activate

echo "== Installing pm2 (process supervisor) =="
sudo npm install -g pm2

echo
echo "Done. Log out and back in (or run 'source ~/.bashrc') so uv/pnpm are on PATH,"
echo "then follow production-celeron.md to copy the project in and configure it."
