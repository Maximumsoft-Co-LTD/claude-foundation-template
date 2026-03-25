---
type: glossary
term: PostToolUse Hook
tags: [claude-code, automation, linting, testing, ci-cd]
updated: 2026-03-25
---

# PostToolUse Hook

**Definition:** A Claude Code lifecycle event that fires automatically after every Write or Edit tool call, enabling automated checks like linting, formatting, and testing without requiring manual invocation.

## What Is It?

When Claude (or any Claude Code user) writes or edits a file, the PostToolUse hook system:
1. Detects the file change
2. Looks up path-scoped rules in `.claude/hooks/PostToolUse/`
3. Executes matching scripts (shell, Python, Node, etc.)
4. Reports results in the chat or logs

**Result:** Errors are caught immediately, before the developer needs to run checks manually.

## How It Works

### File Structure
```
.claude/hooks/
└── PostToolUse/
    ├── lint_js.sh          # Runs on *.js, *.jsx files
    ├── lint_go.py          # Runs on *.go files
    ├── lint_python.py      # Runs on *.py files
    ├── format_yaml.sh      # Runs on *.yaml, *.yml files
    └── test_changes.sh     # Runs on test files
```

### Hook File Example (lint_js.sh)
```bash
#!/bin/bash
# Runs after any JavaScript edit
# Arguments: $1 = file path

FILE=$1

# Run ESLint
npx eslint "$FILE" --fix

# Check for linting errors
if ! npx eslint "$FILE"; then
  echo "❌ ESLint failed for $FILE"
  exit 1
fi

echo "✅ Linting passed for $FILE"
exit 0
```

### Triggering the Hook
```
Claude edits: src/auth.js
    ↓
PostToolUse hook system detects .js file
    ↓
Looks for `.claude/hooks/PostToolUse/lint_js.sh`
    ↓
Executes: `./lint_js.sh src/auth.js`
    ↓
Result reported to user
```

## Practical Examples

### Example 1: Auto-Format on Save
```bash
# .claude/hooks/PostToolUse/format_python.py
import subprocess
import sys

file_path = sys.argv[1]

# Run Black formatter
result = subprocess.run(['black', file_path])
sys.exit(result.returncode)
```

**Effect:** Whenever Claude edits a `.py` file, Black auto-formats it.

### Example 2: Run Tests on Test File Edit
```bash
# .claude/hooks/PostToolUse/test_typescript.sh
#!/bin/bash

FILE=$1

# Only run tests if it's a test file
if [[ "$FILE" == *".test.ts" ]]; then
  npm test -- "$FILE"
fi
```

**Effect:** After Claude edits a test file, the test suite runs automatically.

### Example 3: Lint on Any Edit
```bash
# .claude/hooks/PostToolUse/lint_all.sh
#!/bin/bash

FILE=$1

# Run appropriate linter based on file extension
case "$FILE" in
  *.ts|*.tsx|*.js|*.jsx)
    npx eslint "$FILE"
    ;;
  *.py)
    pylint "$FILE"
    ;;
  *.go)
    go vet ./...
    ;;
  *.yaml|*.yml)
    yamllint "$FILE"
    ;;
esac
```

**Effect:** Any file edit triggers the appropriate linter.

## Benefits

✅ **Catch errors immediately** — Linting/formatting issues found before code review
✅ **Maintain code quality** — Consistent style enforced automatically
✅ **Run tests as you code** — Regression caught as Claude implements
✅ **No manual overhead** — No need to remember to run `npm lint` or `pytest`
✅ **Faster feedback loop** — Claude knows immediately if something broke

## Exit Codes Matter

PostToolUse hooks should exit with:
- **0** — Success; continue with next hook or finish
- **non-zero** — Failure; stop and report error to user

```bash
#!/bin/bash
if some_check_fails; then
  echo "❌ Check failed"
  exit 1  # Fails the hook
fi

echo "✅ Check passed"
exit 0   # Succeeds
```

## Common Hook Scripts

### Lint (ESLint for JavaScript)
```bash
#!/bin/bash
npx eslint "$1" --fix
```

### Format (Prettier)
```bash
#!/bin/bash
npx prettier --write "$1"
```

### Type Check (TypeScript)
```bash
#!/bin/bash
npx tsc --noEmit "$1"
```

### Test (Jest)
```bash
#!/bin/bash
npx jest "$1" --testPathPattern="test|spec"
```

### Build Check (Try compiling)
```bash
#!/bin/bash
cargo build --check  # For Rust
# or
go build ./...       # For Go
```

## Configuration in CLAUDE.md

PostToolUse hooks are configured in `.claude/hooks/PostToolUse/`:

```
# In CLAUDE.md or .claude/hooks/PostToolUse/README.md

## PostToolUse Hooks

Configured hooks:
- `lint_js.sh` — Runs ESLint on all .js/.jsx edits
- `lint_ts.sh` — Runs TypeScript compiler on .ts/.tsx edits
- `test_js.sh` — Runs Jest on all .test.js edits
- `format_yaml.sh` — Formats YAML files

Disabled hooks:
- `lint_go.sh` — Only enabled on Go projects
```

## Limitations

⚠️ **Slow hooks can block workflow** — If a PostToolUse hook takes 30 seconds, each edit is delayed
⚠️ **Not all checks fit here** — Some tests (integration, e2e) are too slow for PostToolUse
⚠️ **Permissions required** — Hook scripts need execute permissions; may require `chmod +x`
⚠️ **Environment setup** — Hooks assume dev tools are installed (eslint, pytest, go, etc.)

## Best Practices

✅ Keep PostToolUse hooks **fast** (< 5 seconds)
✅ Use PostToolUse for **lightweight checks** (lint, format, type-check)
✅ Use **separate CI** for heavyweight tests (integration, e2e, performance)
✅ **Log clearly** what passed/failed
✅ **Exit non-zero on failure** so Claude knows something broke

## See Also

- [[DEC-002-posttooluse-lint-hooks]] — Architectural decision on when to use PostToolUse
- [[MOC-Architecture]] — Overview of Claude Code architecture and lifecycle events
- [[MOC-Workflow]] — Full development workflow including automated checks
