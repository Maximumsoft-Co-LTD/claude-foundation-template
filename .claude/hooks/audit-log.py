#!/usr/bin/env python3
"""
Audit log hook — appends every user prompt, tool use, and stop event to
audit.md per AI-DLC spec.

Triggered on: UserPromptSubmit, PreToolUse (destructive ops), Stop.

Append-only. Never overwrites. ISO-8601 timestamps. Complete raw user input
preserved verbatim (no summarization).

Audit file location:
  - If active sprint + task detected: docs/sprints/[sprint]/[task]/audit.md
  - Else: docs/audit-[YYYY-MM-DD].md

Determines active task by reading docs/sprints/*/.autopilot-state.json (if
present) or by parsing the current branch name (`SP[N]/SP[N]-T[NNN]-...`).
"""
import json
import os
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

PROJECT_DIR = Path(os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd()))

DESTRUCTIVE_BASH_PATTERNS = [
    r"\bgit\s+push\s+.*\b(main|master)\b",
    r"\bgit\s+push\s+.*--force\b",
    r"\bgit\s+push\s+.*-f\b",
    r"\bgit\s+reset\s+--hard\b",
    r"\bgit\s+branch\s+-D\b",
    r"\brm\s+-rf\b",
    r"\bdb\.[a-zA-Z]+\.drop\(",
    r"\bdropDatabase\(",
]


def now_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def current_branch() -> str:
    try:
        out = subprocess.check_output(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            cwd=PROJECT_DIR,
            stderr=subprocess.DEVNULL,
            text=True,
        ).strip()
        return out
    except Exception:
        return ""


def parse_task_from_branch(branch: str) -> tuple[str, str]:
    m = re.match(r"^(SP\d+)/(SP\d+-T\d+)", branch)
    if m:
        return m.group(1), m.group(2)
    return "", ""


def resolve_audit_path() -> Path:
    sprint_id, task_id = parse_task_from_branch(current_branch())
    if sprint_id and task_id:
        d = PROJECT_DIR / "docs" / "sprints" / sprint_id / task_id
        d.mkdir(parents=True, exist_ok=True)
        return d / "audit.md"
    d = PROJECT_DIR / "docs"
    d.mkdir(parents=True, exist_ok=True)
    return d / f"audit-{datetime.now(timezone.utc).strftime('%Y-%m-%d')}.md"


def append_entry(path: Path, header: str, body: str) -> None:
    if not path.exists():
        path.write_text(f"# Audit log — {path.name}\n\n", encoding="utf-8")
    with path.open("a", encoding="utf-8") as f:
        f.write(f"## {header}\n")
        f.write(f"**Timestamp**: {now_iso()}\n")
        f.write(body)
        f.write("\n---\n\n")


def is_destructive(tool_name: str, tool_input: dict) -> bool:
    if tool_name == "Bash":
        cmd = tool_input.get("command", "")
        return any(re.search(p, cmd) for p in DESTRUCTIVE_BASH_PATTERNS)
    return False


def main() -> None:
    try:
        raw = sys.stdin.read()
        payload = json.loads(raw) if raw else {}
    except Exception:
        sys.exit(0)

    event = payload.get("hook_event_name", "")
    audit = resolve_audit_path()

    if event == "UserPromptSubmit":
        prompt = payload.get("prompt", "")
        body = f'**User Input**: """\n{prompt}\n"""\n**Context**: prompt submitted\n'
        append_entry(audit, "User Prompt", body)

    elif event == "PreToolUse":
        tool_name = payload.get("tool_name", "")
        tool_input = payload.get("tool_input", {})
        if not is_destructive(tool_name, tool_input):
            sys.exit(0)
        body = (
            f"**Tool**: {tool_name}\n"
            f"**Input**: `{json.dumps(tool_input)[:500]}`\n"
            f"**Context**: destructive op detected\n"
        )
        append_entry(audit, "Destructive Op (pre)", body)

    elif event == "Stop":
        body = "**Context**: assistant turn completed\n"
        append_entry(audit, "Turn End", body)

    sys.exit(0)


if __name__ == "__main__":
    main()
