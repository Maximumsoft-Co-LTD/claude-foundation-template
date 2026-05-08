---
name: ui-verify
description: Manual UI verification before commit — start dev server, click every AC path in real browser, capture evidence, block /git-commit on failure
allowed-tools: Read, Grep, Glob, Bash(npm *), Bash(npx *), Bash(yarn *), Bash(pnpm *), Bash(go run:*), Bash(go test:*), Bash(go vet:*), Bash(pytest:*), Bash(ruff:*), Bash(python *), Bash(curl *), Bash(lsof:*), Bash(mkdir:*), Bash(ls:*)
---

# ui-verify

Workflow position: **invoked from `/testing` Step 6a-uiverify (after /code-review, before /retro-task) → BLOCK commit if any AC path fails**

Catches "type-check passes but the button doesn't actually work" before it ships. Stack-aware for Vue3+Nuxt and Next; covers Socket.io flows.

**Note:** This skill does NOT run during `/implement`. It runs once per task at `/testing` time, after all slices have landed and the task is whole. Partial UI from an in-progress task is rarely click-through ready, and a single browser walk after the task is whole is cheaper and more accurate than N partial walks per slice.

Arguments: `[task-id]`

---

## When to invoke

Mandatory:
- Any task that touched `.vue`, `.tsx`, `.jsx`, `pages/`, `components/`, `app/`, or `layouts/`
- Any task that added or changed an API endpoint a UI consumes
- Any task involving Socket.io events a UI subscribes to

Skip:
- Pure backend task with no UI consumer in this repo
- Pure tooling/config (CI, lint rules)
- Doc-only changes

If skipping, state explicitly: "ui-verify skipped — no UI surface touched."

---

## Step 1 — Start the dev server

First, detect the package manager from lockfile (in priority order):

| Lockfile present | `[pkg]` |
|---|---|
| `pnpm-lock.yaml` | `pnpm` |
| `yarn.lock` | `yarn` |
| `package-lock.json` | `npm` |
| none | fall back to `npm` |

Then detect the stack from `package.json` and start the right command (substitute `[pkg]`):

| Stack signal | Start command | Default URL |
|---|---|---|
| `nuxt` in deps | `[pkg] run dev` | `http://localhost:3000` |
| `next` in deps | `[pkg] run dev` | `http://localhost:3000` |
| `vite` + `vue` | `[pkg] run dev` | `http://localhost:5173` |
| Backend separate | `go run ./cmd/api` or `python -m app` | per project README |

Run dev server in **background**. Wait for "ready" log line. If port collides, `lsof -i :PORT` and resolve before continuing.

If BE+FE both needed, start both. Verify FE proxy/CORS to BE works.

---

## Step 2 — Load the AC checklist

Open `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md`. Extract every AC. For each, write a **clickable path**:

```
AC1: User can create a thing
  Path:
    1. Open http://localhost:3000/things
    2. Click "New" button
    3. Fill name = "test-thing"
    4. Click "Save"
  Expected:
    - Toast "Saved" appears
    - Row "test-thing" appears in list within 2s
    - Network: POST /api/things → 201
    - Console: no error
```

If you can't write the path, the AC is too vague — bounce back to scope-check.

---

## Step 3 — Walk every path manually

For each AC path, do this in order:

