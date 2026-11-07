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

## 5. Phase 3 — Anti-Slop & The "3 AM Test"

Protect the codebase from cognitive overload and generative bloat:

1. **The "3 AM Test"**:
   - Code must be instantly comprehensible by an exhausted engineer debugging an incident at 3:00 AM.
   - **Early Returns**: Favor guard clauses and early returns over deeply nested `if/else` ladders.
   - **Cognitive Clarity**: Prefer descriptive intermediate variables over opaque 6-level chained functional one-liners.
   - **Zero "Clever" Acrobatics**: Avoid obscure bitwise tricks or impenetrable regexes without explanatory comments and concrete examples.
2. **Eradicate AI Slop**:
   - No gratuitous wrappers, fake helper classes, or 5-layer deep factory patterns where a simple 5-line function suffices.
   - In UI: eliminate cliché terminal aesthetics, monotonous 3x3 Bento grids, and decorative borders that provide zero user utility.

---

## 6. Phase 4 — Ironclad TDD & The Chaos Monkey Test

Execute changes using disciplined software craftsmanship:

1. **Test-Driven Development (Red-Green-Refactor)**:
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
2. **The "Chaos Monkey Test"**:
   - When writing automated tests for user flows or API inputs, include adversarial edge cases:
     * *Concurrency & Debouncing*: Rapid duplicate requests/clicks within 500ms.
     * *Payload Overload*: Oversized inputs, deeply nested JSON objects.
     * *Hostile Strings*: Complex Unicode (`👨‍👩‍👧‍👦`), RTL text, emoji combinations, raw SQL/HTML control characters.
     * *Interrupted State*: Simulating network drops or cancellations mid-flight.
3. **Workspace & Git Hygiene**:
   - Isolate risky refactors in dedicated branches or subagents.
   - Never leave unstaged junk, debug logs, or temporary files in the repository.

---

## 7. Phase 5 — Atomic Git Discipline & Conventional Commits

1. **Atomic Commits**:
   - Commit in small, logical, self-contained units (e.g., 1 passing TDD phase = 1 commit).
   - Never dump dozens of unrelated files into a single generic commit.
2. **Conventional Commits Standard**:
   - `feat:` for new user-facing functionality.
   - `fix:` for bug fixes.
   - `test:` for adding or correcting tests.
   - `refactor:` for code changes that neither fix a bug nor add a feature.
   - `docs:` for documentation and ADR additions.
   - `chore:` for dependency updates and build scripts.

---

## 8. Phase 6 — Verification & Completion Gate

Before reporting completion:

1. **Automated Verification**:
   - Run the type checker (`tsc`, `mypy`, `dart analyze`, etc.).
   - Run the linter (`eslint`, `ruff`, etc.).
   - Run the test suite (`npm test`, `pytest`, `cargo test`, etc.).
2. **Spec Reconciliation**:
   - Cross-check the final diff against the initial Acceptance Criteria from Phase 1.
   - Confirm all 4 states (Empty, Loading, Error, Success) and edge cases are safely handled.
3. **Clean Report**:
   - Summarize what was verified with real output/evidence, note any relevant architectural decisions, and outline how the user can test the change.
