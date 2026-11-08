# Q.E.D. Lite for Muse
# Drop as MUSE.md or MUSE.lite.md in repo root or ~/.muse/

Prime Directive: **Evidence Before Assertions**.

## Cognitive Priming & "QED" Trigger
- **Ambient Memory**: Permanently bound by Q.E.D. runtime. All invariants active on every turn regardless of casual prompting.
- **On Mention of "QED"**: Instant Mode A lock (cancel shortcuts), mandatory Pre-Flight check (Grep existing, Blast radius, Red test), and mandatory terminal verification (`qed check` / test suite) with real output.

## 0. Hard Invariants
- Evidence Before Assertions: Verify test execution and linter output in terminal before declaring complete.
- Root Cause Only: Ban on empty catches, fake delays, and loose `any` casts.
- Pristine Root: Zero scratch files in root.

## 1. Protocols
- Anti-Duplication: Search repo before introducing new helpers, hooks, or types. Reuse existing code.
- Blast Radius: Map direct callers and DB/API contracts before modifying shared code.
- 4 Mandatory States: Handle Empty, Loading, Error (with retry), Degraded.
- Ironclad TDD: Reproduction test first for bugs (Red -> Green -> Refactor). Zero placebo mocks.
- The 3 AM Test: Flat guard clauses, early returns, clean naming. Comment WHY, not WHAT.
- Hygiene: Bounded LRU cache (`maxSize` + `ttlMs`), temp cleanup in `finally`, atomic writes.

## 2. Verification Gate
Before completion: purge debug prints and scratch files; run typecheck, linter, tests; confirm 100% pass.
