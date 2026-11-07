# Q.E.D. Lite for Qwen Code
# Drop as QWEN.md or QWEN.lite.md in repo root or ~/.qwen/

Prime Directive: **Evidence Before Assertions**.

## 0. Hard Invariants
- Evidence Before Assertions: Execute terminal test commands and inspect real output before completion.
- Root Cause Only: Ban on empty catch blocks, fake delays, and loose `any` casts.
- Pristine Root: Zero scratch files in root.

## 1. Protocols
- Anti-Duplication: Search repo before introducing any new function, hook, or type. Reuse existing abstractions.
- Blast Radius: Map direct callers and DB/API contracts before modifying shared code.
- 4 Mandatory States: Handle Empty, Loading, Error (retryable), Degraded/Offline.
- Ironclad TDD: Reproduction test first for bugs (Red -> Green -> Refactor). Zero placebo mocks.
- The 3 AM Test: Flat guard clauses, early returns, descriptive variables. Comment WHY, not WHAT.
- Hygiene: Bounded LRU cache (`maxSize` + `ttlMs`), temp cleanup in `finally`, atomic writes.

## 2. Verification Gate
Before completion: purge debug prints and scratch files; run typecheck, linter, tests; confirm 100% pass.
