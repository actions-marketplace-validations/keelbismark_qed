# Error Handling Philosophy Standard
*Part of the Q.E.D. Engineering Framework*

This standard codifies non-negotiable engineering invariants governing error classification, causal chains, recovery mechanics, and public boundary masking under the **Principle of Earned Complexity**.

---

## 0. Fundamental Axioms: Errors are First-Class Control Flow

> **Errors are not anomalies; they are normal, inevitable execution paths of distributed computing.  
> An empty `catch` block is technical negligence.  
> A generic `500 Internal Server Error` is a confession of broken architecture.  
> Swallowing an exception hides rot; leaking an internal stack trace invites attackers.**

Software fails predictably when systems pretend the world is infallible. In high-assurance engineering, error handling is designed with the same rigor as business logic.

Under Q.E.D., every failure mode is governed by the **Error Integrity Pentad**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                     THE ERROR INTEGRITY PENTAD                         │
│                                                                        │
│ 1. Root Cause & Zero Swallowing       2. The 4 Operational Tiers       │
│    - Strict ban on empty catch blocks    - Domain (Expected business)  │
│    - Never log AND rethrow (double log)  - Transient (Retryable infra) │
│    - Preserve causality (`error.cause`)  - Environmental (Fail at boot)│
│                                          - Bug / Panic (Alert & Mask)  │
│                                                                        │
│ 3. Boundary Masking & Telemetry       4. Result<T, E> vs. Exceptions   │
│    - Leaked internals forbidden in UI    - Expected logic: Result<T,E> │
│    - Internal logs: full cause & stack   - Panics: throw for crashes   │
│    - Correlation ID on every response    - Typed error hierarchies     │
│                                                                        │
│ 5. Graceful Degradation & Safe Fallback                                │
│    - Brownout mode over total outage                                   │
│    - Clean resource teardown (`finally` / `defer`)                     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Pillar 1: Zero Swallowing & The Root Cause Invariant

### A. The Strict Ban on Empty Catch Blocks
* ❌ *BANNED*: Catching an error and doing nothing, or merely logging a useless message without recovery:
  ```typescript
  // CATASTROPHIC ANTI-PATTERN: Silent rot. Data corrupts silently.
  try {
    await processPayment(invoiceId);
  } catch (err) {
    // Empty catch or comment: // ignore
  }
  ```
* ✅ *REQUIRED*: Every catch block MUST perform one of three discrete actions:
  1. **Handle and Recover**: Execute a genuine fallback (e.g. read from local offline cache, retry with backoff).
  2. **Enrich and Rethrow (The Causal Chain)**: Wrap in a domain-specific error while preserving the original cause.
  3. **Record and Surface**: Log structured telemetry with full context and display an actionable UI notification.

### B. The Causal Chain Invariant (`error.cause`)
* When re-wrapping lower-level errors (e.g. database driver error $\rightarrow$ domain error), you **MUST NEVER discard the original stack trace**.
* ✅ *REQUIRED*: Always chain errors using native causality:
  ```typescript
  try {
    await db.query("SELECT * FROM billing_accounts WHERE id = $1", [id]);
  } catch (err) {
    throw new BillingDatabaseError("Failed to fetch billing account", {
      cause: err, // Native Node.js / V8 error chaining
    });
  }
  ```

### C. The Anti-"Log and Rethrow" Rule
* ❌ *BANNED*: Logging an error at every intermediate layer before rethrowing it:
  ```typescript
  // BAD: Creates 5 duplicate error log entries for a single failure
  catch (err) {
    logger.error("DB failed", err);
    throw err;
  }
  ```
* ✅ *REQUIRED*: **Log once at the architectural boundary** (e.g., in global exception middleware or top-level task runner). Intermediate layers either enrich and rethrow or catch and recover.

---

## 2. Pillar 2: The 4 Operational Error Tiers

Never treat all errors identically. Every failure belongs to one of four discrete tiers:

| Tier | Category | Examples | Expected Handling | HTTP Status |
| :-: | :--- | :--- | :--- | :-: |
| **1** | **Domain / Business** | Insufficient funds, duplicate slug, invalid promo code | Return typed Result or Domain Error; show actionable UI text. | `400`, `409`, `422` |
| **2** | **Transient Infra** | Network timeout, 429 rate limit, DB deadlock (deadlock detected) | Automatic retry with exponential backoff and randomized jitter. | `429`, `503`, `504` |
| **3** | **Environmental** | Missing `DATABASE_URL`, unreadable TLS cert, invalid disk permissions | **Fail Fast at startup / boot.** Crash the container immediately. | Exit Code `1` |
| **4** | **Unhandled Bugs** | Null pointer, undefined method, out of memory, invariant violation | Sentry/Datadog alert; mask from user; return incident Correlation ID. | `500` |

