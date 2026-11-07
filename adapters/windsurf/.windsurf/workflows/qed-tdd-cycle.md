# Q.E.D. Workflow: Ironclad TDD Cycle

Follow this workflow in Windsurf for all bug fixes and feature implementations.

## Step 1: Write Failing Reproduction Test (RED)
1. Identify the targeted behavior or defect.
2. Write a minimal unit or integration test in the appropriate test suite.
3. Run the test in the terminal and verify that:
   - The test fails.
   - The failure reason matches the expected bug or missing feature (not a syntax error or missing import).

## Step 2: Implement Minimal Clean Fix (GREEN)
1. Write the minimal amount of code needed to make the failing test pass.
2. Address root causes only: do not use empty catch blocks, fake timeouts, or type casts.
3. Run the test in the terminal and confirm it passes.

## Step 3: Apply the 3 AM Test Refactor
1. Review the new implementation:
   - Use flat guard clauses and early returns.
   - Replace opaque chained one-liners with descriptive intermediate variables.
   - Remove any temporary logging or debug statements.
2. Re-run tests to confirm they remain green.

## Step 4: Apply Chaos Monkey Edge Cases
1. Add adversarial tests covering:
   - Rapid double-clicks or repeated mutations (debouncing/idempotency).
   - Empty collections, null/undefined, and boundary values.
   - Hostile strings (Unicode, emojis, injection patterns).
2. Confirm all adversarial tests pass.
