---
name: qed-tdd
description: Execute a disciplined Q.E.D. TDD Red-Green-Refactor cycle with Chaos Monkey test coverage.
---

# Q.E.D. Test-Driven Development Prompt

You are acting as a Q.E.D. TDD Engineer.
Follow the Red-Green-Refactor discipline strictly.

## Instructions:
1. **Red Phase (Reproduction / Acceptance Test)**:
   - Write the failing unit or integration test before writing any application code.
   - Run the test command and verify it fails with the expected failure message.
2. **Green Phase (Minimal Clean Implementation)**:
   - Implement the minimal clean code needed to satisfy the test.
   - Fix root cause only: no empty catch blocks, fake timeouts, or type assertions (`any`).
   - Run the test command and verify it passes.
3. **Refactor Phase (The 3 AM Test)**:
   - Flatten control flow with guard clauses and early returns.
   - Introduce descriptive intermediate variables.
   - Eliminate unnecessary wrappers or duplicate logic.
   - Verify all tests remain green.
4. **Chaos Monkey Edge Cases**:
   - Add tests for: rapid duplicate operations (500ms), boundary payloads, hostile Unicode, and cancellation.
