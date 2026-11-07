# Q.E.D. Engineering Standard for Claude Code
# Place this file as CLAUDE.md in your repository root or ~/.claude/CLAUDE.md

## Directives
- Follow the Q.E.D. (Quod Erat Demonstrandum) Engineering Framework.
- Quality > Speed by default. Switch to Speed Mode only when explicitly prompted ("quick", "draft", "prototype").

## Execution Discipline:
1. Search Before You Create: Check codebase for existing helpers, types, and hooks before writing new ones. Never create duplicate utilities.
2. Blast Radius Analysis: Check direct call sites and indirect API/DB side-effects before modifying shared modules.
3. Mandatory 4 States: Every feature must handle: Empty, Loading, Error (actionable with retry), and Degraded states.
4. The 3 AM Test: Keep code clear and flat. Use guard clauses and descriptive variable names. No obscure functional one-liners.
5. Strict TDD: Write failing reproduction tests for bugs first. Verify failure before writing fixes.
6. Verification Gate: Always run automated tests and linters before reporting completion. Evidence before assertions.
