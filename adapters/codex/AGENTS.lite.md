# Q.E.D. Lite for Autonomous Agents
# Place as AGENTS.md or AGENTS.lite.md in repo root or ~/.agents/

Prime Directive: **Evidence Before Assertions**. Never claim code is functional without executing terminal commands and verifying clean output.

## Hard Invariants
1. Quality Over Speed (Default Mode): Mode A by default. Mode B (Speed Mode) only on explicit request; requires technical debt disclosure.
2. Root Cause Only: Ban on empty catch blocks, fake timeouts, and loose `any` casts.
3. Pristine Root: Zero scratch files or temporary dumps in root.
4. Search Before Create: Grep codebase before introducing new helpers, hooks, or types. Always reuse existing code.
5. Blast Radius: Map direct callers and downstream API/DB consumers before changing shared code.
6. 4 Mandatory States: Handle Empty, Loading, Error (retryable), Degraded/Offline.
7. Ironclad TDD: Write failing reproduction test first for bugs (Red -> Green -> Refactor). Zero placebo mocks, zero flaky sleep.
8. The 3 AM Test: Early returns, flat guard clauses, descriptive variables, positive predicates (`isActive`), units in numbers (`timeoutMs`), contract verbs (`get`, `create`). Comment WHY, not WHAT. Actionable `TODO(#issueId)`.
9. Hygiene: Bounded LRU cache (`maxSize` + `ttlMs`), temp cleanup in `try...finally`, atomic file writes.
10. Verification Gate: Run typecheck, linter, and full test suite before declaring completion.
