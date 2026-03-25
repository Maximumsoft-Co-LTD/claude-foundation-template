---
type: concept
tags: [backend, error-handling, exceptions, logging, error-codes]
related: [CON-api-design-principles, CON-backend-layers]
updated: 2026-03-25
---

# Error Handling

## Error Handling Principles

```
1. Fail fast — detect errors early, before they propagate
2. Never swallow errors — always log or rethrow
3. Be specific — differentiate error types
4. Separate: operational errors vs. programmer errors
5. User-facing: helpful but safe (no stack traces)
6. Internal: detailed for debugging
```

## Error Types

### Operational Errors (Expected)
Predictable problems the system must handle gracefully:
```
- User not found (404)
- Invalid input (422)
- Authentication failed (401)
- External service timeout
- Database connection lost
- Disk full
```

### Programmer Errors (Bugs)
Unexpected problems that should never happen in production:
```
- TypeError: Cannot read property of undefined
- RangeError: Array index out of bounds
- Logic error: business rule violated
```

**Handle differently:**
- Operational → catch, return structured error, continue
- Programmer → let it crash (or log + restart) — don't hide bugs

## Error Response Structure

```typescript
// Consistent shape for all API errors
interface ApiError {
  error: string     // Machine-readable code (for client logic)
  message: string   // Human-readable message
  details?: Array<{ field: string; message: string }>  // Validation details
  requestId?: string  // For support tickets / log correlation
}

// Examples:
{
  "error": "VALIDATION_FAILED",
  "message": "Please correct the following errors",
  "details": [
    { "field": "email", "message": "Valid email required" },
    { "field": "age", "message": "Must be at least 18" }
  ],
  "requestId": "req_abc123"
}

{
  "error": "USER_NOT_FOUND",
  "message": "The requested user does not exist",
  "requestId": "req_xyz789"
}

{
  "error": "INTERNAL_ERROR",
  "message": "An unexpected error occurred. Please try again.",
  "requestId": "req_err456"  // ← user gives this to support
}
```

## Error Layer Pattern

```
HTTP Handler
  ↓ catches all errors
  ↓ maps to HTTP status + ApiError response
  ↓ logs with context

Service Layer
  ↓ throws domain-specific errors
  ↓ never throws HTTP errors (no HTTP types!)
  throw new UserNotFoundError(userId)
  throw new InsufficientBalanceError(required, available)

Repository Layer
  ↓ throws data-access errors
  ↓ wraps DB exceptions in domain errors
  throw new DatabaseError('Failed to save user', originalError)
```

```typescript
// Custom error classes
class AppError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any[]
  ) { super(message) }
}

class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', `${resource} ${id} not found`, 404)
  }
}

class ValidationError extends AppError {
  constructor(details: { field: string; message: string }[]) {
    super('VALIDATION_FAILED', 'Validation failed', 422, details)
  }
}

// Handler catches all
app.use((err: Error, req, res, next) => {
  if (err instanceof AppError) {
    logger.warn({ err, requestId: req.id }, 'Operational error')
    return res.status(err.statusCode).json({
      error: err.code,
      message: err.message,
      details: err.details,
      requestId: req.id
    })
  }

  // Programmer error
  logger.error({ err, requestId: req.id }, 'Unexpected error')
  res.status(500).json({
    error: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
    requestId: req.id
  })
})
```

## Retry Strategy

For transient failures (network hiccup, DB timeout):

```typescript
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (err) {
      if (attempt === maxAttempts || !isTransientError(err)) throw err
      await sleep(delayMs * Math.pow(2, attempt - 1))  // Exponential backoff
      logger.warn({ attempt }, 'Retrying after transient error')
    }
  }
}

// Transient: timeout, 503, connection refused
// Non-transient: 404, 422, 401 (retrying won't help)
```

## Circuit Breaker

Prevent cascade failures when downstream service is down:

```
CLOSED (normal)     → all requests pass through
    ↓ threshold failures
OPEN (tripped)      → all requests fail immediately (no wait)
    ↓ after timeout
HALF-OPEN (testing) → let one request through
    ↓ success
CLOSED again
```

## Related

- [[CON-api-design-principles]] — HTTP status codes for errors
- [[CON-backend-layers]] — error bubbles up through layers
- [[../devops/CON-monitoring-observability]] — errors trigger alerts
- [[../../../00-MOC/MOC-Backend]]
