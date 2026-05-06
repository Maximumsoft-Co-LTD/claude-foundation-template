#!/usr/bin/env python3
"""
TypeScript typecheck hook.

Walks up from the edited file to find the nearest `tsconfig.json` and runs
`tsc --noEmit -p <config>`. Uses the project's locally-installed tsc to
avoid auto-downloading typescript@latest. Skips silently if no local tsc
is available — the project may not need typecheck on every save.
"""
import json
import os
import shutil
import subprocess
import sys


def find_tsconfig(start: str) -> str | None:
    current = os.path.abspath(start)
    while True:
        candidate = os.path.join(current, "tsconfig.json")
        if os.path.isfile(candidate):
            return candidate
        parent = os.path.dirname(current)
        if parent == current:
            return None
        current = parent


def find_local_tsc(project_dir: str) -> str | None:
    """Look for a locally-installed tsc binary in the project's node_modules.

    Walks up from project_dir to handle nested workspaces / monorepos.
    Returns the absolute path to the tsc binary, or None if not found.
    """
    current = os.path.abspath(project_dir)
    while True:
        candidate = os.path.join(current, "node_modules", ".bin", "tsc")
        if os.path.isfile(candidate) and os.access(candidate, os.X_OK):
            return candidate
        parent = os.path.dirname(current)
        if parent == current:
            return None
        current = parent


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)

    file_path = data.get("tool_input", {}).get("file_path", "")
    if not file_path.endswith((".ts", ".tsx")):
        sys.exit(0)

    tsconfig = find_tsconfig(os.path.dirname(file_path))
    if not tsconfig:
        sys.exit(0)

    project_dir = os.path.dirname(tsconfig)

    tsc = find_local_tsc(project_dir) or shutil.which("tsc")
    if not tsc:
        # No local tsc, no global tsc — don't auto-install. Skip silently.
        sys.exit(0)

    try:
        result = subprocess.run(
            [tsc, "--noEmit", "-p", tsconfig],
            capture_output=True,
            text=True,
            timeout=120,
            cwd=project_dir,
        )
    except (subprocess.TimeoutExpired, FileNotFoundError):
        sys.exit(0)

    if result.stdout or result.stderr:
        output = (result.stdout + result.stderr).strip()
        print(json.dumps({"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": f"tsc:\n{output}"}}))


if __name__ == "__main__":
    main()
