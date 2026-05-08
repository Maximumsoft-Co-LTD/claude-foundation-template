#!/usr/bin/env python3
"""
Validate project-local skills after editing SKILL.md or agents/openai.yaml.

Non-blocking advisory hook:
- runs the shared quick skill validator when available
- warns when SKILL.md grows too large or misses core trigger/output sections
- lightly checks agents/openai.yaml shape when present
"""
import json
import os
import re
import subprocess
import sys
from pathlib import Path

PROJECT_DIR = Path(os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd()))
CODEX_HOME = Path(os.environ.get("CODEX_HOME", Path.home() / ".codex"))
VALIDATOR = CODEX_HOME / "skills" / ".system" / "skill-creator" / "scripts" / "quick_validate.py"


def relpath(path: str) -> str:
    try:
        return os.path.relpath(path, PROJECT_DIR).replace(os.sep, "/")
    except ValueError:
        return path.replace(os.sep, "/")


def skill_dir_for(rel: str) -> Path | None:
    parts = Path(rel).parts
    if len(parts) < 4 or parts[0] != ".claude" or parts[1] != "skills":
        return None
    skill_name = parts[2]
    if skill_name == "_archive":
        return None
    if parts[-1] == "SKILL.md":
        return PROJECT_DIR / ".claude" / "skills" / skill_name
    if parts[-1] == "openai.yaml" and len(parts) >= 5 and parts[-2] == "agents":
        return PROJECT_DIR / ".claude" / "skills" / skill_name
    return None


def has_explicit_output_contract(text: str) -> bool:
    patterns = (
        r"^## Output\b",
        r"^## Step [0-9A-Za-z ._-]+Output\b",
    )
    return any(re.search(pattern, text, re.MULTILINE) for pattern in patterns)


def lint_skill(skill_dir: Path) -> list[str]:
    issues: list[str] = []
    skill_md = skill_dir / "SKILL.md"
    if not skill_md.exists():
        return issues

    text = skill_md.read_text(encoding="utf-8")
    line_count = len(text.splitlines())
    if line_count > 500:
        issues.append(
            f"SKILL.md is {line_count} lines. Split bulky detail into references/ or scripts to keep trigger context lean."
        )

    for marker in ("Workflow position:", "## When to invoke"):
        if marker not in text:
            issues.append(f"SKILL.md is missing `{marker}`.")

    if not has_explicit_output_contract(text):
        issues.append(
            "SKILL.md is missing an explicit output contract (`## Output` preferred, `## Step N — Output` also acceptable)."
        )

    if VALIDATOR.exists():
        try:
            result = subprocess.run(
                ["python3", str(VALIDATOR), str(skill_dir)],
                capture_output=True,
                text=True,
                timeout=20,
                cwd=PROJECT_DIR,
            )
            if result.returncode != 0:
                issues.append(result.stdout.strip() or result.stderr.strip() or "Skill validator failed.")
        except Exception:
            pass

    openai_yaml = skill_dir / "agents" / "openai.yaml"
    if openai_yaml.exists():
        yaml_text = openai_yaml.read_text(encoding="utf-8")
        if "interface:" not in yaml_text:
            issues.append("agents/openai.yaml is missing the top-level `interface:` block.")
        for marker in ("display_name:", "short_description:", "default_prompt:"):
            if not re.search(rf"^\s*{re.escape(marker)}", yaml_text, re.MULTILINE):
                issues.append(f"agents/openai.yaml is missing `{marker}`.")

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
    skill_dir = skill_dir_for(rel)
    if skill_dir is None:
        sys.exit(0)

    issues = lint_skill(skill_dir)
    if not issues:
        sys.exit(0)

    skill_name = skill_dir.name
    message = "Skill validation warnings — " + skill_name + "\n" + "\n".join(f"- {item}" for item in issues)
    print(json.dumps({
        "hookSpecificOutput": {
            "hookEventName": "PostToolUse",
            "additionalContext": message,
        }
    }))


if __name__ == "__main__":
    main()
