---
name: api-contract
description: Lock the FE↔BE contract before either side is written. Trigger whenever a slice adds or changes a REST endpoint or socket event in this stack (Go / Vue / Nuxt / Next / MongoDB / Socket.io / Python). Use it BEFORE the handler, composable, or emitter exists — not after, when the shapes have already drifted.
allowed-tools: Read, Grep, Glob, Edit, Write, Bash(go *), Bash(npm *), Bash(npx *), Bash(rg *), Bash(jq *)
---

# api-contract

Workflow position: **inside `/implement` on any slice that crosses FE↔BE — BEFORE writing the handler, composable, or socket emitter. Also invoked from `/requirement` Step (Implementation Plan) so the contract row exists in the plan contract before code starts.**

Stack-aware: Go (backend), Vue3+Nuxt / Next (frontend), MongoDB (data), Socket.io (realtime), Python (services).

Goal: make FE/BE drift impossible *by construction* — both sides import the same definition, and changing one breaks the other's build.

Arguments: `[METHOD] [path]` (REST) or `socket:[event-name]` (realtime).

---

## When to invoke

Trigger:
- New endpoint or socket event in a slice.
- Existing endpoint changes shape (added/removed/renamed field, type change, status code change).
- FE and BE are both edited in the same task.
- A bug in this area is "field is undefined" / "400 on valid input" / "type mismatch on response".

Skip:
- Pure FE change with no network call touched.
- Pure BE change with no consumer affected (verify by grepping the path/event across the FE first).
- Internal-only refactor where the wire shape is provably unchanged (still grep to prove it).

