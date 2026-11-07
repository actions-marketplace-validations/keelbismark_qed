<p align="center">
  <img src="assets/banner.svg" alt="Q.E.D. Banner" width="100%">
</p>

<p align="center">
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-3b82f6.svg?style=flat-square" alt="License: MIT"></a>
  <a href="docs/harnesses.md"><img src="https://img.shields.io/badge/harnesses-20%20platforms-8b5cf6.svg?style=flat-square" alt="Harnesses: 20 Platforms"></a>
  <a href="core/CONSTITUTION.md"><img src="https://img.shields.io/badge/standard-high--assurance-10b981.svg?style=flat-square" alt="Standard: High-Assurance"></a>
  <a href="llms.txt"><img src="https://img.shields.io/badge/agent-llms.txt-f59e0b.svg?style=flat-square" alt="LLM Entrypoint: llms.txt"></a>
</p>

<p align="center">
  <a href="#quickstart">Quickstart</a> •
  <a href="#the-problem">The Problem</a> •
  <a href="#how-it-works">How It Works</a> •
  <a href="#the-5-core-protocols">The 5 Protocols</a> •
  <a href="docs/harnesses.md">20 Platforms</a> •
  <a href="llms.txt">llms.txt</a>
</p>

---

## The Problem

AI pair-programming promised a 10x engineer. In practice, it often feels like reviewing PRs from an overcaffeinated intern:

> *"I've resolved the issue!"* — the agent announces.  
> You pull the branch. It never ran the test. It broke three database queries. It created a second `formatDateHelper.ts` in another folder. And it silenced a fatal error with `catch (e) {}`.

Code generated without discipline is technical debt on compound interest. We call it **codebase erosion**.

**Q.E.D.** (*Latin: "which was to be demonstrated"*) is an open-source engineering standard and configuration layer for AI coding environments. It replaces vibes, guesses, and unverified assumptions with deterministic engineering discipline.

---

## Before & After

```typescript
// [WITHOUT Q.E.D.] Standard AI Output
// Silent error swallowing, loose typing, happy-path assumption, zero tests run
async function checkout(cart: any) {
  try {
    if (cart.items) {
      const total = cart.items.reduce((a: any, b: any) => a + b.price, 0);
      return await api.charge(total); // What if total <= 0? What if user double-clicked?
    }
  } catch (e) {
    console.log("error"); // Swallowed failure. UI hangs indefinitely.
  }
}
```

```typescript
// [WITH Q.E.D.] High-Assurance Output
// Guard clauses, typed contracts, 4 states handled, reproduction test verified RED first
async function checkout(cart: Cart): Promise<CheckoutResult> {
  if (!cart.items || cart.items.length === 0) {
    return { status: "empty", message: "Cart is empty" };
  }
  
  const totalAmount = calculateCartTotal(cart.items); // Reused existing helper (Anti-Duplication)
  if (totalAmount <= 0) {
    throw new InvalidOrderError("Total amount must be greater than zero");
  }

  // Idempotent charge with explicit timeout and retry boundary (Chaos Monkey verified)
  return await paymentGateway.chargeWithIdempotency({
    amount: totalAmount,
    idempotencyKey: cart.idempotencyKey,
  });
}
```

---

## The 5 Core Protocols

Q.E.D. is built on five non-negotiable engineering laws:

### 1. Blast Radius Analysis
> **Rule:** *Look before you leap.*  
Before editing a shared function, model, or schema, the agent must map every caller and evaluate transitive impacts on API contracts, database migrations, and background queues. Changes are tagged **Low**, **Medium**, or **Critical**.

### 2. Anti-Duplication Radar
> **Rule:** *Search before you create.*  
AI agents love inventing new helpers because generating code is cheaper than searching for it. Under Q.E.D., the agent must grep the repository for existing utilities, hooks, and types before writing a single line. Duplicate files like `utils2.ts` or `dateFormatterCustom.ts` are forbidden.

