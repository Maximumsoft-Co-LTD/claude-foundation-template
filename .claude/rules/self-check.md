# Self-Check Rules

**After every Write or Edit tool call on any workflow file, you MUST re-read the file before confirming done.**

## Universal self-check checklist

Run this after every file write/edit, before reporting completion:

1. **Re-read the full file** — use the Read tool. Do not rely on memory of what you just wrote.
2. **Structural integrity** — numbered steps are sequential with no gaps, no duplicate numbers.
3. **No unresolved placeholders** — no `TBD`, `TODO`, `[fill in]`, or empty required table rows left.
4. **Coverage** — every AC from the requirement doc maps to at least one test, design section, or review finding in this file.
5. **Consistency** — references to other files (paths, task IDs, sprint IDs) match the real structure.

## What to do when you find an issue

Fix it immediately. Do NOT report completion until the re-read passes cleanly.

If you find an issue while re-reading:
- Fix the issue in the file.
- Re-read the affected section again to confirm the fix is correct.
- Then continue to the next checklist item.

## This rule applies to

All files written or edited as part of any workflow command:
- `docs/sprints/**` — requirement, frontend, backend, retro docs
- `docs/discovery/**` — discovery docs
- `docs/BACKLOG.md` — backlog updates
- `.claude/commands/**` — command files themselves

## Why

Errors introduced during editing (missing steps, broken numbering, truncated tables, leftover placeholders) are only caught by re-reading. Memory of "what I just wrote" is unreliable.
