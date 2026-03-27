---
type: concept
tags: [security, infra, OWASP, secure-coding, threat-model]
related: [CON-sre-fundamentals, CON-cloud-fundamentals, CON-networking-basics]
updated: 2026-03-25
source: template
---

# Security Fundamentals

## Security Mindset: Threat Modeling

Before writing code, ask:
```
STRIDE framework:
  S — Spoofing     (impersonating a user or system)
  T — Tampering    (modifying data in transit or storage)
  R — Repudiation  (denying an action occurred)
  I — Information Disclosure (data leak)
  D — Denial of Service (making system unavailable)
  E — Elevation of Privilege (gaining unauthorized access)
```

---

## OWASP Top 10 (2021)

### A01 — Broken Access Control
```
Problem: Users can access resources they shouldn't
Examples:
  - Changing ?userId=123 to ?userId=456 accesses other user's data
  - User can access admin endpoints without admin role

Fix:
  - Check authorization on EVERY request (not just UI hide)
  - Use middleware for auth checks
  - Test with different user roles
  - Log all access control failures
```

### A02 — Cryptographic Failures
```
Problem: Weak or missing encryption
Examples:
  - Passwords stored as MD5/SHA1 (crackable)
  - Credit card numbers stored unencrypted
  - HTTP instead of HTTPS

Fix:
  - bcrypt/argon2 for passwords (not SHA/MD5)
  - TLS everywhere (redirect HTTP → HTTPS)
  - Encrypt sensitive data at rest
  - Never log sensitive data (passwords, tokens, card numbers)
```

### A03 — Injection
```
Problem: Untrusted data sent to interpreter
Examples:
  SQL Injection: SELECT * FROM users WHERE name = '" + userInput + "'"
  → Input: '; DROP TABLE users; --

Fix:
  ✅ Parameterized queries / prepared statements:
     db.query("SELECT * FROM users WHERE name = ?", [userInput])
  ✅ ORMs (usually safe by default)
  ✅ Input validation and sanitization
  ✅ Least privilege DB user
```

### A04 — Insecure Design
```
Problem: Security not considered in design phase
Fix: Threat modeling during /discovery and /design be
```

### A05 — Security Misconfiguration
```
Problem: Default configs, open cloud storage, verbose errors
Examples:
  - S3 bucket publicly readable
  - Admin panel on default port with default password
  - Stack traces exposed to users

Fix:
  - Secure defaults in infrastructure
  - Remove unused features, ports, accounts
  - Error messages: generic to users, detailed in logs
  - Regular security audits
```

### A06 — Vulnerable Components
```
Problem: Using libraries with known vulnerabilities
Fix:
  ✅ npm audit / yarn audit regularly
  ✅ Dependabot / Snyk for automated vulnerability scanning
  ✅ Keep dependencies updated
  ✅ Don't use abandoned packages
```

### A07 — Authentication Failures
```
Problem: Weak authentication implementation
Examples:
  - No rate limiting on login (brute force)
  - Weak passwords allowed
  - JWT with weak secret

Fix:
  - Rate limit login attempts (e.g., 5 attempts → 15 min lockout)
  - Strong password policy
  - MFA for sensitive actions
  - Secure session management
  - JWT: strong secret, short expiry, HTTPS only
```

### A08 — Data Integrity Failures
```
Problem: Code or data modified without integrity check
Examples:
  - Insecure deserialization
  - CI/CD pipeline pulls from untrusted source

Fix:
  - Verify signatures on software packages
  - Use trusted CI/CD pipelines with signed artifacts
```

### A09 — Security Logging Failures
```
Problem: Security events not logged or monitored
Fix:
  ✅ Log: failed logins, access control failures, admin actions
  ✅ Alert on: multiple failed logins, unusual patterns
  ✅ Protect logs from modification
  ✅ Log correlation ID for tracing
```

### A10 — SSRF (Server-Side Request Forgery)
```
Problem: Server fetches URL supplied by user → can access internal services
Example: User submits URL → server fetches it → attacker points to internal DB

Fix:
  - Validate and sanitize all user-supplied URLs
  - Allow-list of valid domains
  - Block internal IP ranges (169.254.x.x, 10.x.x.x)
```

---

## Security Principles

| Principle | Meaning |
|-----------|---------|
| **Least Privilege** | Users/services get minimum permissions needed |
| **Defense in Depth** | Multiple security layers — one breach ≠ full compromise |
| **Zero Trust** | Never trust, always verify — even internal traffic |
| **Fail Secure** | On error, deny access (not grant) |
| **Security by Default** | Secure configuration is the default, not opt-in |
| **Don't Roll Your Own Crypto** | Use proven libraries (bcrypt, sodium) |

---

## Secrets Management

```
❌ Never:
  Hardcode in source code
  Commit to git (even private repos)
  Send in logs or error messages
  Pass in URL parameters

✅ Always:
  Environment variables (for simple cases)
  Secrets manager: AWS Secrets Manager, HashiCorp Vault, Azure Key Vault
  Rotate secrets regularly
  Different secrets per environment (dev ≠ staging ≠ prod)
```

## Related

- [[CON-sre-fundamentals]] — security incidents = reliability incidents
- [[../backend/CON-authentication-authorization]] — auth security
- [[../../00-MOC/MOC-Infrastructure]]
