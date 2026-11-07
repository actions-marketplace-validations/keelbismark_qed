# Observability, Structured Telemetry & Root Cause Analysis (RCA) Standard
*Part of the Q.E.D. Engineering Framework*

This standard codifies non-negotiable engineering invariants governing structured JSON logging, distributed context propagation, Personally Identifiable Information (PII) sanitization, and blameless post-mortem RCA investigations under the **Principle of Earned Complexity**.

---

## 0. Fundamental Axioms: Unobserved Systems are Black Boxes

> **If an outage cannot be diagnosed within 5 minutes from telemetry, your logging is noise.  
> Plain-text `console.log("here 1")` is amateur theater.  
> Logs without correlation IDs are unsearchable waste; logs containing raw passwords are data breaches.  
> An incident without a formal Root Cause Analysis (RCA) is an outage scheduled to repeat.**

Under Q.E.D., observability is treated as critical infrastructure, governed by the **Telemetry & Incident Integrity Pentad**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│               THE TELEMETRY & INCIDENT INTEGRITY PENTAD                │
│                                                                        │
│ 1. Structured JSON Logging            2. Context Propagation & Traces  │
│    - Pure JSON output to stdout          - W3C `traceparent` headers   │
│    - Standardized field schema           - Unified Correlation / Req ID│
│    - Zero multi-line string dumps        - Tenant-scoped log queries   │
│                                                                        │
│ 3. PII & Secret Redaction Invariant   4. Metric Cardinality Hygiene    │
│    - Auto-scrub authorization headers    - Bounded label dimensions    │
│    - Redact passwords, CVVs, tokens      - Gauge/Histogram thresholds  │
│    - In-stream regex masks               - Alert on symptom, not cause │
│                                                                        │
│ 5. Blameless Root Cause Analysis (RCA)                                 │
│    - 5 Whys causal breakdown             - Zero human finger-pointing  │
│    - Mechanical remediation items only   - Actionable issue IDs        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Pillar 1: The Structured JSON Logging Standard

### A. The Strict Ban on Plain-Text Console Logs
* ❌ *BANNED*: Writing unstructured, unsearchable string interpolation to stdout:
  ```typescript
  // CATASTROPHIC ANTI-PATTERN: Unparseable by Datadog, ELK, or CloudWatch
  console.log(`User ${userId} paid ${amount} for order ${orderId} at ${new Date()}`);
  ```
* ✅ *REQUIRED*: All runtime logs MUST be emitted as single-line, valid JSON objects containing standardized schema attributes:
  ```json
  {
    "timestamp": "2026-11-07T21:12:00.000Z",
    "level": "INFO",
    "service": "billing-service",
    "message": "Invoice payment processed successfully",
    "traceId": "4bf92f3577b34da6a3ce929d0e0e4736",
    "spanId": "00f067aa0ba902b7",
    "tenantId": "org_98214",
    "userId": "usr_412",
    "durationMs": 142.5,
    "environment": "production"
  }
  ```

### B. Standardized Log Level Semantics
* `DEBUG`: Fine-grained operational details (payload sizes, SQL query plans in local dev). Disabled by default in production.
* `INFO`: Normal lifecycle events (service startup, payment succeeded, batch job completed).
* `WARN`: Transient or recoverable issues (rate limit encountered with retry, degraded cache fallback used).
* `ERROR`: Functional failures requiring engineering attention (unhandled exception, DB transaction failure, 5xx response).
* `FATAL`: System-destroying environmental breakdowns (unreadable TLS cert, failed DB connection at boot, process exit).

---

## 2. Pillar 2: Distributed Context Propagation

### A. The Correlation / Trace ID Invariant
* Every incoming HTTP request, WebSocket connection, or background message MUST carry or generate a unique `traceId` (UUIDv4 or W3C Trace Context).
* This ID MUST be:
  1. Propagated through all internal function calls via asynchronous local storage (`AsyncLocalStorage` in Node.js, `context.Context` in Go).
  2. Passed across microservice boundaries via the standard `traceparent` HTTP header.
  3. Appended to every log line emitted during that execution tick.
  4. Returned to the client in the `x-request-id` response header.

---

## 3. Pillar 3: The PII & Secret Redaction Invariant

> **Logging a customer's password or authentication token is an instant SEV-1 incident.**

### A. Automatic Field Redaction
Logging libraries MUST be configured with deep field-name redaction filters. The following keys are **strictly forbidden** from appearing in plaintext:
- `password`, `passphrase`, `secret`, `token`
- `authorization`, `cookie`, `apiKey`, `privateKey`
- `creditCard`, `pan`, `cvv`, `cardNumber`
- `ssn`, `passportNumber`, `nationalId`

