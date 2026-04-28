# /brain-meter
Workflow position: **read-only — use any time to inspect brain ROI**

Show how much the knowledge vault is actually being used. Cross-references brain notes on disk against citations recorded by the `brain_citation_meter` PostToolUse hook (state in `brain/.metrics/citations.json`). Highlights coverage per note type and never-cited notes as pruning candidates.

Arguments: optional `<PREFIX>` (one of `DEC`, `PAT`, `LES`, `CON`, `GLO`) — drill into the full uncited list for that type.

---

## Step 1 — Confirm prerequisites

- Verify `brain/` exists. If not, output `brain/ not present — meter is for projects that use the knowledge vault.` and stop.
- Verify `.claude/hooks/brain_citation_meter.py` exists. If not, output `Citation meter hook missing — see template setup.` and stop.

If `brain/.metrics/citations.json` does not exist, the dashboard will still run and report 0 citations — that is expected for a fresh project. Continue.

---

## Step 2 — Print the dashboard

Run the citation meter in dashboard mode using Bash:

```bash
python3 "$CLAUDE_PROJECT_DIR/.claude/hooks/brain_citation_meter.py" --dashboard
```

Print its output verbatim. Do NOT modify, summarize, or paraphrase it — the script is the source of truth.

If the user passed `<PREFIX>` as argument:

```bash
python3 "$CLAUDE_PROJECT_DIR/.claude/hooks/brain_citation_meter.py" --uncited <PREFIX>
```

Run that instead and stop after Step 2 — no insight needed for the drill-down listing.

---

## Step 3 — Surface ONE actionable insight

After the dashboard, add a single block titled `Insight:` with the highest-leverage observation. Pick exactly one — do not list multiple. Use this priority order:

1. **Stale high-value note** — if any DEC/PAT/LES note exists but has never been cited, recommend reviewing it for relevance. Pick the oldest by file mtime (use `ls -t brain/02-decisions brain/03-patterns brain/04-lessons` to identify).
2. **Bloated low-value type** — if CON or GLO has > 20 notes and < 10% coverage, recommend pruning. Suggest running `/brain-meter CON` (or `GLO`) to see the full uncited list.
3. **High coverage, no follow-up needed** — if all categories have > 50% coverage, simply say `Brain is being used effectively — no action recommended.`
4. **Empty meter** — if `Total citations: 0`, recommend running a `/discovery` or `/requirement` cycle so brain references can start accumulating.

Format:

```
Insight: [one-sentence observation + concrete next action]
```

Keep it to one or two sentences. Do not propose action across multiple categories.

---

## Step 4 — Skip when drilling down

If `<PREFIX>` was supplied (uncited drill-down), output ends after Step 2. Do not print Step 3 in that case.

---

## Output

```
(dashboard from script — verbatim)

Insight: [single actionable observation]
```

No files written. State file is `brain/.metrics/citations.json`, gitignored via `brain/.metrics/.gitignore`.
