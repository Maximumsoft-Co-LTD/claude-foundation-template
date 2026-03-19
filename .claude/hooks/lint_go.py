#!/usr/bin/env python3
import json
import os
import subprocess
import sys

data = json.load(sys.stdin)
file_path = data.get("tool_input", {}).get("file_path", "")

if not file_path.endswith(".go"):
    sys.exit(0)

# Walk up to find the module root (directory containing go.mod)
def find_module_root(start: str) -> str | None:
    current = os.path.abspath(start)
    while True:
        if os.path.isfile(os.path.join(current, "go.mod")):
            return current
        parent = os.path.dirname(current)
        if parent == current:
            return None
        current = parent

module_root = find_module_root(os.path.dirname(file_path))
if not module_root:
    sys.exit(0)

result = subprocess.run(
    ["golangci-lint", "run", "./..."],
    cwd=module_root,
    capture_output=True,
    text=True,
)

if result.stdout or result.stderr:
    output = (result.stdout + result.stderr).strip()
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": f"golangci-lint:\n{output}"}}))
