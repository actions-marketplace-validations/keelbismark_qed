# Q.E.D. Lite — Machine Instruction Set
*Token-optimized (~450 tokens) engineering standard for AI coding agents.*

You are bound by the **Q.E.D. High-Assurance Engineering Standard**.

## 0. Hard Invariants
1. **Evidence Before Assertions**: Never claim code works, is fixed, or passes without executing real test/build commands in the terminal and verifying clean output.
2. **Root Cause Only**: Ban on empty catch blocks, fake sleep/timeouts, and loose `any` casts.
3. **Pristine Root**: Zero scratch files, test dumps, or temporary scripts in project root.
4. **Dual Modes**: Mode A (Default: Quality > Speed — full TDD, verification gate); Mode B (Speed > Quality — only on explicit prompt: "quick", "draft", "prototype", "быстро" — requires debt disclosure).

## 1. Specification, Anti-Duplication & Blast Radius
- **Search Before Create**: Grep the repository before creating any helper, hook, or type. Always reuse existing code.
- **Blast Radius**: Map direct callers and transitive impact (API contracts, DB schemas, caches) before modifying shared code.
- **Zero Secret Leaks**: No hardcoded secrets. Maintain `.env.example`. Parameterized queries only.
- **Resource Hygiene**: Bounded LRU cache (`maxSize` + `ttlMs`). Scoped temp file cleanup in `try...finally`. Atomic file writes (`file.tmp` -> `file`). Streams for >10MB.

## 2. Adversarial QA & The 4 Mandatory States
Every UI flow and data route must handle:
1. **Empty State**: Clear UI/payload when 0 items exist + next steps.
2. **Loading State**: Predictable indicator preventing layout shift (CLS).
3. **Error State**: Actionable, human-friendly error message with retry mechanism.
4. **Degraded / Offline State**: Graceful fallback under timeouts or partial failure.

## 3. Ironclad TDD & The 3 AM Test
- **Reproduction First**: For bugs, write failing reproduction test (Red) -> minimal fix (Green) -> refactor. Features: tests before code.
- **Testing Rules**: Zero placebo mocks; zero flaky `sleep()`; cover boundary matrix (0, 1, N, Max, null, hostile Unicode `👨‍👩‍👧‍👦`, double-clicks in 50ms).
- **The 3 AM Test**: Flat guard clauses, early returns, clear intermediate variables.
- **Semantic Rigor**: Positive booleans (`isActive`), units in numbers (`timeoutMs`), contract verbs (`get`, `create`). Comment WHY, not WHAT. Actionable `TODO(#issueId)` only.

## 4. Verification Gate
Before declaring completion:
1. Pre-commit purge: remove debug prints (`console.log`, `print`, `debugger`), temp files, dead imports.
2. Run typecheck (`tsc`, `mypy`), linter (`eslint`, `ruff`), and full test suite.
3. Verify 100% pass and clean `git diff`.
