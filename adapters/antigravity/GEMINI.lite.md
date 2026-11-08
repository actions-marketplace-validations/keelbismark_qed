# Q.E.D. Lite for Google Antigravity
# Drop as GEMINI.md or GEMINI.lite.md in repo root or ~/.gemini/

## Cognitive Priming & "QED" Trigger
- **Ambient Memory**: Permanently bound by Q.E.D. runtime. All invariants active on every turn regardless of casual prompting.
- **On Mention of "QED"**: Instant Mode A lock (cancel shortcuts), mandatory Pre-Flight check (Grep existing, Blast radius, Red test), and mandatory terminal verification (`qed check` / test suite) with real output.

## 0. Prime Directive: Evidence Before Assertions
- Never declare a task complete without executing verification tests and verifying clean output via tool commands.
- Root Cause Only: Zero empty catch blocks, zero arbitrary timeouts, zero loose `any` casts.
- Pristine Root Invariant: Zero scratch files or temporary dumps in root directory.
- Dual Modes: Mode A (Default: Quality > Speed — full TDD & verification); Mode B (Speed > Quality — only on explicit request: "quick", "prototype", "draft", "быстро" — requires debt disclosure).

## 1. Specification, Anti-Duplication & Blast Radius
- Search Before Create: Grep codebase before introducing any new helper, utility, or type. Always reuse existing abstractions.
- Blast Radius: Map direct callers and transitive API/DB/cache impact before modifying shared code.
- Zero Secret Leaks: Never hardcode credentials. Keep `.env.example` updated. Parameterized queries only.
- Resource Hygiene: Bounded LRU cache (`maxSize` + `ttlMs`). Scoped temp file deletion in `try...finally`. Atomic file writes (`file.tmp` -> `file`). Streams for >10MB.

## 2. Adversarial QA & The 4 Mandatory States
Every UI view and API route must implement:
1. Empty State (0 items + clear next step)
2. Loading State (predictable indicator, zero CLS)
3. Error State (actionable message + retry button)
4. Degraded / Offline State (graceful fallback under network timeout/partition)

## 3. Ironclad TDD & The 3 AM Test
- Bugs: Write reproduction test first -> verify Red -> minimal fix -> verify Green -> refactor.
- Features: Unit/integration tests reflecting acceptance criteria before code.
- Testing Rules: Zero placebo mocks; zero flaky `sleep()`; cover boundary matrix (0, 1, N, Max, null, hostile Unicode `👨‍👩‍👧‍👦`, double-clicks in 50ms).
- The 3 AM Test: Early returns, flat guard clauses, descriptive intermediate variables.
- Semantic Naming & Clean Comments: Positive booleans (`isActive`), units in numbers (`timeoutMs`), contract verbs (`get`, `create`). Comment WHY, never WHAT. Actionable `TODO(#issueId)` only.

## 4. Verification Gate
Before declaring completion:
1. Pre-commit sweep: purge debug prints (`console.log`, `print`, `debugger`), temp files, dead imports.
2. Run typecheck, linter, and full test suite.
3. Verify 100% pass and clean git diff matching acceptance criteria.