Companion skills (don't duplicate their work):
- **`impact-map`** — if changing an existing endpoint, run this FIRST to enumerate every consumer that could break. `api-contract` then locks the new shape; `impact-map` decides who has to be updated.
- **`mongo-review`** — for the persistence layer (indexes, regex, $lookup). `api-contract` only pins the shape, not the query quality.
- **`ui-verify` / `/testing`** — runtime round-trip belongs there. `api-contract` is a design-time gate.

---

## Step 0 — Search before you define

Before writing a new contract file, prove there isn't already one:

```bash
rg -n "[METHOD] [path]" --type ts --type go     # REST
rg -n "'[event-name]'|\"[event-name]\"" --type ts --type go  # Socket
rg -n "type *[Name]Request|interface *[Name]Request"
```

Three outcomes:
- **Nothing found** → continue to Step 1, this is genuinely new.
- **One side already defines it** → reuse / extract it as the SSoT instead of writing a parallel version. Skip to Step 3.
- **Both sides define it independently** → that's the bug. Pick the truer one, delete the other, unify. Run `impact-map` to find every reference.

Why: the most common cause of "FE call wrong / UI doesn't match" is two developers each inventing a shape and never reconciling. Searching first catches that before you make it worse.

---

## Step 1 — Pick the single source of truth (SSoT)

ONE location owns the shape. Both sides import from it.

| Stack combo | SSoT location | How FE picks it up |
|---|---|---|
| Go BE + Vue/Nuxt or Next FE | `internal/contracts/[name].go` | Hand-mirror in `contracts/[name].ts` OR generate via tygo |
| Python BE + any FE | `contracts/[name].py` (Pydantic) | Generate `.ts` via `datamodel-code-generator` |
| Socket.io event | `packages/contracts/events/[event].ts` (shared) | Server and client both import the same TS file |

Rule: **no hand-typed duplicate on either end.** If the FE has its own `interface CreateThingResponse {…}` that wasn't generated from / imported from the SSoT, that's the bug.

Plan-contract linkage (per `plan-driven-delivery`): the Implementation Plan row that adds this endpoint MUST cite the SSoT file path. If it doesn't, return to `/requirement` and add it — don't quietly invent it during `/implement`.

---

## Step 2 — Write the contract (the shape itself)

Define request, response, and error in the SSoT:

```go
// internal/contracts/create_thing.go
package contracts

type CreateThingRequest struct {
    Name  string     `json:"name"             validate:"required,min=1,max=120"`
    Tags  []string   `json:"tags"             validate:"max=10,dive,min=1,max=40"`
    DueAt *time.Time `json:"dueAt,omitempty"`
}

type CreateThingResponse struct {
    ID        string    `json:"id"`
    Name      string    `json:"name"`
    Tags      []string  `json:"tags"`
    CreatedAt time.Time `json:"createdAt"`
}

type CreateThingError struct {
    Code    string `json:"code"`              // "VALIDATION" | "DUPLICATE" | "INTERNAL"
    Message string `json:"message"`
    Field   string `json:"field,omitempty"`
}
```

FE mirror (hand-typed when generation isn't set up — keep field names / types byte-identical):

```ts
// contracts/create_thing.ts
export interface CreateThingRequest {
  name: string;
  tags: string[];
  dueAt?: string;             // ISO-8601 UTC
}
export interface CreateThingResponse {
  id: string;
  name: string;
  tags: string[];
  createdAt: string;
}
export interface CreateThingError {
  code: 'VALIDATION' | 'DUPLICATE' | 'INTERNAL';
  message: string;
  field?: string;
}
```

Validation rules live on the BE only — the FE can mirror them for UX, but the BE is authoritative. Don't duplicate them as a second source of truth.

---

## Step 3 — Agree on the boring bits (this is where bugs live)

Fill this table inline in the requirement doc. Don't skip rows. These are the questions that always produce a 2am bug when left implicit:

| Item | Value | Why it matters |
|---|---|---|
| Method + path | `POST /api/things` | REST convention; PUT vs POST changes idempotency expectations |
| Auth | `Bearer JWT` / `cookie session` / `none` | Must match the middleware actually mounted on this route |
| Status: success | `201 Created` (creation) or `200 OK` | `201` signals new resource; FE may key off it |
| Status: validation fail | `400` with `{code, field, message}` | FE renders inline error per field |
| Status: auth fail | `401` missing / `403` insufficient | Conflating them breaks "redirect to login vs show forbidden" |
| Status: not found | `404` | Not `400`, not `200 {data:null}` |
| Status: duplicate | `409` | Distinct from generic 400 — lets FE show a specific UX |
| Empty array convention | `[]` not `null` | FE iterates without null-checks |
| Date format | ISO-8601 with `Z` (UTC) | Never local time, never epoch unless explicit |
| Number format | JSON number, not string | `42` not `"42"` (unless precision demands string, then say so) |
| Pagination | `?cursor=&limit=` returning `{items, nextCursor}` | Cursor-based, not offset (stable under writes) |
| Error envelope | `{error: {code, message, field?}}` | Same shape across every route, every status |
| Currency / money | minor units as integer (e.g. cents) | Never floats — `1099` not `10.99` |

Pick the row, write the value. If a row genuinely doesn't apply, write `n/a — [reason]`.

---

## Step 4 — Pin the MongoDB shape (if applicable)

The DB document is **not** the API response. List both side-by-side and mark what's projected vs hidden:

```
Mongo doc (collection: things)            →  Response shape (CreateThingResponse)
  _id: ObjectId                                id: string           ← _id.toString()
  name: string                                 name: string
  tags: string[]                               tags: string[]
  dueAt: Date | null                           (excluded for this endpoint)
  createdBy: ObjectId  ← ref users             (excluded — internal only)
  createdAt: Date                              createdAt: string    ← .toISOString()
  updatedAt: Date                              (excluded)
  __v: number                                  (excluded — internal)
```

If the response leaks `_id`, `createdBy`, or `__v` — that's the bug.

For query / index quality on this collection, hand off to `mongo-review` (it owns the index + regex + projection-leak checks).

---

## Step 5 — Pin the Socket event (if applicable)

Socket bugs come from event-name typos and silent payload drift. Lock both:

```ts
// packages/contracts/events/thing_created.ts
export const THING_CREATED = 'thing:created' as const;
export interface ThingCreatedPayload {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;     // ISO-8601 UTC
}
```

Server emits with the constant, client subscribes with the constant. **No string literals on either side.** A typo in a literal is a silent no-op; a typo in an imported constant is a compile error.

---

## Step 6 — Verify the contract compiles on both sides

Two checks only at design time. Runtime round-trip belongs to `/testing` / `ui-verify`, not here.

1. **BE compiles** — `go build ./...` (or `python -m mypy contracts/` for Pydantic).
2. **FE compiles against the SSoT** — `npx tsc --noEmit` in the FE workspace. Either the generated `.ts` exists, or the hand-mirror compiles cleanly when consumed by a stub call site.

If either fails → the contract is the bug, fix it once. Do NOT patch the failing side to "work around it" — that's how drift starts.

(The full round-trip with `curl` + DevTools Network panel happens in `/testing`. We're not duplicating it here.)

---

## Step 7 — List the negative cases

The error paths must be designed, not improvised. Add to the requirement doc:

| Case | Request | Expected response | FE behavior |
|---|---|---|---|
| Validation fail | empty `name` | `400 {code:"VALIDATION", field:"name"}` | inline error under name field |
| Auth missing | no header | `401` | redirect to login |
| Auth insufficient | wrong role | `403` | toast "no permission" |
| Duplicate | same name twice | `409 {code:"DUPLICATE"}` | toast "already exists" |
| Server error | (injected) | `500 {code:"INTERNAL"}` | generic error toast, no field leak |

Each row should map to a TDD row in the test plan (per `tdd-plan`).

---

## Common pitfalls (the boring-bug catalog)

Quick scan before declaring the contract done:

- **`null` vs missing key vs `[]`** — pick one for absent values, document it. FE code branches on this.
- **`Date` returned as object vs ISO string** — Go's `time.Time` JSON-marshals to ISO by default; Mongo driver may return a `Date` object on the FE if not stringified. Pin to ISO.
- **`ObjectId` leaked as `{$oid: "..."}`** — happens when the BE uses `bson` marshalling on the response path. Always stringify.
- **Trailing slash on path** — `/api/things` vs `/api/things/`. Pick one, the router cares.
- **Status `200` returning `{error: …}`** — never. Errors get 4xx/5xx so HTTP clients and middleware see them.
- **Boolean serialized as `"true"` (string)** — Pydantic or older Python serializers do this. Force JSON bool.
- **Enum drift** — adding a new enum value on the BE without updating the TS union breaks the FE silently. Treat enums as part of the contract.
- **Timezone implied, not declared** — `createdAt: "2026-05-11 14:00"` with no `Z` is ambiguous. Always UTC + `Z` or full offset.

---

## Output (manual mode)

```
Contract: [METHOD] [path]  (or socket:[event])
SSoT: [path/to/contract/file]
Imports verified: BE ✓  FE ✓
Mongo shape pinned: yes/no/n.a.
Socket event pinned: yes/no/n.a.
Negative cases listed: [count]
```

Then end with the standard 2-option completion message per `.claude/rules/completion-format.md`:

```
Next: choose one
A) Request changes — describe what to revise
B) Continue to handler + composable implementation
```

---

## Behavior in autopilot mode

Per `.claude/rules/autonomous-mode.md`:
- Emit one status line and return.
- Flag `?` if the SSoT location is ambiguous (no existing convention in the repo) — orchestrator batches into the next `ask-choice`.
- Flag `?` if Step 0 found independent definitions on both sides — that needs a human decision on which is truer.
- Otherwise `✓`.

### Output (autopilot status line — required)

`> api-contract: [METHOD path], SSoT [path]  [✓|?]`

Example: `> api-contract: POST /api/things, SSoT internal/contracts/create_thing.go  ✓`

---

## Why this exists

Past pain (Thai project context): "API เรียกผิด, UI ไม่ตรง" — the API was called wrong and the UI didn't match. Root cause: FE and BE each invent their own shape, and the mismatch only surfaces during manual testing (or worse, in prod). Locking the contract before either side is written makes drift impossible *by construction*: both sides import the same definition, both sides break the build if you change it without updating the other. The boring-bits table (Step 3) catches the second-order bugs — status code conflation, date format ambiguity, `null` vs `[]` — that don't show up in the type system but cause real outages.
