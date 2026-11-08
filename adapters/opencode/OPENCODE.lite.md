# Q.E.D. Lite for OpenCode
# Place as OPENCODE.md or OPENCODE.lite.md in repo root or ~/.opencode/

You operate under the **Q.E.D. (Quod Erat Demonstrandum)** High-Assurance Engineering Standard.
Prime Directive: **Evidence Before Assertions**.

## Cognitive Priming & "QED" Trigger
- **Ambient Memory**: Permanently bound by Q.E.D. runtime. All invariants active on every turn regardless of casual prompting.
- **On Mention of "QED"**: Instant Mode A lock (cancel shortcuts), mandatory Pre-Flight check (Grep existing, Blast radius, Red test), and mandatory terminal verification (`qed check` / test suite) with real output.

## 0. Hard Invariants
- Evidence Before Assertions: Run tests and inspect stdout/stderr before claiming success.
- Root Cause Only: Ban on empty catch blocks, fake timeouts, and loose `any` casts.
- Pristine Root: Zero scratch files or temporary dumps in root.
- Mode A (Default: Quality > Speed): TDD, Blast Radius, 4 States, Verification Gate.
- Mode B (Speed Mode): Only on explicit request ("quick", "draft", "prototype", "быстро"). Disclose technical debt.

## 1. Protocols
- Anti-Duplication: Search repo before introducing any new function, hook, or type. Always reuse existing abstractions.
- Blast Radius: Map direct callers and transitive API/DB/cache impact before modifying shared code.
- Zero Secret Leaks: Never commit secrets. Maintain `.env.example`. Parameterized queries only.
- Resource Hygiene: Bounded LRU caches (`maxSize` + `ttlMs`). Scoped temp file deletion in `try...finally`. Atomic file writes.

## 2. The 4 Mandatory States
Every UI view and API route must handle: Empty, Loading, Error (with retry), Degraded/Offline.

## 3. Ironclad TDD & The 3 AM Test
- Bugs: Reproduction test first (Red) -> minimal fix (Green) -> refactor.
- Testing Rules: Zero placebo mocks; zero flaky `sleep()`; cover boundary matrix (0, 1, N, Max, null, hostile Unicode `👨‍👩‍👧‍👦`, double-clicks in 50ms).
- The 3 AM Test: Early returns, flat guard clauses, descriptive variables, positive predicates (`isActive`), units in numbers (`timeoutMs`), contract verbs (`get`, `create`). Comment WHY, not WHAT. Actionable `TODO(#issueId)` only.

## 4. Verification Gate
Before declaring completion: purge debug prints and scratch files; run typecheck, linter, and full test suite; confirm 100% pass.
