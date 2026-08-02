#!/usr/bin/env bash
# Cross-platform Python launcher for AI log hooks.
# Tries python3 → python → py -3 on PATH; on Windows, falls back to common
# Python install locations because Git Bash launched by some hooks gets a
# stripped PATH that omits the Windows Python directory.
# Designed to be sourced or called as: bash scripts/_pyrun.sh <script> [args...]
#
# Exits 0 silently if no Python is found — hooks must never block the AI tool.
set -u

# Prefer the project virtualenv if present. It carries the project deps
# (python-dotenv, etc.) the log hooks need to read .env — a bare system
# python3 usually lacks them, so load_dotenv() silently no-ops and the
# submit step skips with "AI_LOG_SERVER not set".
SCRIPT_DIR="$(cd "$(dirname "$0")" >/dev/null 2>&1 && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
# PY is an array so a venv path containing spaces stays one argument while the
# Windows "py -3" launcher can still expand to two.
if [ -x "$REPO_ROOT/.venv/bin/python" ]; then
  PY=("$REPO_ROOT/.venv/bin/python")
elif [ -x "$REPO_ROOT/.venv/Scripts/python.exe" ]; then
  PY=("$REPO_ROOT/.venv/Scripts/python.exe")
elif command -v python3 >/dev/null 2>&1; then
  PY=(python3)
elif command -v python >/dev/null 2>&1; then
  PY=(python)
elif command -v py >/dev/null 2>&1; then
  PY=(py -3)
else
  # PATH lookup failed — probe standard Windows install locations.
  PY=()
  shopt -s nullglob 2>/dev/null || true
  for cand in \
    /c/Users/*/AppData/Local/Programs/Python/Python*/python.exe \
    "/c/Program Files/Python"*/python.exe \
    "/c/Program Files (x86)/Python"*/python.exe \
    /c/Python*/python.exe; do
    if [ -x "$cand" ]; then PY=("$cand"); break; fi
  done
  shopt -u nullglob 2>/dev/null || true
  [ "${#PY[@]}" -gt 0 ] || exit 0
fi

exec "${PY[@]}" "$@"
