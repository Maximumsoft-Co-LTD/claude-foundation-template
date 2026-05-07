---
description: Generate the TDD test plan artifact — every AC mapped to failing tests with explicit boundary cases, before any implementation code
allowed-tools: Read, Grep, Glob, Edit, Write, Bash(git diff:*)
disable-model-invocation: false
---

# tdd-plan

Workflow position: **inside /requirement (last step before sign-off) and /implement (start of each slice) — produces the test plan that drives RED-GREEN-REFACTOR**

Different from `.claude/rules/testing.md`:
- Rule = principles ("write test first", "verify RED")
- Skill = produces the **artifact** (the plan table) that those principles operate on

Arguments: `[task-id]` (or `[task-id]:S[slice-id]` for per-slice plan)

---

## When to invoke

- `/requirement` step "TDD Test Plan" — overall task plan
- `/implement` start of each slice — slice-scoped plan
- Before fixing a bug — add a row for the regression test (per `debug` skill)

Skip:
- Pure styling / copy change with no behavior
- Doc-only change

---

## Step 1 — Read the AC list

Source of truth: `docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md` Acceptance Criteria section, OR the Restate block from `scope-check`.

For each AC, identify:
- **Operators** present (`>`, `>=`, `<`, `<=`, `!=`, `before`, `after`, `non-empty`, `exactly N`, `max length`, `unique`)
- **Quantifiers** (`every`, `at least one`, `none`)
- **State transitions** (`from X to Y`)

Each operator/quantifier/transition produces ≥ 1 boundary row in the plan.

---

## Step 2 — Build the plan table

Append to the requirement doc:

```markdown
## TDD Test Plan ([YYYY-MM-DD])

| # | AC | Test name | Layer | Input | Expected | Boundary covered |
|---|----|-----------|-------|-------|----------|------------------|
| 1 | AC1 | creates_thing_with_valid_name | BE unit | `{name:"x"}` | 201 + id present | min length 1 |
| 2 | AC1 | creates_thing_at_max_name_length | BE unit | `{name: "a"*120}` | 201 | exact max=120 |
| 3 | AC1 | rejects_thing_at_max_plus_one | BE unit | `{name: "a"*121}` | 400 + field=name | max+1 |
| 4 | AC1 | rejects_empty_name | BE unit | `{name:""}` | 400 + field=name | empty (boundary 0) |
| 5 | AC2 | lists_things_for_owner_only | BE integration | seed 2 owners, GET as A | only A's items | scoping |
| 6 | AC2 | empty_list_returns_array_not_null | BE integration | no seed | `200 [] not null` | empty result shape |
| 7 | AC3 | ui_shows_toast_on_save | FE e2e | click Save with valid input | toast text "Saved" visible | UI happy path |
| 8 | AC3 | ui_shows_inline_error_on_400 | FE e2e | submit empty | inline error under name | error path |
```

Hard rules:
- **Every AC** has at least 1 happy + 1 unhappy row
- **Every operator/quantifier** has a boundary row (n, n+1, n-1, 0, max, max+1)
- **Every state transition** has a "from valid prev state" row
- **Layer** column is one of: `BE unit` / `BE integration` / `FE unit` / `FE component` / `FE e2e`
- Test names are `snake_case`, ≤ 60 chars, describe behavior not implementation

---

## Step 3 — Boundary-case checklist (per testing.md rule)

Verify the table has rows for every boundary trigger in the ACs:

| AC has | Plan must include | Status |
|---|---|---|
| `name length ≤ 120` | row at length 120 AND 121 | [ ] |
| `tags max 10` | row at 10 AND 11 | [ ] |
| `dueAt > now` | row at exact `now` AND `now-1ms` | [ ] |
| `non-empty list` | row at `length 0` AND `length 1` | [ ] |
| `unique slug` | row creating duplicate (expect 409) | [ ] |
| time-based | row crossing midnight / DST / leap | [ ] |
| string | row with unicode, RTL, emoji, NUL | [ ] |

