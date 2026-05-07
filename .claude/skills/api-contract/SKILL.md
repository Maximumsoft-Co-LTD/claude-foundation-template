---
description: Lock FE↔BE contract before code — Go handler ↔ Vue/Nuxt/Next composable ↔ MongoDB shape ↔ Socket event must agree by construction
allowed-tools: Read, Grep, Glob, Edit, Write, Bash(go *), Bash(npm *), Bash(npx *), Bash(curl *), Bash(jq *)
disable-model-invocation: false
---

# api-contract

Workflow position: **inside /implement, on any slice that crosses FE↔BE → BEFORE writing the handler or composable**

Stack-aware: Go (backend), Vue3+Nuxt / Next (frontend), MongoDB (data), Socket.io (realtime), Python (services).

Kills the "API เรียกผิด, UI ไม่ตรง" failure mode by writing the contract once and using it on both sides.

Arguments: `[METHOD] [path]` (REST) or `socket:[event-name]` (realtime)

---

## When to invoke

Trigger:
- New endpoint or socket event
- Existing endpoint changes shape (added/removed/renamed field, type change)
- FE and BE were edited in the same task
- A bug in this area is "field is undefined" / "got 400 on valid input" / "type mismatch"

Skip:
- Pure FE change (no network call touched)
- Pure BE change (no consumer affected — verify by searching for `path` in FE)

---

## Step 1 — Identify the contract surface

Decide the single source of truth (SSoT) for this endpoint. Pick ONE:

| Stack combo | SSoT location | Format |
|---|---|---|
| Go BE + Vue/Nuxt FE | `internal/contracts/[name].go` + generated `contracts/[name].ts` | Go struct → TS via tygo / hand-written matching |
| Go BE + Next FE | same | same |
| Python BE + any FE | `contracts/[name].py` (Pydantic) + `contracts/[name].ts` | Pydantic → TS via datamodel-code-generator |
| Socket.io event | `contracts/events/[event].ts` (shared package) | TS interface (server + client both import) |

**Rule:** Both sides MUST import from the SSoT. No hand-typed duplicates on either end.

---

## Step 2 — Write the contract first

Before any handler or composable, define:

```go
// internal/contracts/create_thing.go
package contracts

type CreateThingRequest struct {
    Name        string   `json:"name" validate:"required,min=1,max=120"`
    Tags        []string `json:"tags" validate:"max=10,dive,min=1,max=40"`
    DueAt       *time.Time `json:"dueAt,omitempty"`
}

type CreateThingResponse struct {
    ID        string    `json:"id"`
    Name      string    `json:"name"`
    Tags      []string  `json:"tags"`
    CreatedAt time.Time `json:"createdAt"`
}

type CreateThingError struct {
    Code    string `json:"code"`    // "VALIDATION" | "DUPLICATE" | "INTERNAL"
    Message string `json:"message"`
    Field   string `json:"field,omitempty"`
}
```

Mirror on the FE (or auto-generate):

```ts
// contracts/create_thing.ts
export interface CreateThingRequest {
  name: string;
  tags: string[];
  dueAt?: string; // ISO-8601
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

---

## Step 3 — Agree on the boring bits (this is where bugs live)

Fill out this table inline in the requirement doc. Don't skip rows.

| Item | Value | Rationale |
|---|---|---|
| Method + path | `POST /api/things` | REST convention |
| Auth | `Bearer JWT` / `cookie session` / `none` | Match middleware on this route |
| Status: success | `201 Created` | Resource created, not 200 |
| Status: validation fail | `400` with `{code, field, message}` | FE shows inline error per field |
| Status: auth fail | `401` (missing) / `403` (insufficient) | Don't conflate |
| Status: duplicate | `409` | Distinct from 400 |
| Empty array convention | `[]` not `null` | FE assumes array |
| Date format | ISO-8601 with `Z` | UTC, never local |
| Number format | JSON number, not string | `42` not `"42"` |
| Pagination | `?cursor=&limit=` returning `{items, nextCursor}` | Cursor-based, not offset |
| Error envelope | `{error: {code, message, field?}}` | Single shape across all routes |

---

## Step 4 — Pin the MongoDB shape (if applicable)

The DB document is NOT the response. List both:

```
Mongo doc (collection: things):
  _id: ObjectId
  name: string
  tags: string[]
  dueAt: Date | null
  createdBy: ObjectId  ← ref users
  createdAt: Date
  updatedAt: Date

Response shape (CreateThingResponse):
  id: string  ← stringified _id
  name: string
  tags: string[]
  createdAt: string  ← ISO-8601 from createdAt
  (NOTE: createdBy excluded, dueAt excluded for this endpoint)
```

If the response leaks `_id`, `createdBy`, or `__v` — that's the bug.

---

## Step 5 — Pin the Socket event (if applicable)

Socket bugs come from event name typos and payload drift. Lock both:

```ts
// contracts/events/thing_created.ts
export const THING_CREATED = 'thing:created' as const;
export interface ThingCreatedPayload {
  id: string;
  name: string;
  createdBy: string;
  createdAt: string;
}
```

Server emits with the constant, client subscribes with the constant. No string literals.

---

## Step 6 — Verify both sides match

Run all that apply:

1. **TypeScript build** — `npx tsc --noEmit` — types must compile on the FE side
2. **Go build** — `go build ./...` — struct must compile on the BE side
3. **Round-trip curl** — start dev server, hit the endpoint with a known body, diff the response against the contract:
   ```bash
   curl -s -X POST http://localhost:8080/api/things \
     -H 'content-type: application/json' \
     -d '{"name":"x","tags":["a"]}' | jq .
   ```
4. **FE consumes it** — open the page, watch DevTools Network tab, confirm shape matches `CreateThingResponse`

If any of these fails → fix the contract or the implementation, NOT both sides ad-hoc.

---

## Step 7 — Negative cases

Hit each error path with a real request, confirm the FE handles it:

| Case | Request | Expected | FE behavior |
|---|---|---|---|
| Validation fail | empty `name` | `400 {code:"VALIDATION", field:"name"}` | inline error under name field |
| Auth missing | no header | `401` | redirect to login |
| Duplicate | same name twice | `409 {code:"DUPLICATE"}` | toast "already exists" |

---

## Output

```
Contract: [METHOD] [path] (or socket:[event])
SSoT: [path/to/contract/file]
Both sides import: yes
Roundtrip: 200 OK match | 400 match | 409 match
Mongo shape pinned: yes/no  |  Socket event pinned: yes/no

Next: write handler + composable, both importing from SSoT
```

---

## Behavior in autopilot mode

Per `.claude/rules/autonomous-mode.md`:
- **Manual mode**: present contract + 2-option completion message.
- **Autopilot mode**: emit status line + return. Flag `?` if SSoT location is ambiguous (no convention exists) — orchestrator batches.

## Output (autopilot status line — required)

`> api-contract: [METHOD path], SSoT [path]  [✓|?]`

Example: `> api-contract: POST /api/things, SSoT internal/contracts/  ✓`

---

## Why this exists

Previous pain: "API เรียกผิด, UI ไม่ตรง". Root cause: FE and BE each invent their own shape and never reconcile until manual testing. Locking the contract before either side is written makes drift impossible by construction — both sides import the same definition, both sides break the build if you change it without updating the other.
