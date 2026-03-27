---
type: concept
tags: [backend, api-security, oauth2, cors, csrf, jwt, api-key, security]
related: [CON-authentication-authorization, CON-security-fundamentals, CON-api-design-principles, CON-rate-limiting]
updated: 2026-03-25
source: template
---

# API Security

Authentication, authorization, and protection patterns for APIs.

## OAuth 2.0 Flows

Standard protocol for delegated access without sharing passwords.

### Authorization Code + PKCE (Web/Mobile)

Used by web apps and mobile apps accessing user resources.

```
User Agent      App Server      OAuth Provider
   │               │                   │
   │───Auth Req────>│                   │
   │                │──Auth Request──>  │
   │                │                   │
   │ (User logs in, approves)           │
   │                │<─Auth Code───────│
   │<─Redirect──────│                   │
   │                │                   │
   │                │──Code + Secret──> │
   │                │<─Access Token────│
   │                │                   │
   │   (App has token, calls API)       │
```

Flow steps:
1. User clicks "Login with Google"
2. App redirects to OAuth provider with client_id
3. User authenticates, approves scope
4. Provider redirects back with authorization code
5. Backend exchanges code + secret for access token
6. App uses token to call API

```python
# Using authorization code
@app.route('/callback')
def oauth_callback():
    code = request.args.get('code')

    # Step 5: Exchange code for token
    token_response = requests.post(
        'https://oauth.provider/token',
        data={
            'grant_type': 'authorization_code',
            'code': code,
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
            'redirect_uri': REDIRECT_URI
        }
    )

    token = token_response.json()['access_token']
    session['access_token'] = token
    return redirect('/')
```

### PKCE (Proof Key for Public Clients)

Added layer for mobile/SPA apps (no secret storage):

```
1. Client creates: code_verifier = random_string(128)
2. Client creates: code_challenge = base64url(sha256(code_verifier))
3. Client sends: authorization request with code_challenge
4. After user approves, client exchanges: code + code_verifier
5. Provider verifies: sha256(code_verifier) == code_challenge
```

**Why**: Prevents authorization code interception attacks.

### Client Credentials (M2M)

Service-to-service authentication (no user involved):

```
Service A                OAuth Provider
  │                            │
  │──Client ID + Secret──────> │
  │<─────Access Token─────────│
  │                            │
  │  (Service A calls API with token)
```

```python
def get_machine_token():
    response = requests.post(
        'https://oauth.provider/token',
        data={
            'grant_type': 'client_credentials',
            'client_id': CLIENT_ID,
            'client_secret': CLIENT_SECRET,
            'scope': 'api:write'
        }
    )
    return response.json()['access_token']
```

### Device Flow

For devices without browsers (IoT, smart TVs):

```
Device                    OAuth Provider      User Browser
  │──Device Code──────────>  │                    │
  │<─Device Code + URL────   │                    │
  │                          │                    │
  │ (displays code on screen)│                    │
  │                          │<──User visits──────│
  │ (polls for approval)     │──Enters code──────>│
  │<──Access Token──────────│                    │
```

## API Key Management

Simple bearer token for public APIs and service accounts.

### Generation

```python
import secrets
import base64

def generate_api_key():
    """Generate cryptographically secure API key."""
    raw = secrets.token_bytes(32)
    return base64.urlsafe_b64encode(raw).decode('utf-8')

# Example: zPqXx5Wkj2Y8vL9mN3bQ1aZ6cR4sT7uV
```

### Storage

```python
import hashlib

# Never store plaintext! Store hashed + salted
def hash_api_key(key):
    return hashlib.sha256(key.encode()).hexdigest()

# Database: Store hash only
db.api_keys.insert_one({
    'user_id': 123,
    'key_hash': hash_api_key(key),
    'created_at': datetime.now(),
    'scopes': ['read:users', 'write:posts']
})

# On request: hash incoming key, compare hashes
incoming_hash = hash_api_key(request.headers['Authorization'])
stored_key = db.api_keys.find_one({'key_hash': incoming_hash})
```

### Scoping

Limit what each key can access:

