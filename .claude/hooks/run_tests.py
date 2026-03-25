#!/usr/bin/env python3
"""
TDD enforcement hook: runs tests automatically after source file edits.

Triggers on PostToolUse(Write|Edit). Skips test files, docs, and config files
so it only fires when implementation code is changed — giving Claude immediate
feedback on regressions without being asked.

Adapt TEST_COMMANDS or detect_runner() for your project's test runner.
"""
import json
import os
import subprocess
import sys

data = json.load(sys.stdin)
file_path = data.get("tool_input", {}).get("file_path", "")

# Skip non-source files
SKIP_PATTERNS = [
    ".test.", ".spec.", "_test.", "__tests__",
    "docs/", ".md", ".json", ".yaml", ".yml",
    ".claude/", "node_modules/",
]
if not file_path or any(p in file_path for p in SKIP_PATTERNS):
    sys.exit(0)

# Only run for recognized source extensions
SOURCE_EXTS = (".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java", ".rb")
if not file_path.endswith(SOURCE_EXTS):
    sys.exit(0)


def detect_runner():
    """Auto-detect test runner from project files. Customize as needed."""
    if os.path.exists("package.json"):
        with open("package.json") as f:
            pkg = json.load(f)
        scripts = pkg.get("scripts", {})
        if "test" in scripts:
            # Jest / Vitest
            return ["npm", "test", "--", "--watchAll=false", "--passWithNoTests"]
    if os.path.exists("go.mod"):
        return ["go", "test", "./...", "-count=1"]
    if os.path.exists("pytest.ini") or os.path.exists("pyproject.toml"):
        return ["python", "-m", "pytest", "--tb=short", "-q"]
    if os.path.exists("Gemfile"):
        return ["bundle", "exec", "rspec", "--format", "progress"]
    return None


cmd = detect_runner()
if not cmd:
    sys.exit(0)

try:
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
except subprocess.TimeoutExpired:
    sys.exit(0)

if result.returncode != 0:
    output = (result.stdout + result.stderr).strip()
    # Trim to last 100 lines to avoid flooding context
    lines = output.splitlines()
    if len(lines) > 100:
        output = "...(truncated)...\n" + "\n".join(lines[-100:])
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": (
                f"Tests failed after editing {os.path.basename(file_path)}:\n\n{output}"
            ),
        }
    }))
