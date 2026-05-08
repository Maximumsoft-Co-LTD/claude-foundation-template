---
paths:
  - ".claude/skills/**/SKILL.md"
  - ".claude/skills/**/agents/openai.yaml"
---

# Skill Authoring Rules

## Frontmatter contract

- `SKILL.md` frontmatter must stay within the current validator schema: `name`, `description`, `license`, `allowed-tools`, `metadata`
- `name` and `description` are mandatory
- `description` must explain **what the skill does** and **when it should trigger**; avoid marketing language

## Trigger clarity

Every active skill should make these boundaries explicit in the body:
- `Workflow position`
- `## When to invoke`
- when to skip / not use it
- expected output / handoff contract
  `## Output` is preferred; `## Step N — Output` is also acceptable when the skill is strongly step-oriented

If a future maintainer cannot tell whether a skill should trigger, the skill is underspecified.

## Progressive disclosure

- Keep `SKILL.md` focused on the core workflow
- Move bulky variants, examples, schemas, or long references into `references/` or scripts
- Prefer deterministic scripts for fragile or repeated operations
- Avoid duplicating the same detailed content in both `SKILL.md` and `references/`

## UI metadata

If `agents/openai.yaml` exists:
- keep `display_name`, `short_description`, and `default_prompt` aligned with `SKILL.md`
- regenerate or update it when the skill's responsibility changes materially

## Anti-patterns

- Do not reintroduce legacy frontmatter keys the current validator does not accept
- Do not turn a skill into a mini-product with README / changelog / auxiliary docs inside the skill folder
- Do not let examples outweigh the actual operating instructions
