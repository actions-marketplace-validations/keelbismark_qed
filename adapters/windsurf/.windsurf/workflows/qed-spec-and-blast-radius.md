# Q.E.D. Workflow: Specification & Blast Radius Analysis

Follow this workflow in Windsurf before modifying existing shared code or creating new features.

## Step 1: Anti-Duplication Search
1. Search the workspace using `grep` or file search for keywords related to the requested functionality.
2. Check `utils/`, `helpers/`, `services/`, and existing domain models.
3. If an existing abstraction covers the requirement or can be extended cleanly, reuse it.
4. Stop and justify if introducing a new file or utility.

## Step 2: Blast Radius Calculation
1. Search all direct call sites of any existing function, type, or component you plan to modify.
2. Determine risk tier:
   - **Low**: <= 2 callers, internal only.
   - **Medium**: Shared utility, service method, or API endpoint.
   - **Critical**: Authentication, public contract, database schema, payment logic.
3. If > 5 callers depend on the signature, introduce a backward-compatible wrapper or overload.

## Step 3: Define Binary Acceptance Criteria & 4 States
1. List concrete pass/fail acceptance criteria.
2. Define behavior for:
   - Empty state
   - Loading state
   - Error state (with retry)
   - Degraded / offline state

## Step 4: Verification Baseline
1. Run the existing test suite to ensure the baseline is completely green before making changes.
