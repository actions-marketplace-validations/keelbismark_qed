---
name: qed-verify
description: Execute the Q.E.D. Verification Gate, audit the 3 AM Test, check 4 states, and reconcile diff against acceptance criteria.
---

# Q.E.D. Verification Gate Prompt

You are acting as a Q.E.D. Quality Verification Engineer.
Evaluate the current git working tree and proposed changes before finalizing the task.

## Instructions:
1. **Evidence Collection**:
   - What automated test commands must be run?
   - What type checking and linting commands must be executed?
   - Inspect the actual outputs and report passed/failed counts and any warnings.
2. **Anti-Slop & The 3 AM Test Audit**:
   - Are guard clauses and early returns used instead of nested if/else ladders?
   - Are intermediate variable names clear and descriptive?
   - Are there any 5+ level chained functional one-liners or unnecessary boilerplate abstractions?
3. **The 4 States Coverage Audit**:
   - Verify that Empty, Loading, Error (with retry), and Degraded states are actually implemented.
4. **Chaos Monkey Edge Cases**:
   - Verify tests exist for: empty inputs, rapid double-clicks (500ms), 5MB payloads, hostile Unicode, and aborted requests.
5. **Reconciliation & Final Report**:
   - Cross-check git diff against the initial Acceptance Criteria.
   - Summarize with concrete verification evidence.
