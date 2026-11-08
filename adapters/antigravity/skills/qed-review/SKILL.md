---
name: qed-review
description: Perform an adversarial Q.E.D. code review on recent changes or proposed diffs.
---

# Q.E.D. Adversarial Code Review Skill

Use this skill to review proposed code changes, commits, or pull requests against the Q.E.D. High-Assurance Engineering Standard.

## Review Protocol

1. **Anti-Duplication Audit**:
   - Were any new helpers, utility functions, hooks, or models introduced?
   - Did the author search the codebase first? Does an equivalent function already exist in the repository?
   - Flag any duplicate or near-duplicate functions (`utils2.ts`, duplicate date/string formatters).

2. **Blast Radius Audit**:
   - Were shared functions or interfaces modified?
   - Did the author inspect all direct call sites?
   - Are public API contracts or DB schemas preserved without breaking existing callers?

3. **The 4 Mandatory States Audit**:
   - Does every new UI screen or API endpoint properly implement:
     1. Empty state (helpful message + call to action)?
     2. Loading state (no cumulative layout shift)?
     3. Error state (actionable error message with a retry mechanism)?
     4. Degraded / offline state (safe fallback)?

4. **The 3 AM Test (Anti-Slop Audit)**:
   - Is the code flat with early returns and guard clauses?
   - Are there overly clever 5-level functional one-liners that obscure control flow?
   - Is there AI boilerplate slop (gratuitous factory classes, meaningless wrappers)?

5. **Adversarial QA & Chaos Monkey Audit**:
   - Are edge cases tested (empty lists, null values, rapid double-clicks, large inputs, Unicode)?
   - Did the author provide reproduction tests for bug fixes?

6. **Output**:
   - Deliver an objective review with actionable findings categorized by risk level (Critical, Warning, Suggestion).