```python
# Key has scopes
key_scopes = ['read:users', 'write:posts']

# Endpoint requires
@app.route('/api/admin/delete-user', methods=['DELETE'])
@require_scope('admin:*')
def delete_user(user_id):
    return {}

# Validation
def require_scope(required):
    def decorator(f):
        def wrapper(*args, **kwargs):
            if not any(matches(s, required) for s in key_scopes):
                return 403, {'error': 'insufficient_scope'}
            return f(*args, **kwargs)
        return wrapper
    return decorator
```

### Rotation

```python
# Allow multiple active keys during rotation window
db.api_keys.update_one(
    {'user_id': 123},
    {'$set': {'rotated_at': datetime.now()}}
)

# After rotation period, deactivate old key
def cleanup_old_keys(days=30):
    cutoff = datetime.now() - timedelta(days=days)
    db.api_keys.delete_many({'rotated_at': {'$lt': cutoff}})
```

## CORS (Cross-Origin Resource Sharing)

Allows controlled cross-origin requests from browsers.

### Preflight Request

Browser sends OPTIONS before actual request if:
- Method is not simple (GET/POST/HEAD)
- Custom headers present
- Non-standard content-type

```
Browser (http://app.example.com)
  │
  ├─ OPTIONS /api/users
  │   Origin: http://app.example.com
  │   Access-Control-Request-Method: DELETE
  │
  └─ Server responds:
     Access-Control-Allow-Origin: http://app.example.com
     Access-Control-Allow-Methods: GET, POST, DELETE
     Access-Control-Allow-Headers: Content-Type, Authorization
     Access-Control-Max-Age: 86400
  │
  └─ Browser now sends actual DELETE request
```

### Implementation

```python
from flask_cors import CORS

# Allow all origins (NOT PRODUCTION)
CORS(app)

# Specific origins
CORS(app, resources={
    r'/api/*': {
        'origins': ['https://example.com', 'https://app.example.com'],
        'methods': ['GET', 'POST', 'PUT', 'DELETE'],
        'allow_headers': ['Content-Type', 'Authorization'],
        'expose_headers': ['X-Total-Count'],
        'supports_credentials': True,
        'max_age': 3600
    }
})
```

### Common Misconfigurations

| Misconfiguration | Risk | Fix |
|---|---|---|
| `Access-Control-Allow-Origin: *` with credentials | Leaks auth to anyone | Use whitelist + credentials: false |
| `Allow-Origin: *` | Any site can call your API | Restrict to known origins |
| Missing preflight | Browser blocks request | Ensure correct CORS headers |
| Over-permissive headers | Exposes sensitive headers | Only expose what's needed |

## CSRF (Cross-Site Request Forgery)

Prevent requests from being initiated by third-party sites.

### Attack Example

```
User logs into bank.com
User visits evil.com (same session)
evil.com has: <img src="bank.com/transfer?to=attacker&amount=1000">
Browser auto-sends with bank's session cookie
→ Money transferred without user's knowledge
```

### SameSite Cookie

Modern, simple defense:

```
Set-Cookie: session=abc123; SameSite=Strict; Secure; HttpOnly

Values:
- Strict: Never send cookie to cross-origin (safest, but breaks some workflows)
- Lax: Send only on top-level navigation (good balance)
- None: Always send (requires Secure flag)
```

### CSRF Token

Traditional approach for forms:

```html
<form method="POST" action="/transfer">
    <input type="hidden" name="csrf_token" value="AbCd1234...">
    <input type="text" name="amount">
    <button type="submit">Transfer</button>
</form>
```

```python
# Server generates + validates token
import secrets

def generate_csrf_token():
    return secrets.token_hex(32)

@app.route('/transfer', methods=['POST'])
def transfer():
    token = request.form.get('csrf_token')
    session_token = session.get('csrf_token')

    if not token or token != session_token:
        return 403, {'error': 'csrf_token_invalid'}

    # Process transfer
    return {'status': 'success'}
```

### Double-Submit Cookie Pattern

```python
# Set CSRF token in both cookie and form
Set-Cookie: csrf_token=abc123; SameSite=Lax

# Client must include in header OR form
Headers: X-CSRF-Token: abc123

# Server compares
if request.headers.get('X-CSRF-Token') != request.cookies.get('csrf_token'):
    return 403
```

