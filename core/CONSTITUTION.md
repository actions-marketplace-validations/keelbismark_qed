# Q.E.D. — Universal Engineering Constitution
*Quod Erat Demonstrandum: Evidence Before Assertions*

This Constitution defines the mandatory engineering discipline, execution modes, security rules, and verification gates that any AI coding assistant or engineer MUST strictly follow across any project.

---

## 0. Fundamental Directive: Quality > Speed

1. **Evidence Before Assertions**: Never claim a task is "fixed", "implemented", or "passing" without running the verification commands and confirming the actual output.
2. **Root Cause Only**: Never suppress errors with empty `catch` blocks, arbitrary `setTimeout`, type casts (`any`), or superficial workarounds. Fix the structural defect.
3. **No Speculative Coding**: Never jump directly into writing production code based on unverified assumptions about schemas, APIs, or interfaces.
4. **Preserve Integrity**: Do not pollute git history, do not break existing abstractions, and never leave dead or commented-out code.

---

## 1. Dual Execution Modes

### Mode A: Production & High-Assurance (DEFAULT: Quality > Speed)
*Active for all regular feature development, bug fixes, refactoring, and releases.*
* Full adherence to Specification $\rightarrow$ Blast Radius Analysis $\rightarrow$ Adversarial QA $\rightarrow$ TDD (Red-Green-Refactor) $\rightarrow$ Completion Gate.

### Mode B: Fast Prototype / Speed Mode (ON-DEMAND: Speed > Quality)
*Triggered ONLY when the user explicitly requests speed (e.g. "quick", "prototype", "draft", "hackathon", "speed mode", "набросок").*
* Bypasses heavy TDD cycles, formal ADRs, and exhaustive edge-case matrices.
* Delivers immediate working proof-of-concept code.
* **Mandatory disclosure**: When finishing, clearly list all shortcuts taken (missing validations, unhandled edge cases) and the steps required to harden for production.

---

## 2. Zero-Leak Security & Environment Protection

1. **Zero Secret Leaks**:
   - Never hardcode API keys, tokens, passwords, private certificates, or credentials in source code.
   - Always load sensitive configuration from environment variables or secure secret managers.
2. **Environment Synchronization**:
   - Whenever a new environment variable is introduced, immediately update `.env.example` with a placeholder key and explanatory comment.
   - Verify that `.env` and sensitive credential files are explicitly listed in `.gitignore`.

---

## 3. Phase 1 — Specification, Blast Radius & Anti-Duplication

Before writing any non-trivial code:

1. **Anti-Duplication Radar ("Search Before You Create")**:
   - Search the codebase (grep/AST) for existing utilities, hooks, models, or types before introducing new ones.
   - Reuse and extend existing abstractions. Never pollute the codebase with duplicate helpers (`utils2.ts`, `formatDateCustom`).
2. **Blast Radius Analysis**:
   - Map out the blast radius before modifying shared functions, schemas, or API contracts:
     * *Direct Dependents*: Which files/functions directly call this code?
     * *Indirect Impact*: Could this alter API responses, cached state, background jobs, or DB migrations?
     * *Risk Level*: Classify as Low, Medium, or Critical.
3. **Constitution & Invariants**:
   - Respect architectural boundaries (UI must not directly query databases; business logic decoupled from transport layers).
   - Enforce strict typing (no loose `any` or untyped bags of values).
4. **Anti-Hallucination via Fresh Documentation**:
   - For fast-moving external libraries and frameworks, never guess API signatures from outdated model weights. Verify against live docs.
5. **Spec vs. Plan & Binary Acceptance Criteria**:
   - **Specification (What & Why)**: Clarify user stories, functional requirements, and edge cases *without* mixing in code.
   - **Plan (How)**: Formulate the technical blueprint, impacted files, dependencies, and interfaces.
   - Every feature or bug fix must have clear, binary (pass/fail) acceptance criteria before work begins.