### 3. The 4 Mandatory States
> **Rule:** *No happy-path delusions.*  
Real software runs in a hostile world. Every interface component and backend route must explicitly handle:
* **Empty**: What happens when zero records exist?
* **Loading**: Visual placeholder preventing layout shift (CLS).
* **Error**: Actionable, human-friendly message with a retry trigger.
* **Degraded / Offline**: Graceful fallback under network timeouts.

### 4. The "3 AM Test"
> **Rule:** *Code must be readable by an exhausted engineer during a production outage at 3:00 AM.*  
Guard clauses and early returns over deep nesting. Clear intermediate variables over opaque 6-level chained functional one-liners. Concrete input/output examples in comments for non-obvious algorithms.

### 5. The Chaos Monkey Test
> **Rule:** *Assault the code with real-world hostility.*  
Automated test suites must include adversarial edge cases: 10 rapid duplicate clicks within 500ms (debouncing), 5MB+ payloads, complex Unicode/RTL strings, and mid-flight network drops.

---

## How It Works

Q.E.D. enforces a deterministic 4-phase verification loop on every task:

<p align="center">
  <img src="assets/pipeline.svg" alt="Q.E.D. Workflow Pipeline" width="100%">
</p>

### Execution Example

```text
$ qed "Add idempotent debit to wallet API"

[1/4] ANTI-DUPLICATION & BLAST RADIUS
      Searching codebase for existing wallet balance helpers...
      -> Found 'db.wallets.updateBalance()' in src/services/wallet.ts (reused).
      -> Callers: CheckoutController, SubscriptionCron (Risk: Medium).

[2/4] IRONCLAD TDD (RED STAGE)
      Writing reproduction test: test/wallet.test.ts:42
      $ npm test -- test/wallet.test.ts
      FAIL: Concurrent duplicate debit executed twice. Expected 1 charge.
      -> Failure verified.

[3/4] ROOT CAUSE FIX (GREEN STAGE)
      Adding unique idempotencyKey constraint & distributed lock...
      $ npm test -- test/wallet.test.ts
      PASS: 2 concurrent calls -> 1 debit, 1 cached response.

[4/4] VERIFICATION GATE & 3 AM AUDIT
      -> Flattened nested if/else into early guard clauses.
      -> Typecheck: OK (0 errors).
      -> Linter: OK (0 warnings).
      -> Full test suite: 64/64 passed (0 regressions).
      -> Commit: feat(wallet): implement idempotent debit with distributed lock
```

---

## Quickstart

Install Q.E.D. into your project in seconds:

### Windows (PowerShell)
```powershell
irm https://raw.githubusercontent.com/keelbismark/qed/main/install.ps1 | iex
```

### Linux / macOS (Bash)
```bash
curl -fsSL https://raw.githubusercontent.com/keelbismark/qed/main/install.sh | bash
```

### Targeted Tool Setup
Install configurations for a specific harness only:

```bash
./install.sh cursor      # Cursor AI (.cursorrules & modern .cursor/rules/*.mdc)
./install.sh claude      # Claude Code (CLAUDE.md, slash commands, skills)
./install.sh deepseek    # DeepSeek Harness & Continue.dev
./install.sh roo         # Roo Code custom modes (Architect, TDD, Reviewer)
./install.sh global all  # Machine-wide installation across user profile
```

---

## 20 Supported Platforms

Q.E.D. provides native drop-in adapters and configuration files tailored to each tool's architecture:

| Environment | Primary File | Key Features |
| :--- | :--- | :--- |
| **Cursor AI** | `.cursorrules`, `.cursor/rules/*.mdc` | Modern MDC rules with YAML frontmatter for TDD and Blast Radius |
| **Claude Code** | `CLAUDE.md`, `.claude/commands/` | Slash commands (`/boost`, `/qed-verify`, `/qed-review`), skills |
| **Google Antigravity** | `GEMINI.md`, plugin manifest | Multi-agent orchestration, Evidence Before Assertions |
| **DeepSeek (dsh & Continue)**| `DEEPSEEK.md`, `.dsh/`, `.continue/` | R1 Chain-of-Thought directives, safety presets, slash commands |
| **Roo Code & Cline** | `.roomodes`, `.clinerules` | 3 custom roles: `Architect`, `TDD Engineer`, and `Reviewer` |
| **Windsurf Cascade** | `.windsurfrules`, workflows | Interactive workflows (`qed-boost`, `qed-tdd-cycle`) |
| **Aider** | `.aider.conf.yml` | Auto-test on commit (`auto-test: true`), Conventional Commits |
| **GitHub Copilot** | `copilot-instructions.md`, prompts | Instructions and prompt templates (`qed-boost`, `qed-spec`) |
| **OpenCode** | `opencode.json`, `plugins/qed.js` | In-process V1/V2 lifecycle plugin, sandbox constraints |
| **Codex, Grok, Kimi, Pi, Devin...** | Native manifests & configs | Full parity across 20 environments |

