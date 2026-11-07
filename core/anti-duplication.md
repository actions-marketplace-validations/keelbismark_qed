# Anti-Duplication Radar ("Search Before You Create")
*Part of the Q.E.D. Engineering Framework*

## The Problem: AI Codebase Rot
When AI agents work on a codebase over weeks or months, a silent rot sets in:
- The agent invents `formatDate()` when `formatIsoTimestamp()` already exists.
- The agent writes a custom HTTP wrapper when an established `apiClient` exists.
- The agent defines an interface `UserProfile` when `UserDto` was already in the shared types directory.

This results in bloated bundle sizes, divergent bug fixes, and fractured abstractions.

---

## The Golden Rule: "Search Before You Create"

Before introducing ANY new:
- Helper / utility function
- Custom React/Vue hook
- Data type, model, or schema
- UI component or atom

**You MUST search the codebase first.**

### Search Protocol:
1. **Keyword Grep**: Search for semantic stems (e.g., `format`, `date`, `currency`, `fetch`, `token`, `validate`).
2. **Directory Inspection**: Check standard directories (`src/utils`, `src/helpers`, `src/common`, `src/types`, `packages/shared`).
3. **Decision Tree**:
   * **Found an exact match?** $\rightarrow$ Reuse it directly.
   * **Found a near match?** $\rightarrow$ Extend the existing utility (with backward compatibility) rather than creating a duplicate.
   * **No match found?** $\rightarrow$ Place the new helper in the appropriate shared location, document its contract, and add unit tests.

### Anti-Patterns Explicitly Forbidden:
- Creating `utils2.ts`, `helpers_new.ts`, `formatDateCustom.ts`.
- Rewriting an inline regex when a shared validation utility exists.
- Re-implementing debounce/throttle instead of using the project's standard library.
