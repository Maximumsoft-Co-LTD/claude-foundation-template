#!/usr/bin/env python3
import json
import os
import subprocess
import sys

data = json.load(sys.stdin)
file_path = data.get("tool_input", {}).get("file_path", "")

if not file_path.endswith((".js", ".jsx", ".ts", ".tsx")):
    sys.exit(0)

# Walk up from the file's directory to find eslint config
ESLINT_CONFIGS = (
    "eslint.config.js", "eslint.config.mjs", "eslint.config.cjs",
    ".eslintrc.js", ".eslintrc.cjs", ".eslintrc.json", ".eslintrc.yml", ".eslintrc.yaml",
)

def find_eslint_config(start: str) -> bool:
    current = os.path.abspath(start)
    while True:
        for name in ESLINT_CONFIGS:
            if os.path.isfile(os.path.join(current, name)):
                return True
        parent = os.path.dirname(current)
        if parent == current:
            return False
        current = parent

if not find_eslint_config(os.path.dirname(file_path)):
    sys.exit(0)

result = subprocess.run(
    ["npx", "eslint", file_path],
    capture_output=True,
    text=True,
)

if result.stdout or result.stderr:
    output = (result.stdout + result.stderr).strip()
    print(json.dumps({"hookSpecificOutput": {"hookEventName": "PostToolUse", "additionalContext": f"eslint:\n{output}"}}))
