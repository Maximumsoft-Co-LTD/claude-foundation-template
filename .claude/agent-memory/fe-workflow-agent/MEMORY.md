# Memory Index

## Feedback
- [feedback_discovery_questions.md](feedback_discovery_questions.md) — /discovery should create file first, then ask all questions at once (not one by one)
- [feedback_new_sprint_scaffold.md](feedback_new_sprint_scaffold.md) — /new-sprint should only scaffold requirement.md, not frontend/backend design docs (those belong to /fe-design and /be-design)

## Project Patterns
- [pattern_test_react_hooks.md](pattern_test_react_hooks.md) — Component tests with hooks must use static imports; never resetModules() before requiring a hooks component
- [pattern_service_extraction.md](pattern_service_extraction.md) — Route logic extracted into service module for direct testing; avoids Next.js transform issues in Jest node env
- [pattern_sql_params.md](pattern_sql_params.md) — Use ? (anonymous) not ?1/?2 (numbered) SQL params for better-sqlite3 shim compatibility
- [pattern_next_navigation_mock.md](pattern_next_navigation_mock.md) — Any component using useSearchParams/useRouter requires jest.mock('next/navigation') in every test file that imports it — including pre-existing files
