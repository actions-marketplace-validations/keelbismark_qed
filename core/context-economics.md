# Q.E.D. Standard: Context Economics, Token Hygiene & Surgical Diffs

> *"Context window capacity is not infinite RAM; it is working attention memory. Polluting it degrades reasoning, multiplies cost, and loses critical architectural details in the middle."*

---

## 1. The Context Window Tragedy of the Commons

In multi-turn autonomous coding sessions, agents frequently burn 80% of their token budget on low-entropy noise:

1. **The System Prompt Tax**: Re-injecting 5,000-token rule monoliths on every turn. In a 20-turn session, that is **100,000 tokens** wasted on static instructions.
2. **Command Output Flooding**: Running `npm test` or `pytest` and dumping 300 lines of passing green checkmarks into context (4,000+ tokens of zero information).
3. **The File Rewrite Anti-Pattern**: Emitting a 600-line full file replacement just to change a 2-line conditional.
4. **Unbounded Reading**: Ingesting a 1,200-line file when the task only concerns a single helper function.

Q.E.D. treats context capacity as a scarce, managed runtime resource.

---

## 2. The 5 Invariants of Context Economics

### Invariant 1: The Surgical Edit Invariant (Anti-Rewrite)
- **Rule**: When editing an existing source file where changes affect less than 20% of the lines, **full-file replacements are prohibited**.
- **Action**: Agents must emit targeted search-and-replace blocks, unified diffs, or line-bounded edits.
- **Token Impact**: Reduces output token consumption from ~1,200 tokens to ~60 tokens per edit (a **95% reduction**).

### Invariant 2: Progressive Inspection & Targeted Range Reading
- **Rule**: Never read a multi-hundred-line file without reconnaissance.
- **Workflow**:
  1. Grep for function signatures, symbols, or error messages first.
  2. Inspect only the relevant line range (`StartLine` to `EndLine`).
  3. Expand range only if surrounding architectural context is required.

### Invariant 3: Command Output Hygiene & Log Pruning (`qed exec`)
- **Rule**: Never dump raw test or build outputs into context when the majority of lines represent passing tests.
- **Tool**: Use `node bin/qed-engine.js exec <command>` (or `npx qed exec <command>`):
  - **On Success (Exit 0)**: Collapses hundreds of passing lines into a single verified status line:
    ```text
    ✓ PASS [exit 0]: 48 tests passed in 1.4s
    ```
    *(Consumes 5 tokens instead of 4,000).*
  - **On Failure (Exit != 0)**: Filters out all passing noise, preserves the failing assertion and relevant stacktrace, and truncates excess noise beyond 40 lines.

### Invariant 4: Machine Verification Density (`qed check --compact`)
- **Rule**: Automated pre-commit gates and verification loops must run with `--compact` (or `--ai`).
- **Format**:
  - Success returns a dense 3-token confirmation:
    ```text
    OK (0 violations)
    ```
  - Violations are reported in single-line machine records:
    ```text
    ERR QED004 src/app.ts:12: 'as any' cast -> use typed interface or unknown
    WARN QED002 src/log.ts:5: console.log -> use logger.info
    ```
  - Eliminates human ASCII borders and multi-line headers, saving 85% of token overhead.

### Invariant 5: Context-Gated Modular Rules (Progressive Disclosure)
- **Rule**: Avoid monolith rule files. Load domain rules on-demand:
  - **Core Constitution (<400 tokens)**: Always active.
  - **Frontend Rules**: Activated only when touching UI extensions (`.tsx`, `.jsx`, `.html`, `.vue`, `.svelte`).
  - **Backend Rules**: Activated only when touching server source (`.ts`, `.py`, `.go`, `.rs`).
  - **Database Rules**: Activated only when touching schema or migrations (`.sql`, `migrations/*`).

---

## 3. Tooling & Auditing

### Measuring Context Budget (`qed tokens`)

Run the built-in auditor to inspect instruction file weight across your project:

```bash
npx qed tokens
# or
node bin/qed-engine.js tokens
```

**Output Example**:
```text
==========================================================
 Q.E.D. Token Footprint & Context Budget Auditor
 Evidence Before Assertions
==========================================================
Target: /workspace/project

Discovered Instruction Files:
  - .cursor/rules/00-constitution.mdc        312 tokens (1248 chars)
  - CLAUDE.md                                420 tokens (1680 chars)

----------------------------------------------------------
Per-Turn Rule Tax:      732 tokens
20-Turn Session Tax:    14,640 tokens
Context Efficiency:     EXCELLENT (<1000 tokens)
----------------------------------------------------------
```

---

## 4. Benchmark: Full vs. Token-Optimized Session

| Metric | Unmanaged Baseline | Q.E.D. Context Economics | Improvement |
| :--- | :--- | :--- | :--- |
| **System Rules (per turn)** | 4,500 tokens | 420 tokens (Lite) | **-90.6%** |
| **Test Verification Output** | 3,800 tokens | 6 tokens (`qed exec`) | **-99.8%** |
| **File Edit (3-line fix in 400L file)** | 950 tokens | 45 tokens (Surgical) | **-95.2%** |
| **Linter Verification Pass** | 120 tokens | 3 tokens (`--compact`) | **-97.5%** |
| **20-Turn Session Footprint** | ~180,000 tokens | ~28,000 tokens | **~84% Savings** |
