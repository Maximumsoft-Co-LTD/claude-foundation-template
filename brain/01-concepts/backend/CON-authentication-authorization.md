---
type: concept
tags: [backend, security, auth, JWT, OAuth2, RBAC, session]
related: [CON-api-design-principles, CON-error-handling]
updated: 2026-03-25
---

# Authentication & Authorization

## Key Distinction

```
Authentication (AuthN) = "Who are you?"   → verify identity
Authorization  (AuthZ) = "What can you do?" → check permissions
```

## Authentication Methods

### JWT (JSON Web Token)
```
Header.Payload.Signature

Payload contains: userId, role, expiry (exp), issued-at (iat)

Flow:
  1. User logs in → server creates JWT
  2. Client stores JWT (HttpOnly cookie or memory)
  3. Client sends JWT in header: Authorization: Bearer <token>
  4. Server validates signature, checks expiry
  5. Server reads userId/role from payload (no DB lookup)

Pros: Stateless, scalable, works across services
Cons: Can't invalidate before expiry, payload visible (don't put secrets)
```

### Session-Based
```
Flow:
  1. User logs in → server creates session in DB/Redis
  2. Server sends session ID in cookie
  3. Client sends cookie automatically
  4. Server looks up session in DB → gets user data

Pros: Can revoke instantly, simpler
Cons: Requires session store, not stateless
```

### OAuth2 + OIDC (3rd party login)
```
Flow:
  1. User clicks "Login with Google"
  2. Redirect to Google with client_id + scopes
  3. User grants permission
  4. Google redirects back with authorization code
  5. Server exchanges code for access_token + id_token
  6. Server creates local session/JWT

Common providers: Google, GitHub, Facebook, Auth0, Clerk
```

## Authorization Patterns

### RBAC (Role-Based Access Control)
```
User has Role → Role has Permissions

Role: admin    → permissions: [read, write, delete, manage_users]
Role: editor   → permissions: [read, write]
Role: viewer   → permissions: [read]

Check: if user.role has permission("delete") → allow
```

### ABAC (Attribute-Based Access Control)
```
Allow/Deny based on: user attributes + resource attributes + environment

Policy: "Allow if user.department == resource.department AND time == business_hours"

More flexible than RBAC but more complex to manage
```

## HTTP Status Codes for Auth

```
401 Unauthorized  → Not authenticated (no token, expired token)
403 Forbidden     → Authenticated but no permission
                   (never 404 to hide resource existence from attackers)
```

## Security Checklist

- [ ] Passwords hashed with bcrypt/argon2 (NOT MD5/SHA1)
- [ ] JWT secret is long (256-bit+) and stored in env var
- [ ] JWT expiry set (access: 15min-1h, refresh: 7-30 days)
- [ ] Refresh token rotation implemented
- [ ] HttpOnly + Secure cookies (prevent XSS stealing tokens)
- [ ] Rate limit on login endpoint (prevent brute force)
- [ ] CORS configured correctly (not `*` in production)
- [ ] HTTPS everywhere (redirect HTTP → HTTPS)

## Related

- [[CON-api-design-principles]] — which endpoints need auth
- [[CON-backend-layers]] — auth middleware in handler layer
- [[../../../00-MOC/MOC-Backend]]
