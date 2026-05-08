# Workflow Principles

Use this reference only when you need the rationale behind a workflow decision.

## 1. Scrum planning and visibility

Distilled from the Scrum Guide (November 2020):
- The Product Backlog is the single source of work.
- Sprint Backlog must carry `why`, `what`, and `how`.
- Product Backlog items are refined by adding description, order, and size.
- Scope can be clarified and renegotiated during the Sprint as more is learned, but not in a way that silently breaks the Sprint Goal.
- Definition of Done is the minimum quality bar for work to count as complete.

Applied here:
- `/discovery` and `/new-sprint` create the `why` and `what`.
- `/requirement` creates the task-level `how`.
- `Execution Slices` keep that `how` visible through `/implement`, `/code-review`, `/testing`, and `/dev`.

## 2. Keep agent workflows simple and explicit

Distilled from Anthropic's "Building effective agents" (Dec 19, 2024):
- Prefer simple, composable patterns over large frameworks.
- Use workflows for predictable tasks; use agents only when the next subtask cannot be known in advance.
- Prompt chaining works well when a task can be decomposed into fixed subtasks with gates.
- Orchestrator-workers fits complex coding tasks, but only when the orchestration stays transparent.
- Add complexity only when it clearly improves results.

Applied here:
- The workflow stays command-first.
- `/dev` orchestrates, but the plan contract stays explicit in the requirement doc.
- The agent should not "freestyle" when the task already has a valid plan.

## 3. Review should improve code health, not just catch syntax errors

Distilled from Google's engineering practices:
- Review design first, then functionality, complexity, tests, naming, comments, style, and docs.
- Review should improve overall code health over time.
- User-facing changes often need real behavior checks, not only static reading.
- Tests belong with the change unless it is an emergency.

Applied here:
- `/code-review` checks plan/AC compliance before code quality.
- `/testing` and `ui-verify` close the real-behavior gap for user-facing work.

## 4. Security review still needs humans

Distilled from the OWASP Code Review Guide:
- Security scanners are useful, but manual security review still has a prominent place in a secure SDLC.
- Reviewers should know the common vulnerability classes and inspect for red flags in context.

Applied here:
- `/code-review` keeps explicit security and edge-case checks.
- Plan slices do not replace manual security reasoning.

## 5. Testing should optimize feedback loops

Distilled from the Google Testing Blog:
- Good feedback loops are fast, reliable, and isolate failures.
- Smaller tests usually create better debugging loops than E2E-heavy strategies.
- Integration tests are for verifying units work together.
- Keep only a small number of broad E2E tests; use the test pyramid, not an inverted pyramid.

Applied here:
- `/implement` stays test-first.
- `/testing` runs unit + integration first, then focused E2E/journey checks.
- `Execution Slices` name their test-first proof up front so failures stay local.

## 6. Commit intent should be machine-readable

Distilled from Conventional Commits 1.0.0:
- Commit messages start with a type and short description.
- `feat` means a feature, `fix` means a bug fix, and more types can be added consistently.
- Breaking changes must be explicit.

Applied here:
- `/git-commit` keeps Conventional Commit style while still prefixing the task ID for sprint traceability.
