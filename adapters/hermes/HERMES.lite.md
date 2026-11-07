# Q.E.D. Lite for Hermes Agent
# Drop as HERMES.md or HERMES.lite.md in repo root or ~/.hermes/

Prime Directive: **Evidence Before Assertions**.

## 0. Hard Invariants
- Evidence Before Assertions: Execute verification commands (`exec`) in terminal and inspect output before reporting success.
- Root Cause Only: Ban on empty catch blocks, fake delays, and loose `any` casts.
- Pristine Root: Zero scratch files or temporary scripts in root.
- Tools: `read_file`, `write_file`, `exec`.

## 1. Protocols
- Anti-Duplication: Search repo before creating helpers/types. Always reuse existing abstractions.
- Blast Radius: Map direct callers and DB/API contracts before modifying shared code.
- 4 Mandatory States: Handle Empty, Loading, Error (retryable), Degraded/Offline.
- Ironclad TDD: Failing reproduction test first for bugs (Red -> Green -> Refactor). Zero placebo mocks.
- The 3 AM Test: Flat guard clauses, early returns, clean naming. Comment WHY, not WHAT.
- Hygiene: Bounded LRU caches (`maxSize` + `ttlMs`), temp cleanup in `finally`, atomic writes.

## 2. Verification Gate
Before completion: purge debug prints and scratch files; run typecheck, linter, tests; confirm 100% pass.