1. **Open the URL** — describe what you see (page rendered? loading spinner stuck? blank?)
2. **Click/type the action** — exactly as written
3. **Inspect Network tab** — record method, URL, status, response shape
4. **Inspect Console** — record any error, warning (yellow OK if not breaking)
5. **Inspect DOM** — confirm expected element appears (text, count, attribute)
6. **Refresh** — confirm state persisted (or correctly didn't, per AC)

For Socket.io flows, also:
- Open second browser tab/incognito
- Trigger event in tab A, confirm tab B receives within 1s
- Disconnect network briefly, reconnect, confirm reconnection event fires

---

## Step 4 — Capture evidence

Save to `docs/sprints/[sprint-id]/[task-id]/ui-verify/`:

```
ui-verify/
├── AC1-create-thing.png       (screenshot of success state)
├── AC1-network.txt            (curl-equivalent of the request + response)
├── AC2-validation-error.png
├── AC3-edit-flow.png
└── notes.md                   (anything the screenshots don't show)
```

For headless environments, replace screenshots with:
- `curl` commands that reproduce the network call + response body
- DOM snapshot via `document.querySelector(...).outerHTML` from devtools
- Console log dump

The point is: **a reviewer can verify this passed without re-running it.**

---

## Step 5 — Edge cases (mandatory rows)

Check each, even if AC didn't list them:

| Edge case | Pass condition |
|---|---|
| Empty input on every form | Inline validation message, no 500 |
| Very long input (1000+ chars) | Truncated visibly OR rejected with clear message |
| Special chars (`<script>`, emoji, RTL) | Rendered safely, not as HTML |
| Slow network (DevTools throttle "Slow 3G") | Loading state visible, no double-submit |
| Browser back button mid-flow | State sane, no orphan request |
| Refresh mid-flow | No data loss, or clear "you have unsaved changes" |
| Mobile viewport (DevTools, 375px) | Layout works, buttons reachable |

Failures here → fix before commit, not "later."

---

## Step 6 — Run automated suite alongside

Manual UI verify does NOT replace tests. Use the `[pkg]` detected in Step 1; run:

```bash
# FE
[pkg] run test          # unit
[pkg] run test:e2e      # if Playwright/Cypress configured
[pkg] run typecheck     # tsc --noEmit
[pkg] run lint          # eslint

# BE (Go)
go test ./...
go vet ./...

# BE (Python)
pytest
ruff check .
```

Any red → block.

---

## Step 7 — Verdict

Write the verdict block. Be honest — partial pass is a fail.

```
## ui-verify — [task-id] — [YYYY-MM-DD HH:MM]

ACs walked: [N/N]
Edge cases: [N/N]
Automated: tests=PASS  typecheck=PASS  lint=PASS

Issues found:
  - [none]   OR   - [AC2: empty submit shows 500 instead of 400]

Verdict: PASS  /  FAIL — fix [issue] before commit
Evidence: docs/sprints/[sprint-id]/[task-id]/ui-verify/
```

---

## Step 8 — Block or proceed

- **PASS** → unblock `/git-commit`
- **FAIL** → STOP. Open `/debug` on the failing AC. Do NOT proceed to commit.
  - "It's a small thing, I'll fix in next commit" is exactly the failure mode this skill exists to prevent. No.

---

## Output

```
ui-verify: [PASS | FAIL]
ACs: [N/N]  |  Edges: [N/N]  |  Tests: [PASS | FAIL]
Evidence: docs/sprints/[sprint-id]/[task-id]/ui-verify/

Next:
  PASS → resume /testing Step 6b (journey tracing) → /retro-task → /git-commit
  FAIL → /debug [task-id] [symptom]
```

---

## Behavior in autopilot mode

Per `.claude/rules/autonomous-mode.md`:
- **Manual mode**: produce verdict block + block /git-commit on FAIL.
- **Autopilot mode**: emit status line. **FAIL is one of the 3 official block conditions** — auto-trigger `/debug`; if `/debug` resolves to GREEN, continue; otherwise BLOCK with diagnosis.

## Output (autopilot status line — required)

`> ui-verify: PASS [N/N ACs]  [✓]` or `> ui-verify: FAIL on [AC] ([reason])  [✗]`

Examples:
- `> ui-verify: PASS 5/5 ACs, 7/7 edges  ✓`
- `> ui-verify: FAIL on AC2 (toast missing after save)  ✗`

---

## Why this exists

Previous pain: "ทำงานไม่ผ่าน UI กดไม่ได้". Root cause: type-check and unit tests pass without proving any path actually works in the browser. This skill makes "open it and click it" a mandatory blocking step, with evidence captured so it can't be skipped silently.
