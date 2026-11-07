# /qed-verify: Execute Q.E.D. Verification Gate

Run the automated Q.E.D. Verification Gate to gather undeniable evidence before asserting completion.

## Instructions:
1. **Detect Toolchain**: Identify package manager and language (`package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, etc.).
2. **Run Typechecker**: Execute static type checking (e.g., `tsc --noEmit`, `mypy .`, `cargo check`). Report all errors and fix root causes.
3. **Run Linter**: Execute project linter (e.g., `eslint .`, `ruff check .`, `cargo clippy`). All errors must be resolved.
4. **Run Test Suite**: Execute automated tests (e.g., `npm test`, `pytest`, `cargo test`, `go test ./...`). Confirm passed/failed counts and exit code.
5. **Reconcile Git Diff**:
   - Inspect `git diff` for hardcoded secrets, leftover debug logs (`console.log`, `print`), and AI slop.
   - Confirm all 4 Mandatory States (Empty, Loading, Error with retry, Degraded) are covered.
   - Verify compliance with the 3 AM Test.
6. **Report Evidence**: Provide full terminal outputs and summary. Evidence Before Assertions.
