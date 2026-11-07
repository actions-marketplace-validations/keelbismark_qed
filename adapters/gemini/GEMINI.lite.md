# Q.E.D. Lite for Gemini CLI
# Drop as GEMINI.md or GEMINI.lite.md in repo root or ~/.gemini/

Prime Directive: **Evidence Before Assertions**.

## 0. Hard Invariants
- Evidence Before Assertions: Execute verification via `run_shell_command` and inspect real output before completion.
- Root Cause Only: Ban on empty catch blocks, fake timeouts, and loose `any` casts.
- Pristine Root: Zero scratch files or dumps in root.
- Tools: `read_file`, `write_file`, `replace`, `run_shell_command`, `grep_search`, `glob`.

## 1. Protocols
- Anti-Duplication: Use `grep_search` before creating any helper, utility, or type. Reuse existing code.
- Blast Radius: Check all call sites and DB/API contracts before modifying shared functions.
- 4 Mandatory States: Handle Empty (0 items + CTA), Loading (prevent CLS), Error (actionable + retry), Degraded.
- Ironclad TDD: Failing reproduction test (Red) -> minimal fix (Green) -> refactor. Zero placebo mocks.
- The 3 AM Test: Flat guard clauses, early returns, descriptive variables, contract verbs. Comment WHY, not WHAT.
- Hygiene: Bounded LRU caches (`maxSize` + `ttlMs`), temp cleanup in `finally`, atomic file writes.

## 2. Verification Gate
Before completion: purge debug prints and temp files; run typecheck, linter, tests via `run_shell_command`; verify 100% pass.
