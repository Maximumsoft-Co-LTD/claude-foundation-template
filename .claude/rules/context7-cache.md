---
name: Context7 Cache Rule
description: Defines the sprint-scoped JSON cache for context7 library-doc lookups and the read-then-fetch-then-write protocol.
scope: universal
---

# Context7 Cache Rule

Sprint-scoped cache for context7 library docs. Avoids re-fetching the same library + query across `/requirement`, `/implement`, `/code-review`, `/testing`, `/debug`, `/issue` within a sprint.

## Cache file

`docs/sprints/[sprint-id]/.context7-cache.json`

Created on first cache miss. Cleared by `/retro-sprint`.

## Schema

```json
{
  "<library-name>::<query-keywords>": {
    "libraryId": "<context7 library id>",
    "result": "<docs returned by query-docs>",
    "fetchedAt": "<ISO timestamp>"
  }
}
```

The cache key combines library name and a normalized form of the query (lowercase, trimmed, alphanumeric + spaces only, collapsed whitespace). Different queries against the same library are stored as separate entries.

## How to use (in a command step)

Before calling `mcp__plugin_context7_context7__resolve-library-id`:

1. Compute `cacheKey = "<library-name>::<normalized-query>"`.
2. Read `docs/sprints/[sprint-id]/.context7-cache.json` if it exists.
3. **Hit** → reuse `result`; skip both MCP calls.
4. **Miss** → call `resolve-library-id` then `query-docs`, then append `{ libraryId, result, fetchedAt }` under `cacheKey` and write the file back.

If `[sprint-id]` cannot be inferred from the current task (e.g. ad-hoc `/debug`), skip the cache and call MCP directly — caching is sprint-bound on purpose.

If context7 is not available, the cache is irrelevant — proceed with codebase patterns.

## How to clear

`/retro-sprint` removes the cache file as part of sprint close-out.
