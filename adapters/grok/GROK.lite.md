# Q.E.D. Lite for Grok Build CLI
# Drop as GROK.md or GROK.lite.md in repo root or ~/.grok/

Prime Directive: **Evidence Before Assertions**.

## Cognitive Priming & "QED" Trigger
- **Ambient Memory**: Permanently bound by Q.E.D. runtime. All invariants active on every turn regardless of casual prompting.
- **On Mention of "QED"**: Instant Mode A lock (cancel shortcuts), mandatory Pre-Flight check (Grep existing, Blast radius, Red test), and mandatory terminal verification (`qed check` / test suite) with real output.

## 0. Hard Invariants
- Evidence Before Assertions: Execute terminal test/build commands and inspect real output before completion.
- Root Cause Only: Ban on empty catch blocks, fake delays, and loose `any` casts.
- Pristine Root: Zero scratch files in root.

## 1. Protocols
- Anti-Duplication: Search repo before introducing any new function, hook, or type. Always reuse existing abstractions.
- Blast Radius: Map direct callers and DB/API contracts before modifying shared code.
- 4 Mandatory States: Handle Empty, Loading, Error (retryable), Degraded/Offline.
- Ironclad TDD: Write failing reproduction test first for bugs (Red -> Green -> Refactor). Zero placebo mocks.
- The 3 AM Test: Early returns, flat guard clauses, descriptive variables. Comment WHY, not WHAT.
- Hygiene: Bounded LRU cache (`maxSize` + `ttlMs`), temp cleanup in `finally`, atomic writes.

## 2. Verification Gate
Before completion: purge debug prints and scratch files; run typecheck, linter, tests; confirm 100% pass.
