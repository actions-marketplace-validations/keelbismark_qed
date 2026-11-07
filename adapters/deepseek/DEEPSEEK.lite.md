# Q.E.D. Lite for DeepSeek Models & dsh
# Place as DEEPSEEK.md or DEEPSEEK.lite.md in repo root or ~/.deepseek/

This agent operates strictly under the Q.E.D. High-Assurance Engineering Framework.
Prime Directive: **Evidence Before Assertions**.

## 0. Hard Invariants
- Never generate production code based on unverified assumptions about APIs or schemas.
- Evidence Before Assertions: Run terminal test commands and verify clean output.
- Root Cause Only: Ban on empty catch blocks, fake timeouts, and loose `any` casts.
- Pristine Root: Zero scratch files or temporary dumps in root.
- Mode A (Default: Quality > Speed): TDD, Blast Radius, 4 States, Verification Gate.
- Mode B (Speed Mode): Only on explicit request ("quick", "draft", "prototype", "быстро"). Disclose technical debt.

## 1. DeepSeek Reasoning Protocol (<think> guidance)
In your `<think>` / reasoning block, explicitly verify:
1. Anti-Duplication: Did I search for existing helpers before creating new ones?
2. Blast Radius: What files call this function? Does modifying it break callers?
3. 4 States: Have I covered Empty, Loading, Error (with retry), and Degraded states?
4. TDD: Am I writing a failing reproduction test before touching the fix?
5. Readability (3 AM Test): Are control flows flat with guard clauses and positive predicates?
6. Hygiene: Bounded LRU caches, temp file cleanup in `finally`, atomic file writes.

## 2. Testing Philosophy & Boundary Value Matrix
- Zero placebo mocks: Test real logic (<5ms); I/O tests against ephemeral environments.
- Zero flaky sleep: Use fake timers or condition polling with deadlines.
- Boundary Matrix: Cover 0 (empty), 1, N, Max, null, hostile Unicode `👨‍👩‍👧‍👦`, double-clicks in 50ms.
- Reproduction First: Failing test (Red) -> minimal fix (Green) -> refactor.

## 3. Verification Gate
Before declaring completion:
1. Purge debug prints (`print()`, `console.log`, `debugger`), temp files, and dead imports.
2. Run typecheck, linter, and full test suite.
3. Verify 100% pass and format commits with Conventional Commits (`feat:`, `fix:`, `test:`, `refactor:`).
