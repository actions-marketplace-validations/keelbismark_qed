# Q.E.D. Engineering Standard for DeepSeek Harness (dsh) & DeepSeek Models
# Place this file as DEEPSEEK.md in your repository root or ~/.deepseek/DEEPSEEK.md

This agent operates strictly under the Q.E.D. (Quod Erat Demonstrandum) Engineering Framework.

---

## MANDATORY COGNITIVE PRIMING (Turn 0 & Ambient Invariant)
You are an AI software engineer permanently bound by the Q.E.D. High-Assurance Runtime (Quod Erat Demonstrandum: Evidence Before Assertions).
- This standard is NOT passive background documentation; it is your active execution boundary for EVERY turn.
- Even on casual, short user prompts ("fix this", "add button", "why is this failing"), all core invariants apply by default: Zero Speculation, Search Before Create, Blast Radius, Root Cause Only, and Evidence Before Assertions.
- Never write production code on unverified assumptions.

## TRIGGER DIRECTIVE: ON MENTION OF "QED"
Whenever the user mentions "qed", "Q.E.D.", "по qed", or requests standard compliance:
1. **Instant Mode A Escalation**: Instantly lock execution into Mode A (Quality > Speed). Cancel any prototype shortcuts or relaxed constraints.
2. **Zero-Edits Before Pre-Flight**: Before modifying code, explicitly state:
   - **Mode**: Mode A (Enforced)
   - **Existing Code**: Confirmation of grep search (no duplicate types/helpers)
   - **Blast Radius**: Affected direct callers and contracts
   - **Reproduction Test**: Concrete failing test demonstrating the defect/feature
3. **Mechanical Verification Gate**: Never conclude with words alone. You MUST run `qed check` (or repo test suites) in the terminal and provide real terminal stdout as empirical proof.

## 0. Fundamental Directive: Evidence Before Assertions
- **No Speculative Code**: Never generate production code based on unverified assumptions about APIs or schemas.
- **Run the Tests**: Never state that code is functional without running the test commands in the terminal and verifying the output.
- **Root Cause Only**: Ban on empty `catch` blocks, arbitrary `setTimeout`, or masking types with `any`.

---

## 1. DeepSeek Reasoning Protocol (Chain-of-Thought Guidance)
When running with DeepSeek-R1, DeepSeek-V3, or `dsh` terminal agent, your `<think>` / reasoning block MUST explicitly verify:

1. **Architecture, Dependencies & Anti-Duplication**: Does the proposed structure respect native ecosystem idioms and earned complexity? Have I avoided bloat dependencies (using stdlib for trivial helpers, industry standards for crypto) and wrapped external libraries?
2. **Context-Driven Security & Anti-Security-Theater**: Does the security model match the runtime tier (Tier 1 CLI paths/exec, Tier 2 web bundle/XSS, Tier 3 multi-tenant IDOR/error masking, Tier 4 FinTech timing/audit)? Have I avoided user-hostile security theater (blocking paste, killing sessions without drafts, captive captchas)?
3. **Earned Regionality & Temporal Integrity**: Are timestamps UTC in DB/wire? Is money stored in minor integer units? Are names flexible? Are native `Intl` APIs used before dragging in heavy i18n dictionaries?
4. **Cache, Memory & Resource Hygiene**: Are caches strictly bounded (LRU maxSize + TTL)? Are cache keys tenant-scoped? Are temporary files cleaned up in `finally` blocks? Are streams used for files > 10MB?
5. **Blast Radius Analysis**: What files call this function? Does modifying this interface break existing callers or API contracts?
6. **The 4 Mandatory States**: Have I accounted for Empty, Loading, Error (with retry), and Degraded states?
7. **The 3 AM Test, Naming & Comment Standard**: Is the proposed logic flat (guard clauses, early returns) with descriptive variable names? Have I eliminated lazy placeholders (`data`, `temp`), specified units in numbers, used positive predicates, and commented only WHY?
8. **TDD Sequence**: Am I writing a failing reproduction test first before touching the fix?

---

## 2. Dual Execution Modes
- **Mode A (Production — Default: Quality > Speed)**: Strict TDD, Blast Radius analysis, Adversarial QA, linter/typecheck verification before completion.
- **Mode B (Prototype — On-Demand: Speed > Quality)**: Triggered ONLY when explicitly prompted ("quick", "draft", "prototype", "быстро"). Emits minimal working code with an explicit list of shortcuts taken.

---

## 3. Testing Philosophy & Boundary Value Matrix
- **Zero Placebo Mocks**: Pure unit tests must run with zero mocks (<5ms). Real DB/IO must use realistic ephemeral environments. Never test mocks instead of the system.
- **Zero Flaky Sleep**: Ban on arbitrary `sleep()`; use fake timers or deterministic condition polling.
- **The Mutation Check**: A test must be capable of failing; commenting out business logic must cause Red.
- **Mandatory Boundary Matrix**: Cover 0 (empty), 1, N, N+1, Max, Null/Undefined, Hostile Unicode (`👨‍👩‍👧‍👦`), and Concurrency (double-clicks within 50ms).
- **Reproduction First (Red -> Green)**: For bug fixes, write reproduction test first, observe failure, fix root cause, confirm pass.

---

## 4. Verification Gate & Pre-Commit Sanitization
Before reporting completion:
1. Pre-Commit Sanitization: Remove all debug prints (`print()`, `console.log`, `debugger`), delete scratch scripts, eliminate dead imports.
2. Run static analysis and type checks (`tsc`, `mypy`, etc.).
3. Run project linters (`eslint`, `ruff`, etc.).
4. Run the full test suite (`npm test`, `pytest`, etc.).
5. Confirm zero regressions and format git commits via Conventional Commits (`feat:`, `fix:`, `test:`, `refactor:`).
6. Git != Versioning: Maintain the Bisect Invariant (every commit builds & passes). Use context versioning (SemVer/CalVer/ZeroVer/Continuous). Avoid premature `@deprecated` in pre-1.0; separate technical `CHANGELOG.md` from user notes.

---

## 5. Documentation & Visual Ergonomics (Anti-Slop)
- Separate Human vs. Machine entrypoints (`README.md` for humans, `AI_README.md`/`llms.txt` for agents).
- Zero emoji salad in headers; no marketing puffery.
- Strict ban on 3-screen vertical Mermaid noodles: inline workflow diagrams must be horizontal and under 150px height.
- High-assurance SVGs: pure vector, responsive (`viewBox`, `100%` width, `height="auto"`), self-contained dark canvas card for theme immunity, system font typography.
- Prefer real terminal command/test logs over abstract decorative graphics.
