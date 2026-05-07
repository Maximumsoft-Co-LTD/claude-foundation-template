---
description: Given a planned change (file/function/contract/schema), enumerate every callsite, dependent, and downstream consumer that could break — produces an impact table with risk levels
allowed-tools: Read, Grep, Glob, Bash(git log:*), Bash(git diff:*), Bash(rg:*)
disable-model-invocation: false
---

# impact-map

Workflow position: **inside `/issue` Step 2 (after triage), `/code-review` Step 3 (before approving), and `/implement` Step 0 (before slicing) — produces the "what else gets touched" table**

Different from `reverse-engineer`:
- `reverse-engineer` = whole-project architecture scan (run once per 30 days, cached)
- `impact-map` = scoped scan around a SPECIFIC change (run per task)

Different from `risk-register`:
- `impact-map` = WHAT existing code is affected (mechanical traversal)
- `risk-register` = WHAT could go wrong (judgement + categorization)

Arguments: `[task-id]` AND a change-surface descriptor (one of: `file:[path]`, `function:[name]`, `field:[collection.field]`, `endpoint:[METHOD /path]`, `event:[name]`)

---

## When to invoke

- `/issue` Step 2 — before fixing a bug, know what else the fix could break
- `/code-review` Step 3 — before approving a diff, verify no missed dependents
- `/implement` Step 0 — before slicing, know what to avoid touching incidentally
- Any time a change touches: a public API, a DB schema, an event/socket name, a shared util

Skip:
- Net-new file with no callers yet
- Pure styling / copy
- Test-only changes

---

## Step 1 — Define the change surface

State the change in ONE of these forms (be exact):

| Form | Example |
|---|---|
| File | `src/services/order.service.ts` |
| Function/method | `OrderService.calculateTotal` |
| DB field | `orders.discountCode` (renaming, removing, changing type) |
| API endpoint | `POST /api/orders` (changing request/response shape) |
| Event/socket | `order.created` (changing payload) |
| Config key | `FEATURE_X_ENABLED` |

If the change spans multiple surfaces — run impact-map once per surface, then merge.

---

## Step 2 — Find direct callers (Tier-1 impact)

Mechanical search, in priority order:

```bash
# Function/method/symbol
rg -n "\bcalculateTotal\b" --type ts --type tsx --type js
rg -n "from.*order\.service" --type ts

# DB field (rename or remove)
rg -n "\.discountCode\b|\['discountCode'\]|\"discountCode\""

# API endpoint
rg -n "/api/orders" --type ts --type tsx
rg -n "POST.*orders" --type ts

# Event name
rg -n "['\"]order\.created['\"]"

# Config key
rg -n "FEATURE_X_ENABLED"
```

Record every hit with: `file:line` + 1-line context. Group by file.

---

## Step 3 — Find indirect dependents (Tier-2 impact)

Things that won't show up via grep on the surface name:

| Indirect type | How to find |
|---|---|
| **Subscribers / listeners** | grep for the event/socket name in `socket.on`, `bus.subscribe`, `pubsub` |
| **Cron / scheduled jobs** | check `crontab`, `bull`, `agenda`, `*.schedule.ts` for the symbol |
| **Migrations / seeds** | check `migrations/`, `seeds/` for the field/collection |
| **Generated types / OpenAPI** | check `*.gen.ts`, `openapi.yaml`, `proto/` |
| **Frontend stores / hooks** | check `stores/`, `composables/`, `hooks/` for the endpoint or shape |
| **Test fixtures** | check `fixtures/`, `__fixtures__/`, `*.fixture.ts` |
| **Documentation** | grep `docs/`, `README.md`, `CLAUDE.md` for the surface |

Each hit is a Tier-2 dependent — won't crash at compile but will diverge at runtime.

---

## Step 4 — Find data-contract consumers (Tier-3 impact)

The most dangerous tier: external consumers you can't grep for in this repo.

| Consumer | How to know it exists |
|---|---|
| **Public API** | endpoint listed in OpenAPI / public docs / SDK |
| **Webhook payload** | sent to external services (check `webhooks/` config) |
| **Analytics events** | sent to Mixpanel/Amplitude/Segment (check tracking calls) |
| **Stored documents** | existing rows in MongoDB with the field — schema migration risk |
| **Cached values** | Redis/CDN keys derived from the surface |
| **Mobile clients** | shipped apps that hit the API — can't deploy fix to user device |

