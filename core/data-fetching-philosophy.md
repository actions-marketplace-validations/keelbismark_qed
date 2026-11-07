# Data Fetching & Retrieval Philosophy Standard
*Part of the Q.E.D. Engineering Framework*

This standard codifies the non-negotiable engineering invariants governing network transport, boundary validation, topology efficiency, state lifecycles, and tenant isolation under the **Principle of Earned Complexity**.

---

## 0. Fundamental Axioms: The Fallibility and Asymmetry of Distributed Data

> **The network is hostile, latent, and fallible.  
> Data is not a static local object; it is an in-flight contract across unverified boundaries.  
> An unconstrained fetch is a hanging thread; an unvalidated payload is a deferred 3 AM crash; an unthrottled waterfall destroys UX and infrastructure alike.**

Every data retrieval operation sits at the intersection of three competing pressures:
1. **Physical Network Realities**: Packet loss, variable latency, dropped sockets, and transient gateway failures.
2. **Infrastructure Saturation**: Thundering herds, connection pool exhaustion, slow queries, and database locks.
3. **Human Experience**: Layout shifts (CLS), out-of-order race conditions, and unresponsive interfaces.

Under Q.E.D., data fetching is never treated as a trivial one-line `fetch(url)` or `db.find()`. It is governed by five mandatory layers of structural integrity:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   THE DATA FETCHING INTEGRITY PENTAD                   │
│                                                                        │
│ 1. Network Deadlines & Safe Retries   2. Strict Boundary Parsing       │
│    - Mandatory AbortSignal timeout       - Ban on `as TargetType` cast │
│    - Exponential backoff + full jitter   - Parse with Zod/ArkType/DTO  │
│    - Idempotency-Key for POST retries    - Fail-fast on contract drift │
│                                                                        │
│ 3. Topology & Pagination Discipline   4. Race & State Elimination      │
│    - Ban on client/server waterfalls     - The 4 Mandatory Fetch States│
│    - Keyset/Cursor pagination (>1k rows) - Abort stale queries on input│
│    - Mandatory limit clamps              - Singleflight deduplication  │
│                                                                        │
│ 5. Tenancy & Read-DTO Scoping                                          │
│    - Guaranteed `org_id`/tenant filters (IDOR defense)                 │
│    - Strict projection (no password hashes or internal fields leaked)  │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Layer 1: Network Physics & Transport Resilience

### A. The Mandatory Timeout Invariant (No Hanging Sockets)
* ❌ *BANNED*: Naked fetches without a deterministic timeout deadline:
  ```typescript
  // CATASTROPHIC ANTI-PATTERN: If the upstream proxy or gateway hangs,
  // this promise never settles, leaking worker threads and memory.
  const response = await fetch("https://api.internal/v1/orders");
  ```
* ✅ *REQUIRED*: Every network request MUST enforce a mandatory deadline using `AbortSignal.timeout(ms)` or equivalent context cancellation:
  ```typescript
  const DEFAULT_TIMEOUT_MS = 5_000;

  export async function fetchWithTimeout(
    url: string,
    options: RequestInit = {},
    timeoutMs: number = DEFAULT_TIMEOUT_MS
  ): Promise<Response> {
    const timeoutSignal = AbortSignal.timeout(timeoutMs);
    const signal = options.signal
      ? AbortSignal.any([options.signal, timeoutSignal])
      : timeoutSignal;

    return fetch(url, { ...options, signal });
  }
  ```

### B. The Retry Triad: Idempotency, Backoff, and Jitter
Blindly retrying failed requests causes **Retry Storms** (Thundering Herds), taking down recovering services.

1. **Idempotency Classification**:
   - Safe to retry automatically: `GET`, `HEAD`, `OPTIONS`, `PUT`, `DELETE`.
   - ❌ **Strictly Banned from Auto-Retry**: `POST` mutations, payments, or state creations **UNLESS** accompanied by a deterministic, client-generated `Idempotency-Key` header (UUIDv4/UUIDv7).