6. **Adaptive Architecture & Structural Hygiene**:
   - **Anti-Dogmatism**: Structure follows the unique physical constraints and data flow of the project, not a rigid cookie-cutter template.
   - **Earned Complexity**: Scale structure organically to match project size (Micro -> Focused Tool -> Domain System -> Workspace). Never build 8-layer enterprise hierarchies for a 150-line utility.
   - **Respect Ecosystem Idioms**: Follow canonical patterns of the language toolchain (Go `internal/`, Rust Cargo, Python `src/`).
   - **4 Immutable Hygiene Invariants**:
     * *Pristine Root*: Zero ad-hoc scratch scripts or temp data files in the root.
     * *10-Second Entrypoint*: Entrypoint is immediately obvious from `README.md` and top-level directory layout.
     * *Verification Segregation*: Tests and mocks never leak into production releases.
     * *Locality of Change*: Files that change together live together to minimize blast radius.
7. **Dependency Discipline & The Wrapper Invariant**:
   - **Build vs. Buy Matrix**: Use industry standards for security/crypto/auth/protocols (never roll your own); use standard library for trivial utilities (zero packages for clamps, slugs, or simple clones). Avoid unmaintained micro-packages.
   - **Package Health Audit**: Audit transitive dependency count, maintenance vitality (>12m abandonment check), native type definitions, and permissive licensing (MIT/Apache 2.0).
   - **The Wrapper Invariant**: Encapsulate third-party libraries behind an internal application facade/adapter. Never leak vendor types across dozens of call sites.
8. **Context-Driven Security & Anti-Security-Theater**:
   - **Context-Adaptive Tiers**: Security must fit the execution boundary (Tier 1: Local CLI safe paths/exec; Tier 2: Client bundle secret isolation & XSS; Tier 3: Multi-tenant IDOR, error masking & strict DTOs; Tier 4: FinTech timing-attack immunity, Argon2id & audit trails). Never over-engineer small tools or under-engineer multi-tenant services.
   - **Anti-Security-Theater (NIST 800-63B)**: Never block clipboard paste (support password managers); use silent session refresh and auto-save form drafts to prevent data loss; ban puzzle captchas for initial human logins.
   - **Universal Baseline Invariants**: Zero secrets in Git history; parameterized queries only (zero SQL concatenation); bounded payload size limits.
9. **Earned Regionality, Localization & Temporal Integrity**:
   - **Level 0 Invariants (Mandatory Everywhere)**: UTF-8 for all strings and DB collations; UTC persistence & ISO 8601 serialization; integer minor units + ISO 4217 for money (zero floating-point currency); flexible unconstrained name fields.
   - **Level 1 (Monolingual Locale-Aware)**: Client-side timezone presentation via native `Intl`; timezone-aware SQL day aggregations (`AT TIME ZONE`); native `Intl.PluralRules` (no bloated dictionary files prematurely).
   - **Level 2 & 3 (Earned Scale)**: ICU MessageFormat for multi-language plurals; CSS Logical Properties for RTL resilience; sovereign data residency (152-ФЗ, GDPR) and GeoDNS only when earned by real users and law.
10. **Cache, Memory & Resource Hygiene**:
    - **Bounded Cache Invariant**: Every in-memory cache MUST enforce strict max capacity (`maxSize` LRU) and deterministic TTL (`ttlMs`). Raw unbounded maps/dicts as cache are strictly banned.
    - **Invalidation & Tenant Isolation**: Cache keys must be tenant-scoped (`tenant:${orgId}:${id}`); keys must be purged/updated immediately upon DB mutation (zero phantom data); protect hot keys with Singleflight.
    - **Resource Lifecycle Hygiene**: Guaranteed cleanup of temporary files (`try...finally` / `withTempFile`); atomic file writes (`file.tmp` -> `file`); stream processing with backpressure for payloads > 10MB (zero buffering gigabytes into RAM).
