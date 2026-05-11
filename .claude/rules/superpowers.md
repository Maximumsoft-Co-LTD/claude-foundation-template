---
name: Superpowers Integration Rules
description: Establishes priority (template commands win), file-path overrides, sprint-context propagation, and graceful degradation when superpowers is absent.
scope: universal
---

# Superpowers Integration Rules

This template integrates with the [obra/superpowers](https://github.com/obra/superpowers) plugin. These rules govern how superpowers skills interact with template commands.

## Priority

**Template commands always take priority.** When a user invokes a template slash command (e.g. `/discovery`, `/implement`), execute the template command — do NOT let the `using-superpowers` orchestrator override it with a superpowers skill.

Invocation hierarchy:
1. **Template slash commands** (`/discovery`, `/implement`, etc.) — sprint-aware, authoritative
2. **Template bridge commands** (`/brainstorm`, `/write-plan`, `/execute-plan`) — invoke superpowers internally
3. **Direct superpowers skill invocations** (`superpowers:brainstorming`) — only when explicitly requested

## File Path Overrides

Template commands override superpowers default save paths:

| Superpowers default | Template path |
|---------------------|---------------|
| `docs/superpowers/specs/YYYY-MM-DD-<topic>-design.md` | `docs/discovery/[disc-id]-[name].md` |
| `docs/superpowers/plans/YYYY-MM-DD-<feature-name>.md` | `docs/sprints/[sprint-id]/[task-id]/[task-id]-plan.md` |

Always use the template path when inside a template command context.

## Sprint-Awareness Requirement

Superpowers skills have no knowledge of task IDs, sprint IDs, or BACKLOG.md. Before invoking any superpowers skill from a template command:
1. Load the required task context (requirement doc, design docs, sprint overview)
2. Pass that context explicitly in the skill invocation prompt
3. After the skill completes, update BACKLOG.md status as needed

## Graceful Degradation

All template commands work unchanged when superpowers is NOT installed. Every superpowers integration point is advisory:

```
If the superpowers plugin is available, invoke Skill("superpowers:X") here.
Otherwise, follow the inline steps below.
```

Never hard-fail because superpowers is absent.

## `using-superpowers` Orchestrator

The `using-superpowers` skill (auto-loaded at session start) says "invoke a skill before any response." This applies to **freeform user messages** — it does NOT apply when executing a template slash command. Template commands are pre-defined workflows and must not be interrupted by the orchestrator.

Exception: if the user sends a freeform message like "let's brainstorm X" (not prefixed with `/`), the orchestrator correctly routes to `/brainstorm`.