Tick each box that applies. Unticked applicable box → add the row before moving on.

This is enforced by `.claude/rules/testing.md` "Boundary cases must be planned, not improvised."

---

## Step 4 — Cross-cutting tests

For specific patterns, add the dedicated row(s):

| Pattern | Required test |
|---|---|
| State change + audit row | "audit logger throws → state unchanged" (per PAT-008 audit-in-transaction) |
| Authz check | "user without permission gets 403, no side effect" |
| Idempotency key | "same key twice → one resource" |
| Pagination | "cursor stable across inserts in another page" |
| Socket emit | "emit happens on success, NOT on rollback" |
| Cache | "cache invalidates on write, stale window bounded" |

---

## Step 5 — Order of execution

Number the rows in the order they will be RED → GREEN. Default order:

1. Happy path BE unit (proves the contract works)
2. Boundary BE units (cheapest tests, fastest feedback)
3. BE integration (real DB)
4. FE component / unit
5. FE e2e (slowest, run last but non-skippable)

Mark which rows are in slice S1 vs S2 vs ... if `vertical-slice` was used:

```
Slice S1: rows 1, 2, 3, 4
Slice S2: rows 5, 6
Slice S3: rows 7, 8
```

---

## Step 6 — RED gate verification

The plan is incomplete without proving each test actually fails first.

For the slice you're starting now, write a checklist:

```markdown
## RED verification (slice [S1])
- [ ] Row 1 written, run it, watch it fail with expected message
- [ ] Row 2 written, run it, watch it fail
- [ ] Row 3 written, run it, watch it fail
- [ ] Row 4 written, run it, watch it fail

→ Then implement until all GREEN
```

This enforces the rule "Verify RED is mandatory" from `testing.md`.

---

## Step 7 — Self-check

Before declaring plan ready:

| Check | Pass condition |
|---|---|
| Every AC has rows? | yes |
| Every operator has a boundary row? | yes |
| Every row has a clear `Expected`? | yes — "should work" is not expected |
| No mocks at integration layer? | per testing.md rule |
| Test names readable in 5s? | yes — refactor names, not tests |
| Slice ordering matches vertical-slice plan? | yes if slicing was done |

---

## Output

```
tdd-plan: [task-id]
ACs covered: [N/N]
Boundary rows: [N]
Total rows: [N]  (BE unit: [n], BE int: [n], FE: [n], e2e: [n])

Plan written: docs/sprints/[sprint-id]/[task-id]/[task-id]-requirement.md (TDD Test Plan section)
RED checklist: present for slice [S1]

Next: /implement — start writing row 1's test, watch it fail, then code.
```

---

## Anti-patterns

- ❌ "I'll figure out tests as I go" — that's testing-after, banned by testing.md
- ❌ Plan with only happy paths — boundaries are mandatory
- ❌ Test name like `test_function_X` — name the behavior, not the function
- ❌ Mock the DB in integration tests — banned by testing.md
- ❌ Skipping RED verification — without it you don't know the test tests anything

---

## Behavior in autopilot mode

Per `.claude/rules/autonomous-mode.md`:
- **Manual mode**: write plan + 2-option completion.
- **Autopilot mode**: emit status line + return. Flag `?` only if a boundary case requires user-supplied numeric value not in the AC.

## Output (autopilot status line — required)

`> tdd-plan: [N] rows ([N] BE unit, [N] BE int, [N] FE, [N] e2e)  [✓|?]`

Example: `> tdd-plan: 8 rows (3 BE unit, 2 BE int, 1 FE comp, 2 e2e)  ✓`

---

## Why this exists

`testing.md` (the rule) demands TDD and boundary coverage. But neither happens by accident — somebody has to enumerate cases and write the table. This skill is that somebody. The artifact also doubles as the source for `/code-review` to verify against and for `/testing` to run.