### Code Implementation: Typed Error Hierarchy
```typescript
// Base Application Error
export abstract class AppError extends Error {
  public abstract readonly statusCode: number;
  public abstract readonly errorCode: string;
  public readonly isOperational: boolean;

  constructor(message: string, options?: ErrorOptions, isOperational = true) {
    super(message, options);
    this.name = this.constructor.name;
    this.isOperational = isOperational;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

// Tier 1: Domain Validation
export class ValidationError extends AppError {
  public readonly statusCode = 422;
  public readonly errorCode = "VALIDATION_FAILED";
  constructor(message: string, public readonly fields: Record<string, string[]>, options?: ErrorOptions) {
    super(message, options);
  }
}

// Tier 1: Resource Conflict
export class ConflictError extends AppError {
  public readonly statusCode = 409;
  public readonly errorCode = "RESOURCE_CONFLICT";
}

// Tier 1: Resource Not Found
export class NotFoundError extends AppError {
  public readonly statusCode = 404;
  public readonly errorCode = "NOT_FOUND";
}
```

---

## 3. Pillar 3: Boundary Masking & Telemetry Isolation

> **Internal errors belong to engineers; sanitized messages belong to users.**

### A. The Public Masking Invariant
* ❌ *BANNED*: Leaking internal database tables, SQL queries, or file paths to client browsers:
  ```json
  // CATASTROPHIC SECURITY BREACH: Leaks schema and internal paths
  {
    "error": "QueryFailedError: relation 'users_secret_tokens' does not exist at /var/app/src/db.ts:42"
  }
  ```
* ✅ *REQUIRED*: Public error payloads must be strictly sanitized and carry a copyable **Correlation ID**:
  ```json
  // High-Assurance Public DTO
  {
    "error": {
      "code": "INTERNAL_SERVER_ERROR",
      "message": "An unexpected error occurred while processing your request.",
      "incidentId": "req-98f21a4e"
    }
  }
  ```

### B. Internal Telemetry Fidelity
While public clients receive a sanitized DTO, internal logging systems MUST receive full diagnostic context:
```typescript
logger.error("Database query failed during checkout", {
  incidentId: req.id,
  tenantId: req.tenantId,
  userId: req.userId,
  errorCode: error.errorCode,
  durationMs: performance.now() - startTime,
  stack: error.stack,
  cause: error.cause,
});
```

---

## 4. Pillar 4: Expected Failures vs. Panics (`Result<T, E>`)

Exceptions (`throw`) disrupt call stacks and introduce hidden control flows. In high-assurance domain logic, expected business failures should be modeled as explicit return values.

### The Rule of Division:
1. **Use `Result<T, E>` / Either**: For expected domain failures that callers must handle (e.g., invalid coupon, expired session, user already exists).
2. **Use `throw / Exception`**: For exceptional environmental breakdowns or invariant violations (DB down, memory exhausted, corrupted state).

### Functional `Result` Pattern in TypeScript:
```typescript
export type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export const ok = <T>(value: T): Result<T, never> => ({ ok: true, value });
export const err = <E>(error: E): Result<never, E> => ({ ok: false, error });

// Domain logic with forced exhaustive checking
export function applyCoupon(order: Order, couponCode: string): Result<Order, CouponError> {
  const coupon = findCoupon(couponCode);
  if (!coupon) {
    return err(new CouponNotFoundError("Coupon does not exist"));
  }
  if (coupon.isExpired()) {
    return err(new CouponExpiredError("Coupon has expired"));
  }
  return ok(calculateDiscount(order, coupon));
}
```

---

## 5. Pillar 5: Guaranteed Resource Teardown

* **The Leak Hazard**: If an error is thrown while a file descriptor, database transaction, or temporary file is open, failing to clean up leaks physical resources.
* ✅ *REQUIRED*: Always manage resources using deterministic `finally`, `using` (TypeScript 5.2+), or `defer` (Go):
  ```typescript
  // Node.js / TypeScript Disposable Resource (Explicit Resource Management)
  export async function withTransaction<T>(pool: Pool, fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    await client.query("BEGIN");
    try {
      const result = await fn(client);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release(); // Guaranteed connection release
    }
  }
  ```

---

## 6. The 3 AM Error Handling Verification Checklist

Before declaring any feature complete:

- [ ] **No Empty Catches**: Are all catch blocks either handling with fallback, enriching with `cause`, or logging at the boundary?
- [ ] **No Double Logging**: Are intermediate functions avoiding the "log and rethrow" anti-pattern?
- [ ] **Error Chaining**: Do wrapped exceptions preserve `options.cause`?
- [ ] **No Leaked Stack Traces**: Are API error payloads sanitized with a public code and `incidentId`?
- [ ] **Deterministic Teardown**: Are database connections and file descriptors closed inside `finally`?
- [ ] **Actionable UI**: Do errors presented to the user contain a human-friendly description and a **Retry** mechanism?
