---
type: pattern
id: PAT-001
category: testing
tags: [tdd, red-green-refactor, testing]
related: [CON-tdd-rules, DEC-001-real-deps-integration-tests]
updated: 2026-03-25
---

# PAT-001 — TDD Flow (Red → Green → Refactor)

## Problem

Developers write implementation first, then tests to match. Tests become documentation of what the code does, not specifications of what it should do. Bugs slip through because tests are written to pass existing code, not to catch regressions.

## Solution

Always follow Red → Green → Refactor:

```
1. RED    Write a failing test that describes desired behavior
           → Run it, confirm it fails for the right reason
2. GREEN  Write the minimum implementation to make it pass
           → Run it, confirm it passes
3. REFACTOR Clean up code without changing behavior
           → Run tests again, confirm still green
```

## When to Use

Every time you implement new behavior — no exceptions.

## When NOT to Use

Never skip. If time-boxed, write fewer tests, but always write them first.

## Concrete Example

```typescript
// 1. RED — write the failing test first
describe('UserService.login', () => {
  it('returns JWT token on valid credentials', async () => {
    const token = await userService.login('user@test.com', 'password123')
    expect(token).toMatch(/^eyJ/) // JWT shape
  })
})
// Run → FAIL ✗ (UserService.login doesn't exist yet)

// 2. GREEN — minimum implementation
class UserService {
  async login(email: string, password: string): Promise<string> {
    const user = await this.repo.findByEmail(email)
    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      throw new UnauthorizedError()
    }
    return jwt.sign({ userId: user.id }, process.env.JWT_SECRET)
  }
}
// Run → PASS ✓

// 3. REFACTOR — improve without breaking
// (extract constants, improve error messages, etc.)
// Run → PASS ✓
```

## Integration Test Version

```go
// Real DB, real HTTP — no mocks
func TestLoginEndpoint(t *testing.T) {
  // Setup real test DB with seed user
  db := testhelpers.NewTestDB(t)
  testhelpers.SeedUser(db, "user@test.com", "password123")

  // Real HTTP call to local test server
  resp, err := http.Post(testServer.URL+"/login", "application/json",
    strings.NewReader(`{"email":"user@test.com","password":"password123"}`))

  assert.NoError(t, err)
  assert.Equal(t, 200, resp.StatusCode)
  // Parse and validate JWT in response body
}
```

## Related

- [[../01-concepts/CON-tdd-rules]]
- [[../02-decisions/DEC-001-real-deps-integration-tests]]
