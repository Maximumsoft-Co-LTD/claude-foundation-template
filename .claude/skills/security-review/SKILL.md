---
description: Security-focused diff analysis — secrets, injection, insecure defaults, dependency risk
allowed-tools: Read, Grep, Bash(git diff *), Bash(git log *), Bash(gh *)
disable-model-invocation: false
---

# /security-review
Workflow position: **/implement → START → /code-review**

Run a security-focused analysis of all code changes in this task. Covers secrets, injection vulnerabilities, insecure defaults, and new dependency risk.
Arguments: `[task-id]`  — e.g. `SP1-T002`

Designed to run **before** `/code-review` or as a standalone gate before merge.

---

## Step 1 — Get the diff

Parse `[task-id]`, extract `[sprint-id]`.

```bash
git diff main...HEAD
```

Collect:
- All changed source files (path + hunks)
- All changed dependency files (`package.json`, `go.mod`, `requirements.txt`, `Gemfile`, etc.)
- Any new files added

---

## Step 2 — Secrets scan

Search every changed file for:

| Pattern | Risk |
|---------|------|
| Strings matching `(api_key\|secret\|password\|token\|private_key)\s*=\s*['"][^'"]{8,}` | Hardcoded credential |
| AWS key prefix `AKIA[0-9A-Z]{16}` | AWS access key |
| `-----BEGIN (RSA\|EC\|OPENSSH) PRIVATE KEY-----` | Private key material |
| High-entropy strings (>4.5 bits/char) longer than 20 chars assigned to a variable | Possible secret |

Flag as **CRITICAL** if found. Do not print the secret value — print only the file + line number.

---

## Step 3 — Injection vulnerability scan

For each changed file, check:

**SQL injection**
- Raw string concatenation into SQL queries?
- ORM `.raw()`, `.exec()`, or `db.query(string)` with user input?

**Command injection**
- `exec()`, `spawn()`, `subprocess.run(shell=True)` with user-controlled input?
- Template strings passed to shell commands?

**XSS**
- `innerHTML`, `dangerouslySetInnerHTML`, `document.write` with unescaped user input?
- Server-side: unescaped template variables output to HTML?

**Path traversal**
- `fs.readFile`, `open()`, `os.path.join` with user-controlled path segments without sanitization?

---

## Step 4 — Insecure defaults scan

Check for dangerous configurations introduced by this diff:

| Check | Flag if |
|-------|---------|
| CORS | `origin: "*"` or `allowedOrigins: ["*"]` without explicit intent |
| Auth bypass | Routes added without auth middleware when other routes require it |
| Crypto | `MD5`, `SHA1`, `DES`, `RC4` used for security-sensitive hashing |
| TLS | `InsecureSkipVerify: true`, `rejectUnauthorized: false` |
| Debug flags | `DEBUG=true`, `NODE_ENV=development` hardcoded in committed config |
| Rate limiting | New public endpoint with no rate limit applied |
| Error leakage | Stack traces or internal error details returned to API callers |

---

## Step 5 — Dependency risk (if dependency files changed)

For each new or updated dependency:
1. Check for known malicious packages (typosquatting of popular packages — compare spelling carefully)
2. Flag packages with < 100 GitHub stars and no clear org behind them
3. Flag major version bumps on security-sensitive packages (auth, crypto, http)
4. Flag packages that add `postinstall` scripts

This is a heuristic scan — not a full CVE database check. Flag concerns for human review.

---

## Step 6 — Authorization audit

Read the route/handler definitions in changed files:

- Every new endpoint has an auth check?
- Checks authorization (what the user can do), not just authentication (is the user logged in)?
- Privileged operations (admin, delete, export) have role checks?

---

## Step 7 — Write security report

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Security Review: [task-id] — [Task Title]
Result: CLEAR / ISSUES FOUND
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL (block merge):
  ☐ [file:line] — [issue description]

HIGH (fix before review):
  ☐ [file:line] — [issue description]

LOW (advisory):
  • [observation]

Dependency changes: [N new / N updated]
  ⚠ [package] — [concern]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

If result is CLEAR → print `✓ Security review passed` and proceed.
If CRITICAL issues found → run `/issue [task-id] [description]` per issue before continuing.

---

## Output

```
Result: CLEAR / ISSUES FOUND  ([N] critical / [N] high / [N] low)

Next:
  Critical issues → /issue [task-id] [description]  (per issue)
  Clear           → /code-review [task-id]
```
