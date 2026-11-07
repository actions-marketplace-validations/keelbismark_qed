# Q.E.D. End-to-End Walkthrough: Building a Production Feature

This walkthrough illustrates how an autonomous agent or pair-programmer operates under the Q.E.D. Standard.

---

## Task: Add "Idempotent Wallet Deduction" API

### Phase 1: Specification & Blast Radius
1. **Anti-Duplication Radar**: Agent searches `src/utils` and `src/services` for existing transaction or wallet functions. Discovers `db.wallets.updateBalance()`. Reuses this existing primitive.
2. **Blast Radius Analysis**:
   - Direct Callers: Checkout controller, subscription renewal cron.
   - Indirect Impact: Transaction ledger, user balance cache.
   - Risk Level: **Critical** (financial logic).
3. **Acceptance Criteria**:
   - Request with duplicate `idempotencyKey` returns previous response without charging twice.
   - Insufficient funds returns clean 402 with structured error body.
   - Successful debit emits audit event to Kafka/outbox.

---

### Phase 2: Adversarial QA & The 4 States
1. **Empty State**: User has $0.00 balance $\rightarrow$ prompt to top up.
2. **Loading State**: Wallet debit in flight $\rightarrow$ button disabled with spinner.
3. **Error State**: Gateway timeout $\rightarrow$ transaction marked pending with auto-retry.
4. **Chaos Monkey Scenario**: Client fires 5 simultaneous requests with the same `idempotencyKey` within 100ms.

---

### Phase 3: The 3 AM Test
The agent refactors nested logic:
- Uses early return guards for `amount <= 0` and `balance < amount`.
- Replaces complex single-line reducer with clearly named variables: `currentBalance`, `pendingHoldAmount`, `availableBalance`.

---

### Phase 4: Ironclad TDD (Red-Green-Refactor)
1. **Red**: Agent writes integration test:
   ```typescript
   test("concurrent duplicate debit requests execute only once", async () => { ... });
   ```
   Runs test. **Fails** with duplicate debit (Red).
2. **Green**: Agent implements distributed lock / unique constraint on `idempotencyKey`.
   Runs test. **Passes** (Green).
3. **Refactor**: Code cleaned, comments added with concrete examples.

---

### Phase 5: Verification Gate
- `npm run lint` $\rightarrow$ Passed (0 warnings).
- `npx tsc --noEmit` $\rightarrow$ Passed (0 type errors).
- `npm test` $\rightarrow$ 48/48 tests passed (0 regressions).
- Atomic commit created: `feat(wallet): implement idempotent deduction endpoint`.