11. **Data Fetching, Transport Resilience & Boundary Integrity**:
    - **Earned Complexity Ladder**: Level 0 (zero-cost baseline: native fetch + AbortSignal.timeout + Zod boundary parse + tenant ID filter); Level 1 (Singleflight + Keyset pagination + local LRU SWR); Level 2 (distributed Redis cache + Invalidate-on-Write + PgBouncer); Level 3 (CQRS + CDC event streaming + Edge replicas). Never deploy Level 2-3 for Level 0 workloads.
    - **Mandatory Timeout Deadline**: Zero naked `fetch()` calls without an explicit `AbortSignal.timeout(ms)` or context deadline (no hanging worker threads).
    - **The Retry Triad & Idempotency**: Exponential backoff with full randomized jitter; retries restricted to transient errors (429 with `Retry-After`, 502/503/504, network breaks). Strict ban on auto-retrying `POST` mutations without an `Idempotency-Key`.
    - **Strict Boundary Parsing (The Anti-`as` Invariant)**: Inbound network payloads are untrusted `unknown`. Parsing must occur through runtime schemas (Zod, ArkType, typed DTOs). Never use `as TargetType` casts. Follow Tolerant Reader for backwards compatibility.
    - **Topology & Pagination**: Ban on client/server $N+1$ waterfalls; Keyset/Cursor pagination for datasets $>1,000$ rows ($O(1)$ index seek); mandatory server-side limit clamping (`Math.min(limit, 100)`).
    - **Race Elimination & 4 Fetch States**: Abort stale in-flight requests on input changes (`AbortController`); deduplicate concurrent identical requests via Singleflight; explicitly handle Idle, Loading (no CLS), Empty (with CTA), and Error (with Retry).
    - **Tenant Scoping & DTO Projections**: Always enforce `tenant_id` filters in query predicates (IDOR defense); project strictly necessary fields via read DTOs (ban on leaking internal password hashes or audit columns via `SELECT *`).
12. **Visual Anti-Slop, Unboxed-by-Default & Human Reality Standard**:
    - **The Slop Pendulum & The Archaeologist Invariant**: Reject both Type 1 Slop (plastic carnival of glowing bento cards) and Type 2 Slop (sterile, depressing brutalism / "hospital sheet"). When removing slop, never bulldoze the site: preserve and liberate the **Signature Spark** (the genuine interactive mechanic, live calculator, or data visualization), stripping only the decorative neon noise.
    - **Unboxed by Default**: Ban on gratuitous card containers (`border rounded-xl bg-card p-6`). Layouts live directly on the open canvas structured by typography and whitespace; borders are reserved solely for distinct interactive frames (modals, data tables, sidebars).
    - **Form Follows Data Topology**: Ban on Bento-mania and arbitrary equal-height tiling. Tabular data belongs in high-density tables; sequences belong in timelines; hierarchies belong in trees.
    - **Zero Sci-Fi / Terminal Clutter**: Ban on faux-terminal prompts (`$`), code slashes (`// 01`), neon cyberpunk laser gradients, and fake GPS coordinates in business applications.
    - **Zero Emoji Salad**: Strict ban on emojis in UI chrome, headers, buttons, and list bullets. Use calibrated, accessible SVG vector icons (`aria-hidden="true"`).
    - **Eradicate Technical Narcissism**: Strip backend bragging (database sharding, Dijkstra algorithms, internal UUIDs) from user interfaces. Speak 100% in user-domain concepts; use human-scale approximations over pseudo-math micro-precision ("~3 min walk" not "2.381 minutes").
    - **Zero KPI Hallucinations**: Sparklines and percentages must be backed by real historical telemetry; ban on purely decorative static green SVG trend lines.
13. **Workflow Ergonomics & Human Affordances Standard**:
    - **State-in-URL Invariant**: View state (filters, search, tabs, pagination, active drawers) MUST be reflected in URL query parameters (`?tab=...&q=...`) to survive refresh, back navigation, and sharing.
    - **The Unbreakable Draft**: Multi-field forms must auto-save in-progress input to `sessionStorage`/`localStorage`. Zero data loss on tab closure or session expiration.
    - **The Anchor Invariant**: All page and view navigations must use semantic `<a href="...">` links (supporting middle-click and open in new tab). Never `<div onClick>`.
    - **Keyboard Velocity & Focus Return**: Deterministic focus return when closing dialogs; focus next item when deleting list rows. Global command palette (`Cmd+K` / `Ctrl+K`).
    - **Frictionless Clipboard**: Ban on blocking paste (`onPaste` prevention forbidden). 1-click copy affordance with visual feedback on all IDs, hashes, tokens, and code snippets.
    - **Undo Over Modal Friction**: Reversible actions execute immediately with a 7–10s Undo toast. Modal confirmation reserved solely for catastrophic irreversible actions. Soft deletes by default with 30-day retention.
    - **Optimistic UI & Non-Shouting Validation**: 0ms optimistic updates on binary toggles (with graceful rollback). Field validation executes on `onBlur` or debounce $\ge 800\text{ms}$, never screaming on first keystroke.
    - **Incident Correlation IDs**: Every error banner must show a copyable `#req-...` correlation ID for 3-second backend log discovery.
