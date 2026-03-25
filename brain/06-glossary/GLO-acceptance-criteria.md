---
type: glossary
term: Acceptance Criteria (AC)
tags: [agile, user-stories, testing, product-owner, QA]
updated: 2026-03-25
---

# Acceptance Criteria

**Definition:** Specific, testable conditions that define when a user story is complete and ready for acceptance by the Product Owner and stakeholders.

## Key Characteristics

- **Explicit:** Written in plain language or Gherkin (Given/When/Then) format
- **Testable:** QA and developers can verify them without ambiguity
- **Completeness:** Covers the happy path, edge cases, and error scenarios
- **Independent:** Each AC stands alone; not dependent on other ACs

## Format: Gherkin (Given/When/Then)

The standard format is Gherkin BDD syntax:

```
Given [initial state/context]
When [action/event]
Then [expected outcome]
```

### Example 1: Login Feature
```
Given the user is on the login page
When they enter a valid email and password
Then they are redirected to the dashboard
And a session token is stored in localStorage
And an email confirmation is not required
```

### Example 2: Password Reset
```
Given the user has forgotten their password
When they click "Forgot Password" and enter their email
Then an email with a reset link is sent within 2 minutes
And the link expires after 24 hours
And clicking the expired link shows an error message

Given the user is on the reset password page with a valid link
When they enter a new password and click "Reset"
Then their password is updated
And they are redirected to login
And their old password no longer works
```

## Common AC Patterns

### **Happy Path AC**
The main success scenario (user completes their goal):
```
Given [happy path setup]
When [happy path action]
Then [happy path success]
```

### **Sad Path / Error AC**
What happens when things go wrong:
```
Given [error condition]
When [user action that triggers error]
Then [error message or recovery path]
```

### **Edge Case AC**
Boundary conditions or unusual states:
```
Given [edge case setup]
When [edge case action]
Then [expected handling]
```

## AC vs. Tasks

| Acceptance Criteria | Task |
|-------------------|------|
| User-facing value delivered | Engineering-only work |
| "User can reset password" | "Refactor auth module" |
| Defined in the story | Created as blocking work |
| Tested by QA | Reviewed in code review |

**Rule:** Every story has AC; not every task needs AC.

## Writing Good vs. Bad AC

### Bad AC ❌
- "The system should be performant" — Too vague
- "Password reset works" — Not testable
- "Implement authentication" — Describes implementation, not behavior
- "Error handling" — Missing specific error cases

### Good AC ✅
```
Given the user submits a password reset request with a valid email
When the reset link is generated
Then the link expires after exactly 24 hours
And users cannot reuse a reset link

Given the user tries to reset with an invalid email
When they submit the form
Then they see "No account found with this email"
And no reset email is sent
```

## AC Acceptance Workflow

1. **Story created** → Product Owner writes initial AC
2. **Refinement meeting** → Team reviews, asks clarifying questions, refines AC
3. **Sprint commitment** → Team confirms AC is clear before accepting story
4. **Development** → Developers implement to pass AC
5. **QA testing** → QA verifies each AC manually or with automated tests
6. **Story accepted** → Product Owner approves when all AC are satisfied

## Automation: From AC to Test Cases

AC often become automated test cases:

**AC (Manual):**
```
Given the user enters "user@example.com" and "wrongpassword"
When they click Login
Then they see "Invalid credentials" message
```

**Automated Test (JavaScript/Jest):**
```javascript
test('should show error for invalid password', async () => {
  const { getByRole, getByText } = render(<LoginForm />);

  const emailInput = getByRole('textbox', { name: /email/i });
  const passwordInput = getByRole('textbox', { name: /password/i });
  const loginButton = getByRole('button', { name: /login/i });

  fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
  fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
  fireEvent.click(loginButton);

  await waitFor(() => {
    expect(getByText('Invalid credentials')).toBeInTheDocument();
  });
});
```

## See Also

- [[CON-user-story-format]] — How to write user stories with well-formed AC
- [[CON-definition-of-done]] — Team agreement on when a story is truly done
- [[CON-testing-strategy]] — How AC map to test cases
