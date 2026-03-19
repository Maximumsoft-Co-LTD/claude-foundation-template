#!/usr/bin/env python3
import json
import os
import subprocess
import sys

data = json.load(sys.stdin)
file_path = data.get("tool_input", {}).get("file_path", "")

if not file_path.endswith((".ts", ".tsx")):
    sys.exit(0)

# Walk up from the file's directory to find tsconfig.json
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

tsconfig = find_tsconfig(os.path.dirname(file_path))
if not tsconfig:
    sys.exit(0)

result = subprocess.run(
    ["npx", "-p", "typescript", "tsc", "--noEmit", "-p", tsconfig],
    capture_output=True,
    text=True,
)

if result.stdout or result.stderr:
    output = (result.stdout + result.stderr).strip()
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": f"tsc:\n{output}"}}))
