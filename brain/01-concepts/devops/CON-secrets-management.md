---
type: concept
tags: [devops, security, secrets, fundamentals]
related: [CON-security-fundamentals, CON-api-security, CON-authentication-authorization]
updated: 2026-04-29
source: template
---

# Secrets Management

## Core idea

A **secret** is any value that grants access — API keys, DB passwords, signing keys, tokens. Where you store and how you rotate them is one of the highest-leverage security decisions a team makes.

The 2026 consensus: **dynamic, short-lived, identity-bound credentials**, not static long-lived strings in env vars.

## The threat model

What you're defending against:
- Secret committed to git (most common breach root cause)
- Secret printed in logs
- Secret exposed in error messages
- Secret leaked via supply-chain attack (compromised dep reads `process.env`)
- Secret stays valid after a developer leaves the team
- Secret is the same across dev/staging/prod

Each of these has a specific mitigation.

## Storage options — the spectrum

| Where | Severity of risk | When (if ever) acceptable |
|-------|------------------|--------------------------|
| **Hardcoded in source** | 🔴 Critical | Never |
| **`.env` checked into git** | 🔴 Critical | Never |
| **`.env` local + `.gitignore`** | 🟡 Medium | Personal dev only |
| **OS env var injected at runtime** | 🟡 Medium | Small projects, short-lived secrets |
| **Cloud-native secrets store** (AWS Secrets Manager, GCP Secret Manager, Azure Key Vault) | 🟢 Good | Default for cloud workloads |
| **HashiCorp Vault** | 🟢 Good | Multi-cloud or on-prem; richer policy |
| **Dynamic secrets from Vault / cloud IAM** | 🟢🟢 Best | Production critical paths |

The general rule: **the further down this list, the better.**

## Static vs dynamic secrets

### Static
A long-lived string. The DB password your app uses is static.

**Problems:**
- Long-lived → if leaked, valid until rotated
- Rotation is manual and risky (everyone using the password breaks at the same instant)
- Audit trail = "the password was used" with no per-actor identity

### Dynamic
Generated on demand, scoped to the requester, **expires automatically** (often within hours).

**Example flow (Vault):**
1. App starts, authenticates to Vault with its identity (Kubernetes service account, AWS IAM role, etc.)
2. App requests a DB credential
3. Vault generates a fresh DB user with limited permissions, expiry 1h
4. App uses it; Vault auto-revokes when TTL expires

**Properties:**
- Compromised credential is useful for ≤1 hour
- Per-request audit trail (who got which credential, when)
- No rotation event — every credential is "fresh"

The shift from static to dynamic is the most significant architectural change in secrets management in 2026.

## Encryption — at-rest and in-flight

A secret store encrypts secrets:

- **At rest** — disk-level (database) + an envelope key
- **In flight** — TLS between client and store
- **The envelope key** is itself protected by a HSM or KMS

In AWS:
```
Secret in Secrets Manager
  ↳ encrypted with a Data Key
       ↳ Data Key wrapped by KMS Customer Master Key (CMK)
            ↳ CMK never leaves KMS / HSM
```

This is **envelope encryption**. The secret is never decrypted at rest; the data key is decrypted in memory only when the secret is read.

## Rotation

| Type | Rotation cadence | Mechanism |
|------|------------------|-----------|
| Static DB password | Quarterly+ (manual) | Risky, requires app restart |
| OAuth refresh token | Per spec (90 days typical) | App code handles refresh |
| Cloud IAM access keys | 90 days max recommended | Automated via lifecycle |
| **Dynamic credential** | Hourly+ (auto) | Vault revokes on expiry |

Static rotation is hard because every consumer must update at the same time. Dynamic rotation is automatic because each consumer gets its own short-lived credential.

## The OWASP rules of secrets

1. **Never** in source control. Use `.gitignore` + git-secrets / trufflehog scanning in CI.
2. **Never** in logs. Mask values like `password=***` in log middleware.
3. **Never** in error messages. Production stack traces must not include env vars.
4. **Never** as URL parameters. They land in proxy logs and browser history.
5. **Never** the same across environments. Prod credentials don't appear in dev.
6. **Always** scoped (least privilege).
7. **Always** rotatable.
8. **Always** auditable (who accessed what, when).

## Identity-bound access (Zero Trust)

Modern systems give each workload an **identity** (Kubernetes service account, AWS IAM role for service account / IRSA, GCP workload identity) and grant secret access based on that identity — not on a shared password.

```
Pod runs in cluster → has K8s SA → bound to IAM role → 
  KMS allows that role to decrypt this specific secret → 
    Pod fetches secret transparently, no credentials in image or env
```

**Why:** there is no master credential to leak. Compromise of the pod yields only the secrets that pod was allowed to read, scoped to the pod's lifetime.

This is the **zero trust** model: every secret request is evaluated dynamically against identity + policy.

## Tools landscape (2026)

| Tool | Sweet spot |
|------|-----------|
| **HashiCorp Vault** | Multi-cloud, on-prem, richest policy & dynamic secrets |
| **AWS Secrets Manager** | AWS-native, integrates with IAM, simple rotation |
| **AWS Parameter Store** | Cheap, simple, less feature-rich than Secrets Manager |
| **GCP Secret Manager** | GCP-native equivalent |
| **Azure Key Vault** | Azure-native |
| **Doppler / Infisical** | Developer-friendly, multi-env config + secrets |
| **Kubernetes Secrets** | Built-in — but base64 ≠ encryption; use with KMS provider or wrap in Vault |
| **SOPS + age/PGP** | GitOps-friendly encrypted-at-rest secrets in repos |

For most teams: **cloud-native + dynamic credentials for DB / external APIs** is the right starting point. Add Vault when multi-cloud or on-prem requires it.

## Anti-patterns

| Anti-pattern | Why bad | Fix |
|--------------|---------|-----|
| **`.env` committed** | Public history forever | Rotate, commit-scan in CI |
| **Same DB password in dev/prod** | Dev breach → prod breach | Per-env secrets |
| **Secret in Slack DM "for now"** | Persists, indexes, leaks via integrations | Pull from secrets manager |
| **Long-lived API key in CI** | CI logs + env exposure | OIDC short-lived federation |
| **Manual rotation only** | Skipped, secrets stay valid for years | Automate or use dynamic |
| **Wildcards in IAM policy** | Compromise = full access | Least privilege per workload |

## CI/CD secrets

CI is a high-value target — it has secrets for prod. Mitigations:
- Use **OIDC** to federate from CI → cloud (no long-lived cloud keys in CI)
- Mask secrets in build output
- Restrict secret access to specific workflows/branches
- Audit who triggers builds with prod-secret access

## Local development

The hardest case — devs need *something*. Patterns:
- Per-dev short-lived credentials from secret manager (Vault dev mode, AWS SSO assume-role)
- `.env.local` file from `vault read -format=env > .env.local` (regenerated daily)
- Mock external APIs in dev to remove the need for real secrets

## Related

- [[../infra/CON-security-fundamentals]] — broader security context
- [[../backend/CON-api-security]] — auth tokens and API keys
- [[../backend/CON-authentication-authorization]] — identity, where secrets often originate
- [[CON-cicd-pipeline]] — secrets in CI specifically
