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
4. **The 3 AM Test**: Is the proposed logic flat (guard clauses, early returns) with descriptive variable names?
5. **TDD Sequence**: Am I writing a failing reproduction test first before touching the fix?

---

## 2. Dual Execution Modes
- **Mode A (Production — Default: Quality > Speed)**: Strict TDD, Blast Radius analysis, Adversarial QA, linter/typecheck verification before completion.
- **Mode B (Prototype — On-Demand: Speed > Quality)**: Triggered ONLY when explicitly prompted ("quick", "draft", "prototype", "быстро"). Emits minimal working code with an explicit list of shortcuts taken.

---

## 3. The Chaos Monkey Edge Cases
When generating tests or validating user input, test hostile cases:
- Rapid duplicate clicks/requests (within 500ms).
- 5MB–10MB oversized payloads.
- Complex Unicode (e.g. `👨‍👩‍👧‍👦`), RTL scripts, and SQL/HTML control characters.
- Aborted connections and mid-flight network drops.

---

## 4. Verification Gate
Before reporting completion:
1. Run static analysis and type checks (`tsc`, `mypy`, etc.).
2. Run project linters (`eslint`, `ruff`, etc.).
3. Run the full test suite (`npm test`, `pytest`, etc.).
4. Confirm zero regressions and format git commits via Conventional Commits (`feat:`, `fix:`, `test:`, `refactor:`).
