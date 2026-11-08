---
name: using-qed
description: Use when starting any conversation, turn, or task involving software development, debugging, code modification, architecture, or verification — mandates Q.E.D. High-Assurance Engineering Standard (Quod Erat Demonstrandum: Evidence Before Assertions), Mode A escalation, search-before-create, blast radius calculation, and mechanical verification gate.
---

<EXTREMELY-IMPORTANT>
You are permanently governed by the Q.E.D. High-Assurance Runtime (Quod Erat Demonstrandum: Evidence Before Assertions).
- Quality > Speed: Never write production code on unverified assumptions.
- Evidence Before Assertions: Run tests and verify real terminal output before marking tasks done.
- Root Cause Only: No empty catch blocks, no arbitrary timeouts, no loose `any` casts.
- Permanent Invariant: Even on casual, short user prompts ("fix this", "add button", "why is this failing"), Mode A applies by default.
</EXTREMELY-IMPORTANT>

## Mandatory Step 0: Project Grounding & Reconnaissance

Before modifying code or making architectural assertions:
1. **Check for `.qed/BRIEF.md`**:
   - If `.qed/BRIEF.md` exists in the repository root or `.qed/` directory, **you MUST read it first**.
   - It contains the project's discovered entrypoints, primary data flow, Earned Complexity Tier, known debt findings, and the **Anti-Duplication Atlas**.
2. **If `.qed/BRIEF.md` is missing**:
   - Run `qed:qed-reconnaissance` or execute `npx qed init --explore` in the terminal to gain situational awareness.

## The 5 Core Invariants

### 1. Zero Speculation (Empirical Grounding)
- Never guess API contracts, backend shapes, or internal types.
- Grep existing callers and trace runtime schemas before writing client or integration code.

### 2. Search Before You Create (Anti-Duplication)
- Grep the codebase and inspect the Anti-Duplication Atlas in `.qed/BRIEF.md` before creating any helper, utility, or wrapper (`formatDate`, `clamp`, `fetchWithRetry`, logger wrapper).
- Never duplicate existing abstractions.

### 3. Calculate Blast Radius
- Before changing shared functions, types, or schemas, identify direct callers and indirect API/database consumers.
- Use `qed:qed-blast-radius` for high-impact refactors.

### 4. Reproduction First (Red -> Green)
- For every bugfix or new feature: write a concrete reproduction test demonstrating the defect or requirement.
- Verify the test fails (Red) before writing implementation code.
- Implement root-cause fix.
- Verify the test passes (Green).

### 5. Mechanical Verification Gate
- Words alone mean nothing. You MUST run `qed check` (or repo test suites) in the terminal and provide real stdout as empirical proof before claiming completion.

## Skill Routing

- **Investigating bugs, test failures, or crashes** → `qed:qed-debug` or `qed:systematic-debugging` (empirical facts, backward data tracing, reproduction test first).
- **Entering an unfamiliar repository** → `qed:qed-reconnaissance` (explore entrypoints, debt, anti-duplication map).
- **Planning changes to shared contracts** → `qed:qed-blast-radius` (identify callers & affected boundaries).
- **Deep engineering task or complex refactor** → `qed:qed-boost` (iterative design, red-green loop, rigor).
- **Finishing work or preparing PR** → `qed:qed-verify` (typecheck, lint, full test suite, diff reconciliation).
- **Reviewing code or PR diff** → `qed:qed-review` (adversarial audit, 3 AM test, 4 mandatory states).
