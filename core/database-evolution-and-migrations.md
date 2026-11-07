# Database Evolution & Zero-Downtime Migrations Standard
*Part of the Q.E.D. Engineering Framework*

This standard codifies non-negotiable engineering invariants governing schema migrations, non-blocking DDL execution, the Expand/Contract pattern, and safe data backfilling under the **Principle of Earned Complexity**.

---

## 0. Fundamental Axioms: The Database Outlives the Application

> **Code deployments are reversible in seconds; database schema corruptions take hours or days to repair.  
> An unindexed table lock is an unannounced production outage.  
> Dropping a column in the same deployment as the code that stops using it is an instant deployment crash.  
> In high-assurance engineering, all schema evolution is backward-compatible and zero-downtime.**

AI agents frequently generate destructive database migrations: adding `NOT NULL` columns without defaults, executing synchronous index builds on tables with millions of rows, or deleting columns while older application containers are still reading them.

Under Q.E.D., all database schema changes MUST satisfy the **Zero-Downtime Evolution Pentad**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│               ZERO-DOWNTIME DATABASE EVOLUTION PENTAD                  │
│                                                                        │
│ 1. The Expand/Contract Pattern        2. Non-Blocking DDL Discipline   │
│    - Multi-phase schema evolution        - `CREATE INDEX CONCURRENTLY` │
│    - Dual-write during transition        - Strict `lock_timeout` ('2s')│
│    - Never drop and write in one release - Safe defaults (metadata-only│
│                                                                        │
│ 3. Batched Background Backfills       4. Reversibility & Rollback      │
│    - Chunked updates (e.g. 1k rows)      - Verified down-migrations    │
│    - Sleep pauses between chunks         - Backward-compatible schemas │
│    - No table-locking mass updates       - Idempotent migration scripts│
│                                                                        │
│ 5. Lock-Free Foreign Keys & Constraints                                │
│    - Add `NOT VALID` first               - Validate asynchronously     │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Pillar 1: The Expand/Contract (Parallel Run) Pattern

When modifying existing columns (renaming, changing types, splitting fields), **never do it in a single atomic migration**. You must execute across three distinct release phases:

```text
Release N (Expand)           Release N+1 (Migrate & Switch)       Release N+2 (Contract)
┌──────────────────────┐     ┌───────────────────────────┐        ┌──────────────────────┐
│ • Add new column     │     │ • Backfill historical data│        │ • Drop old column    │
│ • Write to BOTH      │ ──> │ • Switch read to NEW      │ ─────> │ • Clean up dual-write│
│ • Read from OLD      │     │ • Continue writing to BOTH│        │   code               │
└──────────────────────┘     └───────────────────────────┘        └──────────────────────┘
```

### Concrete Example: Renaming `phone` to `phoneNumber`

#### Step 1: Release N — Expand
```sql
-- Migration 001_expand_phone_number.sql
-- Add new column as NULLABLE so older code instances don't fail
ALTER TABLE users ADD COLUMN phone_number VARCHAR(32);
```
*Application Code*: Writes to both `phone` AND `phone_number`; reads from `phone`.

#### Step 2: Intermediate Background Backfill
*Run a non-blocking background script to copy old data to new column in small batches.*

#### Step 3: Release N+1 — Switch
*Application Code*: Reads from `phone_number`; continues writing to both.

#### Step 4: Release N+2 — Contract
```sql
-- Migration 002_contract_phone_number.sql
-- Now safe to drop because all deployed containers read only from phone_number
ALTER TABLE users DROP COLUMN phone;
```

---

## 2. Pillar 2: Non-Blocking DDL Discipline

### A. The Lock Timeout Invariant
* **The Hazard**: DDL statements in PostgreSQL and MySQL require an `ACCESS EXCLUSIVE` lock. If a long-running analytical query or background job is running, the DDL waits behind it, blocking **all subsequent queries**, crashing the entire application.
* ✅ *REQUIRED*: Every migration script MUST set a strict `lock_timeout`:
  ```sql
  -- High-Assurance DDL Guardrail
  SET lock_timeout = '2s';
  SET statement_timeout = '30s';
  ```
  *If the lock cannot be acquired within 2 seconds, the migration fails fast rather than queueing up and taking down production.*

### B. Concurrent Index Creation
* ❌ *BANNED*: Running standard `CREATE INDEX` on production tables:
  ```sql
  -- DANGEROUS: Locks table against all writes for the entire duration of the build
  CREATE INDEX idx_orders_customer_id ON orders(customer_id);
  ```
* ✅ *REQUIRED*: Always create indexes without locking writes:
  ```sql
  -- SAFE: Builds index in the background without blocking writes
  CREATE INDEX CONCURRENTLY idx_orders_customer_id ON orders(customer_id);
  ```

### C. Safe Addition of `NOT NULL` Columns
* ❌ *BANNED*: Adding a `NOT NULL` column without a default to an existing table:
  ```sql
  -- CATASTROPHIC: Fails immediately if table has rows, or locks table to rewrite all blocks
  ALTER TABLE users ADD COLUMN status VARCHAR(20) NOT NULL;
  ```
* ✅ *REQUIRED*:
  1. In PostgreSQL 11+: Adding a column with a **constant** default (`DEFAULT 'active'`) is metadata-only ($O(1)$ time, no table rewrite).
  2. For complex or calculated values: Add column as nullable $\rightarrow$ backfill values $\rightarrow$ add `CHECK (col IS NOT NULL) NOT VALID` $\rightarrow$ `VALIDATE CONSTRAINT` asynchronously.

---

## 3. Pillar 3: Batched Background Backfills

* ❌ *BANNED*: Executing mass updates in a single migration statement:
  ```sql
  -- CATASTROPHIC: Generates millions of WAL logs, exhausts lock table, causes replica lag
  UPDATE orders SET status = 'completed' WHERE legacy_status = 1;
  ```
* ✅ *REQUIRED*: Historical data backfills must execute in small, indexed batches with sleep pauses:
  ```typescript
  // scripts/backfills/2026-11-backfill-orders.ts
  const BATCH_SIZE = 1_000;
  const SLEEP_MS = 100;

  export async function backfillOrderStatuses(db: Database) {
    let lastSeenId = 0;
    while (true) {
      const rows = await db.query(
        `UPDATE orders
         SET status = 'completed'
         WHERE id IN (
           SELECT id FROM orders
           WHERE id > $1 AND legacy_status = 1
           ORDER BY id ASC
           LIMIT $2
         )
         RETURNING id`,
        [lastSeenId, BATCH_SIZE]
      );

      if (rows.length === 0) break;
      lastSeenId = rows[rows.length - 1].id;
      logger.info(`Backfilled batch up to ID ${lastSeenId}`);
      await new Promise((resolve) => setTimeout(resolve, SLEEP_MS)); // Yield to DB engine
    }
  }
  ```

---

## 4. Pillar 4: Safe Constraints via `NOT VALID`

Adding foreign keys or check constraints synchronously scans the entire table and holds exclusive locks.

* ✅ *REQUIRED*: Two-step constraint validation:
  ```sql
  -- Step 1: Add constraint without scanning historical data (instant lock acquisition)
  ALTER TABLE invoices
  ADD CONSTRAINT fk_invoices_account_id
  FOREIGN KEY (account_id) REFERENCES accounts(id)
  NOT VALID;

  -- Step 2: Validate constraint concurrently (does NOT block writes)
  ALTER TABLE invoices
  VALIDATE CONSTRAINT fk_invoices_account_id;
  ```

---

## 5. The 3 AM Database Migration Checklist

Before running any migration on a staging or production database:

- [ ] **Lock Timeout**: Does the migration set `SET lock_timeout = '2s'`?
- [ ] **Concurrent Index**: Are all indexes built using `CREATE INDEX CONCURRENTLY`?
- [ ] **Expand/Contract**: If renaming or dropping columns, is it split across multi-phase releases?
- [ ] **Batched Backfill**: Are updates on $>10,000$ rows extracted into a background chunked script?
- [ ] **Safe NOT NULL**: Are new `NOT NULL` columns verified to be constant defaults or validated via `CHECK ... NOT VALID`?
- [ ] **Tested Rollback**: Has the down-migration been executed and tested in an ephemeral environment?
