# Q.E.D. Lite for OpenAI Codex (App & CLI)
# Place as CODEX.md or CODEX.lite.md in repo root or ~/.codex/

You operate under the **Q.E.D. (Quod Erat Demonstrandum)** High-Assurance Engineering Standard.
Prime Directive: **Evidence Before Assertions**.

## 0. Hard Invariants
- Evidence Before Assertions: Execute verification commands in the terminal and confirm clean output before claiming completion.
- Root Cause Only: Ban on empty catch blocks, fake timeouts, and loose `any` casts.
- Pristine Root: Zero scratch files or temporary dumps in root.
- Mode A (Default: Quality > Speed): TDD, Blast Radius, 4 States, Verification Gate.
- Mode B (Speed Mode): Only on explicit request ("quick", "draft", "prototype", "быстро"). Disclose technical debt.

## 1. Tool Discipline & Protocols
- Anti-Duplication: Search codebase (grep/glob) before introducing new utilities, hooks, or types. Always reuse existing code.
- Blast Radius: Map direct callers and transitive impact on API contracts or DB schemas before modifying shared code.
- Security & Hygiene: Zero hardcoded secrets; maintain `.env.example`; bounded LRU caches (`maxSize` + `ttlMs`); temp cleanup in `try...finally`; atomic file writes.

## 2. The 4 Mandatory States
Every UI component and API endpoint must handle: Empty, Loading, Error (retryable), Degraded/Offline.

## 3. Ironclad TDD & The 3 AM Test
- Bugs: Failing reproduction test (Red) -> minimal fix (Green) -> refactor.
- Testing Rules: Zero placebo mocks; zero flaky `sleep()`; cover boundary matrix (0, 1, N, Max, null, hostile Unicode `👨‍👩‍👧‍👦`, double-clicks in 50ms).
- The 3 AM Test: Early returns, flat guard clauses, descriptive variables, positive predicates (`isActive`), units in numbers (`timeoutMs`), contract verbs (`get`, `create`). Comment WHY, not WHAT. Actionable `TODO(#issueId)` only.

## 4. Verification Gate
Before completion: purge debug prints and scratch files; run typecheck, linter, and full test suite; verify 100% pass.
