#!/usr/bin/env python3
"""
Lightweight lint for brain notes and MOCs.

Non-blocking advisory hook that catches the most common knowledge-vault drift:
- missing frontmatter
- missing top-level heading
- dead-end MOCs with no wiki links
- orphaned atomic notes with no cross-links
- obvious placeholders left in prose
"""
import json
import os
import re
import sys
from pathlib import Path

PROJECT_DIR = Path(os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd()))
ATOMIC_PREFIXES = (
    "brain/01-concepts/",
    "brain/02-decisions/",
    "brain/03-patterns/",
    "brain/04-lessons/",
    "brain/05-sprints/",
    "brain/06-glossary/",
)
PLACEHOLDER_PATTERNS = (
    re.compile(r"\bTBD\b"),
    re.compile(r"\bTODO\b"),
    re.compile(r"\[to add\]", re.IGNORECASE),
    re.compile(r"\[main keyword\]", re.IGNORECASE),
    re.compile(r"\[file path\]", re.IGNORECASE),
    re.compile(r"\[YYYY-MM-DD\]"),
)


def relpath(path: str) -> str:
    try:
        return os.path.relpath(path, PROJECT_DIR).replace(os.sep, "/")
    except ValueError:
        return path.replace(os.sep, "/")


def has_placeholder(content: str) -> bool:
    in_code = False
    for line in content.splitlines():
        if line.strip().startswith("```"):
            in_code = not in_code
            continue
        if in_code:
            continue
        if any(p.search(line) for p in PLACEHOLDER_PATTERNS):
            return True
    return False


def lint_brain_note(rel: str, content: str) -> list[str]:
    issues: list[str] = []

    if rel.startswith("brain/.metrics/"):
        return issues

    if rel != "brain/BRAIN-INDEX.md" and not content.startswith("---\n"):
        issues.append("Missing YAML frontmatter.")

    if not re.search(r"^#\s", content, re.MULTILINE):
        issues.append("Missing top-level `#` heading.")

    if rel.startswith("brain/00-MOC/") and "[[" not in content:
        issues.append("MOC has no wiki links; it may be a dead-end index.")

    if any(rel.startswith(prefix) for prefix in ATOMIC_PREFIXES):
        if "related:" not in content and "[[" not in content:
            issues.append("Note has no cross-links (`related:` or `[[...]]`).")

    if has_placeholder(content):
        issues.append("Found unresolved placeholder text (for example `TBD` / `TODO`).")

    return issues


def main() -> None:
    try:
        payload = json.load(sys.stdin)
    except (json.JSONDecodeError, ValueError):
        sys.exit(0)

    file_path = payload.get("tool_input", {}).get("file_path", "")
    if not file_path:
        sys.exit(0)

    rel = relpath(file_path)
    if not rel.startswith("brain/") or not rel.endswith(".md"):
        sys.exit(0)

    path = PROJECT_DIR / rel
    if not path.exists():
        sys.exit(0)

    try:
        content = path.read_text(encoding="utf-8")
    except OSError:
        sys.exit(0)

    issues = lint_brain_note(rel, content)
    if not issues:
        sys.exit(0)

    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": (
                "Brain note warnings — "
                + rel
                + "\n"
                + "\n".join(f"- {item}" for item in issues)
            ),
        }
    }))


if __name__ == "__main__":
    main()
