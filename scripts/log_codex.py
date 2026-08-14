#!/usr/bin/env python3
"""Recover exact Codex user prompts from local rollout JSONL transcripts.

The project lifecycle hook remains the primary real-time collector.  This
pre-push scanner is a recovery path for sessions where the project hook was
not yet trusted, was temporarily disabled, or failed before writing locally.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

VN_TZ = timezone(timedelta(hours=7))


def git(*args: str) -> str:
    """Run a read-only Git query and return an empty string on failure."""
    try:
        return subprocess.check_output(
            ["git", *args], text=True, stderr=subprocess.DEVNULL
        ).strip()
    except (OSError, subprocess.SubprocessError):
        return ""


def _normalize_path(value: str | Path) -> str:
    """Normalize a path for case-insensitive ancestor/descendant checks."""
    return str(value).strip().strip('"').replace("/", "\\").rstrip("\\").casefold()


def _path_matches_repo(path: str, repo_root: str) -> bool:
    """Return whether a session path belongs to the current repository."""
    if not path or not repo_root:
        return False
    return path == repo_root or path.startswith(repo_root + "\\")


def _parse_timestamp(value: str) -> datetime | None:
    """Parse an ISO timestamp and normalize naive values to UTC."""
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def _message_text(content: Any) -> str:
    """Join user-visible text parts from a Codex response item."""
    if isinstance(content, str):
        return content
    if not isinstance(content, list):
        return ""
    parts: list[str] = []
    for part in content:
        if isinstance(part, str):
            parts.append(part)
        elif isinstance(part, dict) and part.get("type") in {"input_text", "text"}:
            text = part.get("text")
            if isinstance(text, str):
                parts.append(text)
    return "\n".join(parts).strip()


def get_logged_entry_ids(log_dir: Path) -> set[str]:
    """Read entry IDs from pending and archived log batches."""
    logged: set[str] = set()
    candidates = list(log_dir.glob("session*.jsonl"))
    candidates.extend((log_dir / "archive").glob("*.jsonl"))
    for log_file in candidates:
        try:
            with log_file.open(encoding="utf-8-sig") as file:
                for line in file:
                    try:
                        entry = json.loads(line)
                    except json.JSONDecodeError:
                        continue
                    entry_id = entry.get("entry_id", "")
                    if entry_id:
                        logged.add(str(entry_id))
        except OSError:
            continue
    return logged


def read_rollout(
    rollout: Path,
    repo_root: str,
    cutoff: datetime | None,
) -> list[dict[str, Any]]:
    """Read user prompts from one Codex rollout belonging to this repo."""
    session_id = rollout.stem
    session_paths: set[str] = set()
    model = ""
    messages: list[dict[str, Any]] = []

    try:
        with rollout.open(encoding="utf-8") as file:
            for line_number, line in enumerate(file, start=1):
                try:
                    record = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if not isinstance(record, dict):
                    continue
                payload = record.get("payload") or {}
                if not isinstance(payload, dict):
                    continue

                if record.get("type") == "session_meta":
                    session_id = str(
                        payload.get("session_id") or payload.get("id") or session_id
                    )
                    cwd = payload.get("cwd")
                    if isinstance(cwd, str):
                        session_paths.add(_normalize_path(cwd))
                    model = str(
                        payload.get("model") or payload.get("model_provider") or model
                    )
                    continue

                if record.get("type") == "turn_context":
                    model = str(payload.get("model") or model)
                    continue

                if (
                    record.get("type") != "response_item"
                    or payload.get("type") != "message"
                    or payload.get("role") != "user"
                ):
                    continue
                prompt = _message_text(payload.get("content"))
                if not prompt:
                    continue
                timestamp = str(record.get("timestamp") or "")
                parsed_timestamp = _parse_timestamp(timestamp)
                if cutoff and parsed_timestamp and parsed_timestamp < cutoff:
                    continue
                metadata = (
                    payload.get("internal_chat_message_metadata_passthrough") or {}
                )
                turn_id = (
                    metadata.get("turn_id") if isinstance(metadata, dict) else None
                )
                messages.append(
                    {
                        "timestamp": timestamp,
                        "turn_id": str(turn_id or line_number),
                        "prompt": prompt,
                    }
                )
    except OSError:
        return []

    if not any(_path_matches_repo(path, repo_root) for path in session_paths):
        return []
    for message in messages:
        message["session_id"] = session_id
        message["model"] = model
    return messages


def _repo_context() -> tuple[Path, str, str, str, str]:
    """Return repository root, name, branch, commit, and student email."""
    root_text = git("rev-parse", "--show-toplevel")
    root = Path(root_text) if root_text else Path.cwd()
    origin = git("remote", "get-url", "origin")
    repo = origin.rstrip("/").split("/")[-1].removesuffix(".git")
    return (
        root,
        repo or root.name,
        git("rev-parse", "--abbrev-ref", "HEAD"),
        git("rev-parse", "--short", "HEAD"),
        git("config", "user.email")
        or os.environ.get("USERNAME", os.environ.get("USER", "unknown")),
    )


def build_entry(
    message: dict[str, Any],
    repo: str,
    branch: str,
    commit: str,
    student: str,
) -> dict[str, Any]:
    """Build one normalized Codex grading-log entry."""
    timestamp = str(message["timestamp"])
    parsed_timestamp = _parse_timestamp(timestamp)
    if parsed_timestamp:
        timestamp = parsed_timestamp.astimezone(VN_TZ).isoformat()
    if not timestamp:
        timestamp = datetime.now(VN_TZ).isoformat()

    session_id = str(message["session_id"])
    turn_id = str(message["turn_id"])
    return {
        "ts": timestamp,
        "tool": "codex",
        "event": "UserPromptSubmit",
        "entry_id": f"codex-{session_id}-{turn_id}",
        "session_id": session_id,
        "turn_id": turn_id,
        "model": message.get("model", ""),
        "repo": repo,
        "branch": branch,
        "commit": commit,
        "student": student,
        "prompt": message["prompt"],
        "transcript_path": "",
    }


def _append_entries(log_dir: Path, entries: list[dict[str, Any]]) -> None:
    """Append entries to the local pending log."""
    if not entries:
        return
    log_dir.mkdir(parents=True, exist_ok=True)
    with (log_dir / "session.jsonl").open("a", encoding="utf-8") as file:
        for entry in entries:
            file.write(json.dumps(entry, ensure_ascii=False) + "\n")


def run_sweep(
    sessions_dir: Path,
    hours: int,
    include_all: bool,
    dry_run: bool,
    log_dir: Path,
) -> int:
    """Scan Codex rollouts and append new repository user prompts."""
    if not sessions_dir.exists():
        print(
            f"[codex-log] Sessions directory not found: {sessions_dir}", file=sys.stderr
        )
        return 0

    root, repo, branch, commit, student = _repo_context()
    repo_root = _normalize_path(root)
    cutoff = None if include_all else datetime.now(VN_TZ) - timedelta(hours=hours)
    logged_ids = get_logged_entry_ids(log_dir)
    entries: list[dict[str, Any]] = []

    for rollout in sessions_dir.rglob("*.jsonl"):
        if cutoff:
            modified = datetime.fromtimestamp(rollout.stat().st_mtime, tz=timezone.utc)
            if modified < cutoff.astimezone(timezone.utc):
                continue
        for message in read_rollout(rollout, repo_root, cutoff):
            entry = build_entry(message, repo, branch, commit, student)
            if entry["entry_id"] in logged_ids:
                continue
            entries.append(entry)
            logged_ids.add(entry["entry_id"])

    if not entries:
        scope = "all" if include_all else f"{hours}h"
        print(
            f"[codex-log] No new prompts (repo={repo_root}, window={scope}).",
            file=sys.stderr,
        )
        return 0
    if dry_run:
        print(f"[codex-log] DRY RUN: would log {len(entries)} prompt(s).")
        return 0

    _append_entries(log_dir, entries)
    print(f"[codex-log] Logged {len(entries)} prompt(s) from Codex.", file=sys.stderr)
    return 0


def main() -> None:
    """Run the Codex transcript recovery scanner."""
    parser = argparse.ArgumentParser(
        description="Extract user prompts from Codex rollouts."
    )
    parser.add_argument("--auto", action="store_true", help="Scan recent rollouts.")
    parser.add_argument("--hours", type=int, default=24, help="Recent scan window.")
    parser.add_argument("--all", action="store_true", help="Ignore the scan window.")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--sessions-dir", type=Path)
    args = parser.parse_args()

    codex_home = Path(os.environ.get("CODEX_HOME", Path.home() / ".codex"))
    sessions_dir = args.sessions_dir or codex_home / "sessions"
    log_dir = Path(os.environ.get("AI_LOG_DIR", ".ai-log"))
    raise SystemExit(
        run_sweep(sessions_dir, args.hours, args.all, args.dry_run, log_dir)
    )


if __name__ == "__main__":
    main()