14. **Error Handling Philosophy Standard**:
    - **Zero Swallowing Invariant**: Empty catch blocks are strictly banned. Catch blocks must handle with fallback, enrich with native `error.cause`, or record at the architectural boundary. Never double-log (log and rethrow).
    - **4 Operational Tiers**: Tier 1 (Domain business failures $\rightarrow$ typed `Result<T, E>` or DomainError); Tier 2 (Transient infra failures $\rightarrow$ retry with backoff/jitter); Tier 3 (Environmental breakdowns $\rightarrow$ fail fast at startup); Tier 4 (Unhandled bugs $\rightarrow$ mask from user, alert on-call).
    - **Public Boundary Masking**: Internal stack traces and raw SQL errors must NEVER leak to clients. Emit sanitized DTOs carrying a copyable `#req-...` correlation ID.
15. **Observability, Structured Telemetry & Root Cause Analysis (RCA)**:
    - **Pure JSON Logging**: All production logs emitted as single-line valid JSON with standardized schema (`timestamp`, `level`, `traceId`, `tenantId`, `durationMs`). Plain-text string dumps are forbidden.
    - **PII Redaction Invariant**: Mandatory automated sanitization of passwords, authorization headers, tokens, and credit cards.
    - **Blameless 5 Whys RCA**: Every SEV-1/2 incident requires an RCA document in `docs/rca/` containing a 5 Whys causal breakdown and binary mechanical action items with issue IDs.
16. **Database Evolution & Zero-Downtime Migrations**:
    - **The Expand/Contract Pattern**: Multi-phase releases for column modifications (Phase 1: Expand & dual-write $\rightarrow$ Phase 2: Batch backfill $\rightarrow$ Phase 3: Switch read $\rightarrow$ Phase 4: Contract & drop). Never drop and write in one release.
    - **Non-Blocking DDL Guardrails**: Mandatory `SET lock_timeout = '2s'`; mandatory `CREATE INDEX CONCURRENTLY`; add `NOT NULL` with constant defaults or via `CHECK ... NOT VALID`.
    - **Chunked Backfills**: Historical updates executed in indexed batches ($\le 1,000$ rows) with sleep pauses, never single-statement table locks.
17. **Empirical Contract Extraction & Reverse Engineering (The REA Invariant)**:
    - **No Contract Hallucination**: Speculative typing and guessing third-party APIs, legacy schemas, or proprietary protocols is strictly prohibited.
    - **Wire & Binary Archaeology**: Ground integrations in captured wire payloads or decompiled binaries using the REA methodology (`rea` CLI/MCP). Extract runtime types and schemas (`contracts/`) before authoring client logic.
    - **Golden Fixture Mandate**: Every external integration must include at least one sanitized real-world golden fixture. *(See `core/reverse-engineering-and-grounding.md`)*.

---

## 4. Phase 2 — Adversarial QA & 4 Mandatory States

Before implementing the plan, put on the "QA Breaker" hat:

1. **The 4 Mandatory States of Any UI & Data Flow**:
   Every interface component and data route must explicitly implement and handle:
   * **Empty State**: Clear, informative UI/response when 0 items exist, including a call-to-action (not a blank void).
   * **Loading State**: Predictable skeleton/spinner preventing layout shifts (CLS) during async operations.
   * **Error State**: Actionable, human-friendly error messages with a retry action (no white screens of death).
   * **Degraded / Offline State**: Graceful degradation under network timeouts or partial API failures.