## JWT (JSON Web Token) Security

Stateless tokens but with security concerns.

### Token Structure

```
header.payload.signature

Header: {"alg":"HS256","typ":"JWT"}
Payload: {"user_id":123,"exp":1703000000}
Signature: HMAC(header.payload, secret)
```

### Best Practices

```python
import jwt
from datetime import datetime, timedelta

# Short expiry (15 min)
payload = {
    'user_id': 123,
    'exp': datetime.utcnow() + timedelta(minutes=15),
    'iat': datetime.utcnow(),
    'aud': 'app.example.com'  # Audience
}

token = jwt.encode(payload, SECRET_KEY, algorithm='HS256')

# On request
try:
    decoded = jwt.decode(token, SECRET_KEY, algorithms=['HS256'], audience='app.example.com')
except jwt.ExpiredSignatureError:
    return 401, {'error': 'token_expired'}
except jwt.InvalidSignatureError:
    return 401, {'error': 'invalid_signature'}
```

### Common Mistakes

| Mistake | Impact | Fix |
|---------|--------|-----|
| Long expiry (days) | Token can't be revoked | Use short expiry (15 min) + refresh token |
| No signature validation | Anyone can forge tokens | Always validate signature + expiry |
| Algorithm: none | Attacker sets alg:none | Whitelist algorithms, forbid 'none' |
| Sensitive data in payload | PII exposed (base64 decoded) | Never store passwords, PII in token |
| No audience (aud) claim | Token valid for other apps | Always use 'aud' claim |

### Refresh Token Pattern

```
Short-lived Access Token (15 min) + Long-lived Refresh Token (7 days)

Initial login:
  POST /auth/login → { access_token: "...", refresh_token: "..." }

Access token expired:
  POST /auth/refresh { refresh_token: "..." } → { access_token: "..." }

Logout:
  DELETE /auth/refresh (invalidate refresh token in DB)
```

## Input Validation & Injection Prevention

### At API Boundary

```python
from pydantic import BaseModel, EmailStr, constr

class CreateUserRequest(BaseModel):
    email: EmailStr
    name: constr(min_length=1, max_length=100)
    age: int  # Validated as integer

    class Config:
        strict = True

@app.post('/users')
def create_user(req: CreateUserRequest):
    # req is validated before handler runs
    return {'user_id': 123}
```

### SQL Injection Prevention

```python
# ❌ VULNERABLE
query = f"SELECT * FROM users WHERE email = '{email}'"

# ✓ SAFE: Parameterized query
query = "SELECT * FROM users WHERE email = ?"
db.execute(query, [email])

# ✓ SAFE: ORM
user = User.query.filter_by(email=email).first()
```

### Command Injection Prevention

```python
# ❌ VULNERABLE
os.system(f"convert {user_input} output.png")

# ✓ SAFE: Use subprocess with list args
subprocess.run(['convert', user_input, 'output.png'], check=True)
```

## API Security Checklist

- [ ] Use HTTPS only (TLS 1.2+)
- [ ] Authenticate all requests (OAuth, API key, JWT)
- [ ] Validate input at boundary (type, length, format)
- [ ] Use parameterized queries (no SQL injection)
- [ ] Implement rate limiting (prevent abuse)
- [ ] Add CORS headers (allow only known origins)
- [ ] Use SameSite cookies (CSRF protection)
- [ ] Validate JWT signature + expiry
- [ ] Never log sensitive data (passwords, tokens)
- [ ] Use secrets for tokens (not predictable)
- [ ] Rotate API keys periodically
- [ ] Whitelist algorithms (forbid 'none')
- [ ] Set proper headers (X-Content-Type-Options, X-Frame-Options)
- [ ] Monitor for abuse patterns
- [ ] Have an incident response plan

## See Also

- [[CON-authentication-authorization]] — auth patterns
- [[CON-security-fundamentals]] — broader security
- [[CON-api-design-principles]] — API design
- [[CON-rate-limiting]] — abuse prevention
