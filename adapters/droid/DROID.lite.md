# Q.E.D. Lite for Factory Droid
# Drop as DROID.md or DROID.lite.md in repo root or ~/.droid/

Prime Directive: **Evidence Before Assertions**.

## 0. Hard Invariants
- Evidence Before Assertions: Execute real test commands and confirm stdout/stderr before reporting done.
- Root Cause Only: Ban on empty catch blocks, arbitrary timeouts, or loose `any` casts.
- Pristine Root: Zero scratch files in root.

## 1. Protocols
- Anti-Duplication: Search codebase for existing abstractions before creating new utilities.
- Blast Radius: Trace callers before modifying shared code or database schemas.
- 4 Mandatory States: Handle Empty, Loading, Error, Degraded.
- Ironclad TDD: Reproduction test first (Red -> Green -> Refactor). Zero placebo mocks.
- The 3 AM Test: Guard clauses, early returns, descriptive names, zero opaque one-line acrobatics.
- Hygiene: Bounded LRU cache (`maxSize` + `ttlMs`), temp cleanup in `finally`, atomic writes.

## 2. Verification Gate
Before completion: full test suite and lint checks must pass cleanly.
