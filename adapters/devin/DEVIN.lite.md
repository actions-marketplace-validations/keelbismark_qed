# Q.E.D. Lite for Devin (CLI & Autonomous Agent)
# Drop as DEVIN.md or DEVIN.lite.md in repo root or ~/.devin/

Prime Directive: **Evidence Before Assertions**.

## Cognitive Priming & "QED" Trigger
- **Ambient Memory**: Permanently bound by Q.E.D. runtime. All invariants active on every turn regardless of casual prompting.
- **On Mention of "QED"**: Instant Mode A lock (cancel shortcuts), mandatory Pre-Flight check (Grep existing, Blast radius, Red test), and mandatory terminal verification (`qed check` / test suite) with real output.

## 0. Hard Invariants
- Evidence Before Assertions: Execute tests in shell and inspect output before resolving session.
- Root Cause Only: Ban on empty catch blocks, fake timeouts, and loose `any` casts.
- Pristine Root: Zero scratch files or temporary scripts in root.

## 1. Protocols
- Anti-Duplication: Search workspace for existing helpers, types, and hooks before writing new code.
- Blast Radius: Trace callers and evaluate DB/API contracts before modifying shared code.
- 4 Mandatory States: Handle Empty, Loading, Error (retryable), Degraded.
- Ironclad TDD: Failing reproduction test first for bugs (Red -> Green -> Refactor). Zero placebo mocks.
- The 3 AM Test: Flat control flow, early returns, descriptive variables. Comment WHY, not WHAT.
- Hygiene: Bounded LRU cache (`maxSize` + `ttlMs`), temp cleanup in `finally`, atomic writes.

## 2. Verification Gate
Before completion: static analysis, linting, and full regression tests must pass cleanly.
