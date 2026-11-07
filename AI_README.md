# Q.E.D. Machine Directives (AI Agent Entrypoint)
*Token-optimized instruction set for autonomous coding agents.*

You are operating inside a repository governed by the **Q.E.D. (Quod Erat Demonstrandum)** High-Assurance Engineering Standard.

---

## 0. Hard Invariants (Zero Tolerance)
1. **Evidence Before Assertions**: Never state that code is functional, fixed, or passing without executing the tests in the terminal and verifying real stdout/stderr.
2. **Root Cause Only**: Do not mask defects with empty `catch` blocks, arbitrary `setTimeout`, or `any` casts.
3. **No Unsolicited Duplicates**: Grep the repository before creating any helper, hook, or type. Reuse existing utilities.
4. **Clean Commits**: Format commits with Conventional Commits (`feat:`, `fix:`, `test:`, `refactor:`) in atomic units.
5. **Data Fetching Invariants**: Mandatory `AbortSignal.timeout(ms)` on all network calls. Never cast responses with `as TargetType`—validate at runtime boundary. Ban on client waterfalls and unbounded queries. Safe retries with jitter (`Idempotency-Key` for POST). Scope queries by tenant.
6. **Visual Anti-Slop & Signature Spark**: The Archaeologist Invariant: preserve unique interactive mechanics while stripping card bloat (unboxed by default); ban Type 2 sterile brutalism; form follows data; zero emojis; 100% human-domain utility.
7. **Workflow Ergonomics**: State-in-URL for all view state; auto-save form drafts to storage; native `<a href>` for navigation; never block paste; 1-click copy with feedback; undo toasts over modal popups; validate on blur.
8. **Errors, Telemetry & DB Evolution**: Zero empty catches (enrich with `cause`); emit single-line JSON logs with traceId & PII redaction; use Expand/Contract for DB migrations (never drop columns in same deployment; `CREATE INDEX CONCURRENTLY`; `lock_timeout = '2s'`).

---

## 1. Operating Modes
- **Mode A (Default: Quality > Speed)**:
  * Full TDD: Write failing reproduction test first $\rightarrow$ verify Red $\rightarrow$ write minimal fix $\rightarrow$ verify Green $\rightarrow$ refactor.
  * Blast Radius: Check direct callers and indirect API/DB side-effects before editing shared code.
  * 4 States: Verify Empty, Loading, Error (actionable with retry), and Degraded states.
  * Verification Gate: Run typechecker (`tsc`, `mypy`), linter, and full test suite before completion.
- **Mode B (On-Demand: Speed > Quality)**:
  * Trigger: Words like "quick", "prototype", "draft", "быстро", "набросок".
  * Action: Deliver minimal working proof-of-concept rapidly. Explicitly list all shortcuts taken and technical debt created.

---

## 2. Code Ergonomics (The 3 AM Test)
- Use guard clauses and early returns. Flatten all nested `if/else` logic.
- Name intermediate variables. Do not write 5-level chained functional one-liners.
- Add concrete `input -> output` doc comments for non-obvious algorithms.

---

## 3. Security
- Never write credentials, tokens, or private keys to source code or git history.
- When adding an environment variable, immediately update `.env.example` with dummy values.

---

## 4. Q.E.D. Lite Edition
For compact token-constrained prompt injection (<500 tokens), refer directly to [QED.lite.md](QED.lite.md) or [CONSTITUTION.lite.md](core/CONSTITUTION.lite.md).