2. **HTTP Status Code Decision Matrix**:
   - **Retryable**:
     - `429 Too Many Requests` (MUST obey the `Retry-After` header).
     - `502 Bad Gateway`, `503 Service Unavailable`, `504 Gateway Timeout`.
     - Transport errors (`ECONNRESET`, `ETIMEDOUT`, `ENOTFOUND`).
   - **Non-Retryable (Fail Fast)**:
     - `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `422 Unprocessable Entity`.
     - *Why*: Logic and authentication errors cannot be resolved by immediate re-execution. Retrying them wastes CPU and clutters logs.
3. **Exponential Backoff with Full Jitter Formula**:
   $$\text{delayMs} = \text{random}(0, \min(\text{maxDelayMs}, \text{baseMs} \times 2^{\text{attempt}}))$$
   *Randomized jitter prevents thousands of clients from hitting the server in synchronized harmonic waves.*

---

## 2. Layer 2: Boundary Safety & Schema Integrity (Parse, Don't Validate)

### A. The Ban on `as TargetType` Casting
TypeScript types exist only during compilation. At runtime, `response.json()` produces `unknown` (or loose `any`).

* ❌ *BANNED*: Casting network responses directly into application types:
  ```typescript
  // ILLUSION OF SAFETY: If the API changes or returns an error payload,
  // runtime explodes with "Cannot read properties of undefined".
  const users = (await response.json()) as User[];
  ```
* ✅ *REQUIRED*: Runtime boundary parsing via schema validators (Zod, ArkType, TypeBox in TypeScript; Pydantic in Python; structured decoders in Go/Rust):
  ```typescript
  import { z } from "zod";

  export const UserSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    displayName: z.string().min(1),
    roles: z.array(z.enum(["admin", "member", "viewer"])).default(["viewer"]),
  });

  export type User = z.infer<typeof UserSchema>;

  export async function fetchUser(userId: string): Promise<User> {
    const res = await fetchWithTimeout(`/api/users/${userId}`);
    if (!res.ok) {
      throw new HttpError(res.status, `Failed to fetch user ${userId}`);
    }

    const rawPayload: unknown = await res.json();
    const result = UserSchema.safeParse(rawPayload);

    if (!result.success) {
      // Diagnostic telemetry: logs schema breach without leaking PII
      logger.error("Contract drift detected on user schema", {
        userId,
        issues: result.error.issues,
      });
      throw new SchemaValidationError("Received malformed user payload", result.error);
    }

    return result.data;
  }
  ```

### B. Postel's Law for API Consumers (Tolerant Reader)
- **Be strict in what you emit, tolerant in what you accept.**
- When parsing responses, strip or ignore unknown fields (`strip()` by default in Zod). Never allow backend addition of a new feature flag or metadata key to break existing client consumers.

---

## 3. Layer 3: Topology & Performance Discipline

### A. The Waterfall Ban
* ❌ *BANNED*: Sequential $N+1$ fetches in UI components or asynchronous loops:
  ```typescript
  // CATASTROPHIC WATERFALL: 50 items = 50 roundtrips sequentially
  for (const item of items) {
    const details = await fetchDetails(item.id);
  }
  ```
* ✅ *REQUIRED*:
  1. **Batch APIs**: Provide bulk query endpoints (`GET /api/items?ids=1,2,3`).
  2. **Bounded Parallelism**: When batch endpoints do not exist, use bounded concurrent pools (`Promise.allSettled` with concurrency limits, e.g., `p-limit(5)`).
  3. **DataLoader Pattern**: In GraphQL / BFF layers, coalesce and batch database or service lookups across identical execution ticks.

### B. Pagination Discipline: Keyset (Cursor) vs. Offset
* **The Offset Trap**: `OFFSET 50000` forces the database to read 50,000 index entries, decode table blocks, and discard them ($O(N)$ CPU and I/O cost). Furthermore, concurrent inserts or deletes cause rows to duplicate or be skipped between pages.
* ✅ *REQUIRED*:
  - Datasets with $>1,000$ records or high-frequency inserts MUST use **Keyset / Cursor Pagination**:
    ```sql
    -- High-Assurance Keyset Pagination: O(1) Index Seek
    SELECT id, title, created_at
    FROM audit_logs
    WHERE (created_at, id) < (:cursor_created_at, :cursor_id)
    ORDER BY created_at DESC, id DESC
    LIMIT :page_size;
    ```
  - Return opaque, base64-encoded cursors to client consumers (`cursor: eyJpZCI6MTIzLCJ0cyI6MTY5...}`).

### C. Server-Side Mandatory Limit Clamping
Every endpoint that queries a collection MUST clamp the client-supplied limit:
```typescript
const DEFAULT_LIMIT = 20;
const MAX_ALLOWED_LIMIT = 100;

export function sanitizePagination(limitRaw?: number, cursorRaw?: string) {
  const limit = Math.min(Math.max(Number(limitRaw) || DEFAULT_LIMIT, 1), MAX_ALLOWED_LIMIT);
  return { limit, cursor: cursorRaw?.trim() || null };
}
```

---

## 4. Layer 4: State Lifecycle, Race Conditions & Deduplication

### A. The 4 Mandatory Fetch States
Every UI flow and data consumer must explicitly model all four states:

```text
┌──────────────┐     fetch()      ┌──────────────┐    res.ok && items > 0     ┌──────────────┐
│     Idle     │ ───────────────> │   Loading    │ ─────────────────────────> │   Success    │
└──────────────┘                  └──────────────┘                            └──────────────┘
                                         │
                                         ├────────────> ┌───────────────────┐
                                         │  items == 0  │   Empty (w/ CTA)  │
                                         │              └───────────────────┘
                                         │
                                         └────────────> ┌───────────────────┐
                                            !res.ok     │ Error (w/ Retry)  │
                                                        └───────────────────┘
