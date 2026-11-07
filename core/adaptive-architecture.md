# Adaptive Architecture & Project Structure Standard
*Part of the Q.E.D. Engineering Framework*

This standard establishes the philosophy, evolutionary rules, and immutable hygiene invariants governing how projects are structured across diverse domains, ecosystems, and scales.

---

## 0. The Anti-Dogmatism Axiom

> **Structure is not a rigid cookie-cutter template. Structure is an organic skeleton tailored to the physical constraints, data flow, and ecosystem idioms of the specific problem.**

One of the most persistent failure modes of AI coding assistants is architectural dogma: forcing every project into a single learned pattern (e.g., trying to impose Next.js/React folder layouts onto a Go systems utility, or building 8-layer enterprise Java hierarchies for a 150-line CLI script).

Every project is unique:
* An **ML/Data Science pipeline** organizes around datasets, notebooks, features, and model artifacts—not CRUD controllers.
* A **low-level systems utility (Rust / Go / Zig / C++)** organizes around compiler rules, memory layout, and idiomatic toolchain conventions.
* A **real-time event system (Canvas / WebSockets / Game Engine)** organizes around state loops, entity-component data flows, and message queues.
* A **focused CLI tool** is best expressed in 1–2 flat files, where adding 10 directories is architectural damage.

Under Q.E.D., architecture is **Context-Driven and Organically Scaled**.

---

## 1. The Principle of Earned Complexity

Complexity of structure must be **earned by the scale of the domain**, never introduced as speculative anticipatory scaffolding.

```text
Level 1: Micro / Script  ──>  Level 2: Focused Tool  ──>  Level 3: Domain System  ──>  Level 4: Polyglot / Workspace
(1-3 flat files)              (src/ + tests/ + docs/)    (features/ or internal/)     (apps/ + packages/ + tooling/)
```

### The Scale Spectrum:

1. **Level 1: Micro / Script (< 300 lines of code)**:
   - *Structure*: 1 or 2 flat files (e.g. `main.py`, `script.ts`, `tests.py`).
   - *Rule*: Do NOT create `src/`, `controllers/`, or `services/` until cognitive friction demands it.
2. **Level 2: Focused Tool / Library (300 – 3,000 lines)**:
   - *Structure*: Standard single-package layout (`src/`, `tests/`, `docs/`, entrypoint file).
   - *Rule*: Keep files grouped cleanly by role. Maintain high visibility.
3. **Level 3: Domain System / Multi-Feature App (3,000 – 50,000 lines)**:
   - *Structure*: Domain-first / Feature-driven slices (`features/billing/`, `internal/trading/`).
   - *Rule*: Group by business domain, not technical layer. Things that change together live together.
4. **Level 4: Polyglot / Multi-Package (> 50,000 lines or distinct release artifacts)**:
   - *Structure*: Monorepo or workspace structure (`apps/`, `packages/`, `crates/`, `services/`).
   - *Rule*: Strict dependency boundaries between packages. Shared code must have explicit ownership.

---

## 2. Respect Ecosystem Idioms First

Never impose foreign conventions on a native ecosystem. Follow the battle-tested idioms of the language and platform toolchain:

| Ecosystem | Canonical Layout Pattern | Cardinal Rule |
| :--- | :--- | :--- |
| **Go** | `cmd/<app>/main.go`, `internal/` for private packages, `pkg/` only for public libraries. | Avoid deep package hierarchies; prefer flat packages named after the domain entity. |
| **Rust** | `Cargo.toml`, `src/main.rs`, `src/lib.rs`, `tests/` for integration, `benches/`. | Respect Cargo workspace conventions; modules follow the Rust `mod.rs` or `foo/` hierarchy. |
| **Python** | `src/<package>/`, `pyproject.toml`, `tests/`. | Ban flat root pollution; use `src/` layout to prevent accidental uninstalled local package imports. |
| **TypeScript / Web** | Entrypoint (`app/` or `pages/`), `features/` or `src/`, `shared/` for reusable UI/primitives. | Feature slices over layer-by-type (`controllers/`, `services/`). |
| **C / C++ / Zig** | `include/` (public headers), `src/` (implementation), `build.zig` / `CMakeLists.txt`. | Strict separation of public API contracts from private compilation units. |
| **ML / Data** | `notebooks/`, `src/data/`, `src/models/`, `configs/`, `artifacts/` (gitignored). | Explicit separation of reproducible pipeline code from ephemeral datasets and weights. |

---

## 3. Structure Follows Data Flow

Instead of memorized folder names, design directory structures around the **actual movement of data through the system**:

1. **Ingestion (How data enters)**:
   - CLI flags, HTTP requests, WebSockets, Kafka topics, disk sensors, or file streams.
2. **Processing / Domain Logic (Where business invariants live)**:
   - Pure state machines, parsers, calculators, domain rules.
   - Decoupled from transport protocols and databases.
3. **Egress (Where data exits)**:
   - Database persistence, terminal rendering, UI canvas, external webhooks.

*Guideline*: Name folders after what they do in the domain (`routing`, `telemetry`, `matching_engine`), never generic filler like `managers`, `handlers`, `helpers`, or `processors`.

---

## 4. The 4 Immutable Hygiene Invariants

Regardless of project domain, language, or scale, every repository must preserve these 4 non-negotiable hygiene laws:

### Invariant 1: The Pristine Root
The root directory is the public storefront of the repository. It may ONLY contain:
* Primary human & machine documentation: `README.md`, `AI_README.md`, `llms.txt`, `LICENSE`.
* Environment declarations: `.env.example`, `.gitignore`.
* Toolchain & build manifests: `package.json`, `Cargo.toml`, `go.mod`, `pyproject.toml`, etc.
* Canonical top-level directories (`src/`, `tests/`, `docs/`, `assets/`, `scripts/`).

*Violation*: Any ad-hoc scratch script (`run.py`, `test2.js`, `temp.json`, `data.csv`) left in the root is an engineering defect.

### Invariant 2: 10-Second Entrypoint Discovery
Any engineer or AI agent opening the repository must locate the primary execution entrypoint within 10 seconds:
* Standalone app: clear `main.*` or entrypoint in `src/` or `cmd/`.
* Library: clear public export index (`index.ts`, `lib.rs`, `__init__.py`).
* Documented clearly in the first section of `README.md`.

### Invariant 3: Segregation of Verification vs. Production
* Test fixtures, mocks, stress tools, and benchmarks must NEVER be bundled into production binaries or publishable packages.
* Production code must have zero runtime dependencies on test frameworks.

### Invariant 4: Locality of Change (Minimizing Blast Radius)
* Code that changes together must live together.
* If modifying a feature requires editing files across 6 distant folders, the structure has failed Locality of Change.
* Unit tests should be co-located with their subject (`user.ts` next to `user.test.ts`), while cross-module integration tests belong in `tests/`.

---

## 5. Architectural Anti-Patterns (Forbidden by Q.E.D.)

1. **The Enterprise Cargo-Cult**: Creating 8 nested subfolders for a script that could fit in 1 file.
2. **The Flat Swamp**: Dumping 80 unrelated files into a single flat directory without domain grouping.
3. **The Layered Spaghetti (Folder-by-Type)**: Splitting every feature across `controllers/`, `services/`, `models/`, `views/`, destroying readability.
4. **The Ghost Helper Graveyard (`utils.ts`)**: Dumping 50 unrelated functions into a giant junk-drawer file. If a helper belongs to a feature, keep it inside that feature. Only promote to shared libraries when 3+ independent domains require it.
