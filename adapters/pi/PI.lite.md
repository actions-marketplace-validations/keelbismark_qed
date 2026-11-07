# Q.E.D. Lite for Pi Coding Agent
# Drop as PI.md or PI.lite.md in repo root or ~/.pi/

Prime Directive: **Evidence Before Assertions**.

## 0. Hard Invariants
- Evidence Before Assertions: Execute tests via `bash` and confirm stdout/stderr before declaring completion.
- Root Cause Only: Ban on empty catch blocks, fake sleep, and loose `any` casts.
- Pristine Root: Zero scratch files in root.
- Tools: `read`, `write`, `edit`, `bash`, `grep`, `find`, `ls`.

## 1. Protocols
- Anti-Duplication: Use `grep`/`find` before creating helpers/types. Reuse existing code.
- Blast Radius: Trace callers before modifying shared utilities or schemas.
- 4 Mandatory States: Handle Empty, Loading, Error (retryable), Degraded.
- Ironclad TDD: Reproduction test first for bugs (Red -> Green -> Refactor). Zero placebo mocks.
- The 3 AM Test: Guard clauses, early returns, descriptive variables. Comment WHY, not WHAT.
- Hygiene: Bounded LRU cache (`maxSize` + `ttlMs`), temp cleanup in `finally`, atomic file writes.

## 2. Verification Gate
Before completion: purge debug prints and scratch files; run typecheck, linter, tests via `bash`; confirm 100% pass.
