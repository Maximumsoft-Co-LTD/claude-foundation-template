#!/usr/bin/env python3
import json
import subprocess
import sys

data = json.load(sys.stdin)
file_path = data.get("tool_input", {}).get("file_path", "")

if not file_path.endswith((".js", ".jsx", ".ts", ".tsx")):
    sys.exit(0)

result = subprocess.run(
    ["npx", "eslint", file_path],
    capture_output=True,
    text=True,
)

if result.stdout or result.stderr:
    output = (result.stdout + result.stderr).strip()
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": f"eslint:\n{output}"}}))
