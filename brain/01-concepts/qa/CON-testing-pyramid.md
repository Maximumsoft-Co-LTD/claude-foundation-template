---
type: concept
tags: [qa, testing, pyramid, unit, integration, E2E]
related: [CON-test-types, CON-qa-process]
updated: 2026-03-25
source: template
---

# Testing Pyramid

## The Pyramid

```
           /\
          /  \
         / E2E\          ← Few (10%), Slow, High confidence, Fragile
        /------\
       /        \
      /Integration\     ← Moderate (20%), Real deps, Good coverage
     /--------------\
    /                \
   /   Unit Tests     \  ← Many (70%), Fast, Isolated, Cheap
  /____________________\
```

**Rule of thumb:** 70/20/10

## Why This Ratio?

| Test Type | Cost | Speed | Confidence | Fragility |
|-----------|------|-------|-----------|----------|
| Unit | Low | Fast (ms) | Medium | Low |
| Integration | Medium | Medium (s) | High | Medium |
| E2E | High | Slow (min) | Very High | High |

Writing too many E2E tests → slow, flaky CI, expensive to maintain
Writing only unit tests → miss integration bugs

## Unit Tests

**What:** Single function/class in isolation, dependencies mocked

```typescript
// Unit test — fast, isolated
describe('calculateDiscount', () => {
  it('returns 10% discount for premium users', () => {
    const result = calculateDiscount(100, { tier: 'premium' })
    expect(result).toBe(90)
  })

  it('returns 0% discount for free users', () => {
    const result = calculateDiscount(100, { tier: 'free' })
    expect(result).toBe(100)
  })
})
```

**Best for:**
- Business logic / calculations
- Data transformations
- Edge cases and error handling

---

## Integration Tests

**What:** Multiple components working together, real dependencies (DB, Redis, etc.)

```go
// Integration test — real DB
func TestUserRepository_CreateUser(t *testing.T) {
  db := testhelpers.NewTestDB(t)
  repo := NewUserRepository(db)

  user, err := repo.Create(context.Background(), CreateUserInput{
    Email: "test@example.com",
    Name:  "Test User",
  })

  assert.NoError(t, err)
  assert.NotEmpty(t, user.ID)

  // Verify in DB
  found, err := repo.FindByID(context.Background(), user.ID)
  assert.NoError(t, err)
  assert.Equal(t, "test@example.com", found.Email)
}
```

**Best for:**
- API endpoint contracts
- DB repository layer
- External service integrations

---

## E2E Tests

**What:** Full user flow through UI in real browser against real system

```typescript
// E2E — Playwright
test('user can complete checkout', async ({ page }) => {
  await page.goto('/products')
  await page.click('[data-testid="add-to-cart-btn"]')
  await page.click('[data-testid="checkout-btn"]')
  await page.fill('#card-number', '4242424242424242')
  await page.click('[data-testid="pay-btn"]')
  await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
})
```

**Best for:**
- Critical user journeys (checkout, signup, login)
- Smoke tests in production

## The Honeycomb (Alternative for Microservices)

```
         /\
        /E2E\         ← very few
       /------\
      /Integration\   ← most tests here (between services)
     /--------------\
    /  Unit           \ ← fewer than traditional
```

In microservices: integration tests between services matter more than internal unit tests.

## Related

- [[CON-test-types]] — all test types explained
- [[CON-qa-process]] — when each test type runs
- [[../../CON-tdd-rules]] — TDD applies to all pyramid levels
- [[../../../00-MOC/MOC-QA]]
