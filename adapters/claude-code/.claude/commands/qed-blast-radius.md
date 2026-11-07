# /qed-blast-radius: Blast Radius Impact Analysis

Calculate direct callers, indirect architectural effects, and risk tiers before modifying shared code, schemas, or contracts.

## Instructions:
1. **Locate Direct Dependents**:
   - Run `rg --word-regexp "<symbol_name>"` across the project.
   - Count direct call sites and consuming modules.
   - If callers > 5, plan a backward-compatible wrapper or overload.
2. **Assess Indirect Impact**:
   - Serialization & public APIs: Will JSON responses or webhook payloads break?
   - Database migrations: Are schema migrations required? Are existing rows backward-compatible?
   - Caches & Queues: Are Redis keys or task queue payloads impacted?
3. **Assign Risk Tier**:
   - **Low**: <= 2 callers, internal only.
   - **Medium**: Shared utility, service method, internal API.
   - **Critical**: Core authentication, public API, breaking DB migration, billing/financial logic.
4. **Draft Mitigation Plan**:
   - Write/verify caller regression tests before editing shared code.
   - Proceed with minimal, focused diff.