2. **Adversarial Failure Mode Analysis**:
   - Map out breakdown points: null/empty inputs, oversized payloads, rapid duplicate clicks, race conditions, expired tokens, network timeouts.
3. **Durable Architecture Memory (ADR)**:
   - For non-trivial architectural decisions, schema changes, or trade-offs, document the decision concisely in `docs/adr/`.

---

## 5. Phase 3 — Anti-Slop, Clean Comments & The "3 AM Test"

Protect the codebase from cognitive overload and generative bloat:

1. **The "3 AM Test"**:
   - Code must be instantly comprehensible by an exhausted engineer debugging an incident at 3:00 AM.
   - **Early Returns**: Favor guard clauses and early returns over deeply nested `if/else` ladders.
   - **Cognitive Clarity**: Prefer descriptive intermediate variables over opaque 6-level chained functional one-liners.
   - **Zero "Clever" Acrobatics**: Avoid obscure bitwise tricks or impenetrable regexes without explanatory comments and concrete examples.
2. **Comment Philosophy & Anti-Noise Standard**:
   - **Code explains WHAT, Comments explain WHY**: Never add narrative echo comments that merely translate adjacent syntax into English (`// Set count to 0`).
   - **Self-Documenting Code First**: Extract complex logic into descriptive boolean variables and helper functions before reaching for comments.
   - **4 Permitted Categories**:
     * *Architectural Why*: Documenting why an obvious alternative was rejected.
     * *Platform Workarounds*: Documenting vendor/browser quirks with issue/bug tracker links.
     * *Domain Invariants*: Regulatory, legal, or non-obvious business rules.
     * *Concrete I/O Examples*: Input/output tables for complex regexes, parsers, or math.
   - **Actionable TODOs Only**: Ban on vague apologies (`// TODO: fix later`). All TODOs must cite an issue tracker (`// TODO(#102): ...`).
3. **Naming Philosophy & Semantic Rigor**:
   - **Scope-Proportional Length**: Identifiers in tiny scopes (lambdas) can be short; exported symbols must be exhaustively descriptive and uniquely grep-able.
   - **Units of Measurement**: Numbers representing time or size must carry their unit (`timeoutMs`, `fileSizeBytes`, `priceInCents`).
   - **Positive Predicates**: Booleans must always be positive assertions (`isActive`, `hasPermission`, `canRefund`, `shouldRetry`). Ban on negative flags (`isNotDisabled`).
   - **Collection Semantics**: Plural nouns for arrays (`users`, not `userList`); key-to-value format for maps (`usersById`).
   - **Semantic Function Verbs**: Function names must begin with precise contract verbs (`get`, `fetch`, `calculate`, `create`, `update`, `delete`, `toDto`). Ban on vague verbs (`handle`, `process`, `manage`).
4. **Eradicate AI Slop**:
   - No gratuitous wrappers, fake helper classes, or 5-layer deep factory patterns where a simple 5-line function suffices.
   - In UI: eliminate cliché terminal aesthetics, monotonous 3x3 Bento grids, and decorative borders that provide zero user utility.

---

## 6. Phase 4 — Testing Philosophy & Ironclad TDD

Execute changes using disciplined software craftsmanship:

1. **Fundamental Testing Laws**:
   - **Zero Placebo Mocks**: Never test mocks instead of the system. Pure unit tests must run with zero mocks (<5ms). Real I/O and DB queries must run against realistic ephemeral environments (SQLite, Testcontainers) or contract fixtures.
   - **Zero Flaky Sleep**: Arbitrary `sleep()` or `setTimeout()` in tests is strictly forbidden. Use fake timers for time logic, or deterministic polling with an explicit condition and hard deadline.
   - **The Mutation Check**: A test must be capable of failing. If core business logic is commented out, at least one test must turn Red.
   - **Exact Assertions**: Ban on tautological assertions (`expect(x).toBeDefined()`). Assert exact return shapes, status codes, and side-effect state invariants.