```

1. **Idle**: Pre-flight state before any trigger.
2. **Loading**: Predictable visual feedback (skeleton/shimmer matching final content dimensions to eliminate Cumulative Layout Shift).
3. **Empty**: 0 records found is **not an error**. Must provide an actionable empty state with a clear next step (e.g., "No invoices yet. [Create Invoice]").
4. **Error**: Actionable, human-friendly message categorized by failure type with a **Retry** action.

### B. Out-of-Order Race Condition Elimination
* In typeaheads, filters, or tab switches, fast asynchronous responses can arrive out of order:
  - User types `"a"` (Request 1 sent, slow: 800ms).
  - User types `"ab"` (Request 2 sent, fast: 120ms, renders `"ab"` results).
  - Request 1 resolves at 800ms and overwrites Request 2! The UI now shows results for `"a"` while the input says `"ab"`.
* ✅ *REQUIRED*: Abort prior active requests when search/filter parameters change:
  ```typescript
  let activeAbortController: AbortController | null = null;

  export async function searchProducts(query: string): Promise<Product[]> {
    if (activeAbortController) {
      activeAbortController.abort("New query initiated");
    }

    activeAbortController = new AbortController();
    try {
      return await fetchWithTimeout(`/api/search?q=${encodeURIComponent(query)}`, {
        signal: activeAbortController.signal,
      });
    } catch (error) {
      if ((error as DOMException)?.name === "AbortError") {
        return []; // Discard aborted queries cleanly
      }
      throw error;
    }
  }
  ```

### C. Request Collapsing (Singleflight Deduplication)
When multiple UI widgets or concurrent background jobs request the same resource simultaneously, coalesce them into a single in-flight Promise. Never execute duplicate identical fetches over the wire.

---

## 5. Layer 5: Context-Driven Security & Tenancy

### A. Tenant Isolation & IDOR Defense
* ❌ *BANNED*: Querying solely by a user-supplied primary key without scoping to the authenticated tenant:
  ```typescript
  // INSECURE (IDOR): Any user can read any invoice by guessing or iterating the ID
  const invoice = await db.invoices.findById(req.params.id);
  ```
* ✅ *REQUIRED*: Every data retrieval query MUST enforce the tenant boundary in its WHERE predicate:
  ```typescript
  // SECURE: Enforces tenant boundary derived from verified session token
  const invoice = await db.invoices.findOne({
    where: {
      id: req.params.id,
      organizationId: req.auth.organizationId,
      isDeleted: false,
    },
  });
  if (!invoice) {
    throw new NotFoundError("Invoice not found or access denied");
  }
  ```

### B. Strict Read DTO Projection (No Leak of Internal Entities)
* ❌ *BANNED*: Returning raw ORM entities or `SELECT *` from tables containing sensitive fields:
  ```sql
  -- DANGEROUS: Leaks password hashes, salt, 2FA secrets, and internal audit notes
  SELECT * FROM users WHERE id = :userId;
  ```
* ✅ *REQUIRED*: Select and serialize only explicitly allowed fields via strict projection schemas:
  ```typescript
  // Read DTO projection
  export const PublicUserDto = z.object({
    id: z.string(),
    displayName: z.string(),
    avatarUrl: z.string().url().nullable(),
    createdAt: z.string().datetime(),
  });
  ```

### C. SSRF Protection for Dynamic URL Fetching
If your backend fetches data from URLs supplied by users (e.g., webhooks, link unfurling, avatar import):
1. **DNS Pinning & Validation**: Resolve DNS before requesting.
2. **IP Range Blocklist**: Forbid requests targeting private or loopback ranges:
   - `127.0.0.0/8`, `::1` (Loopback)
   - `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16` (RFC 1918 Private)
   - `169.254.169.254` (Cloud Metadata / Link-Local)

---

## 6. The 3 AM Verification Checklist

Before deploying any feature involving data retrieval:

- [ ] **Timeout**: Does every network call have an explicit `AbortSignal.timeout(ms)`?
- [ ] **No `as` Casts**: Are network responses validated through a schema parser (`safeParse`)?
- [ ] **Safe Retries**: Are retries restricted to idempotent methods or guarded by `Idempotency-Key`?
- [ ] **No Waterfalls**: Are parallel requests batched or executed via `Promise.allSettled`?
- [ ] **Keyset Pagination**: Are unbounded `SELECT *` queries banned and tables $>1,000$ rows indexed with cursors?
- [ ] **4 States Handled**: Does the UI cleanly display Idle, Loading (no CLS), Empty, and Error (with Retry)?
- [ ] **Race Conditions Prevented**: Are previous requests aborted when query arguments change?
- [ ] **Tenant Scoped**: Is every database query filtered by `organizationId` / `tenantId`?
- [ ] **DTO Sanitized**: Are internal database columns and secrets omitted from the response?