If ANY Tier-3 consumer exists, the change is NOT a refactor — it's a contract change. Flag this prominently in the output.

---

## Step 5 — Build the impact table

Append to the requirement / issue doc:

```markdown
## Impact Map ([YYYY-MM-DD])

Change surface: `[exact surface from Step 1]`

| Tier | Path | What uses it | Risk | Action needed |
|---|---|---|---|---|
| 1 | src/api/orders.controller.ts:42 | calls calculateTotal in POST handler | 🔴 High | update call signature |
| 1 | src/services/invoice.service.ts:88 | calls calculateTotal in invoice gen | 🔴 High | update call signature |
| 2 | src/jobs/nightly-billing.cron.ts:15 | imports OrderService for batch | 🟡 Med | manual smoke after deploy |
| 2 | tests/fixtures/order.fixture.ts | hardcodes discountCode field | 🟢 Low | regenerate fixture |
| 3 | OpenAPI spec | exposes /api/orders publicly | 🔴 High — contract change | bump API version OR backfill |
| 3 | mongo collection `orders` | 2.3M documents have discountCode | 🔴 High — data migration | write migration script |
```

Risk levels:
- 🔴 **High** — compile error OR runtime crash OR external contract breaks
- 🟡 **Med** — internal-only, runtime behavior changes, no contract break
- 🟢 **Low** — test fixture, doc, comment — cosmetic update needed

---

## Step 6 — Flag unknown unknowns

Some dependencies don't show up via static search:

| Unknown | What to do |
|---|---|
| Dynamic dispatch (`obj[methodName]()`) | List the file + line. Mark "manual review needed" |
| Reflection / metaprogramming | List the file. Mark "cannot statically verify" |
| Plugin systems / lazy imports | Check the plugin registry, list registered hooks |
| String-built queries / event names | Grep for substring of the surface name, manually filter |

Add a `### Unknown unknowns` subsection. Do NOT pretend they're not there.

---

## Step 7 — Cross-reference with risk-register

If a `risk-register` artifact exists for this task, ensure every Tier-1 and Tier-3 row in the impact map appears (or is dismissed with reason) in the risk register.

If `risk-register` does NOT exist yet and any row is 🔴 → recommend running `risk-register` before `/implement`.

---

## Output

```
impact-map: [task-id] surface=[surface]
Tier-1 (direct callers): [N]
Tier-2 (indirect):       [N]
Tier-3 (external):       [N]  ← contract-change indicator if > 0
Unknown unknowns:        [N]

Highest risk: [🔴 | 🟡 | 🟢]
Map written: [path to requirement/issue doc, "Impact Map" section]
```

End with the standard 2-option completion:

```
Next: choose one
A) Request changes — describe what to revise
B) Continue to [risk-register | /implement | /code-review next step]
```

---

## Anti-patterns

- ❌ "I checked the obvious places" — enumerate them, don't assert
- ❌ Skipping Tier-3 because "we don't have public API" — verify by reading the OpenAPI / webhook config, don't assume
- ❌ Missing migrations as a dependent — schema changes always need a migration check
- ❌ Treating fixtures/docs as zero-risk — they cause CI churn that masks real failures
- ❌ Single-line "looks fine" — every row needs a path AND a risk classification

---

## Behavior in autopilot mode

Per `.claude/rules/autonomous-mode.md`:
- **Manual mode**: write full table + 2-option completion
- **Autopilot mode**: emit status line + return. Flag `?` ONLY if Tier-3 has rows AND no contract-versioning strategy is documented (orchestrator will batch with other ambiguities)

## Output (autopilot status line — required)

`> impact-map: T1=[N] T2=[N] T3=[N] highest=[🔴|🟡|🟢]  [✓|?]`

Examples:
- `> impact-map: T1=2 T2=1 T3=0 highest=🟡  ✓`
- `> impact-map: T1=2 T2=1 T3=2 highest=🔴 (contract change)  ?`

---

## Why this exists

Engineers consistently underestimate blast radius. "I'll just rename this field" → 47 dependents, 2 webhooks, 1 mobile app. This skill forces the enumeration to happen mechanically before the change is shipped, surfacing the contract-change cases (Tier 3) that are otherwise invisible until production breaks. Pairs with `risk-register` (judgement layer) and feeds `/code-review` (verification layer).
