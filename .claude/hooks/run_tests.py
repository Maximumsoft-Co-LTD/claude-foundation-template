#!/usr/bin/env python3
"""
TDD enforcement hook: runs the targeted test for a source file edit.

Triggers on PostToolUse(Write|Edit). Skips docs and config files.
Runs only the related test file (fast feedback). If no related test
exists, exits silently — full-suite runs belong to /testing and CI.
"""
import json
import os
import subprocess
import sys

data = json.load(sys.stdin)
file_path = data.get("tool_input", {}).get("file_path", "")

# Vitest/Jest filters match by substring against the in-process file path.
# On macOS /tmp resolves to /private/tmp and other tools may pass paths from a
# different mount root, so relativize to CWD whenever the file is inside it.
if file_path:
    try:
        rel = os.path.relpath(os.path.realpath(file_path), os.path.realpath(os.getcwd()))
        if not rel.startswith(".."):
            file_path = rel
    except ValueError:
        pass

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
        # Prefer vitest if a config or package.json script/dep mentions it
        for cfg in ("vitest.config.ts", "vitest.config.js", "vite.config.ts"):
            if os.path.exists(cfg):
                return ["npx", "vitest", "run", test_file]
        try:
            with open("package.json", encoding="utf-8") as fh:
                pkg = json.load(fh)
            haystack = json.dumps({
                "scripts": pkg.get("scripts", {}),
                "deps": pkg.get("dependencies", {}),
                "devDeps": pkg.get("devDependencies", {}),
            })
            if "vitest" in haystack:
                return ["npx", "vitest", "run", test_file]
        except (OSError, ValueError):
            pass
        return ["npx", "jest", "--testPathPatterns", test_file, "--passWithNoTests"]

    elif ext == ".go":
        package_dir = os.path.dirname(test_file) or "."
        return ["go", "test", f"./{package_dir}/...", "-count=1", "-run", "."]

    elif ext == ".py":
        return ["python", "-m", "pytest", test_file, "--tb=short", "-q"]

    elif ext == ".rb":
        return ["bundle", "exec", "rspec", test_file]

    return None


# Determine which command to run.
# Scope: only run a TARGETED test (the edited test, or a related test).
# Full-suite fallback was removed — running the whole suite on every Write/Edit
# is too slow and belongs to /testing and CI, not this hook.
if is_test_file(file_path):
    cmd = single_test_command(file_path)
else:
    related = find_related_test(file_path)
    cmd = single_test_command(related) if related else None

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
