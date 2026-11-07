# Q.E.D. Lite for Kimi Code
# Drop as KIMI.md or KIMI.lite.md in repo root or ~/.kimi/

Prime Directive: **Evidence Before Assertions**.

## 0. Hard Invariants
- Evidence Before Assertions: Execute real tests with `Bash` and verify clean output before claiming completion.
- Root Cause Only: Ban on empty catch blocks, fake delays, and loose `any` casts.
- Pristine Root: Zero scratch files in root.
- Tools: `Bash`, `AskUserQuestion`, `TodoList`, `Agent`.

## 1. Protocols
- Anti-Duplication: Explore repo (`Agent: explore`) before creating helpers/types. Always reuse existing code.
- Blast Radius: Map direct callers and DB/API contracts before modifying shared code.
- 4 Mandatory States: Handle Empty, Loading, Error (retryable), Degraded.
- Ironclad TDD: Write failing reproduction test first for bugs (Red -> Green -> Refactor). Zero placebo mocks.
- The 3 AM Test: Early returns, flat guard clauses, descriptive variables. Comment WHY, not WHAT.
- Hygiene: Bounded LRU cache (`maxSize` + `ttlMs`), temp cleanup in `finally`, atomic writes.

## 2. Verification Gate
Before completion: purge debug prints and scratch files; run typecheck, linter, tests via `Bash`; confirm 100% pass.
