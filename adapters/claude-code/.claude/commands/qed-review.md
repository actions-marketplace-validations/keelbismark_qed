# /qed-review: Adversarial Q.E.D. Code Review

Perform an adversarial code review on proposed changes or current git diff against the Q.E.D. High-Assurance Engineering Standard.

## Instructions:
1. **Inspect Diff**: Run `git diff HEAD` (or against target branch) and review all modified files.
2. **Anti-Duplication Audit**:
   - Check if any new utility, helper, hook, or type duplicates existing codebase functionality.
   - Enforce "Search Before You Create".
3. **Blast Radius Audit**:
   - Verify that all direct callers of modified functions/types were identified.
   - Check backward-compatibility for API contracts, DB models, and serialized payloads.
4. **The 4 Mandatory States Audit**:
   - Verify every UI flow or API route implements: Empty, Loading, Error (actionable with retry), and Degraded states.
5. **The 3 AM Test Audit (Anti-Slop)**:
   - Check for flat guard clauses and early returns.
   - Reject opaque 5-level functional one-liners and unnecessary AI boilerplate classes.
6. **Chaos Monkey Edge Cases**:
   - Verify tests cover: empty inputs, 500ms duplicate clicks, 5MB payloads, hostile Unicode, and aborted requests.
7. **Generate Review**: Output findings grouped by Critical, Warning, and Suggestion.
