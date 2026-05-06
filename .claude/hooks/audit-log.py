#!/usr/bin/env python3
"""
Audit-log hook: append-only trail of every user prompt, AI completion, and
destructive tool invocation. Runs on UserPromptSubmit, Stop, and PreToolUse
events.

Format (per AI-DLC spec):
  ## [Stage / Event]
  **Timestamp**: <ISO-8601>
  **User Input**: "<verbatim>"
  **AI Response**: "<verbatim>"
  **Context**: <branch / task / decision>
  ---

Destination:
  - docs/sprints/<sprint-id>/<task-id>/audit.md   (when on a task branch)
  - docs/audit-<YYYY-MM-DD>.md                    (otherwise)

Append-only. Never overwrite. Never summarize.
"""
import datetime as dt
import json
import os
import re
import subprocess
import sys
from pathlib import Path

PROJECT_DIR = Path(os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd()))

DESTRUCTIVE_BASH_PATTERNS = (
    r"\brm\s+-rf\b",
    r"\bgit\s+push\b.*\b(--force|-f)\b",
    r"\bgit\s+push\b.*\bmain\b",
    r"\bgit\s+push\b.*\bmaster\b",
    r"\bgit\s+reset\s+--hard\b",
    r"\bgit\s+branch\s+-D\b",
    r"\bdocker\s+(rm|rmi)\s+-f\b",
    r"\bdrop(Database|Collection)\s*\(",
    r"\bdb\.\w+\.deleteMany\s*\(\s*\{\s*\}\s*\)",
    r"\bDELETE\s+FROM\b",
    r"\bTRUNCATE\b",
)


def now_iso() -> str:
    return dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def git_branch() -> str:
    try:
        out = subprocess.run(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"],
            capture_output=True, text=True, cwd=PROJECT_DIR, timeout=2,
        )
        return out.stdout.strip()
    except Exception:
        return ""


def task_context(branch: str) -> tuple[str, str]:
    """Parse SPn/SPn-Tnnn-... → (sprint_id, task_id) or ("", "")."""
    m = re.match(r"^(SP\d+)/((SP\d+)-T\d+)", branch)
    if m:
        return m.group(1), m.group(2)
    return "", ""


def audit_path(sprint_id: str, task_id: str) -> Path:
    if sprint_id and task_id:
        p = PROJECT_DIR / "docs" / "sprints" / sprint_id / task_id / "audit.md"
    else:
        today = dt.date.today().isoformat()
        p = PROJECT_DIR / "docs" / f"audit-{today}.md"
    p.parent.mkdir(parents=True, exist_ok=True)
    return p


def append_entry(path: Path, header: str, fields: dict[str, str]) -> None:
    block = [f"## {header}", f"**Timestamp**: {now_iso()}"]
    for k, v in fields.items():
        v_escaped = v.replace("\n", "\\n")
        block.append(f"**{k}**: \"{v_escaped}\"")
    block.append("---\n")
    with path.open("a", encoding="utf-8") as f:
        f.write("\n".join(block) + "\n")


def is_destructive_bash(cmd: str) -> bool:
    return any(re.search(p, cmd, re.IGNORECASE) for p in DESTRUCTIVE_BASH_PATTERNS)


def main() -> None:
    try:
        raw = sys.stdin.read()
        payload = json.loads(raw) if raw else {}
    except Exception:
        sys.exit(0)

    event = payload.get("hook_event_name", "")
    branch = git_branch()
    sprint_id, task_id = task_context(branch)
    path = audit_path(sprint_id, task_id)
    context = f"branch={branch}; task={task_id or 'none'}"

    if event == "UserPromptSubmit":
        prompt = payload.get("prompt", "") or payload.get("user_prompt", "")
        append_entry(path, "User prompt", {
            "User Input": prompt,
            "Context": context,
        })

    elif event == "Stop":
        # Stop event marks end of an AI response turn
        response = payload.get("stop_reason", "") or "turn-end"
        append_entry(path, "AI turn end", {
            "AI Response": f"[turn ended: {response}]",
            "Context": context,
        })

    elif event == "PreToolUse":
        tool = payload.get("tool_name", "")
        tool_input = payload.get("tool_input", {})
        if tool == "Bash":
            cmd = tool_input.get("command", "")
            if is_destructive_bash(cmd):
                append_entry(path, "Destructive op (PreToolUse)", {
                    "Tool": tool,
                    "Command": cmd,
                    "Context": context,
                })
        elif tool in ("Write", "Edit") and tool_input.get("file_path", "").endswith((".env", "secrets.json", "credentials.json")):
            append_entry(path, "Sensitive file write (PreToolUse)", {
                "Tool": tool,
                "Path": tool_input.get("file_path", ""),
                "Context": context,
            })

    # Hooks return JSON to stdout; empty object = no extra context
    print(json.dumps({}))
    sys.exit(0)


if __name__ == "__main__":
    main()
