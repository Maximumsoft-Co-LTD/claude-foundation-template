#!/usr/bin/env python3
"""
PostToolUse dispatcher: routes a Write|Edit event to the relevant sub-hooks
based on the edited file path, and runs them in parallel.

Replaces the previous 5-entry hook array in settings.json. Two wins:
  1. Source linters never run on docs / brain notes / .claude config.
  2. The remaining sub-hooks run in parallel instead of sequentially.

Each sub-hook still reads its JSON payload from stdin and emits a JSON
hookSpecificOutput on stdout. The dispatcher relays outputs by merging
all non-empty `additionalContext` fields into a single PostToolUse JSON.
"""
import json
import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor

PROJECT_DIR = os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())
HOOKS_DIR = os.path.join(PROJECT_DIR, ".claude", "hooks")

SOURCE_EXTS = (".go", ".ts", ".tsx", ".js", ".jsx", ".py", ".rb", ".rs", ".java")
DOCS_PREFIXES = ("docs/", "brain/", ".claude/", ".wolf/")


def is_docs_or_config(path: str) -> bool:
    rel = os.path.relpath(path, PROJECT_DIR) if os.path.isabs(path) else path
    rel = rel.replace(os.sep, "/")
    return any(rel.startswith(pref) for pref in DOCS_PREFIXES)


try:
    raw = sys.stdin.read()
    payload = json.loads(raw) if raw else {}
except Exception:
    sys.exit(0)

file_path = payload.get("tool_input", {}).get("file_path", "")

hooks_to_run: list[str] = []

if file_path and file_path.endswith(SOURCE_EXTS) and not is_docs_or_config(file_path):
    if file_path.endswith(".go"):
        hooks_to_run.append("lint_go.py")
    if file_path.endswith((".ts", ".tsx")):
        hooks_to_run.append("lint_ts.py")
    if file_path.endswith((".ts", ".tsx", ".js", ".jsx")):
        hooks_to_run.append("lint_js.py")
    hooks_to_run.append("run_tests.py")

# Brain citation meter only acts on workflow output docs (docs/sprints/, docs/discovery/).
# Filter here so we don't even spawn the meter for unrelated markdown.
if file_path.endswith(".md"):
    rel = os.path.relpath(file_path, PROJECT_DIR) if os.path.isabs(file_path) else file_path
    rel = rel.replace(os.sep, "/")
    if rel.startswith(("docs/sprints/", "docs/discovery/")):
        hooks_to_run.append("brain_citation_meter.py")

if not hooks_to_run:
    sys.exit(0)


def run_hook(name: str) -> str:
    path = os.path.join(HOOKS_DIR, name)
    try:
        result = subprocess.run(
            ["python3", path],
            input=raw,
            capture_output=True,
            text=True,
            timeout=120,
        )
        return result.stdout.strip()
    except Exception:
        return ""


with ThreadPoolExecutor(max_workers=len(hooks_to_run)) as pool:
    outputs = list(pool.map(run_hook, hooks_to_run))

merged: list[str] = []
for out in outputs:
    if not out:
        continue
    try:
        add_ctx = json.loads(out).get("hookSpecificOutput", {}).get("additionalContext")
        if add_ctx:
            merged.append(add_ctx)
    except Exception:
        merged.append(out)

if merged:
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": "\n\n".join(merged),
        }
    }))
