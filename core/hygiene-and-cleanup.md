# Hygiene, Self-Cleaning & Sanitization Standard
*Part of the Q.E.D. Engineering Framework*

This standard establishes the mandatory cleanliness discipline, zero-debug invariants, and pre-commit sanitization protocols governing AI agents and software engineers.

---

## 0. Fundamental Axiom: The Pristine Campsite Standard

> **Always leave the codebase strictly cleaner than you found it.**

When an AI coding assistant completes a task, the repository must exhibit zero traces of diagnostic surgery. Scaffolding, scratch scripts, temporary files, diagnostic print statements, and dead imports must be completely dismantled before the work is declared finished.

---

## 1. The 4 Deadly Sins of Codebase Pollution

### Sin 1: Diagnostic Log Littering
* **The Anti-Pattern**: Leaving temporary inspection prints (`console.log("here")`, `print(f"DEBUG: {val}")`, `fmt.Println("!!!")`, `debugger;`) in production code after solving an issue.
* **The Consequences**:
  - Leaks Protected Health Information (PHI), Personally Identifiable Information (PII), or auth tokens into unencrypted stdout.
  - Causes severe throughput degradation in tight loops and hot paths.
  - Floods log aggregation pipelines (Datadog, CloudWatch, Elasticsearch) with meaningless noise.
* **The Q.E.D. Rule**: **Zero tolerance for temporary debug prints crossing the commit boundary.** If logging is required for production telemetry, it must use the system's structured logging framework with explicit levels and PII masking.

### Sin 2: Scratch Files & Throwaway Scaffolding
* **The Anti-Pattern**: Creating test files (`test_fix.py`, `curl_api.sh`, `temp.json`, `debug.log`) in the project tree and abandoning them after the test passes.
* **The Q.E.D. Rule**: All throwaway scripts and artifacts must be deleted before reporting completion. A final `git status` must confirm a clean working tree with zero untracked files.

### Sin 3: Zombie Imports & Dead Code
* **The Anti-Pattern**: Deleting the call site of a function but leaving unused `import` statements at the top of the file, or leaving commented-out blocks ("in case we need this later").
* **The Q.E.D. Rule**: Unused imports and dead variables are build defects. Linters must be configured to fail on unused code. Commented-out code blocks are strictly forbidden; version history belongs exclusively in Git.

### Sin 4: Git & Environment Pollution
* **The Anti-Pattern**: Staging and committing OS artifacts (`.DS_Store`, `Thumbs.db`), editor folders (`.idea/`, `.vscode/`), compiled outputs (`dist/`, `build/`, `__pycache__/`), or merge conflict markers (`<<<<<<< HEAD`).
* **The Q.E.D. Rule**: `.gitignore` must be maintained and verified. Every staged diff must be inspected line-by-line before committing.

---

## 2. Table of Forbidden Temporary Debug Constructs

The following constructs are strictly forbidden in any commit:

| Language | Forbidden Diagnostic Call | Permitted Production Telemetry |
| :--- | :--- | :--- |
| **TypeScript / JavaScript** | `console.log`, `console.dir`, `console.debug`, `debugger;` | `logger.info()`, `logger.error()`, `logger.debug()` |
| **Python** | `print()`, `breakpoint()`, `import pdb; pdb.set_trace()` | `logging.getLogger(__name__).info()`, `structlog` |
| **Go** | `fmt.Println`, `fmt.Printf` (in library code), `panic("here")` | `log.WithFields()`, `zap.Logger`, `slog.Info()` |
| **Rust** | `println!`, `eprintln!`, `dbg!()` | `tracing::info!()`, `log::debug!()` |
| **C / C++** | `printf`, `std::cout`, `std::cerr` (in non-CLI libraries) | `spdlog`, structured telemetry sinks |
| **Dart / Flutter** | `print()`, `debugPrint()`, `debugger()` | `developer.log()`, structured telemetry services |

---

## 3. The 4-Step Pre-Commit Sanitization Sweep

Before running `git commit` or marking any task complete, the agent must execute this sequential sanitization gate:

```text
[Step 1: Auto-Fix Linters]
        │
        ▼
[Step 2: Scratch Purge]
        │
        ▼
[Step 3: Diff Sanity Audit]
        │
        ▼
[Step 4: Atomic Clean Commit]
```

### Step 1: Static Sanitization (Auto-Fix)
Run the project's linter and formatter with automatic fix flags enabled to purge unused imports and enforce formatting:
- Node/TypeScript: `npm run lint -- --fix` / `npx eslint --fix .`
- Python: `ruff check --fix . && ruff format .`
- Go: `goimports -w . && go vet ./...`
- Rust: `cargo clippy --fix --allow-dirty && cargo fmt`

### Step 2: Scratch Purge (Untracked Files Check)
Run `git status --porcelain` to discover any forgotten scratch files or test outputs:
```bash
git status --porcelain
```
If any temporary scripts, logs, or JSON dumps appear with `??`, delete them immediately:
```bash
rm temp_*.py scratch.* debug.log
```

### Step 3: Diff Sanity Audit (The Human Eye Check)
Inspect the exact diff about to be staged:
```bash
git diff
```
Verify three invariants:
1. **Zero Debug Leaks**: Verify that no `console.log`, `print()`, or `debugger` statements are in the diff.
2. **No Whitespace Churn**: Confirm you did not accidentally reformat unrelated files or entire files with mismatched CRLF/LF line endings.
3. **Locality of Scope**: Confirm every edited file is strictly within the declared task scope.

### Step 4: Atomic Clean Commit
Stage only the intentional files and commit with a clean Conventional Commit message:
```bash
git add src/path/to/feature.ts test/path/to/feature.test.ts
git commit -m "feat(billing): implement idempotent debit transactions"
```

---

## 4. Branch & Repository Hygiene

1. **Delete Feature Branches Post-Merge**: Once a branch is merged into `main`, delete the local and remote feature branch immediately. Never accumulate dozens of stale branches.
2. **Zero Ghost Files in Root**: Never save ad-hoc testing notes or test outputs into the repository root. Use dedicated doc directories (`docs/adr/`) or ephemeral system temp dirs.
3. **Environment Security**: Never commit `.env`. Verify that `.env.example` has placeholder keys and that `.env*` is safely protected by `.gitignore`.
