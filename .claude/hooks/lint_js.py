#!/usr/bin/env python3
"""
ESLint hook.

Walks up from the edited file to find the nearest ESLint config and runs the
project's locally-installed `eslint` against the file. Skips silently if no
local eslint is available — avoids `npx` auto-downloading eslint@latest.
"""
import json
import os
import shutil
import subprocess
import sys


ESLINT_CONFIGS = (
    "eslint.config.js", "eslint.config.mjs", "eslint.config.cjs",
    ".eslintrc.js", ".eslintrc.cjs", ".eslintrc.json", ".eslintrc.yml", ".eslintrc.yaml",
)


def find_eslint_config(start: str) -> str | None:
    current = os.path.abspath(start)
    while True:
        for name in ESLINT_CONFIGS:
            candidate = os.path.join(current, name)
            if os.path.isfile(candidate):
                return current
        parent = os.path.dirname(current)
        if parent == current:
            return None
        current = parent


def find_local_eslint(project_dir: str) -> str | None:
    current = os.path.abspath(project_dir)
    while True:
        candidate = os.path.join(current, "node_modules", ".bin", "eslint")
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
    if not file_path.endswith((".js", ".jsx", ".ts", ".tsx")):
        sys.exit(0)

    project_dir = find_eslint_config(os.path.dirname(file_path))
    if not project_dir:
        sys.exit(0)

    eslint = find_local_eslint(project_dir) or shutil.which("eslint")
    if not eslint:
        sys.exit(0)

    try:
        result = subprocess.run(
            [eslint, file_path],
            capture_output=True,
            text=True,
            timeout=60,
            cwd=project_dir,
        )
    except (subprocess.TimeoutExpired, FileNotFoundError):
        sys.exit(0)

    if result.stdout or result.stderr:
        output = (result.stdout + result.stderr).strip()
        print(json.dumps({"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": f"eslint:\n{output}"}}))


if __name__ == "__main__":
    main()
