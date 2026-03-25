---
type: concept
tags: [qa, testing, unit, integration, E2E, performance, security]
related: [CON-testing-pyramid, CON-qa-process, CON-bug-lifecycle]
updated: 2026-03-25
---

# Test Types

## All Test Types

| Type | What It Tests | Speed | When to Run |
|------|--------------|-------|------------|
| Unit | Single function/class | ms | Every commit |
| Integration | Multiple components + real deps | seconds | Every commit |
| E2E | Full user journey in browser | minutes | Every PR |
| Regression | Nothing broke from before | minutes | Every PR |
| Smoke | Critical paths alive | seconds | Post-deploy |
| Performance/Load | System under load | minutes-hours | Release |
| Security | Vulnerabilities | minutes | Release + weekly |
| UAT | Business requirements | hours | Pre-release |
| Exploratory | Unknown unknowns | hours | Sprint testing |

## Unit Tests

**Scope:** Single function, class method, component
**Dependencies:** All mocked
**Speed:** < 100ms per test

```typescript
// Pure business logic — ideal for unit test
describe('calculateDiscount', () => {
  it('gives 10% for premium tier', () => {
    expect(calculateDiscount(100, 'premium')).toBe(90)
  })

  it('gives 0% for free tier', () => {
    expect(calculateDiscount(100, 'free')).toBe(100)
  })

  it('handles zero amount', () => {
    expect(calculateDiscount(0, 'premium')).toBe(0)
  })
})
```

**Best for:** Business logic, data transformations, utilities, pure functions

## Integration Tests

**Scope:** Module + its dependencies (real DB, real HTTP, real queue)
**Dependencies:** Real (use test containers or test DB)
**Speed:** 1-30 seconds

```go
func TestUserRepository_CreateAndFind(t *testing.T) {
  db := testhelpers.NewPostgresDB(t)  // Real DB
  repo := repository.NewUserRepo(db)

  created, _ := repo.Create(ctx, CreateInput{Email: "test@example.com"})
  found, _ := repo.FindByEmail(ctx, "test@example.com")

  assert.Equal(t, created.ID, found.ID)
}
```

**Best for:** API endpoints, database operations, service interactions

## E2E Tests

**Scope:** Complete user journey (browser + frontend + backend + DB)
**Dependencies:** Full running system
**Speed:** 30 seconds - 5 minutes

```typescript
// Playwright E2E
test('complete checkout flow', async ({ page }) => {
  await page.goto('/login')
  await page.fill('[data-testid=email]', 'user@test.com')
  await page.fill('[data-testid=password]', 'password123')
  await page.click('[data-testid=login-btn]')

  await page.goto('/products')
  await page.click('[data-testid=add-to-cart]:first-child')
  await page.click('[data-testid=checkout-btn]')
  await page.fill('[data-testid=card-number]', '4242424242424242')
  await page.click('[data-testid=pay-btn]')

  await expect(page.getByText('Order confirmed!')).toBeVisible()
})
```

**Best for:** Critical business flows, happy paths, regression

## Performance / Load Tests

**Goal:** Validate system behavior under expected and peak load

```javascript
// k6 load test
import http from 'k6/http'
import { check } from 'k6'

export const options = {
  stages: [
    { duration: '2m', target: 100 },   // Ramp up to 100 users
    { duration: '5m', target: 100 },   // Stay at 100 users
    { duration: '2m', target: 0 },     // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p95<500'],    // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],    // < 1% error rate
  },
}

export default function() {
  const res = http.get('https://api.example.com/users')
  check(res, { 'status 200': (r) => r.status === 200 })
}
```

**Tools:** k6, Locust, JMeter, Gatling

## Security Tests

| Type | What It Checks | Tool |
|------|---------------|------|
| SAST | Code vulnerabilities without running | SonarQube, CodeQL |
| DAST | Running app attack simulation | OWASP ZAP, Burp Suite |
| Dependency scan | Known CVEs in libraries | Snyk, Dependabot |
| Secrets scan | Hardcoded credentials | GitLeaks, TruffleHog |
| Container scan | Image vulnerabilities | Trivy, Clair |

## Smoke Tests

Fast health checks right after deployment:
```bash
# Verify critical endpoints respond correctly
curl -f https://api.example.com/health
curl -f https://api.example.com/api/v1/status
```

Pass = deployment successful. Fail = rollback immediately.

## UAT (User Acceptance Testing)

```
Performed by: Product Owner / Business stakeholders (not QA)
Goal: Verify software meets business requirements
When: After QA sign-off, before production release

Process:
  1. PO creates test scenarios based on acceptance criteria
  2. Run in staging environment with production-like data
  3. PO accepts or rejects each story
  4. Rejected → goes back to dev as a bug
```

## Related

- [[CON-testing-pyramid]] — how many of each type
- [[CON-qa-process]] — when each type runs
- [[../../CON-tdd-rules]] — TDD applies to unit + integration
- [[../../../00-MOC/MOC-QA]]
