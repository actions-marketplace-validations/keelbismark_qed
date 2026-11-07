# Q.E.D. Workflow: Verification Gate & Atomic Commit

Follow this workflow in Windsurf before closing any task.

## Step 1: Automated Static Checks
1. Execute the project typechecker in terminal:
   - TypeScript: `npx tsc --noEmit`
   - Python: `mypy .`
   - Rust: `cargo check`
   - Go: `go vet ./...`
2. Execute the project linter:
   - `npm run lint` or `npx eslint .`
   - `ruff check .`
   - `cargo clippy`
3. Fix any reported warnings and errors.

## Step 2: Full Test Suite
1. Run the entire test suite (unit + integration).
2. Confirm zero failing tests.
3. Verify test coverage for new or changed code paths.

## Step 3: Diff Inspection
1. Run `git diff` to inspect every modified line.
2. Ensure:
   - No hardcoded secrets or credentials.
   - `.env.example` is updated if new env variables were added.
   - All 4 Mandatory States (Empty, Loading, Error, Degraded) are handled.
   - Code complies with the 3 AM Test.

## Step 4: Atomic Conventional Commit
1. Stage modified files cleanly (`git add <files>`).
2. Commit using Conventional Commits (`feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `chore:`).
3. Present evidence-based completion summary to the user.
