# Testing Philosophy & High-Assurance Standard
*Part of the Q.E.D. Engineering Framework*

This standard defines the philosophy, structural boundaries, and strict invariants governing how automated tests must be written by AI agents and software engineers.

---

## 0. Fundamental Axioms

1. **A bad test is worse than no test.**
   A missing test is an honest gap. A bad test provides false security, masks critical bugs, resists necessary refactoring, and gives a green checkmark to broken production code.
2. **Test behavior, not implementation details.**
   Tests must interact with components through their public interface and assert on observable outputs and side effects. Never test private variables, internal call sequences, or mirror internal code line-by-line.
3. **The Mutation Invariant (A test must be capable of failing).**
   If you comment out or mutate the core business logic in production code, at least one test MUST fail. A test suite that remains green when business logic is deleted is a placebo.
4. **Evidence Before Assertions.**
   Never declare a test suite passing without running the command in the shell and examining stdout, stderr, and the exit code.

---

## 1. The 7 Deadly Sins of AI Testing (Forbidden Patterns)

### Sin 1: The Placebo Mock ("Mocking the Universe")
* **The Anti-Pattern**: An agent wants a green test, so it mocks the database, mocks the HTTP client, mocks the internal helper, mocks the validator, and then asserts:
  ```typescript
  // BAD: Testing your own mock, not your system
  expect(mockPaymentClient.charge).toHaveBeenCalledWith(100);
  ```
* **The Reality**: If the real payment provider renames `charge` to `processCharge`, or if the SQL query fails on Postgres due to a missing comma, the test suite is 100% green while production crashes.
* **The Q.E.D. Rule**:
  - Pure business logic must be tested with **zero mocks** on real deterministic inputs.
  - Integration with databases, file systems, and external APIs must be tested against real ephemeral environments (e.g., Testcontainers, in-memory SQLite, contract tests) or high-fidelity contract fixtures, never imaginary mocks.

### Sin 2: Tautological Assertions
* **The Anti-Pattern**: Assertions that cannot fail or that only assert existence:
  ```typescript
  // BAD: Tautological assertion
  expect(result).toBeDefined();
  expect(result != null).toBe(true);
  ```
* **The Q.E.D. Rule**: Always assert exact expected states, precise return structures, or explicit error codes:
  ```typescript
  // GOOD: Exact state contract
  expect(result).toEqual({
    status: "success",
    transactionId: "tx_12345",
    chargedAmount: 10000,
    currency: "USD",
  });
  ```

### Sin 3: "Happy-Path" Tunnel Vision
* **The Anti-Pattern**: Only testing the optimistic flow (`user: "Alice", age: 25, item: 1`).
* **The Q.E.D. Rule**: Every feature must execute the **Mandatory Boundary Value Matrix** (see Section 3).

### Sin 4: The Flaky Sleep Hack (`sleep(1000)`)
* **The Anti-Pattern**: Using arbitrary timers to synchronize async code:
  ```typescript
  // BAD: Flaky sleep
  await new Promise((r) => setTimeout(r, 1000));
  expect(queue.isDone()).toBe(true);
  ```
* **The Q.E.D. Rule**: **Strict ban on arbitrary sleeping in tests.** Use:
  - Virtual/fake timers (`jest.useFakeTimers()`, `time.sleep` with mock clock) for purely time-based logic.
  - Deterministic polling with an explicit condition, interval, and hard deadline:
  ```typescript
  // GOOD: Deterministic polling with timeout
  await waitFor(() => expect(queue.isDone()).toBe(true), { timeoutMs: 2000 });
  ```

### Sin 5: Post-Hoc Tests (Writing Tests After the Fix)
* **The Anti-Pattern**: Modifying production code blindly, seeing it "look okay", and then writing a test fitted to the new output.
* **The Q.E.D. Rule**: For any bug fix, the reproduction test must be written **first**, run to observe it **FAIL** with the exact defect (Red), then the root cause is fixed, and the test is re-run to confirm **PASS** (Green).

### Sin 6: Testing Private Implementation Details
* **The Anti-Pattern**: Exposing private methods just to write unit tests for them, or checking internal private flags.
* **The Q.E.D. Rule**: Test private behavior transitively through public contracts. If a private method is so complex it demands standalone tests, it is screaming to be extracted into a separate, pure collaborator class or helper.

### Sin 7: Meaningless Test Names ("test1", "should work")
* **The Anti-Pattern**: `it("test checkout")` or `test("handles error")`.
* **The Q.E.D. Rule**: Test names must follow the `[Condition] -> [Action] -> [Expected Result]` convention:
  ```typescript
  it("when cart is empty, checkout returns EmptyCartError without charging card", async () => { ... });
  ```

### Sin 8: Silent Test Weakening & Poisoning ("Cheating the Oracle")
* **The Anti-Pattern**: When an autonomous agent encounters a failing test, it takes the path of least resistance: changing expected values to match buggy output, deleting assertions, or weakening exact checks (`expect(user.role).toBe('admin')` $\rightarrow$ `expect(user).toBeDefined()`).
* **The Reality**: The production code remains broken, and the automated safety net is permanently degraded.
* **The Q.E.D. Rule**: **The No-Weakening Invariant**. Tests are presumed correct. An agent may ONLY modify an existing test if it provides verifiable evidence of a test defect (contract evolution, implementation-coupling, or physical flakiness), and the replacement assertion must remain as strict as the original. (See Section 6).

---

## 2. The Q.E.D. Testing Pyramid

