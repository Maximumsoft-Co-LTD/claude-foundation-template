---
type: glossary
term: TDD (Test-Driven Development)
tags: [testing, tdd, red-green-refactor, development-practices, qa]
updated: 2026-03-25
---

# TDD (Test-Driven Development)

**Definition:** A development discipline where automated tests are written **before** implementation code, following the **Red → Green → Refactor** cycle. The test drives the design and behavior of the code.

## Core Principle

**Write the failing test first. Then implement code to make it pass. Then refactor.**

This inverts the typical workflow:
```
Traditional: Code → Test (often forgotten)
TDD:         Test → Code → Refactor
```

## The Red-Green-Refactor Cycle

### **Red Phase**
Write a test for functionality that **doesn't exist yet**. The test fails because the feature isn't implemented.

```javascript
// test_calculator.js
test('should add two numbers', () => {
  const result = add(2, 3);
  expect(result).toBe(5);  // ❌ FAILS: add() doesn't exist
});
```

**Status:** Red — test fails (function doesn't exist)

### **Green Phase**
Write the **minimum code** to make the test pass. Not pretty, not efficient — just pass the test.

```javascript
// calculator.js
function add(a, b) {
  return a + b;  // ✅ Simplest code to pass test
}
```

**Status:** Green — test passes

### **Refactor Phase**
Clean up the code. Optimize. Improve design. **But the test still passes.**

```javascript
// calculator.js (refactored)
function add(a, b) {
  // Validate inputs
  if (typeof a !== 'number' || typeof b !== 'number') {
    throw new Error('Arguments must be numbers');
  }
  return a + b;
}
```

**Status:** Green — test still passes; code improved

## Example: Building a Password Validator

### **Red: Write the test**
```javascript
// password.test.js
describe('Password Validator', () => {
  test('should accept valid passwords', () => {
    expect(isValidPassword('SecurePass123!')).toBe(true);
  });

  test('should reject passwords < 8 characters', () => {
    expect(isValidPassword('Short1!')).toBe(false);
  });

  test('should reject passwords without uppercase', () => {
    expect(isValidPassword('nouppercase123!')).toBe(false);
  });

  test('should reject passwords without numbers', () => {
    expect(isValidPassword('NoNumbers!')).toBe(false);
  });
});
```

**Run tests:** ❌ All fail (function doesn't exist)

### **Green: Implement (minimum code)**
```javascript
// password.js
function isValidPassword(password) {
  if (password.length < 8) return false;
  if (!/[A-Z]/.test(password)) return false;  // has uppercase
  if (!/[0-9]/.test(password)) return false;  // has number
  return true;
}
```

**Run tests:** ✅ All pass

### **Refactor: Clean up**
```javascript
// password.js (refactored)
function isValidPassword(password) {
  const MIN_LENGTH = 8;
  const UPPERCASE_REGEX = /[A-Z]/;
  const NUMBER_REGEX = /[0-9]/;

  const checks = [
    { condition: password.length >= MIN_LENGTH, message: 'At least 8 characters' },
    { condition: UPPERCASE_REGEX.test(password), message: 'Must contain uppercase' },
    { condition: NUMBER_REGEX.test(password), message: 'Must contain a number' },
  ];

  return checks.every(check => check.condition);
}

// Add edge case tests and refactor as needed
```

**Run tests:** ✅ All still pass; code cleaner

## Workflow: TDD in a Sprint

### **Story: "User can reset password"**

**Day 1: Design via tests**
```javascript
// Write tests FIRST — no implementation yet
test('should send reset email when user requests', () => {
  const user = { email: 'user@example.com' };
  sendPasswordReset(user);
  expect(emailService.sendEmail).toHaveBeenCalledWith('user@example.com');
});

test('should create a reset token valid for 24 hours', () => {
  const token = generateResetToken();
  expect(token.expiresAt).toBeLessThanOrEqual(now + 24*60*60*1000);
});

test('should allow resetting password with valid token', () => {
  const token = generateResetToken();
  resetPassword(token, 'newPassword');
  expect(passwordUpdated()).toBe(true);
});
```

**Day 2-3: Implement to pass tests**
```javascript
function sendPasswordReset(user) {
  const token = generateResetToken();
  emailService.sendEmail(user.email, `Reset: ${token}`);
}

function generateResetToken() {
  return {
    token: crypto.randomBytes(32),
    expiresAt: Date.now() + 24*60*60*1000,
  };
}

function resetPassword(token, newPassword) {
  if (!isTokenValid(token)) throw new Error('Token expired');
  updateUserPassword(token.userId, newPassword);
  return true;
}
```

**Run tests:** ✅ All green

**Day 4: Refactor + review**
- Add error handling
- Optimize database queries
- Improve code clarity
- Add edge case tests

**Outcome:** Working feature, well-tested, high confidence

## Benefits of TDD

✅ **Clear requirements:** Writing tests forces you to think through behavior before coding
✅ **Fewer bugs:** Bugs are caught early; test coverage is near 100%
✅ **Easier refactoring:** Change code confidently; tests alert you to breaking changes
✅ **Better design:** TDD naturally leads to loosely coupled, testable code
✅ **Documentation:** Tests show how code is supposed to be used
✅ **Regression prevention:** New features don't break old features
✅ **Confidence in production:** Ship with peace of mind

## Challenges & Misconceptions

❌ **"TDD is slow"** — True upfront, but pays off in fewer bugs and easier maintenance. Faster overall.
❌ **"100% test coverage needed"** — Aim for high (80%+), but pragmatism matters; not every edge case needs a test.
❌ **"Tests are hard to write"** — Yes initially; gets easier as you practice. Bad tests indicate tight coupling in code.
❌ **"I'll write tests after"** — Almost never happens; TDD forces it upfront.

## TDD vs. BDD (Behavior-Driven Development)

**TDD** focuses on unit tests (testing individual functions):
```javascript
test('add(2,3) returns 5', () => {
  expect(add(2, 3)).toBe(5);
});
```

**BDD** focuses on behavior in user language (integration tests):
```gherkin
Given the user is on the login page
When they enter valid credentials
Then they are logged in and see the dashboard
```

**Both are valuable:** TDD for units, BDD for features.

## TDD Rules (From CLAUDE.md)

> Write the failing test **first**, then implement until it passes — no exceptions.

This means:
1. **Always test first** — even if implementation seems obvious
2. **Start red** — the test must fail before you code
3. **Minimal implementation** — just enough to pass the test
4. **Then refactor** — improve while keeping tests green
5. **Never skip** — no "I'll test it manually later"

## Common TDD Patterns

### **Arrange-Act-Assert (AAA)**
```javascript
test('should calculate order total correctly', () => {
  // Arrange: Set up test data
  const items = [
    { price: 10, quantity: 2 },
    { price: 5, quantity: 1 },
  ];

  // Act: Execute the code under test
  const total = calculateTotal(items);

  // Assert: Check the result
  expect(total).toBe(25);  // (10*2) + (5*1) = 25
});
```

### **Given-When-Then (Gherkin)**
```javascript
test('should reject invalid credit cards', () => {
  // Given: A card with invalid format
  const card = { number: '1234' };

  // When: Processing payment
  const result = validateCard(card);

  // Then: Payment is rejected
  expect(result.valid).toBe(false);
});
```

## See Also

- [[DEC-001-real-deps-integration-tests]] — Why integration tests use real dependencies
- [[PAT-001-tdd-flow]] — Detailed TDD implementation patterns
- [[CON-tdd-rules]] — Project-specific TDD rules and constraints
- [[CON-testing-strategy]] — Broader testing approach (unit, integration, e2e)
