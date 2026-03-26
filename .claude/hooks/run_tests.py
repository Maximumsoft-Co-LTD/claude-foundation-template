#!/usr/bin/env python3
"""
TDD enforcement hook: runs tests automatically after source file edits.

Triggers on PostToolUse(Write|Edit). Skips docs and config files.
Runs the related test file first (fast feedback), falling back to the
full suite only when no related test is found.

Adapt detect_runner() for your project's test runner.
"""
import json
import os
import subprocess
import sys

data = json.load(sys.stdin)
file_path = data.get("tool_input", {}).get("file_path", "")

# Skip docs and config files
SKIP_PATTERNS = [
    "docs/", ".md", ".json", ".yaml", ".yml",
    ".claude/", "node_modules/",
]
if not file_path or any(p in file_path for p in SKIP_PATTERNS):
    sys.exit(0)

# Only run for recognized source extensions
SOURCE_EXTS = (".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java", ".rb")
if not file_path.endswith(SOURCE_EXTS):
    sys.exit(0)


def is_test_file(path):
    """Check if the edited file is itself a test file."""
    basename = os.path.basename(path)
    return (
        ".test." in basename or
        ".spec." in basename or
        "_test." in basename or
        basename.startswith("test_") or
        basename.endswith("_spec.rb") or
        "__tests__" in path
    )


def find_related_test(path):
    """Given a source file, find its companion test file."""
    base, ext = os.path.splitext(path)
    name = os.path.basename(base)
    directory = os.path.dirname(base)

    if ext in (".ts", ".tsx", ".js", ".jsx"):
        # e.g. src/foo/bar.ts → src/foo/bar.test.ts or bar.spec.tsx
        for test_ext in (ext, ".ts", ".tsx", ".js", ".jsx"):
            for suffix in (f".test{test_ext}", f".spec{test_ext}"):
                candidate = base + suffix
                if os.path.exists(candidate):
                    return candidate
    elif ext == ".go":
        candidate = base + "_test.go"
        if os.path.exists(candidate):
            return candidate
    elif ext == ".py":
        # Same dir: test_<name>.py
        candidate = os.path.join(directory, f"test_{name}.py")
        if os.path.exists(candidate):
            return candidate
        # tests/ subdir
        candidate = os.path.join(directory, "tests", f"test_{name}.py")
        if os.path.exists(candidate):
            return candidate
    elif ext == ".rb":
        # Mirror src/ structure under spec/
        candidate = path.replace("/app/", "/spec/").replace(".rb", "_spec.rb")
        if os.path.exists(candidate):
            return candidate

    return None


def single_test_command(test_file):
    """Return command to run a single test file."""
    ext = os.path.splitext(test_file)[1]

    if ext in (".ts", ".tsx", ".js", ".jsx"):
        # Prefer vitest if config exists
        for cfg in ("vitest.config.ts", "vitest.config.js", "vite.config.ts"):
            if os.path.exists(cfg):
                return ["npx", "vitest", "run", test_file]
        return ["npx", "jest", "--testPathPattern", test_file, "--passWithNoTests"]

    elif ext == ".go":
        package_dir = os.path.dirname(test_file) or "."
        return ["go", "test", f"./{package_dir}/...", "-count=1", "-run", "."]

    elif ext == ".py":
        return ["python", "-m", "pytest", test_file, "--tb=short", "-q"]

    elif ext == ".rb":
        return ["bundle", "exec", "rspec", test_file]

    return None


def detect_runner():
    """Auto-detect test runner from project files for full suite. Customize as needed."""
    if os.path.exists("package.json"):
        with open("package.json") as f:
            pkg = json.load(f)
        scripts = pkg.get("scripts", {})
        if "test" in scripts:
            return ["npm", "test", "--", "--watchAll=false", "--passWithNoTests"]
    if os.path.exists("go.mod"):
        return ["go", "test", "./...", "-count=1"]
    if os.path.exists("Cargo.toml"):
        return ["cargo", "test", "--", "--nocapture"]
    if os.path.exists("pytest.ini") or os.path.exists("pyproject.toml"):
        return ["python", "-m", "pytest", "--tb=short", "-q"]
    if os.path.exists("Gemfile"):
        return ["bundle", "exec", "rspec", "--format", "progress"]
    return None


# Determine which command to run
if is_test_file(file_path):
    # Edited file is a test — run just it
    cmd = single_test_command(file_path)
    if not cmd:
        cmd = detect_runner()
else:
    # Look for a related test file first
    related = find_related_test(file_path)
    if related:
        cmd = single_test_command(related)
        if not cmd:
            cmd = detect_runner()
    else:
        # No related test found — fall back to full suite
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
