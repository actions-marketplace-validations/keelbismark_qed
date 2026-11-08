# Q.E.D. Lite — Universal Engineering Standard (Token-Optimized)
*Evidence Before Assertions. Zero Fluff. Maximum Assurance.*

This specification defines the non-negotiable engineering invariants for AI coding agents operating in token-constrained contexts (e.g., Claude 3.5 Haiku, Gemini Flash, GPT-4o-mini, local LLMs).

---

## 0. Hard Invariants (Zero Tolerance)
1. **Evidence Before Assertions**: Never claim code is functional, fixed, or passing without executing tests/build commands in the terminal and verifying real stdout/stderr.
2. **Root Cause Only**: Ban on empty catch blocks, fake sleep/timeouts, and loose `any` casts. Fix structural defects directly.
3. **Pristine Root Invariant**: Zero scratch files, test dumps, or temporary scripts in the root directory.
4. **Dual Execution Modes**:
   - **Mode A (Default: Quality > Speed)**: Full TDD, Blast Radius analysis, 4 Mandatory States, Verification Gate.
   - **Mode B (On-Demand: Speed > Quality)**: Active only when user explicitly asks ("быстро", "quick", "draft", "prototype"). Delivers fast POC with an explicit report detailing all shortcuts taken and technical debt created.
5. **The Leash Invariant (Subagents)**: Subagents are bounded leaf workers, never autonomous architects. The parent agent bears 100% liability. Hard churn budget ($\le 100$ lines); zero unilateral architecture changes; zero latency/memory regressions. Overreaching subagent output must be rolled back immediately.

---

## 1. Specification, Anti-Duplication & Blast Radius
- **Search Before You Create (Anti-Duplication)**: Grep the repository before introducing any new helper, utility, hook, or type. Always reuse or extend existing abstractions. Never create duplicate helpers (`utils2.ts`, `customFormatDate`).
- **Blast Radius Analysis**: Before modifying shared code or schemas, map direct callers and transitive impact (API contracts, database migrations, background jobs, cached state).
- **Threat-Adaptive Security**: Zero hardcoded secrets/tokens in code or git. Keep `.env.example` synchronized. Use parameterized queries only. Adhere to least privilege.
- **Reverse Engineering Invariant (REA)**: Zero contract hallucination. Decompile bundles, trace wire frames, and extract schemas via REA tools before integrating external APIs.
- **Resource & Cache Hygiene**: All caches must be bounded LRUs (`maxSize` + `ttlMs`) with tenant-isolated keys. Temp files must be cleaned in `try...finally`. Use atomic file writes (`file.tmp` -> `file`). Stream payloads > 10MB.
- **Data Fetching Invariants**: Mandatory `AbortSignal.timeout(ms)` on all network calls. Ban on `as TargetType` casts (validate at boundary). Ban on client waterfalls and unbounded queries (Keyset pagination for >1k rows). Retry only idempotent requests with jitter (`Idempotency-Key` for POST). Scope all queries by tenant (IDOR defense).

---

## 2. Adversarial QA & The 4 Mandatory States
Every UI flow and data endpoint must explicitly handle all 4 states:
1. **Empty State**: Clear UI/payload when 0 items exist, with actionable next steps.
2. **Loading State**: Predictable indicator preventing Cumulative Layout Shift (CLS).
3. **Error State**: Actionable, human-friendly error message with a retry mechanism.
4. **Degraded / Offline State**: Graceful fallback under timeouts or partial outages.

- **Visual Anti-Slop & Signature Spark**: The Archaeologist Invariant: when purging slop, preserve the unique interactive spark/mechanic while stripping card boxes (unboxed by default); ban Type 2 sterile brutalism; zero Bento/3x3 monotony; zero emojis; zero fake terminal prompts; 100% human-domain utility.
- **Workflow Ergonomics**: State-in-URL for all filters/tabs; auto-save form drafts; semantic links (`<a>`) for navigation (never `<div onClick>`); never block paste; 1-click copy with feedback; undo toasts over modal popups; validate on blur.
- **Errors, Logs & DB Evolution**: Zero empty catches (chain `cause`); structured JSON logs with traceId & PII scrub; Expand/Contract for DB migrations (never drop columns in same release; `CREATE INDEX CONCURRENTLY`; `lock_timeout = '2s'`).

---

## 3. Ironclad TDD & The 3 AM Test
- **Reproduction First (Red -> Green -> Refactor)**:
  - For bug fixes: Author a failing reproduction test -> verify Red -> implement minimal fix -> verify Green -> run regression suite.
  - For features: Write acceptance tests reflecting criteria before writing implementation code.
- **Testing Rules**:
  - Zero placebo mocks: Unit tests must test real logic (<5ms); I/O tests use ephemeral instances.
  - Zero flaky sleep: Ban on arbitrary `sleep()`; use fake timers or condition polling with deadlines.
  - Mutation check: Tests must be capable of failing if business logic is removed.
  - No-weakening invariant: Tests are presumed correct. Modifying tests requires documented proof of test defect (contract drift or flakiness); strictly forbidden from downgrading assertions (e.g. to `toBeDefined()`) to force a pass.
  - Cover the boundary matrix: 0 (empty), 1, N, Max, null/undefined, hostile Unicode (`👨‍👩‍👧‍👦`), rapid double-clicks (50ms).
- **Computer-Use & Visual Verification (CUA)**: Drive real headless browser instances (Playwright/CDP) for UI workflows. Ground testing in accessibility tree snapshots and multi-breakpoint screenshots (375px/768px/1440px). Never rely on blind JSX/HTML compilation.
- **The 3 AM Test (Readability)**:
  - Guard clauses and early returns; eliminate nested if/else pyramids.
  - Clear intermediate variables; avoid opaque 5-level chained functional one-liners.
  - Positive predicates (`isActive`), units in numbers (`timeoutMs`, `fileSizeBytes`), contract verbs (`get`, `create`).
  - Comment WHY, never WHAT. Ban syntax echo noise (`// set count to 0`). Actionable `TODO(#issueId)` only.

---

## 4. Verification Gate
Before declaring any task complete:
1. **Pre-Commit Sanitization**: Purge debug statements (`console.log`, `print`, `debugger`), delete scratch files (`git status` clean), eliminate dead imports.
2. **Automated Verification**: Run static typecheck (`tsc`, `mypy`), linter (`eslint`, `ruff`), and full automated test suite.
3. **Spec Reconciliation**: Confirm all acceptance criteria and 4 states are satisfied with zero regressions.

---

## 5. Context Economics & Token Hygiene
1. **Surgical Edits**: Targeted diffs only; never rewrite 400 lines to change a 2-line conditional (<20% churn = surgical edit).
2. **Progressive Inspection**: Grep function names or read line intervals (`StartLine`/`EndLine`); never dump entire 1,000L files into context.
3. **Log Pruning**: Run tests with `qed exec <command>` or `--only-failures`; collapse hundreds of green lines into a single status line.
4. **Machine Density**: Run `qed check --compact` for 3-token success (`OK`) and 1-line machine errors. Zero conversational filler. Evidence before assertions.
