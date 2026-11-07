# Comment Philosophy & Anti-Noise Standard
*Part of the Q.E.D. Engineering Framework*

This standard establishes the engineering discipline, permitted patterns, and strict prohibitions governing code comments written by AI agents and software engineers.

---

## 0. Fundamental Axiom

> **Code explains WHAT happens. Comments explain WHY it happens.**

The compiler, the runtime, and static analyzers execute the code. Code is optimal for expressing sequential steps, mathematical operations, and data transformations.

Code alone is incapable of explaining the **context of the outside world**:
* Why an obvious simpler approach was rejected due to an unexpressed edge case.
* Why a strange workaround exists for an operating system, runtime, or browser bug.
* Why a regulatory law or business constraint requires non-obvious logic.
* What performance trade-off was consciously accepted.

---

## 1. The 4 Deadly Sins of AI Commenting (Forbidden Patterns)

### Sin 1: The "Echo Noise" (Paraphrasing Syntax)
* **The Anti-Pattern**: An agent adds narrative play-by-play comments that merely restate what the adjacent syntax already declares:
  ```typescript
  // BAD: Echo noise. Triples line count, zero value.
  // Set isSubmitting to true
  setIsSubmitting(true);

  // Check if user is null
  if (!user) {
    // Return early with 401
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Iterate over products
  for (const product of products) { ... }
  ```
* **The Q.E.D. Rule**: **Zero tolerance for echo noise.** Any comment that merely translates syntax into plain English is classified as bloat and must be deleted.

### Sin 2: Docstring / JSDoc Inflation
* **The Anti-Pattern**: Re-documenting types that the language compiler already enforces:
  ```typescript
  // BAD: Redundant docstring inflation
  /**
   * Retrieves user by id.
   * @param {string} id - The id of the user.
   * @returns {User} The user object.
   */
  function getUserById(id: string): User;
  ```
* **The Q.E.D. Rule**: In strongly typed languages, doc comments are reserved for **public exported module boundaries** and MUST document information invisible in the type signature:
  * **Preconditions & Invariants**: What must be true before calling this function?
  * **Side Effects**: Does this mutate persistent storage, dispatch network events, or acquire distributed locks?
  * **Exceptions (`@throws`)**: Under what specific conditions does this throw?
  * **Algorithmic Complexity**: What is the asymptotic time and space complexity?

### Sin 3: Apology Comments & Ghost TODOs
* **The Anti-Pattern**: Leaving un-actionable, vague apologies or excuses in source code:
  ```typescript
  // BAD: Ghost TODO / Apology
  // TODO: fix this hack later
  // FIXME: this is messy but works for now
  ```
* **The Q.E.D. Rule**:
  - In High-Assurance Mode, sloppy code is refactored immediately—never deferred with an apology.
  - A legitimate `TODO` MUST be tied to a tracked issue or an explicit future condition:
  ```typescript
  // GOOD: Actionable TODO with issue reference and removal trigger
  // TODO(#412): Replace in-memory rate-limiter with Redis once service scales past 1 instance.
  ```

### Sin 4: Comment Rot (The Lying Comment)
* **The Anti-Pattern**: Business code is updated, but the adjacent comment is left unchanged:
  ```typescript
  // BAD: Comment rot (says 15%, code does 20%)
  // Apply 15% discount for tier-2 members
  const finalPrice = basePrice * 0.80;
  ```
* **The Q.E.D. Rule**: An outdated comment is a defect equivalent to a failing test. During every modification, all comments in the blast radius must be audited for veracity.

---

## 2. Self-Documenting Architecture First

Before writing any comment to explain complex logic, ask: **Can this be explained by better naming and structure?**

### Example: Eliminating Comments via Naming

```typescript
// BEFORE (Comment-heavy, 3 AM readability failure):
// Check if user is eligible for instant refund: must have paid within 14 days,
// account must not be flagged for fraud, and dispute count must be 0
if (now - order.paidAt < 14 * 86400000 && !user.isFraudFlagged && user.disputeCount === 0) { ... }
```

```typescript
// AFTER (Self-documenting, zero comments needed, instantly clear at 3 AM):
const isWithin14DayRefundWindow = (now - order.paidAt) < FOURTEEN_DAYS_IN_MS;
const hasCleanReputation = !user.isFraudFlagged && user.disputeCount === 0;
const isEligibleForInstantRefund = isWithin14DayRefundWindow && hasCleanReputation;

if (isEligibleForInstantRefund) { ... }
```

---

## 3. The 4 Permitted Categories of Comments in Q.E.D.

When a comment is necessary, it must belong to one of these four high-value categories:

### Category A: The "Architectural Why" (Design Trade-offs)
Explains why an alternative, seemingly obvious solution was deliberately avoided:
```typescript
// Keyset pagination (WHERE id > lastId) is used instead of OFFSET.
// PostgreSQL OFFSET scans and discards preceding rows, degrading to O(N^2)
// performance once tables exceed 500,000 records.
```

### Category B: Platform & Vendor Bug Workarounds
Documents an external quirk, browser incompatibility, or third-party bug that cannot be solved cleanly:
```typescript
// WORKAROUND: Safari iOS 16.4 WebKit bug #254198.
// Virtualized lists fail to recalculate scroll bounds when font scaling is active.
// Forcing a layout pass via offsetHeight resolves the blank frame glitch.
// Safe to remove once iOS 16 support is dropped.
```

### Category C: Regulatory & Business Domain Invariants
Documents legal statutes, accounting rules, or compliance constraints:
```typescript
// Complies with EU VAT Directive 2006/112/EC (Article 196):
// Reverse-charge mechanism requires setting VAT to 0% for verified cross-border
// B2B entities, but requires recording the validated customer VAT ID on the invoice.
```

### Category D: Concrete I/O Examples for Complex Algorithms
Provides visual input/output pairs for regular expressions, string parsers, or bitwise operations:
```typescript
/**
 * Normalizes varied international phone number formats into strict E.164 format.
 *
 * Examples:
 *   "+1 (555) 234-5678" -> "+15552345678"
 *   "8 (999) 123-45-67" -> "+79991234567"
 *   "0044 20 7946 0991" -> "+442079460991"
 *
 * @throws {InvalidPhoneNumberError} If digits length is < 10 or contains invalid country prefix.
 * Time Complexity: O(N) where N is string length.
 */
```

---

## 4. Checklist for Reviewing Comments

Before submitting code, verify:
- [ ] Are all play-by-play comments ("increment i", "return response") deleted?
- [ ] Does every comment explain **Why**, not **What**?
- [ ] Could complex boolean logic be refactored into descriptive variable names instead of comments?
- [ ] Does every `TODO` reference an active issue number or concrete milestone?
- [ ] Do complex parsers or regexes include concrete input/output examples?
- [ ] Are all comments in the blast radius 100% accurate and up-to-date with current code?
