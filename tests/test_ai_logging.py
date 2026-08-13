"""Regression tests for project-level AI prompt logging."""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path
from types import ModuleType

import pytest

REPO_ROOT = Path(__file__).resolve().parents[1]


def load_script(name: str) -> ModuleType:
    """Load one script module without turning ``scripts`` into a package."""
    path = REPO_ROOT / "scripts" / f"{name}.py"
    spec = importlib.util.spec_from_file_location(f"test_{name}", path)
    assert spec and spec.loader
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


@pytest.fixture
def antigravity() -> ModuleType:
    """Return the Antigravity collector module."""
    return load_script("log_antigravity")


@pytest.fixture
def codex() -> ModuleType:
    """Return the Codex recovery collector module."""
    return load_script("log_codex")


def write_jsonl(path: Path, records: list[dict[str, object]]) -> None:
    """Write a small isolated JSONL fixture."""
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        "".join(json.dumps(record, ensure_ascii=False) + "\n" for record in records),
        encoding="utf-8",
    )


def test_antigravity_hook_collects_and_deduplicates_exact_prompts(
    antigravity: ModuleType,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The lifecycle hook should support legacy and role-based transcript rows."""
    repo_root = tmp_path / "repo"
    transcript = tmp_path / "brain" / "conv-1" / "transcript.jsonl"
    log_dir = tmp_path / "logs"
    write_jsonl(
        transcript,
        [
            {
                "type": "USER_INPUT",
                "source": "USER_EXPLICIT",
                "step_index": 3,
                "created_at": "2026-08-13T08:00:00Z",
                "content": (
                    "<USER_REQUEST>Kiểm tra thuốc này</USER_REQUEST>"
                    "<ADDITIONAL_METADATA>ignored</ADDITIONAL_METADATA>"
                ),
            },
            {
                "role": "user",
                "timestamp": "2026-08-13T08:01:00Z",
                "content": [{"type": "text", "text": "Giải thích kết quả"}],
            },
            {"role": "assistant", "content": "Không được ghi dòng này"},
        ],
    )
    monkeypatch.setattr(
        antigravity,
        "_repo_context",
        lambda: (repo_root, "P-054", "VMEC-40", "abc1234", "member@example.com"),
    )
    payload = {
        "conversationId": "conv-1",
        "workspacePaths": [str(repo_root)],
        "transcriptPath": str(transcript),
        "modelName": "gemini-test",
    }

    assert antigravity.run_hook(payload, log_dir) == 0
    assert antigravity.run_hook(payload, log_dir) == 0

    entries = [
        json.loads(line)
        for line in (log_dir / "session.jsonl").read_text(encoding="utf-8").splitlines()
    ]
    assert [entry["prompt"] for entry in entries] == [
        "Kiểm tra thuốc này",
        "Giải thích kết quả",
    ]
    assert len({entry["entry_id"] for entry in entries}) == 2
    assert all(entry["tool"] == "antigravity" for entry in entries)


def test_antigravity_hook_ignores_another_workspace(
    antigravity: ModuleType,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """A project hook must not ingest a transcript from another workspace."""
    repo_root = tmp_path / "repo"
    log_dir = tmp_path / "logs"
    monkeypatch.setattr(
        antigravity,
        "_repo_context",
        lambda: (repo_root, "P-054", "VMEC-40", "abc1234", "member@example.com"),
    )
    payload = {
        "conversationId": "other",
        "workspacePaths": [str(tmp_path)],
        "transcriptPath": str(tmp_path / "missing.jsonl"),
    }

    assert antigravity.run_hook(payload, log_dir) == 0
    assert not (log_dir / "session.jsonl").exists()


def test_codex_recovery_scans_only_matching_repo_and_deduplicates(
    codex: ModuleType,
    tmp_path: Path,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """The pre-push fallback should recover one exact Codex user turn once."""
    repo_root = tmp_path / "repo"
    sessions_dir = tmp_path / "sessions"
    log_dir = tmp_path / "logs"
    rollout = sessions_dir / "2026" / "08" / "13" / "rollout.jsonl"
    write_jsonl(
        rollout,
        [
            {
                "timestamp": "2026-08-13T08:00:00Z",
                "type": "session_meta",
                "payload": {"id": "session-1", "cwd": str(repo_root)},
            },
            {
                "timestamp": "2026-08-13T08:00:01Z",
                "type": "turn_context",
                "payload": {"model": "gpt-test"},
            },
            {
                "timestamp": "2026-08-13T08:00:02Z",
                "type": "response_item",
                "payload": {
                    "type": "message",
                    "role": "user",
                    "content": [{"type": "input_text", "text": "Sửa cơ chế AI log"}],
                    "internal_chat_message_metadata_passthrough": {"turn_id": "turn-1"},
                },
            },
            {
                "timestamp": "2026-08-13T08:00:03Z",
                "type": "response_item",
                "payload": {
                    "type": "message",
                    "role": "assistant",
                    "content": [{"type": "output_text", "text": "Không ghi"}],
                },
            },
        ],
    )
    monkeypatch.setattr(
        codex,
        "_repo_context",
        lambda: (repo_root, "P-054", "VMEC-40", "abc1234", "member@example.com"),
    )
    assert not codex._path_matches_repo(
        codex._normalize_path(tmp_path), codex._normalize_path(repo_root)
    )

    assert codex.run_sweep(sessions_dir, 24, True, False, log_dir) == 0
    assert codex.run_sweep(sessions_dir, 24, True, False, log_dir) == 0

    entries = [
        json.loads(line)
        for line in (log_dir / "session.jsonl").read_text(encoding="utf-8").splitlines()
    ]
    assert len(entries) == 1
    assert entries[0]["prompt"] == "Sửa cơ chế AI log"
    assert entries[0]["entry_id"] == "codex-session-1-turn-1"
    assert entries[0]["model"] == "gpt-test"


def test_codex_hook_and_recovery_share_entry_id(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    """Realtime and recovery collectors must use the same de-duplication key."""
    log_hook = load_script("log_hook")
    monkeypatch.setattr(
        log_hook,
        "git",
        lambda command: {
            "git remote get-url origin": "https://example.com/P-054.git",
            "git rev-parse --abbrev-ref HEAD": "VMEC-40",
            "git rev-parse --short HEAD": "abc1234",
            "git config user.email": "member@example.com",
        }.get(command, ""),
    )
    entry = log_hook.normalize(
        {
            "hook_event_name": "UserPromptSubmit",
            "session_id": "session-1",
            "turn_id": "turn-1",
            "prompt": "Sửa cơ chế AI log",
        },
        "codex",
    )

    assert entry is not None
    assert entry["entry_id"] == "codex-session-1-turn-1"
    assert entry["prompt"] == "Sửa cơ chế AI log"
