#!/usr/bin/env python3
"""
TDD enforcement hook: runs the targeted test for a source file edit.

Triggers on PostToolUse(Write|Edit). Walks up from the edited file to find
the nearest project root (package.json / pyproject.toml / go.mod / etc.) so
subprojects under tmp/, packages/, apps/ resolve their own toolchain.
Skips docs and config files. Runs only the related test file (fast feedback).
If no related test exists, exits silently.

Output distinguishes RED-by-design (test file just edited) from regression
(source file edited, pre-existing tests now failing).
"""
import json
import os
import subprocess
import sys

SOURCE_EXTS = (".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java", ".rb")

PROJECT_MARKERS = (
    "package.json",      # node / pnpm / yarn
    "pyproject.toml",    # python (poetry / hatch / pdm)
    "setup.py",          # python (legacy)
    "go.mod",            # go
    "Cargo.toml",        # rust
    "Gemfile",           # ruby
    "pom.xml",           # java/maven
    "build.gradle",      # java/gradle
    "build.gradle.kts",
)

SKIP_PATTERNS = [
    "docs/", ".md", ".json", ".yaml", ".yml",
    ".claude/", "node_modules/", ".venv/", "vendor/",
]


def find_project_root(start_path: str) -> str | None:
    """Walk up from the edited file's directory looking for a project marker.

    Stops at the filesystem root. Returns the directory containing the marker,
    or None if no marker found.
    """
    current = os.path.abspath(os.path.dirname(start_path) or ".")
    while True:
        for marker in PROJECT_MARKERS:
            if os.path.isfile(os.path.join(current, marker)):
                return current
        parent = os.path.dirname(current)
        if parent == current:
            return None
        current = parent


def is_test_file(path: str) -> bool:
    basename = os.path.basename(path)
    return (
        ".test." in basename or
        ".spec." in basename or
        "_test." in basename or
        basename.startswith("test_") or
        basename.endswith("_spec.rb") or
        "__tests__" in path
    )


def find_related_test(path: str) -> str | None:
    base, ext = os.path.splitext(path)
    name = os.path.basename(base)
    directory = os.path.dirname(base)

    if ext in (".ts", ".tsx", ".js", ".jsx"):
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
        candidate = os.path.join(directory, f"test_{name}.py")
        if os.path.exists(candidate):
            return candidate
        candidate = os.path.join(directory, "tests", f"test_{name}.py")
        if os.path.exists(candidate):
            return candidate
    elif ext == ".rb":
        candidate = path.replace("/app/", "/spec/").replace(".rb", "_spec.rb")
        if os.path.exists(candidate):
            return candidate

    return None


def has_test_runner(project_root: str, ext: str) -> str | None:
    """Detect which test runner the project uses. Return runner name or None.

    For JS/TS: only auto-runs vitest or jest if explicitly listed in
    package.json deps/devDeps or via a config file. Never auto-installs an
    unrelated runner — if neither is present, exit silently (the hook is
    advisory, not authoritative).
    """
    if ext in (".ts", ".tsx", ".js", ".jsx"):
        for cfg in ("vitest.config.ts", "vitest.config.js", "vitest.config.mjs", "vite.config.ts"):
            if os.path.isfile(os.path.join(project_root, cfg)):
                return "vitest"
        try:
            with open(os.path.join(project_root, "package.json"), encoding="utf-8") as fh:
                pkg = json.load(fh)
            haystack = json.dumps({
                "scripts": pkg.get("scripts", {}),
                "deps": pkg.get("dependencies", {}),
                "devDeps": pkg.get("devDependencies", {}),
            })
            if "vitest" in haystack:
                return "vitest"
            if '"jest"' in haystack or "'jest'" in haystack:
                return "jest"
        except (OSError, ValueError):
            pass
        return None  # don't auto-install jest just because the file is JS/TS

    if ext == ".go":
        return "go"
    if ext == ".py":
        return "pytest"
    if ext == ".rb":
        return "rspec"
    return None


def single_test_command(test_file: str, project_root: str) -> list[str] | None:
    ext = os.path.splitext(test_file)[1]
    runner = has_test_runner(project_root, ext)
    if not runner:
        return None

    rel_test = os.path.relpath(test_file, project_root)
    if runner == "vitest":
        return ["npx", "vitest", "run", rel_test]
    if runner == "jest":
        return ["npx", "jest", "--testPathPatterns", rel_test, "--passWithNoTests"]
    if runner == "go":
        package_dir = os.path.dirname(rel_test) or "."
        return ["go", "test", f"./{package_dir}/...", "-count=1", "-run", "."]
    if runner == "pytest":
        return ["python", "-m", "pytest", rel_test, "--tb=short", "-q"]
    if runner == "rspec":
        return ["bundle", "exec", "rspec", rel_test]
    return None


def main() -> None:
    try:
        data = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)

    file_path = data.get("tool_input", {}).get("file_path", "")
    if not file_path:
        sys.exit(0)

    # Skip docs / config / vendored
    if any(p in file_path for p in SKIP_PATTERNS):
        sys.exit(0)

    if not file_path.endswith(SOURCE_EXTS):
        sys.exit(0)

    abs_path = os.path.abspath(file_path)
    project_root = find_project_root(abs_path)
    if not project_root:
        # Greenfield: no project marker yet — hook stays silent. /implement
        # Step 0b is the right place to flag baseline-test setup, not this hook.
        sys.exit(0)

    # Determine which test to run
    edited_is_test = is_test_file(abs_path)
    if edited_is_test:
        test_file = abs_path
    else:
        test_file = find_related_test(abs_path)
        if not test_file:
            sys.exit(0)

    cmd = single_test_command(test_file, project_root)
    if not cmd:
        sys.exit(0)

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=120,
            cwd=project_root,
        )
    except (subprocess.TimeoutExpired, FileNotFoundError):
        sys.exit(0)

    if result.returncode == 0:
        sys.exit(0)

    output = (result.stdout + result.stderr).strip()
    lines = output.splitlines()
    if len(lines) > 100:
        output = "...(truncated)...\n" + "\n".join(lines[-100:])

    # RED-vs-regression hint:
    # - Edited a test file → user is likely in TDD's RED phase.
    #   Failure here is EXPECTED if the implementation is not yet written.
    # - Edited a source file → failures are likely a regression.
    if edited_is_test:
        header = (
            f"Test run after editing {os.path.basename(file_path)} "
            f"(in {os.path.relpath(project_root, os.getcwd()) or '.'}). "
            "If this is a TDD RED phase, failures are EXPECTED — confirm the "
            "failure message matches what you intended, then implement to GREEN.\n"
            "If you did not just add a failing test, this is a regression — fix it.\n"
        )
    else:
        header = (
            f"Tests failed after editing {os.path.basename(file_path)} "
            f"(in {os.path.relpath(project_root, os.getcwd()) or '.'}). "
            "Likely a regression — investigate before continuing.\n"
        )

    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": header + "\n" + output,
        }
    }))


if __name__ == "__main__":
    main()
