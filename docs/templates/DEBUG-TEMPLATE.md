# Debug Record — [task-id]

**Created:** [ISO date]
**Last updated:** [ISO date]
**Linked issues:** [task-id]-issues.md (if any)

---

## Incident — [ISO date]

### Symptom

What was observed? Include error message, stack trace excerpt, or user-visible behavior. Be specific — "API was slow" is not a symptom; "POST /upload returned 500 after 12s with `ECONNRESET`" is.

### Reproduction

Exact steps to trigger the bug, including any environment, fixtures, or input data. Should be runnable by another engineer without further context.

```
1. ...
2. ...
3. ...
```

If the bug is intermittent, note the observed frequency and any patterns (time of day, load, specific user).

### Root Cause

What was actually wrong, traced to the source — not the layer where the symptom appeared. One short paragraph or bullet list. Cite the line that caused it: `path/to/file.ts:42`.

### Fix

What was changed. Cite files modified. If the fix differs from the obvious patch (e.g. fixed at the source rather than the symptom layer), explain why.

```
- path/to/file.ts:42 — reason
- path/to/other.ts:88 — reason
```

### Tests Added

Regression tests proving the bug is fixed. List file paths and the assertions they make.

```
- path/to/file.test.ts — "rejects empty payload with 400" (red → green confirmed)
```

### Lessons

What's worth remembering for next time? Mark each as a candidate for a brain `LES-` note if generally useful:

- [ ] Lesson candidate: ...
- [ ] Lesson candidate: ...