### Redaction Masking Pattern:
```typescript
const SENSITIVE_KEY_REGEX = /(password|token|secret|authorization|api[-_]?key|credit[-_]?card|cvv)/i;

export function redactSensitiveData(obj: unknown, depth = 0): unknown {
  if (depth > 5 || obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map((item) => redactSensitiveData(item, depth + 1));

  const sanitized: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (SENSITIVE_KEY_REGEX.test(key)) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof val === "object" && val !== null) {
      sanitized[key] = redactSensitiveData(val, depth + 1);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}
```

---

## 4. Pillar 4: Metric Cardinality Hygiene

* **The Cardinality Bomb**: Putting high-cardinality values (e.g. `userId`, `orderId`, full URLs with query parameters) into Prometheus or OpenTelemetry metric labels exhausts memory and crashes telemetry collectors.
* ✅ *REQUIRED*:
  - **Metric Labels**: Low cardinality only (`route: "/api/orders/:id"`, `status: "200"`, `method: "POST"`).
  - High-cardinality values belong in **logs and trace spans**, never in metric counter labels.

---

## 5. Pillar 5: The Blameless Post-Mortem & RCA Standard

When an incident occurs in production, an engineering team operating under Q.E.D. does not play the blame game. Humans make mistakes; systems must be designed to withstand them.

Every SEV-1 or SEV-2 incident requires a formal document in `docs/rca/YYYY-MM-DD-incident-title.md` adhering to this exact format:

### Official Q.E.D. Post-Mortem Template

```markdown
# Incident RCA: [YYYY-MM-DD] - [Short Descriptive Title]
**Severity**: SEV-1 (Critical Outage) | SEV-2 (Degraded Performance)  
**Date**: YYYY-MM-DD  
**Lead Investigator**: [Name/Handle]  
**Incident Correlation ID**: #req-9f82a1b  

---

## 1. Executive Summary
Brief non-technical description of what happened, user impact, and the resolution.
- **Duration**: XX minutes (from Detection to Mitigation)
- **User Impact**: XX% of active users experienced payment timeouts (HTTP 504).
- **Financial / Data Loss**: $0 / Zero data corruption.

---

## 2. Timeline (All Times in UTC)
- **14:02 UTC**: Deployment `v1.4.2` initiated containing PR #104.
- **14:06 UTC**: P99 database query latency spikes from 8ms to 4,200ms.
- **14:08 UTC**: PagerDuty fires alert `BillingDB_HighConnectionPoolSaturation`.
- **14:12 UTC**: On-call engineer identifies missing index on `orders.tenant_id`.
- **14:15 UTC**: Traffic diverted to read-replica; hotfix PR #106 created.
- **14:22 UTC**: Migration completed using `CREATE INDEX CONCURRENTLY`.
- **14:25 UTC**: Latency normalizes to 8ms; incident resolved.

---

## 3. The 5 Whys (Root Cause Deep-Dive)
1. **Why did users experience HTTP 504?** Because the billing service connection pool was exhausted.
2. **Why was the connection pool exhausted?** Because queries to the `orders` table took 4.2 seconds instead of 8ms.
3. **Why did queries take 4.2 seconds?** Because the query executed a full-table sequential scan on 12 million rows.
4. **Why did it execute a sequential scan?** Because the newly deployed feature queried by `tenant_id` without an index.
5. **Why was the index missing?** Because local development tests ran against SQLite with 10 rows where sequential scans took 0.1ms, and CI did not enforce a query execution plan audit.

---

## 4. Mechanical Corrective Actions (Prevent Recurrence)
*Action items must be binary, assigned to issues, and never blame human error.*

| Action Item | Type | Owner | Issue ID |
| :--- | :--- | :--- | :--- |
| Add `CREATE INDEX CONCURRENTLY` on `orders(tenant_id)` | Mitigate | @lead | `#106` (Done) |
| Add automated CI check for missing foreign key indexes | Prevent | @devops | `#108` |
| Configure P99 latency alerts at 500ms threshold | Detect | @sre | `#109` |
| Clamp default query limits to 100 rows in ORM base | Harden | @backend | `#110` |
```

---

## 6. The 3 AM Telemetry Checklist

- [ ] **Pure JSON**: Are all production logs emitted as valid structured JSON?
- [ ] **No Naked Prints**: Have all `console.log` / `print()` statements been replaced with structured loggers?
- [ ] **Correlation Propagation**: Does every log line carry a `traceId` / `incidentId`?
- [ ] **Zero PII Leaks**: Are passwords, authorization tokens, and credit cards strictly redacted?
- [ ] **Low Cardinality Metrics**: Are metric labels free of high-cardinality IDs and raw query strings?
- [ ] **Actionable RCA**: Are production outages closed with an explicit 5 Whys analysis and issue-tracked corrective tasks?
