---
type: concept
tags: [workflow, quality, claude-code, file-editing]
related: [CON-confidence-gate, CON-verification-before-completion]
updated: 2026-04-29
source: template
---

# Self-Check Rule

## Core idea

**After every Write or Edit on any workflow file, re-read the file before reporting done.** Memory of "what I just wrote" is unreliable. Errors introduced during editing — missing steps, broken numbering, truncated tables, leftover placeholders — are only caught by re-reading.

## The universal checklist

Run after every file write/edit, before reporting completion:

1. **Re-read the full file** — use the Read tool, do not rely on memory.
2. **Structural integrity** — numbered steps sequential, no gaps, no duplicate numbers.
3. **No unresolved placeholders** — no `TBD`, `TODO`, `[fill in]`, or empty required table rows.
4. **Coverage** — every AC from the requirement doc maps to a test, design section, or review finding.
5. **Consistency** — references to other files (paths, task IDs, sprint IDs) match the real structure.

## What to do when you find an issue

Fix it immediately. Do NOT report completion until the re-read passes cleanly. After fixing:
- Re-read the affected section again to confirm the fix.
- Continue to the next checklist item.

## Where it applies

- `docs/sprints/**` — requirement, frontend, backend, retro docs
- `docs/discovery/**` — discovery docs
- `docs/BACKLOG.md` — backlog updates
- `.claude/commands/**` — command files themselves

## Why memory is unreliable

LLMs generate token-by-token without a reliable internal map of what was written. Long edits, multi-section docs, and template-driven outputs are especially prone to:
- **Numbering drift** — Step 3 followed by Step 5
- **Truncation** — table rows missing the last cell
- **Placeholder leaks** — `[task-id]` left literal instead of substituted
- **Reference rot** — link points to the old filename

Re-reading is cheap (~1 tool call). The cost of shipping a broken doc downstream — wrong commit message, wrong AC, broken plan — is far higher.

## Self-check vs confidence gate

| Gate | When | Mirrors |
|------|------|---------|
| [[CON-confidence-gate]] | **Before** acting | Pre-flight: am I sure I should do this? |
| Self-check | **After** acting | Post-flight: did I actually do it correctly? |
| [[CON-verification-before-completion]] | **End of task** | Evidence: do tests prove it works? |

Three gates, three different failure modes. All required.

## Related

- `.claude/rules/self-check.md` — runtime enforcement
- [[CON-confidence-gate]]
- [[CON-verification-before-completion]]
