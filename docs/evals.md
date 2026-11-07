# Q.E.D. Empirical Evaluation & LLM Benchmark Suite

> **Evidence Before Assertions**: We do not assert that Q.E.D. produces superior code; we measure and prove it mechanically.

This evaluation suite quantifies the exact defect eradication rate when autonomous AI coding assistants (Claude, Cursor, Copilot, Antigravity, OpenAI Codex) operate under the **Q.E.D. Engineering Standard** versus vanilla unconstrained prompting.

---

## 1. Methodology & Evaluation Matrix

We hand 6 identical, highly representative software engineering challenges across multiple tiers (frontend, backend, database, resilience) to:
1. **Vanilla Baseline**: Unconstrained prompt without the Q.E.D. constitution.
2. **Q.E.D. Standard**: The same prompt executed under Q.E.D. rules.

Each generated output is submitted directly to the **Q.E.D. Mechanical Verification Engine (`qed check`)** without human modification.

### Defect Taxonomy Tested

| Code | Pillar | Anti-Pattern | Operational Risk |
| :--- | :--- | :--- | :--- |
| **QED006** | Cache Hygiene | Unbounded `export const cache = new Map()` | Memory leak & OOM under production load |
| **QED005** | Network Deadlines | Naked `fetch(url)` without `AbortSignal.timeout` | Thread starvation & hanging connection pools |
| **QED003** | Error Integrity | Swallowed exception `catch (e) {}` | Silent data corruption & untraceable failures |
| **QED004** | Type Invariants | Loose `parsed as any` type cast | Runtime `TypeError: undefined is not a function` |
| **QED012** | Zero-Downtime DDL | Non-concurrent `CREATE INDEX` | Global exclusive write-lock on production table |
| **QED011** | Visual Anti-Slop | Emoji salad in action chrome (`🔥 Pay Now 🚀`) | User-hostile UI, unreadable screen reader copy |

---

## 2. Empirical Results (Node v20 / v22)

```
Scenario Evaluation Results:
---------------------------------------------------------------------------------------
| Scenario ID      | Domain                    | Vanilla Slop   | Q.E.D. Result  | Status   |
---------------------------------------------------------------------------------------
| SCN-01-CACHE     | backend/memory            | 1 defect(s)    | 0 defect(s)    | PASSED   |
| SCN-02-FETCH     | resilience/network        | 1 defect(s)    | 0 defect(s)    | PASSED   |
| SCN-03-ERROR     | observability/error-handling | 1 defect(s)    | 0 defect(s)    | PASSED   |
| SCN-04-TYPES     | type-safety/invariants    | 1 defect(s)    | 0 defect(s)    | PASSED   |
| SCN-05-DDL       | database/zero-downtime    | 1 defect(s)    | 0 defect(s)    | PASSED   |
| SCN-06-UI        | ui/anti-slop              | 1 defect(s)    | 0 defect(s)    | PASSED   |
---------------------------------------------------------------------------------------

Statistical Summary:
  - Total Scenarios Evaluated:       6
  - Vanilla Total Defects Detected:  6
  - Q.E.D. Total Defects Detected:   0
  - Slop Eradication Rate:           100.0% (Defects Eliminated)
  - Vanilla Gate Pass Rate:          0.0%
  - Q.E.D. Gate Pass Rate:           100.0% (High-Assurance Complete)
```

---

## 3. How to Reproduce

Run the automated evaluation suite locally from the repository root:

```bash
node evals/run-benchmark.js
```

The script evaluates the raw fixture code, asserts linter violations, prints the proof matrix, and exports full JSON telemetry to `evals/benchmark-results.json`.
