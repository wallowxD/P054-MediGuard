#!/usr/bin/env python3
"""Collect exact user prompts from Antigravity lifecycle transcripts.

Antigravity 2.0 exposes the active transcript path and workspace paths to
project hooks.  This module supports that hook contract and also keeps a
pre-push transcript sweep as a recovery path for conversations whose hook was
temporarily disabled.

The legacy Antigravity IDE stored an empty ``transcript.jsonl`` next to an
opaque protobuf-backed SQLite conversation database.  Those empty files are
ignored: generated task or walkthrough artifacts are not acceptable
substitutes for the user's original prompt.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from collections.abc import Iterator
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

VN_TZ = timezone(timedelta(hours=7))
GEMINI_HOME = Path.home() / ".gemini"

# Current documented locations first, followed by the legacy IDE location.
BRAIN_CANDIDATES = (
    GEMINI_HOME / "antigravity" / "brain",
    GEMINI_HOME / "antigravity-cli" / "brain",
    GEMINI_HOME / "antigravity-ide" / "brain",
)

USER_REQUEST_RE = re.compile(r"<USER_REQUEST>(.*?)</USER_REQUEST>", re.DOTALL)
AUX_BLOCK_RE = re.compile(
    r"<(?:ADDITIONAL_METADATA|USER_SETTINGS_CHANGE|SYSTEM_MESSAGE)>"
    r".*?"
    r"</(?:ADDITIONAL_METADATA|USER_SETTINGS_CHANGE|SYSTEM_MESSAGE)>",
    re.DOTALL,
)


def git(*args: str) -> str:
    """Run a read-only Git query and return an empty string on failure."""
    try:
        return subprocess.check_output(
            ["git", *args], text=True, stderr=subprocess.DEVNULL
        ).strip()
    except (OSError, subprocess.SubprocessError):
        return ""


def get_brain_dirs() -> list[Path]:
    """Return existing Antigravity brain directories, newest layout first."""
    configured = os.environ.get("ANTIGRAVITY_BRAIN_DIR")
    if configured:
        path = Path(configured).expanduser()
        return [path] if path.exists() else []
    return [path for path in BRAIN_CANDIDATES if path.exists()]


def _normalize_path(value: str | Path) -> str:
    """Normalize a path for case-insensitive ancestor/descendant checks."""
    text = str(value).strip().strip('"').replace("/", "\\").rstrip("\\")
    return text.casefold()


def _paths_match_repo(paths: set[str], repo_root: str) -> bool:
    """Return whether any supplied path belongs to the current repository."""
    if not paths or not repo_root:
        return False
    for path in paths:
        if path == repo_root:
            return True
        if path.startswith(repo_root + "\\"):
            return True
    return False


def _unquote_arg(value: Any) -> Any:
    """Unwrap JSON-encoded string arguments emitted by older transcripts."""
    if not isinstance(value, str):
        return value
    stripped = value.strip()
    if len(stripped) >= 2 and stripped[0] == '"' and stripped[-1] == '"':
        try:
            return json.loads(stripped)
        except json.JSONDecodeError:
            return stripped[1:-1]
    return value


def _text_from_value(value: Any) -> str:
    """Extract text from common transcript message representations."""
    if isinstance(value, str):
        return value
    if isinstance(value, list):
        return "\n".join(text for item in value if (text := _text_from_value(item)))
    if isinstance(value, dict):
        for key in ("text", "content", "prompt", "message", "userMessage"):
            if key in value and (text := _text_from_value(value[key])):
                return text
    return ""


def extract_user_prompt(content: Any) -> str:
    """Extract the exact user request while removing tool-added metadata."""
    text = _text_from_value(content)
    if not text:
        return ""
    match = USER_REQUEST_RE.search(text)
    if match:
        return match.group(1).strip()
    return AUX_BLOCK_RE.sub("", text).strip()


def _user_prompt_from_entry(entry: dict[str, Any]) -> str:
    """Return a user prompt from documented and legacy transcript shapes."""
    if entry.get("type") == "USER_INPUT":
        source = entry.get("source")
        if source in (None, "", "USER_EXPLICIT"):
            return extract_user_prompt(entry.get("content", ""))

    candidates = [entry]
    for key in ("payload", "message", "data"):
        nested = entry.get(key)
        if isinstance(nested, dict):
            candidates.append(nested)

    for candidate in candidates:
        role = str(candidate.get("role", "")).casefold()
        event_type = str(candidate.get("type", "")).casefold()
        is_user = role == "user" or event_type in {
            "user",
            "user_input",
            "user_message",
            "usermessage",
        }
        if not is_user:
            continue
        for key in ("prompt", "content", "text", "message", "userMessage"):
            if key in candidate and (prompt := extract_user_prompt(candidate[key])):
                return prompt
    return ""


def _paths_from_entry(entry: dict[str, Any]) -> set[str]:
    """Collect workspace and tool CWD paths from one transcript entry."""
    paths: set[str] = set()
    candidates = [entry]
    for key in ("payload", "data"):
        nested = entry.get(key)
        if isinstance(nested, dict):
            candidates.append(nested)

    for candidate in candidates:
        for key in ("workspacePaths", "workspace_paths"):
            values = candidate.get(key) or []
            if isinstance(values, str):
                values = [values]
            for value in values:
                if isinstance(value, str) and (normalized := _normalize_path(value)):
                    paths.add(normalized)

        tool_calls = candidate.get("tool_calls") or []
        tool_call = candidate.get("toolCall")
        if isinstance(tool_call, dict):
            tool_calls = [*tool_calls, tool_call]
        for call in tool_calls:
            if not isinstance(call, dict):
                continue
            args = call.get("args") or {}
            if not isinstance(args, dict):
                continue
            cwd = _unquote_arg(args.get("Cwd") or args.get("cwd"))
            if isinstance(cwd, str) and (normalized := _normalize_path(cwd)):
                paths.add(normalized)
    return paths


def _transcript_paths(transcript: Path) -> set[str]:
    """Return all workspace paths recorded in a transcript."""
    paths: set[str] = set()
    try:
        with transcript.open(encoding="utf-8") as file:
            for line in file:
                try:
                    entry = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if isinstance(entry, dict):
                    paths.update(_paths_from_entry(entry))
    except OSError:
        pass
    return paths


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


def iter_transcript_user_inputs(
    transcript: Path,
    cutoff: datetime | None,
    conversation_id: str,
) -> Iterator[dict[str, Any]]:
    """Yield exact user prompts from one Antigravity JSONL transcript."""
    try:
        with transcript.open(encoding="utf-8") as file:
            for line_number, line in enumerate(file, start=1):
                try:
                    entry = json.loads(line)
                except json.JSONDecodeError:
                    continue
                if not isinstance(entry, dict):
                    continue
                prompt = _user_prompt_from_entry(entry)
                if len(prompt) < 2:
                    continue

                timestamp = str(
                    entry.get("created_at")
                    or entry.get("timestamp")
                    or entry.get("createdAt")
                    or ""
                )
                parsed_timestamp = _parse_timestamp(timestamp)
                if cutoff and parsed_timestamp and parsed_timestamp < cutoff:
                    continue

                step_index = entry.get("step_index", entry.get("stepIdx", line_number))
                yield {
                    "conv_id": conversation_id,
                    "step_index": step_index,
                    "timestamp": timestamp,
                    "text": prompt,
                }
    except OSError:
        return


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
    model: str = "gemini",
) -> dict[str, Any]:
    """Build one normalized Antigravity grading-log entry."""
    timestamp = str(message["timestamp"])
    parsed_timestamp = _parse_timestamp(timestamp)
    if parsed_timestamp:
        timestamp = parsed_timestamp.astimezone(VN_TZ).isoformat()
    if not timestamp:
        timestamp = datetime.now(VN_TZ).isoformat()

    conversation_id = str(message["conv_id"])
    step_index = str(message["step_index"])
    return {
        "ts": timestamp,
        "tool": "antigravity",
        "event": "UserPrompt",
        "entry_id": f"antigravity-{conversation_id}-{step_index}",
        "session_id": conversation_id,
        "model": model or "gemini",
        "repo": repo,
        "branch": branch,
        "commit": commit,
        "student": student,
        "prompt": message["text"],
        "response_summary": "",
    }


def _append_entries(log_dir: Path, entries: list[dict[str, Any]]) -> None:
    """Append entries atomically enough for short-lived local hooks."""
    if not entries:
        return
    log_dir.mkdir(parents=True, exist_ok=True)
    with (log_dir / "session.jsonl").open("a", encoding="utf-8") as file:
        for entry in entries:
            file.write(json.dumps(entry, ensure_ascii=False) + "\n")


def _collect_transcript(
    transcript: Path,
    conversation_id: str,
    cutoff: datetime | None,
    logged_ids: set[str],
    repo: str,
    branch: str,
    commit: str,
    student: str,
    model: str = "gemini",
) -> list[dict[str, Any]]:
    """Collect de-duplicated entries from one transcript."""
    entries: list[dict[str, Any]] = []
    for message in iter_transcript_user_inputs(transcript, cutoff, conversation_id):
        entry = build_entry(message, repo, branch, commit, student, model)
        if entry["entry_id"] in logged_ids:
            continue
        entries.append(entry)
        logged_ids.add(entry["entry_id"])
    return entries


def _hook_response(payload: dict[str, Any]) -> dict[str, str]:
    """Return the event-specific non-blocking hook response."""
    if "terminationReason" in payload:
        return {"decision": "stop"}
    return {}


def run_hook(payload: dict[str, Any], log_dir: Path) -> int:
    """Collect the active Antigravity transcript from a lifecycle hook."""
    root, repo, branch, commit, student = _repo_context()
    repo_root = _normalize_path(root)
    workspace_paths = {
        _normalize_path(path)
        for path in payload.get("workspacePaths", [])
        if isinstance(path, str)
    }
    if workspace_paths and not _paths_match_repo(workspace_paths, repo_root):
        print(json.dumps(_hook_response(payload)))
        return 0

    transcript_value = payload.get("transcriptPath") or payload.get("transcript_path")
    if not isinstance(transcript_value, str):
        print(json.dumps(_hook_response(payload)))
        return 0
    transcript = Path(transcript_value).expanduser()
    conversation_id = str(
        payload.get("conversationId")
        or payload.get("conversation_id")
        or transcript.parent.name
    )
    logged_ids = get_logged_entry_ids(log_dir)
    entries = _collect_transcript(
        transcript,
        conversation_id,
        None,
        logged_ids,
        repo,
        branch,
        commit,
        student,
        str(payload.get("modelName") or payload.get("model") or "gemini"),
    )
    _append_entries(log_dir, entries)
    if entries:
        print(
            f"[antigravity-log] Logged {len(entries)} prompt(s) from lifecycle hook.",
            file=sys.stderr,
        )
    print(json.dumps(_hook_response(payload)))
    return 0


def run_sweep(
    hours: int,
    include_all: bool,
    only_conversation: str | None,
    no_repo_filter: bool,
    dry_run: bool,
    log_dir: Path,
) -> int:
    """Sweep persistent transcripts and append new repository prompts."""
    brain_dirs = get_brain_dirs()
    if not brain_dirs:
        print(
            "[antigravity-log] No Antigravity brain directory found "
            f"(checked {', '.join(str(path) for path in BRAIN_CANDIDATES)}).",
            file=sys.stderr,
        )
        return 0

    root, repo, branch, commit, student = _repo_context()
    repo_root = _normalize_path(root)
    cutoff = None if include_all else datetime.now(VN_TZ) - timedelta(hours=hours)
    logged_ids = get_logged_entry_ids(log_dir)
    entries: list[dict[str, Any]] = []

    for brain in brain_dirs:
        for conversation_dir in sorted(brain.iterdir()):
            if not conversation_dir.is_dir():
                continue
            if only_conversation and conversation_dir.name != only_conversation:
                continue
            transcript = (
                conversation_dir / ".system_generated" / "logs" / "transcript.jsonl"
            )
            if not transcript.exists() or transcript.stat().st_size == 0:
                continue
            if not no_repo_filter:
                paths = _transcript_paths(transcript)
                if not _paths_match_repo(paths, repo_root):
                    continue
            entries.extend(
                _collect_transcript(
                    transcript,
                    conversation_dir.name,
                    cutoff,
                    logged_ids,
                    repo,
                    branch,
                    commit,
                    student,
                )
            )

    if not entries:
        scope = "all" if include_all else f"{hours}h"
        print(
            f"[antigravity-log] No new prompts (repo={repo_root}, window={scope}).",
            file=sys.stderr,
        )
        return 0

    if dry_run:
        print(f"[antigravity-log] DRY RUN: would log {len(entries)} prompt(s).")
        return 0

    _append_entries(log_dir, entries)
    print(
        f"[antigravity-log] Logged {len(entries)} prompt(s) from Antigravity.",
        file=sys.stderr,
    )
    return 0


def _legacy_log(summary: str, model: str, log_dir: Path) -> None:
    """Preserve the deprecated manual mode for old local callers."""
    root, repo, branch, commit, student = _repo_context()
    del root
    timestamp = datetime.now(VN_TZ)
    entry = {
        "ts": timestamp.isoformat(),
        "tool": "antigravity",
        "event": "TaskComplete",
        "entry_id": f"antigravity-{timestamp.strftime('%Y%m%d-%H%M%S')}",
        "model": model,
        "repo": repo,
        "branch": branch,
        "commit": commit,
        "student": student,
        "prompt": summary[:1000],
        "response_summary": f"[Antigravity] {summary[:500]}",
    }
    _append_entries(log_dir, [entry])
    print(f"[antigravity-log] Logged manual: {summary[:80]}...", file=sys.stderr)


def main() -> None:
    """Run lifecycle-hook, transcript-sweep, or legacy manual mode."""
    parser = argparse.ArgumentParser(
        description="Extract exact user prompts from Antigravity transcripts."
    )
    parser.add_argument(
        "--hook", action="store_true", help="Read hook JSON from stdin."
    )
    parser.add_argument(
        "--auto", action="store_true", help="Scan recent conversations."
    )
    parser.add_argument("--hours", type=int, default=24, help="Recent scan window.")
    parser.add_argument("--all", action="store_true", help="Ignore the scan window.")
    parser.add_argument("--conv-id", help="Limit the sweep to one conversation.")
    parser.add_argument("--no-repo-filter", action="store_true")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("summary", nargs="?", help=argparse.SUPPRESS)
    parser.add_argument("model", nargs="?", help=argparse.SUPPRESS)
    args = parser.parse_args()

    log_dir = Path(os.environ.get("AI_LOG_DIR", ".ai-log"))
    if args.hook:
        try:
            payload = json.loads(
                sys.stdin.buffer.read().decode("utf-8", errors="replace")
            )
        except json.JSONDecodeError:
            payload = {}
        raise SystemExit(run_hook(payload, log_dir))

    if args.summary and not (args.auto or args.conv_id or args.all):
        _legacy_log(args.summary, args.model or "gemini", log_dir)
        return

    raise SystemExit(
        run_sweep(
            args.hours,
            args.all,
            args.conv_id,
            args.no_repo_filter,
            args.dry_run,
            log_dir,
        )
    )


if __name__ == "__main__":
    main()
