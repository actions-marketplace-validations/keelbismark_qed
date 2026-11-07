<div align="center">

# Q.E.D.
### *Quod Erat Demonstrandum*
**The High-Assurance Engineering Framework for Autonomous Coding Agents**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Standard: High--Assurance](https://img.shields.io/badge/Standard-High--Assurance-emerald.svg)](core/CONSTITUTION.md)
[![Harnesses: 20 Platforms](https://img.shields.io/badge/Harnesses-20%20Platforms-purple.svg)](docs/harnesses.md)
[![Agent Entrypoint: llms.txt](https://img.shields.io/badge/Agent-llms.txt-orange.svg)](llms.txt)

*«Evidence Before Assertions» — Turning AI pair-programmers into disciplined Staff Engineers.*

[Human Guide](README.md) • [AI Agent Guide](AI_README.md) • [Constitution](core/CONSTITUTION.md) • [20 Supported Harnesses](docs/harnesses.md) • [Protocols](docs/protocols.md)

</div>

---

## The Problem: AI Codebase Rot

Most AI coding assistants suffer from **"vibe coding"**: they generate code that compiles and looks superficially correct, but silently destroys production codebases:

* **Phantom Fixes**: The agent declares *"I've fixed the bug!"* without ever running a test to see if it reproduces or passes.
* **Code Duplication**: Instead of finding existing project helpers, the agent invents `formatDate()`, `dateUtils.ts`, and `formatDate2()` across 5 directories.
* **Happy-Path Blindness**: Zero handling for empty data, network timeouts, or rate limits.
* **Superficial Workarounds**: Silencing real errors with empty `catch` blocks, arbitrary `setTimeout`, or loose `any` casts.

**Q.E.D.** solves this by enforcing disciplined, high-assurance software engineering habits natively inside your AI coding assistant.

---

## ⚡ The 5 Core Principles

Unlike generic prompt collections, Q.E.D. enforces 5 practical engineering protocols:

1. **Blast Radius Analysis**: Before modifying shared code, the agent must map all direct callers and assess API/DB regression risks.
2. **Anti-Duplication Radar**: *"Search Before You Create"*. Mandatory search for existing helpers, types, and hooks before writing new ones.
3. **The 4 Mandatory States**: Complete ban on Happy-Path-only code. Every feature must explicitly handle **Empty**, **Loading**, **Error (with retry)**, and **Degraded/Offline** states.
4. **The "3 AM Test"**: Code must be understandable by an exhausted engineer at 3:00 AM. Guard clauses, early returns, clear intermediate variables, zero opaque 6-level chained functional one-liners.
5. **The Chaos Monkey Test**: Adversarial test cases for hostile real-world inputs: 10 rapid duplicate clicks within 500ms, oversized payloads, RTL/Unicode strings, and aborted requests.

---

## 🚀 Quickstart

### One-Click Installation

**Windows (PowerShell):**
```powershell
iex "& { $(irm https://raw.githubusercontent.com/keelbismark/qed/main/install.ps1) } -Harness all"
```

**Linux / macOS (Bash):**
```bash
curl -fsSL https://raw.githubusercontent.com/keelbismark/qed/main/install.sh | bash
```

*Want to install only for Cursor, Claude Code, or another specific tool? See the [Harness Integration Guide](docs/harnesses.md).*

---

## 🛠️ Supported Harnesses (20 Platforms)

Q.E.D. provides native drop-in configurations tailored to the execution models of 20 coding environments:

| Category | Supported Environments |
| :--- | :--- |
| **IDEs & Desktop Agents** | Cursor AI, Windsurf Cascade, Roo Code, Cline, GitHub Copilot |
| **CLI & Terminal Agents** | Claude Code, Aider, OpenCode, Gemini CLI, DeepSeek Harness (`dsh`), OpenAI Codex, Grok Build CLI, Qwen Code, Kimi Code |
| **Autonomous & Cloud** | Google Antigravity, Cognition Devin, Factory Droid, Nous Hermes, Inflection Pi, Muse |

👉 **[View Full Harness Details & Manual Setup Instructions →](docs/harnesses.md)**

---

## 🔄 Dual Execution Modes

Q.E.D. adapts to your current velocity needs:

* **Mode A: Production (DEFAULT: `Quality > Speed`)**  
  Full engineering rigor. Ironclad TDD (Red-Green-Refactor), Blast Radius analysis, Adversarial QA, and full verification before completion.
* **Mode B: Speed Mode (ON-DEMAND: `Speed > Quality`)**  
  Triggered when you explicitly ask for speed (*"quick"*, *"prototype"*, *"draft"*, *"быстро"*, *"набросок"*). Bypasses formal ceremonies to deliver a working proof-of-concept immediately, with an honest list of shortcuts taken.

---

## 📊 Comparison

| Capability | Q.E.D. | GitHub Spec-Kit | obra/superpowers | BMad Method | Vanilla AI |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Evidence Before Assertions** | ✅ **Strict** | ⚠️ Partial | ✅ **Strict** | ⚠️ Partial | ❌ None |
| **Blast Radius Analysis** | ✅ **Built-in** | ❌ None | ❌ None | ❌ None | ❌ None |
| **Anti-Duplication Radar** | ✅ **Mandatory** | ❌ None | ❌ None | ❌ None | ❌ None |
| **4 Mandatory States** | ✅ **Enforced** | ⚠️ Partial | ❌ None | ⚠️ Partial | ❌ None |
| **The "3 AM Test" (Anti-Slop)**| ✅ **Enforced** | ❌ None | ⚠️ Partial | ❌ None | ❌ None |
| **The Chaos Monkey Test** | ✅ **Standard** | ❌ None | ⚠️ Partial | ❌ None | ❌ None |
| **Harness Support** | 🌐 **20 Platforms**| ⚠️ CLI-only | 🌐 20 Platforms | ⚠️ 2 Platforms | ❌ None |
| **Overhead & Token Burn** | 🚀 **Lean** | 🚀 **Lean** | 🚀 **Lean** | 🐢 Verbose | ⚡ Uncontrolled |

---

## 📂 Documentation & Links

* 📘 **[Constitution](core/CONSTITUTION.md)** — The universal engineering rules.
* 🤖 **[AI Agent Guide](AI_README.md)** / **[llms.txt](llms.txt)** — Token-dense entrypoint for LLMs.
* 🛡️ **[Core Protocols](docs/protocols.md)** — Deep dive into Blast Radius, Anti-Duplication, and Chaos Monkey.
* 🔌 **[Harness Integration Guide](docs/harnesses.md)** — Detailed configs for all 20 platforms.
* 📝 **[Templates](templates/)** — Standard templates for Specs, ADRs, and Plans.
* 💡 **[End-to-End Walkthrough](examples/full-lifecycle-walkthrough.md)** — Real-world example of building a production feature under Q.E.D.

---

## 📜 The Core Directive

> **Evidence Before Assertions.**  
> A task is not done when the code is written. A task is done when the test has run, the output has been verified, edge cases have been assaulted, and the commit is clean.

---

## 👤 Author & License

Created by **[KeelBismarck](https://github.com/keelbismark)**.  
Released under the [MIT License](LICENSE).