```text
       ▲
      / \     E2E / Adversarial (10%)
     /   \    Multi-system flows, rapid double clicks, network cuts, 5MB payloads
    /-----\
   /       \   Integration & Contract (30%)
  /         \  Database schema compliance, real SQL queries, migrations, API DTOs
 /-----------\
/             \ Pure Deterministic Unit (60%)
--------------- Pure business logic, state machines, parsers: 0 mocks, 0 I/O (<5ms)
```

1. **Pure Unit (60%)**:
   - Tests pure business calculations, formatting, parsing, validation, and domain state machines.
   - **Zero mocks, zero I/O, zero network.**
   - Execution time: < 5 milliseconds per test. Thousands can run in seconds.
2. **Integration & Contract (30%)**:
   - Tests where software touches reality: database queries, file writing, HTTP endpoints, cache layers.
   - Uses real test databases (in-memory SQLite, Testcontainers PostgreSQL) to verify that queries and schemas actually work.
3. **Adversarial & Chaos (10%)**:
   - Tests stress, race conditions, rapid concurrency (double-click within 50ms), malformed payloads, and aborted requests.

---

## 3. The Mandatory Boundary Value Matrix

Whenever an agent writes tests for an input parameter, collection, or state machine, it must cover this matrix:

| Scenario | Input Representation | Expected Behavior |
| :--- | :--- | :--- |
| **Zero / Empty** | `0`, `""`, `[]`, `{}` | Returns defined Empty state or validation error; never crashes. |
| **Singular (One)** | `1`, `[item]`, single character | Standard base processing. |
| **Nominal (N)** | Normal realistic collection (e.g. 5 items) | Standard business output. |
| **Boundary (N+1)**| Pagination limit (e.g. item 101 when page size is 100)| Correctly truncates or pages. |
| **Maximum / Overflow** | Huge integer (`Number.MAX_SAFE_INTEGER`), 5MB payload | Rejects gracefully with 413/PayloadTooLarge, does not OOM. |
| **Null / Undefined** | `null`, `undefined`, missing JSON key | Guard clauses trigger; no unhandled `TypeError`. |
| **Hostile Strings** | RTL text, composite emojis (`👨‍👩‍👧‍👦`), SQL/XSS injections | Encoded cleanly, does not corrupt storage or render raw. |
| **Concurrent / Duplicate** | 2 requests with identical idempotency key in 10ms | Exactly 1 processed, second receives cached result or 409. |

---

## 4. Test Anatomy: The Standard AAA Pattern

Every test written under Q.E.D. must clearly separate three blocks:

```typescript
describe("WalletService.debit", () => {
  it("when funds are insufficient, throws InsufficientFundsError and does not update balance", async () => {
    // 1. Arrange: Setup realistic state with zero irrelevant noise
    const wallet = await createTestWallet({ initialBalance: 50 });
    const debitAmount = 100;

    // 2. Act: Execute the single action under test
    const action = () => walletService.debit(wallet.id, debitAmount);

    // 3. Assert: Verify both the error AND the absence of side-effects
    await expect(action).rejects.toThrow(InsufficientFundsError);
    const balanceAfter = await walletService.getBalance(wallet.id);
    expect(balanceAfter).toBe(50); // Invariant preserved!
  });
});
```

---

## 5. Verification Checklist for AI Agents

Before submitting code with tests, the agent must verify:
- [ ] Are pure unit tests running with zero mocks and executing in < 5ms?
- [ ] Are integration tests running against realistic schemas/databases?
- [ ] Is there zero usage of `sleep()` or arbitrary timeouts?
- [ ] Does every test have an exact, non-tautological assertion?
- [ ] Have the boundary conditions (0, 1, Max, Null, Hostile) been tested?
- [ ] For bug fixes: Was the test run and verified RED before the fix was made?
- [ ] Does the test fail if the business logic is commented out (Mutation Check)?

---

## 6. The Test Mutation Protocol (Modifying Existing Tests)

Autonomous agents must not treat tests as untouchable black boxes when tests are genuinely defective, nor may they cheat by weakening them. Follow the 4 rules of the **Test Mutation Protocol**:

1. **Presumption of Code Defect**:
   Production code is assumed broken until proven otherwise. Failing tests are treated as valid alarms by default.
2. **The 3 Permissible Test Defect Scenarios**:
   - *Scenario A: Contract Evolution*: A business requirement explicitly changed (e.g. migration to a new schema). The test is asserting deprecated behavior.
   - *Scenario B: White-Box / Implementation Coupling*: A valid refactoring changed internal structure without altering public behavior, but the old test was tightly coupled to private methods or obsolete mocks.
   - *Scenario C: Physical Test Bug*: The test contained an unhandled race condition, hardcoded expired timestamp, or timezone assumption.
3. **The No-Weakening Invariant**:
   When updating an existing test, assertions must NEVER be downgraded:
   - ❌ FORBIDDEN: Changing `expect(res.status).toBe(200)` to `expect(res).toBeDefined()`.
   - ❌ FORBIDDEN: Deleting failing assertions without replacement.
   - ✅ PERMITTED: Updating `expect(user.name).toBe('Alice')` to `expect(user.fullName).toBe('Alice Smith')` when reflecting a documented contract change.
4. **The Post-Mutation Verification**:
   If an existing test was modified, the agent MUST run the Mutation Check: temporarily break the business logic in production code and verify that the updated test turns **RED**. If it stays GREEN, the test mutation is defective and must be rejected.