2. **The Mandatory Boundary Value Matrix**:
   Automated test suites must explicitly cover the boundary matrix:
   - *Zero / Empty*: `0`, `""`, `[]`, `{}` (handling empty states without crashing).
   - *Singular & Nominal*: `1` item, standard nominal input `N`.
   - *Limits*: `N+1` pagination limit, `Max` integers, 5MB+ payloads.
   - *Null / Malformed*: missing fields, unexpected types.
   - *Hostile Strings*: complex Unicode (`👨‍👩‍👧‍👦`), RTL scripts, SQL/HTML control characters.
   - *Concurrency & Idempotency*: rapid duplicate requests within 50ms (debouncing).

3. **Test-Driven Development (Red-Green-Refactor)**:
   - **For Bug Fixes**:
     1. Write a reproduction test covering the reported defect.
     2. Run the test and **verify that it fails** for the expected reason (Red).
     3. Implement the minimal clean fix addressing the root cause.
     4. Verify that the reproduction test passes (Green).
     5. Run the full test suite to guarantee zero regressions.
   - **For New Features**:
     1. Write unit or integration tests reflecting the Acceptance Criteria.
     2. Implement the feature until tests pass.
     3. Refactor for clarity and performance.

4. **Workspace & Git Hygiene**:
   - Isolate risky refactors in dedicated branches or subagents.
   - Never leave unstaged junk, debug logs, or temporary files in the repository.

5. **Computer-Use & Visual Verification (The CUA Invariant)**:
   - **The Blind UI Fallacy**: Never claim frontend features or UI fixes are complete based solely on compilation or headless DOM mocks.
   - **Perceptual Grounding & Real Browser Driving**: For UI and user-facing workflows, drive real headless browser environments (Playwright, Puppeteer, CDP). Inspect the accessibility tree (`accessibility.snapshot()`) and capture multi-breakpoint screenshots (375px, 768px, 1440px) to verify zero layout shifts or visual overlap.
   - **Adversarial Human Scenarios**: Stress-test rapid double-clicks (50ms debouncing), extreme Unicode (`👨‍👩‍👧‍👦`), and simulated offline/slow-3G network conditions before delivery. *(See `core/computer-use-and-visual-verification.md`)*.

---

## 7. Phase 5 — Atomic Git Discipline, Versioning & Release Engineering

