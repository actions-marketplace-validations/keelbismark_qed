<div align="center">

# Q.E.D.
### *Quod Erat Demonstrandum*
**The High-Assurance Engineering Framework for Autonomous Coding Agents**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Standard: High--Assurance](https://img.shields.io/badge/Standard-High--Assurance-emerald.svg)](core/CONSTITUTION.md)
[![Agents: Universal](https://img.shields.io/badge/Agents-Antigravity%20%7C%20Cursor%20%7C%20Claude%20%7C%20Windsurf%20%7C%20Copilot-purple.svg)](adapters/)

*«Evidence Before Assertions» — Turning AI pair-programmers into disciplined Staff Engineers.*

[English](README.md) • [Конституция (RU/EN)](core/CONSTITUTION.md) • [Quickstart](#-quickstart) • [Core Superpowers](#-the-5-unique-superpowers)

</div>

---

## 🎯 What is Q.E.D.?

**Q.E.D.** (*Latin: Quod Erat Demonstrandum — "Which was to be demonstrated"*) is an open-source engineering standard and operational protocol for AI-assisted software development.

Most AI coding assistants suffer from **"vibe coding"**: they generate code that compiles and looks superficially correct, but silently rots the codebase with duplicate utilities, untested edge cases, breaking contract changes, and zero automated verification.

Q.E.D. synthesizes the best ideas from **GitHub Spec-Kit**, **obra/superpowers**, and **BMad Method** into a unified, battle-tested standard that forces AI agents to adhere to rigorous software engineering discipline:

1. **No Code Without Verification**: Never claim a task is complete without running real tests and showing execution evidence.
2. **Root Cause Only**: Complete ban on hacky `setTimeout`, empty `catch` blocks, or loose `any` type casts.
3. **Dual Execution Modes**: Production mode (`Quality > Speed`) by default; instant prototype mode (`Speed > Quality`) on-demand.

---

## ⚡ The 5 Unique Superpowers of Q.E.D.

Unlike generic prompt collections, Q.E.D. introduces 5 distinct engineering mechanisms designed to protect real-world production codebases:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       THE 5 PILLARS OF Q.E.D.                               │
├──────────────────────────┬──────────────────────────────────────────────────┤
│ 1. Blast Radius Analysis │ Calculates direct callers & indirect API/DB risk │
│                          │ before modifying existing shared code.           │
├──────────────────────────┼──────────────────────────────────────────────────┤
│ 2. Anti-Duplication      │ "Search Before You Create": greps codebase to    │
│    Radar                 │ prevent duplicate helpers, types, and hooks.     │
├──────────────────────────┼──────────────────────────────────────────────────┤
│ 3. The 4 Mandatory       │ Ban on Happy-Path-only code. Every flow must     │
│    States                │ handle Empty, Loading, Error, and Degraded.      │
├──────────────────────────┼──────────────────────────────────────────────────┤
│ 4. The "3 AM Test"       │ Cognitive ergonomics: flat guard clauses, early  │
│                          │ returns, descriptive names, zero opaque one-line │
│                          │ functional acrobatics.                           │
├──────────────────────────┼──────────────────────────────────────────────────┤
│ 5. The Chaos Monkey      │ Adversarial testing: rapid double-clicks (500ms),│
│    Test                  │ 5MB payloads, hostile RTL/Unicode, abort states. │
└──────────────────────────┴──────────────────────────────────────────────────┘
```

---

## 📊 Comparison Matrix

| Capability | Q.E.D. | GitHub Spec-Kit | obra/superpowers | BMad Method | Vanilla AI |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Evidence Before Assertions** | ✅ **Strict** | ⚠️ Partial | ✅ **Strict** | ⚠️ Partial | ❌ None |
| **Blast Radius Analysis** | ✅ **Built-in** | ❌ None | ❌ None | ❌ None | ❌ None |
| **Anti-Duplication Radar** | ✅ **Mandatory** | ❌ None | ❌ None | ❌ None | ❌ None |
| **4 States (Empty/Load/Err/Degraded)**| ✅ **Mandatory** | ⚠️ Partial | ❌ None | ⚠️ Partial | ❌ None |
| **The "3 AM Test" (Anti-Slop)** | ✅ **Enforced** | ❌ None | ⚠️ Partial | ❌ None | ❌ None |
| **The Chaos Monkey Test** | ✅ **Standard** | ❌ None | ⚠️ Partial | ❌ None | ❌ None |
| **Ironclad TDD (Red-Green-Refactor)** | ✅ **Strict** | ❌ None | ✅ **Strict** | ⚠️ Optional | ❌ None |
| **Token & Overhead Efficiency** | 🚀 **Lean** | 🚀 **Lean** | 🚀 **Lean** | 🐢 Verbose | ⚡ Uncontrolled |
| **Cross-Agent Drop-in Support** | ✅ **Universal**| ⚠️ CLI-only | ⚠️ Harness | ⚠️ Cursor/Claude | ❌ None |

---

## 🔄 The Q.E.D. Lifecycle

```mermaid
flowchart TD
    A["Task Input"] --> B{"Mode Selection"}
    B -->|"Speed Mode (On-Demand)"| B1["Immediate Working Prototype"]
    B1 --> B2["List Technical Debt & Shortcuts"]
    
    B -->|"Production Mode (Default)"| C["Phase 1: Spec & Blast Radius"]
    C --> C1["Anti-Duplication Search"]
    C1 --> C2["Blast Radius Impact Calculation"]
    C2 --> C3["Binary Acceptance Criteria"]
    
    C3 --> D["Phase 2: Adversarial QA & 4 States"]
    D --> D1["Empty / Loading / Error / Degraded"]
    D1 --> D2["Chaos Monkey Edge Cases"]
    
    D2 --> E["Phase 3: Ironclad TDD"]
    E --> E1["Write Failing Test (RED)"]
    E1 --> E2["Minimal Fix (GREEN)"]
    E2 --> E3["The 3 AM Test Refactoring"]
    
    E3 --> F["Phase 4: Verification Gate"]
    F --> F1["Automated Linter & Typecheck"]
    F --> F2["Full Regression Test Suite"]
    F1 & F2 --> G["Atomic Conventional Commit (Q.E.D.)"]
```

---

## 🚀 Quickstart

### 1. One-Click Global Installation (PowerShell / Windows)
To enforce Q.E.D. across **all projects and sessions** in Google Antigravity:
```powershell
irm https://raw.githubusercontent.com/keelbismark/qed/main/install.ps1 | iex -args "-Target global"
```

### 2. One-Click Local Repository Installation (Linux / macOS)
Drop Q.E.D. configurations into your current Git repository:
```bash
curl -fsSL https://raw.githubusercontent.com/keelbismark/qed/main/install.sh | bash
```

### 3. Manual Installation by Agent

* **Google Antigravity**: Copy [`adapters/antigravity/GEMINI.md`](adapters/antigravity/GEMINI.md) to `~/.gemini/GEMINI.md` (machine-wide) or to your repository root.
* **Cursor AI**: Copy [`adapters/cursor/.cursorrules`](adapters/cursor/.cursorrules) to `.cursorrules` in your repository root.
* **Claude Code**: Copy [`adapters/claude-code/CLAUDE.md`](adapters/claude-code/CLAUDE.md) to `CLAUDE.md` in your repository root.
* **Windsurf**: Copy [`adapters/windsurf/.windsurfrules`](adapters/windsurf/.windsurfrules) to `.windsurfrules`.
* **GitHub Copilot**: Copy [`adapters/copilot/copilot-instructions.md`](adapters/copilot/copilot-instructions.md) to `.github/copilot-instructions.md`.

---

## 📂 Repository Structure

```text
qed/
├── README.md               # Framework documentation and manifesto
├── LICENSE                 # MIT License
├── install.ps1             # PowerShell 1-click installer
├── install.sh              # Bash 1-click installer
├── core/                   # The Core Q.E.D. Specifications
│   ├── CONSTITUTION.md     # Universal Engineering Constitution
│   ├── blast-radius.md     # Blast Radius Analysis Protocol
│   ├── anti-duplication.md # Anti-Duplication Radar
│   ├── chaos-monkey.md     # The Chaos Monkey Test Protocol
│   └── three-am-test.md    # The 3 AM Readability Test
├── adapters/               # Drop-in configuration for AI Agents
│   ├── antigravity/        # Google Antigravity (GEMINI.md)
│   ├── cursor/             # Cursor (.cursorrules)
│   ├── claude-code/        # Claude Code (CLAUDE.md)
│   ├── windsurf/           # Windsurf (.windsurfrules)
│   └── copilot/            # GitHub Copilot (copilot-instructions.md)
├── templates/              # Standard Artifact Templates
│   ├── SPEC_TEMPLATE.md    # Specification Template (What & Why)
│   ├── ADR_TEMPLATE.md     # Architecture Decision Record
│   └── PLAN_TEMPLATE.md    # Technical Blueprint & Task Breakdown
└── examples/
    └── full-lifecycle-walkthrough.md
```

---

## 📜 The Core Directive

> **Evidence Before Assertions.**
> A task is not done when the code is written. A task is done when the test has run, the output has been verified, the edge cases have been assaulted, and the commit is clean.

---

## 👤 Author & License

Created by **[KeelBismarck](https://github.com/keelbismark)**.  
Released under the [MIT License](LICENSE).