[View Full Harness Details & Manual Configurations →](docs/harnesses.md)

---

## Dual Execution Modes

Q.E.D. adapts to your velocity requirements:

* **Production Mode (Default: `Quality > Speed`)**  
  Full engineering rigor. Red-green TDD cycles, blast radius calculation, adversarial testing, and verification before declaring work complete.
* **Speed Mode (On-Demand: `Speed > Quality`)**  
  Triggered when you explicitly ask for speed (*"quick"*, *"prototype"*, *"draft"*, *"быстро"*, *"набросок"*). Delivers a working proof-of-concept immediately, with an honest report on shortcuts taken.

---

## Comparison

| Capability | Q.E.D. | GitHub Spec-Kit | obra/superpowers | BMad Method | Default AI |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Evidence Before Assertions** | Enforced | Partial | Enforced | Partial | None |
| **Blast Radius Analysis** | Yes | No | No | No | No |
| **Anti-Duplication Radar** | Mandatory | No | No | No | No |
| **4 Mandatory States** | Enforced | Partial | No | Partial | None |
| **3 AM Readability Test** | Enforced | No | Partial | No | None |
| **Chaos Monkey Edge Cases** | Standard | No | Partial | No | None |
| **Supported Platforms** | 20 | 1 | 20 | 2 | None |
| **Context Overhead** | Minimal | Minimal | Minimal | Heavy | Uncontrolled |

---

## Documentation

* **[Universal Constitution](core/CONSTITUTION.md)** — Foundational rules governing agent behavior.
* **[Git & Versioning Philosophy](core/git-and-versioning.md)** — Git change ledger vs. SemVer/CalVer/ZeroVer/Continuous trust contracts.
* **[Adaptive Architecture & Structure](core/adaptive-architecture.md)** — Anti-template dogmatism, earned complexity, and native ecosystem idioms.
* **[Naming Philosophy & Semantics](core/naming-philosophy.md)** — Scope-proportional length, positive predicates, and semantic contract verbs.
* **[Testing Philosophy & Standards](core/testing-philosophy.md)** — Zero placebo mocks, boundary value matrix, and mutation-tested determinism.
* **[Hygiene & Pre-Commit Sanitization](core/hygiene-and-cleanup.md)** — Zero-debug print invariant, scratch scaffolding purge, and dead code elimination.
* **[Comment Philosophy & Anti-Noise](core/comment-philosophy.md)** — Ban on syntax echo noise, Why-over-What rules, and high-assurance docstrings.
* **[AI Agent Guide (llms.txt)](llms.txt)** — High-density machine entrypoint for LLMs.
* **[Documentation & Visual Standards](core/documentation-and-visuals.md)** — Human vs. AI separation, responsive SVG graphics, and anti-slop rules.
* **[Core Protocols](docs/protocols.md)** — In-depth guide to Blast Radius, Anti-Duplication, and Chaos Monkey.
* **[Harness Guide](docs/harnesses.md)** — Setup reference for all 20 platforms.
* **[Templates](templates/)** — Templates for Specs, Architecture Decision Records (ADRs), and Plans.
* **[End-to-End Walkthrough](examples/full-lifecycle-walkthrough.md)** — Real-world example building a feature under Q.E.D.

---

## License

MIT License. Copyright (c) 2026 KeelBismarck.
