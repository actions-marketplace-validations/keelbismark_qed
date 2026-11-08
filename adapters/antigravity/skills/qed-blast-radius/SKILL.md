---
name: qed-blast-radius
description: Calculate and document the blast radius before modifying shared code, types, or schemas.
---

# Q.E.D. Blast Radius Analysis Skill

Use this skill before modifying any shared module, contract, or database schema to evaluate and mitigate the blast radius.

## Analysis Steps

1. **Identify Direct Dependents**:
   - Run `rg --word-regexp "<symbol_name>"` across the repository.
   - Count direct call sites and consuming files.
   - If count > 5, plan for backward compatibility (optional parameter, deprecation wrapper, or overload).

2. **Assess Indirect Impact**:
   - **Serialization**: Does changing this type break external API consumers or webhook payloads?
   - **Persistence**: Does this modify a stored database model or table column? Is a migration needed?
   - **Caching & Queues**: Are instances cached in Redis or passed through asynchronous task queues?

3. **Assign Risk Tier**:
   - **Low**: <= 2 callers, private/internal function, unit tests present.
   - **Medium**: Shared utility, internal service API, or non-breaking model update.
   - **Critical**: Core authentication, public API, breaking DB migration, or payment/billing logic.

4. **Construct Mitigation Plan**:
   - Write or update tests covering all direct callers before making changes.
   - Execute tests to verify baseline is green.
   - Proceed with minimal, focused diff.