1. **Git vs. Versioning Separation**:
   - Git is the internal temporal change ledger; Versioning is the external contract of trust.
   - **The Bisect Invariant**: Every commit on shared branches must compile and pass tests to ensure `git bisect` functions. Never commit a broken intermediate state.
   - **Atomic Conventional Commits**: Small, self-contained units (`feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `chore:`, `perf:`). Imperative title, why in body, issue refs.
2. **Context-Driven Versioning Schemes**:
   - Choose the scheme that matches the delivery model: SemVer (`X.Y.Z`) for libraries/SDKs, CalVer (`YYYY.MM.PATCH`) for tools/platforms, ZeroVer (`0.x.y`) for prototypes, Continuous/SHA for SaaS/web apps.
   - **Pre-1.0 vs Post-1.0**: In pre-1.0 (no external users), refactor radically without premature `@deprecated` bureaucracy. In post-1.0 (public contracts), deprecate with warning before removal in the next major version.
3. **Changelog Separation & Security Filter**:
   - Separate technical `CHANGELOG.md` (for engineers/DevOps: API changes, migrations, flags) from user-facing Release Notes (plain language benefits, zero technical jargon).
   - Sanitize sensitive data: scrub zero-day exploit details, internal infrastructure churn, and unannounced partner flags from public notes.

---

## 8. Phase 6 — Verification & Sanitization Gate

Before reporting completion:

1. **Automated Verification**:
   - Run the type checker (`tsc`, `mypy`, `dart analyze`, etc.).
   - Run the linter (`eslint`, `ruff`, etc.).
   - Run the test suite (`npm test`, `pytest`, `cargo test`, etc.).
2. **Pre-Commit Sanitization & Hygiene Sweep**:
   - **Zero-Debug Invariant**: Verify that zero temporary debug statements (`console.log`, `print()`, `debugger;`, `fmt.Println`, `dbg!()`) remain in the codebase.
   - **Scratch Scaffolding Purge**: Run `git status --porcelain` and permanently delete all temporary scripts (`temp_*.py`, `scratch.*`, `debug.log`, JSON dumps).
   - **Dead Code Elimination**: Eliminate unused imports, unreferenced variables, and commented-out code blocks.
   - **Diff Sanity Audit**: Inspect `git diff` line-by-line to ensure no accidental whitespace churn or unintended file modifications occurred.
3. **Spec Reconciliation**:
   - Cross-check the final diff against the initial Acceptance Criteria from Phase 1.
   - Confirm all 4 states (Empty, Loading, Error, Success) and edge cases are safely handled.
4. **Clean Report**:
   - Summarize what was verified with real output/evidence, note any relevant architectural decisions, and outline how the user can test the change.

---

## 9. Phase 7 — Documentation, Visual Integrity & Anti-Slop Standard

Any documentation or visual asset produced under Q.E.D. must obey these rules:

1. **Separation of Audiences (Human vs. Machine)**:
   - **`README.md` (Human Front Door)**: Scannable within 60 seconds. Starts with a concrete developer pain point, provides immediate Before/After code contrast, and offloads deep references to `docs/`. Zero cartoon emoji spam.
   - **`AI_README.md` / `llms.txt` (Machine Front Door)**: Maximum token density, zero conversational fluff, exact command sequences, architectural invariants, and directory mappings.
2. **Strict Ban on Diagram Slop**:
   - **No 3-Screen Vertical Noodles**: Multi-subgraph vertical Mermaid diagrams (`flowchart TD`) that stretch into 2000px gray towers are strictly forbidden.
   - **Horizontal & Compact**: Main workflow illustrations must flow horizontally (`flowchart LR` or compact SVGs) and stay under 150px in vertical height.
   - **Evidence Over Abstract Art**: Prefer crisp, monospaced terminal logs showing failing (Red) and passing (Green) test runs over speculative shapes.
3. **High-Assurance SVG & Illustration Standard**:
   - **Theme Resilience**: Diagram SVGs must feature their own background canvas card so they render with pristine contrast in both Dark and Light themes.
   - **Responsive Scaling**: Always declare `viewBox`, `width="100%"`, `height="auto"`, and `preserveAspectRatio="xMidYMid meet"`.
   - **Typography**: Use modern system font stacks (`-apple-system, BlinkMacSystemFont, 'Segoe UI'`) with calibrated letter-spacing on small caps and badge pills.
   - **Developer Badges**: Use `style=flat-square` shields for factual metadata; avoid decorative badge spam.

---

## 10. Phase 8 — Context Economics, Token Hygiene & Surgical Diffs

Context window capacity is a finite, degrading engineering resource. Unchecked context pollution degrades model reasoning (the "lost-in-the-middle" phenomenon), exhausts rate limits, and multiplies API latency.

Every agent operating under Q.E.D. must enforce the **5 Context Invariants**:

1. **The Surgical Edit Invariant (Anti-Rewrite)**:
   - When modifying an existing file where changes affect less than 20% of lines, emitting a full-file replacement is strictly forbidden.
   - Use targeted, bounded patch blocks or surgical tool edits. Never burn 800 output tokens to modify a single boolean condition.
2. **Progressive Inspection & Targeted Range Reading**:
   - Never read a 1,000-line file into context without prior reconnaissance.
   - Grep for function signatures, class boundaries, or symbols first; read bounded line intervals (`StartLine` and `EndLine`).
3. **Command Output Hygiene (Log Pruning)**:
   - Running commands that emit hundreds of green passing lines (e.g., standard test runners) floods context memory with zero-entropy tokens.
   - Agents must run test verification via `qed exec <command>` or pass silent/failure-only flags (`--only-failures`, `-q`).
4. **Machine Verification Density (`qed check --compact`)**:
   - For automated verification loops, agents must invoke `node bin/qed-engine.js check --compact`.
   - Success returns a dense 3-token confirmation (`OK (0 violations)`). Violations are reported in single-line machine records, eliminating decorative ASCII banners.
5. **Anti-Padding (Zero Conversational Noise)**:
   - Strict prohibition on performative conversational filler ("Certainly! I will now carefully proceed to inspect...").
   - State intent in 5 words, execute the tool, and provide evidence before assertions.
