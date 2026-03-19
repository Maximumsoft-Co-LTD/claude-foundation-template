#!/usr/bin/env python3
import json
import subprocess
import sys
import os

data = json.load(sys.stdin)
file_path = data.get("tool_input", {}).get("file_path", "")

if not file_path.endswith(".go"):
    sys.exit(0)

dir_path = os.path.dirname(os.path.abspath(file_path))
result = subprocess.run(
    ["golangci-lint", "run", f"{dir_path}/..."],
    capture_output=True,
    text=True,
)

if result.stdout or result.stderr:
    output = (result.stdout + result.stderr).strip()
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": f"golangci-lint:\n{output}"}}))
