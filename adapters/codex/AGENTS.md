# Q.E.D. Agent Instructions & Operational Standard
# Quod Erat Demonstrandum: Evidence Before Assertions

This repository enforces the **Q.E.D. High-Assurance Engineering Standard**.
All autonomous agents interacting with this project MUST adhere strictly to the rules below.

---

## Prime Directive

> **Evidence Before Assertions**
> Never assert that code is functional, fixed, or tested without running the actual commands in the workspace and verifying clean exit codes and error-free output.

---

## Invariant Rules for Autonomous Agents

1. **Quality Over Speed (Default Mode)**:
   - Always operate in production quality mode unless the user explicitly requested speed ("quick", "draft", "prototype", "набросок").
2. **Search Before You Create**:
   - Grep the codebase for existing helpers, types, and hooks before writing new code. Duplicate utilities are considered bugs.
3. **Dependency Discipline & The Wrapper Invariant**:
   - Battle-tested standards for crypto/auth/protocols (never DIY). Standard library for trivial helpers. Audit transitive dependencies and licenses. Wrap third-party libraries behind internal facades.
4. **Context-Driven Security & Anti-Security-Theater**:
   - Match security to runtime tier (Tier 1 CLI path/exec safety, Tier 2 web bundle/XSS, Tier 3 multi-tenant IDOR/error masking, Tier 4 FinTech timing/audit). Never block paste (support password managers); silent refresh & draft preservation; ban captive captchas on initial logins.
5. **Earned Regionality & Temporal Integrity**:
   - Level 0: UTF-8, UTC in DB/wire, integer minor units + ISO 4217 for money, flexible names. Scale to ICU dictionaries and sovereign multi-region DBs (152-ФЗ, GDPR) only when earned.
6. **Cache, Memory & Resource Hygiene**:
   - Bounded LRU cache (`maxSize`) and TTL (`ttlMs`); tenant-scoped cache keys; invalidate on DB mutation; guaranteed temp file deletion (`try...finally`); atomic file writes (`file.tmp` -> `file`); streams with backpressure for payloads > 10MB.
7. **Blast Radius Analysis**:
   - Determine all direct callers and downstream consumers before changing shared code, APIs, or database schemas.
8. **4 Mandatory States**:
   - Every user-facing view and data-fetching route must handle: Empty state, Loading state, Error state with retry, and Degraded state.
9. **The 3 AM Test**:
   - Structure code with clear guard clauses, early returns, and descriptive variables. No impenetrable one-line acrobatics.
10. **Reproduction Test First (TDD)**:
   - For bug fixes, write a failing reproduction test first. Confirm failure. Implement minimal fix. Confirm pass.
11. **Verification Gate**:
   - Run type checks, linters, and the full test suite before declaring completion.
