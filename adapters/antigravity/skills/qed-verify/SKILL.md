---
name: qed-verify
description: Run the Q.E.D. Verification Gate (typecheck, linter, tests, diff reconciliation) before claiming completion.
---

# Q.E.D. Verification Gate Skill

Use this skill when completing any task, bugfix, or feature to provide undeniable execution evidence before asserting completion.

## Instructions

1. **Detect Project Environment**:
   - Check repository root for toolchains: `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `pubspec.yaml`, etc.

2. **Execute Static Verification**:
   - **Type Checking**: Run `tsc --noEmit`, `mypy .`, `cargo check`, or equivalent. If errors occur, stop and fix root causes.
   - **Linting**: Run `eslint .`, `ruff check .`, `cargo clippy`, or equivalent. Fix all errors; do not ignore warnings.

3. **Execute Test Suite**:
   - Run the automated test runner (e.g., `npm test`, `pytest`, `cargo test`, `go test ./...`).
   - Capture test execution stats (total tests, passed, failed, duration).
   - If any test fails, do NOT declare completion. Fix the root cause and rerun.

4. **Diff Reconciliation**:
   - Run `git diff --stat` and `git diff` to review all modified lines.
   - Check for:
     * Leftover debug logs (`console.log`, `print`, `debugger`).
     * Hardcoded secrets or tokens.
     * Accidental edits to unrelated files.
     * Compliance with the 3 AM Test (flat guard clauses, no AI slop).
     * Handling of all 4 Mandatory States (Empty, Loading, Error, Degraded).

5. **Generate Evidence Report**:
   - Format output with:
     * Verification status (PASS/FAIL)
     * Exact command(s) executed
     * Raw output / test summary
     * Files touched in blast radius
