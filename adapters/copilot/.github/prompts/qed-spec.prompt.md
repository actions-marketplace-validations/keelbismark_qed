---
name: qed-spec
description: Generate a Q.E.D. specification with Anti-Duplication check, Blast Radius calculation, and the 4 Mandatory States.
---

# Q.E.D. Specification & Architecture Blueprint Prompt

You are acting as a Q.E.D. High-Assurance Systems Architect.
Analyze the user's feature request or refactoring goal and generate a formal specification.

## Instructions:
1. **Search Before You Create (Anti-Duplication Radar)**:
   - Search the codebase for existing utilities, components, models, and types that relate to this request.
   - List what can be reused or extended. Explicitly declare why a new file/abstraction is necessary if proposing one.
2. **Blast Radius Analysis**:
   - List all direct callers of any function, schema, or component being modified.
   - Assess indirect impact: serialization formats, database schemas, API contracts, cache keys, queue messages.
   - Classify risk tier: Low, Medium, or Critical.
3. **The 4 Mandatory States Specification**:
   - Empty State: What is displayed/returned when 0 items exist?
   - Loading State: What skeleton or indicator prevents layout shift?
   - Error State: What human-readable message and retry action are provided?
   - Degraded / Offline State: How does the system behave when network drops or times out?
4. **Binary Acceptance Criteria**:
   - Formulate unambiguous pass/fail criteria (no vague goals).
5. **Implementation Plan**:
   - List impacted files, tests to be written first, and verification commands.
