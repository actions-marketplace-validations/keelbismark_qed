---
name: qed-reconnaissance
description: Use when entering an unfamiliar repository, starting project onboarding, or auditing codebase health and debt — executes the Q.E.D. Agent Reconnaissance Walk, surveys entrypoints, data flow, Anti-Duplication Atlas, and diagnoses pre-existing debt ("насрано" / unearned enterprise bloat or god-files).
---

# Q.E.D. Agent Reconnaissance Walk

Use this skill when onboarding onto a new project, starting a new session in an unfamiliar codebase, or when diagnosing codebase complexity and structural debt.

## Reconnaissance Protocol

### 1. Discover Entrypoints & Primary Flow
- Inspect root config: `package.json`, `go.mod`, `Cargo.toml`, `pyproject.toml`.
- Locate primary entrypoint (`src/index.ts`, `main.go`, `app/main.py`, `src/App.tsx`).
- Trace high-level data path: Entrypoint -> Router/Controller -> Business Logic -> Storage/External APIs.

### 2. Build the Anti-Duplication Atlas (Existing Helpers)
- Scan utility directories: `utils/`, `helpers/`, `lib/`, `common/`, `shared/`, `pkg/`.
- Inventory exported functions (formatters, date parsers, HTTP clients, validators, cache helpers).
- Ground all future implementations in existing utilities; never write duplicates.

### 3. Diagnose Pre-Q.E.D. Debt ("Насрано" Detector)
- **Earned Complexity Tier**:
  - `Tier 1 (< 1,500 SLOC)`: Flat, minimal abstractions, zero enterprise layers.
  - `Tier 2 (1,500 - 20,000 SLOC)`: Modular service, bounded LRU caches, structured errors.
  - `Tier 3 (> 20,000 SLOC)`: Platform/monorepo, sovereign domains, isolated modules.
- **Premature Enterprise Bloat**: If a small codebase (< 1,500 SLOC) contains complex folder nesting (e.g. `domain/`, `usecases/`, `repositories/`, `factories/`), flag as architectural bloat.
- **God-File Spaghetti**: If any single file contains > 600-1,000 lines or > 35% of total logic, flag for decoupling.
- **Untested Code**: If SLOC > 300 and zero test files exist, flag missing safety net.

### 4. Generate or Refresh Brief
- Run `node bin/qed-engine.js init --explore` (or `npx qed init --explore`).
- Inspect the generated `.qed/BRIEF.md`.
