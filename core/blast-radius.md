# Blast Radius Analysis Protocol
*Part of the Q.E.D. Engineering Framework*

## Overview
The **Blast Radius Analysis** prevents the "butterfly effect" in software engineering: the phenomenon where modifying a single function or data schema unexpectedly causes crashes in distant parts of the system.

Before modifying any existing shared function, data contract, database model, or API endpoint, the agent or engineer MUST calculate and document the Blast Radius.

---

## 3-Dimensional Impact Matrix

Whenever a change touches shared code, evaluate three dimensions:

### 1. Direct Dependents (Direct Callers)
- Run code searches (e.g., `grep`, AST search, or "Find all references").
- Identify all call sites, test files, and imported modules.
- **Rule**: If $>5$ files depend directly on this function, consider introducing an overload or a backward-compatible wrapper instead of changing the existing signature.

### 2. Indirect Impact (Transitive & State Effects)
- **Serialization & APIs**: Does this change alter the JSON output of any public or internal API?
- **Database & Migrations**: Does this change require a database schema migration? Could old records fail to deserialize?
- **Caches & Background Jobs**: Are cached objects (Redis/Memcached) or serialized queue payloads (Celery, BullMQ, Kafka) impacted?

### 3. Risk Classification
| Level | Criteria | Required Action |
| :--- | :--- | :--- |
| **Low** | Self-contained internal function with $\le 2$ callers; comprehensive unit tests exist. | Run existing unit tests; verify callers. |
| **Medium** | Shared utility, API schema change, or model modification with multiple callers. | Write regression tests for all callers before making edits; run full test suite. |
| **Critical** | Core domain model, authentication/authorization logic, database migration, or public API contract. | Write a formal ADR (Architecture Decision Record), isolate in a branch, run end-to-end regression tests. |

---

## Blast Radius Pre-Flight Checklist
Before applying changes:
1. [ ] Have all direct call sites been identified?
2. [ ] Is backward compatibility preserved where necessary?
3. [ ] Are existing tests run and verified green BEFORE making the change?
4. [ ] Is there an automated rollback or fallback strategy if the change breaks?
