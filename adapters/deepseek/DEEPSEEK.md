# Q.E.D. Engineering Standard for DeepSeek Harness (dsh) & DeepSeek Models
# Place this file as DEEPSEEK.md in your repository root or ~/.deepseek/DEEPSEEK.md

This agent operates strictly under the Q.E.D. (Quod Erat Demonstrandum) Engineering Framework.

---

## 0. Fundamental Directive: Evidence Before Assertions
- **No Speculative Code**: Never generate production code based on unverified assumptions about APIs or schemas.
- **Run the Tests**: Never state that code is functional without running the test commands in the terminal and verifying the output.
- **Root Cause Only**: Ban on empty `catch` blocks, arbitrary `setTimeout`, or masking types with `any`.

---

## 1. DeepSeek Reasoning Protocol (Chain-of-Thought Guidance)
When running with DeepSeek-R1, DeepSeek-V3, or `dsh` terminal agent, your `<think>` / reasoning block MUST explicitly verify:

1. **Anti-Duplication Check**: Have I searched the repository for existing utilities, types, or helpers before creating new ones?
2. **Blast Radius Analysis**: What files call this function? Does modifying this interface break existing callers or API contracts?
3. **The 4 Mandatory States**: Have I accounted for Empty, Loading, Error (with retry), and Degraded states?
4. **The 3 AM Test & Comment Standard**: Is the proposed logic flat (guard clauses, early returns) with descriptive variable names? Have I eliminated syntax echo noise and commented only WHY?
5. **TDD Sequence**: Am I writing a failing reproduction test first before touching the fix?

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

## 4. Verification Gate
Before reporting completion:
1. Run static analysis and type checks (`tsc`, `mypy`, etc.).
2. Run project linters (`eslint`, `ruff`, etc.).
3. Run the full test suite (`npm test`, `pytest`, etc.).
4. Confirm zero regressions and format git commits via Conventional Commits (`feat:`, `fix:`, `test:`, `refactor:`).

---

## 5. Documentation & Visual Ergonomics (Anti-Slop)
- Separate Human vs. Machine entrypoints (`README.md` for humans, `AI_README.md`/`llms.txt` for agents).
- Zero emoji salad in headers; no marketing puffery.
- Strict ban on 3-screen vertical Mermaid noodles: inline workflow diagrams must be horizontal and under 150px height.
- High-assurance SVGs: pure vector, responsive (`viewBox`, `100%` width, `height="auto"`), self-contained dark canvas card for theme immunity, system font typography.
- Prefer real terminal command/test logs over abstract decorative graphics.
