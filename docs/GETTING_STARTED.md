# Q.E.D. Quick Start Guide
> Quod Erat Demonstrandum: Evidence Before Assertions.

This guide gets you up and running with Q.E.D. in seconds: one-liner installation, zero-friction project onboarding, and pair-programming with AI coding agents.

---

## ⚡ 1. One-Liner Installation (Once per Machine)

Pick the command for your operating system. No repository cloning or manual building required.

### Windows (PowerShell):
```powershell
irm https://raw.githubusercontent.com/keelbismark/qed/main/install.ps1 | iex
```
*(Or install globally to user profile: `& ([scriptblock]::Create((irm https://raw.githubusercontent.com/keelbismark/qed/main/install.ps1))) -Target global`)*

### macOS / Linux / WSL (Bash):
```bash
curl -fsSL https://raw.githubusercontent.com/keelbismark/qed/main/install.sh | bash -s -- --target global
```

### Or via npm (Node.js 18+):
```bash
npm install -g qed-standard
```

---

## 🚀 2. Onboard Your Project (1 Command)

Navigate to any existing or new repository:

```bash
cd /path/to/your-project
qed init
```
*(Or without installing globally: `npx qed-standard init`)*

### What Q.E.D. does in 50 milliseconds:
1. **Detects your stack**: languages (Rust, Go, TypeScript, Python), frameworks, package manager, and test runner.
2. **Scans for pre-existing debt**: identifies monolithic god-files and untested code.
3. **Builds the Anti-Duplication Atlas**: catalogs existing helpers in `utils/` or `lib/` so agents reuse code instead of duplicating it.
4. **Creates the codebase brief (`.qed/BRIEF.md`)**: the Turn-0 situational briefing read by agents before editing code.
5. **Configures your editor**: installs native rules for Antigravity, Cursor, Claude Code, Codex, and others.
6. **Installs Git defense**: enables `pre-commit` (`qed check`) and `pre-push` (`qed test`) hooks.

> 💡 **Want to inspect the codebase brief and debt report directly in your terminal?**  
> Run:
> ```bash
> qed init --explore
> ```

---

## 💬 3. Daily Pair-Programming with Your Agent

Thanks to `.qed/BRIEF.md` and Turn-0 priming hooks, **you never need to paste massive system prompts**.

Simply add the trigger keyword **"under qed"** or **"following qed"** to your request:

### Example 1: Bug Investigation & Fixing
```text
👤 You:   "Checkout crashes with a 500 error when applying a coupon, find the cause and fix under qed"

🤖 Agent:
  1. Reads .qed/BRIEF.md and invokes systematic-debugging.
  2. Gathers runtime logs and the exact stack trace (zero guessing).
  3. Writes a failing reproduction test coupon_overflow_test (Red).
  4. Fixes the root cause in the billing calculation (Green).
  5. Runs `qed check` in terminal and provides stdout as empirical proof.
```

### Example 2: Building a New Feature
```text
👤 You:   "Add CSV export for the user table following qed"

🤖 Agent:
  1. Checks Anti-Duplication Atlas: reuses existing CSV formatting utilities.
  2. Implements 4 mandatory states: empty, loading skeleton, retryable error, offline/degraded.
  3. Writes clean code passing the "3 AM Test" (early returns, guard clauses).
  4. Runs tests and verifies the mechanical gate.
```

---

## 🛡️ 4. Verification Gate (`qed check`)

Whenever an agent claims work is complete, verify in one command:

```bash
qed check
```

When clean, you'll see:
```text
==========================================================
 Q.E.D. High-Assurance Mechanical Verification Engine
 Evidence Before Assertions
==========================================================
Target: C:\Portfolio\OpenAntigravity

✓ Q.E.D. Verification Gate: 100% CLEAN. Zero violations found.
  All 16 pillars and mechanical invariants satisfied.
```

---

## 📋 Command Cheat Sheet

| Task | Command |
| :--- | :--- |
| **Onboard repository into Q.E.D.** | `qed init` |
| **Inspect codebase passport & debt findings** | `qed init --explore` |
| **Run mechanical verification gate** | `qed check` |
| **Strict gate (warnings treated as errors)** | `qed check --strict` |
| **Audit repository health, hooks, and adapters** | `qed doctor` |
| **Synchronize installed adapters to latest standard** | `qed update` |
| **Reinstall Git hooks** | `qed hook` |
