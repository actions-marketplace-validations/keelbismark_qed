# Q.E.D. Getting Started Guide
> Quod Erat Demonstrandum: Evidence Before Assertions.

This is the practical, step-by-step guide for software engineers and autonomous agents to install Q.E.D., onboard projects, and pair-program under the High-Assurance Runtime.

---

## 1. What is Q.E.D. in 30 Seconds

Q.E.D. is not a passive markdown prompt. It is a **deterministic engineering runtime and mechanical gatekeeper** for AI coding assistants (Google Antigravity, Cursor, Claude Code, Windsurf, Copilot, Codex, etc.).

It eliminates the three primary pathologies of generative coding:
1. **Hallucination & Guessing (Zero Speculation)**: Agents must rely on verified runtime facts, not unverified assumptions.
2. **Reinventing the Wheel (Anti-Duplication Radar)**: Agents must discover and reuse existing helpers before writing new utilities.
3. **"Trust Me, It Works" (Verification Gate)**: Any agent assertion of task completion is void without real terminal test stdout.

---

## 2. Step 1: Global Installation (Once per Machine)

To make the `qed` CLI available in your terminal and register the Q.E.D. plugin and skills across your IDEs:

### Option A: Via npm
```bash
npm install -g qed-standard
```

### Option B: Via Repository Installer
```powershell
# Windows PowerShell
.\install.ps1 -Target global
```
```bash
# Linux / macOS / Git Bash
./install.sh --target global
```

**What this configures:**
- Deploys global agent constitutions (`~/.gemini/GEMINI.md`, `~/.cursorrules`, `~/.claude/CLAUDE.md`).
- Installs the native Q.E.D. plugin with `SessionStart` hooks and skills into `~/.gemini/config/plugins/qed`.
- Puts the `qed` executable on your system `PATH`.

---

## 3. Step 2: Onboarding a Project (`qed init`)

Inside any repository (new or legacy), run:

```bash
qed init
```
*(Or without global installation: `npx qed-standard init`)*

This runs in **~15–30 milliseconds** and executes 6 onboarding phases:

1. **Stack Telemetry**: Identifies languages (TypeScript/JS, Go, Rust, Python, etc.), package managers, frameworks, and test runners.
2. **Earned Complexity Profile**: Measures non-blank source lines (SLOC), file density, and assigns the appropriate Earned Complexity Tier:
   - `Tier 1 (Utility / CLI / Script)`: Under 1,500 SLOC (flat idiom, minimal layers).
   - `Tier 2 (Service / Application)`: 1,500 – 20,000 SLOC (modular, bounded LRU caches).
   - `Tier 3 (Platform / Multi-tenant)`: Over 20,000 SLOC (sovereign domains).
3. **Pre-Q.E.D. Debt Detector ("Насрано")**: Mechanically identifies structural liabilities:
   - Monolithic God-Files (> 600–1,000 lines or > 35% of codebase).
   - Unearned Enterprise Bloat (`domain/`, `repositories/` in small scripts).
   - Untested Codebases (0 test files for projects > 300 SLOC).
4. **Anti-Duplication Atlas**: Scans `utils/`, `helpers/`, `lib/`, `pkg/` and extracts exported symbols so agents never recreate existing utilities.
5. **Codebase Passport & Config**:
   - Generates `.qed/BRIEF.md` (instant situational awareness for agents on Turn 0).
   - Creates `.qedrc.json` tailored to stack ignore patterns and tier rules.
   - Installs matching IDE adapters (Cursor, Claude, Antigravity).
   - Injects the official Q.E.D. badge into `README.md`.
6. **Git Verification Gate**: Installs `.git/hooks/pre-commit` (`qed check`) and `.git/hooks/pre-push` (`qed test`).

> **Tip:** To display the full codebase brief directly in your terminal, run:
> ```bash
> qed init --explore
> ```

---

## 4. Step 3: Pair-Programming with Agents under Q.E.D.

Thanks to the `SessionStart` hook and Turn-0 Cognitive Priming, **you never need to paste long instruction prompts**.

### The Keyword Trigger
To enforce maximum rigor on any task, mention **"qed"** in your prompt:
> *"Add the wallet debit endpoint following qed"*  
> *"Fix this authentication bug under qed"*

The agent immediately locks into **Mode A (Quality > Speed)**:
1. Consults `.qed/BRIEF.md` and checks existing helpers.
2. Assesses the blast radius of proposed edits.
3. Writes a failing reproduction test (Red).
4. Implements root-cause remediation (Green).
5. Executes the Mutation Check.
6. Runs `qed check` in the terminal and provides real terminal output as proof.

### Scenario 1: Investigating Bugs or System Crashes
You ask:
> *"Why did my PC restart unexpectedly?"* or *"Fix this 500 error on checkout"*

**What the Q.E.D. agent does:**
- Activates `systematic-debugging` / `qed-debug`.
- Gathers physical telemetry (dumps, Event IDs 41/1074/6008, stack traces, exit codes).
- Traces data flow backward to the original source of corruption.
- Creates a reproducible failing test before touching production code.
- Remediates root causes without band-aids (no empty catch blocks, no loose `any`).

### Scenario 2: Building a Feature
You ask:
> *"Implement date range filtering for orders"*

**What the Q.E.D. agent does:**
- Consults the Anti-Duplication Atlas: reuses existing date/time utilities.
- Implements all 4 Mandatory States: Empty, Loading, Error (with retry), and Degraded.
- Adheres to the 3 AM Test: early return guards, descriptive intermediate variables.

---

## 5. Step 4: CLI Commands Reference

All commands execute lightning-fast (5–15ms) with zero external runtime dependencies:

| Command | Purpose |
| :--- | :--- |
| `qed init [path]` | Onboard project: detect stack, Earned Complexity Tier, Anti-Duplication Atlas, BRIEF.md, and hooks |
| `qed init --explore` | Onboard and display full Agent Reconnaissance Brief directly to stdout |
| `qed check [path]` | Verify codebase against all 16 mechanical Q.E.D. invariants |
| `qed check --strict` | Strict verification (warnings treated as fatal errors) |
| `qed check --compact` | Ultra-dense single-line output (ideal for LLM context budgets) |
| `qed doctor` | Audit repository health: Git, hooks, adapter drift, REA, CUA, remote CI |
| `qed hook` | Install or repair Git hooks `pre-commit` and `pre-push` |
| `qed update` | Synchronize installed project adapters with latest upstream standard |
| `qed update --global` | Synchronize global user adapters and plugin configs |
| `qed test` | Execute the full multi-platform verification test suite |

---

## 6. Verification Checklist Before Marking Work Done

Before approving an agent's PR or committing to main:

- [ ] Run `qed check` in terminal $\rightarrow$ **100% CLEAN (0 violations)**.
- [ ] Run application test suite (`npm test`, `pytest`, `go test ./...`) $\rightarrow$ all tests green.
- [ ] Review `git diff`: zero leftover `console.log`, empty catch blocks, or loose `as any`.
- [ ] Git `pre-commit` hook passed automatically.
