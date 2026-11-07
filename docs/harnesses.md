# Supported Harnesses & Platform Integration Guide
*Part of the Q.E.D. Engineering Framework*

This document provides the complete integration matrix and setup reference for all 20 supported AI coding environments.

---

## 1. Quick Harness Directory

| Harness | Primary Config | Lite Manifest (<500 tokens) | Native Features |
| :--- | :--- | :--- | :--- |
| **Cursor AI** | `.cursorrules`, `.cursor/rules/*.mdc` | `.cursorrules.lite` | Modern MDC rules with YAML frontmatter (`globs`, `alwaysApply: true`) |
| **Claude Code** | `CLAUDE.md`, `.claude/skills/` | `CLAUDE.lite.md` | Native slash commands (`/boost`, `/qed-verify`), plugin manifest |
| **Google Antigravity** | `GEMINI.md`, `.antigravity-plugin/` | `GEMINI.lite.md` | Autonomous multi-agent directives, marketplace bundle |
| **Gemini CLI** | `GEMINI.md`, `gemini-extension.json` | `GEMINI.lite.md` | Extension manifest with generalist subagent mappings |
| **OpenAI Codex** | `CODEX.md`, `AGENTS.md`, `.codex-plugin/` | `CODEX.lite.md`, `AGENTS.lite.md` | Codex App & CLI manifest with AGENTS.md conventions |
| **Moonshot Kimi Code** | `KIMI.md`, `.kimi-plugin/plugin.json` | `KIMI.lite.md` | Plugin manifest with automatic `sessionStart` hook |
| **Pi Coding Agent** | `PI.md`, `package.json`, extensions | `PI.lite.md` | In-process extension with compaction ordering preservation |
| **Nous Hermes** | `HERMES.md`, `.hermes-plugin/` | `HERMES.lite.md` | Python hook `pre_llm_call(**kwargs)` with turn-1 injection |
| **Muse** | `MUSE.md`, `.muse-plugin/plugin.json` | `MUSE.lite.md` | Marketplace manifest and `SessionStart` hooks |
| **Cognition Devin** | `DEVIN.md`, `.devin-plugin/plugin.json` | `DEVIN.lite.md` | Devin CLI playbook and runtime guardrails |
| **Factory Droid** | `DROID.md`, `.agents/plugins/` | `DROID.lite.md` | Marketplace registration and workspace rules |
| **xAI Grok Build CLI** | `GROK.md`, `.grok-plugin/plugin.json` | `GROK.lite.md` | Grok CLI plugin configuration |
| **Alibaba Qwen Code** | `QWEN.md`, `.qwenrules` | `QWEN.lite.md`, `.qwenrules.lite` | CLI and IDE extension rules |
| **OpenCode** | `opencode.json`, `.opencoderules` | `OPENCODE.lite.md`, `.opencoderules.lite` | In-process plugin supporting V1 (`transform`) and V2 (`setup`) |
| **DeepSeek (dsh / Continue)** | `DEEPSEEK.md`, `.deepseekrules` | `DEEPSEEK.lite.md`, `.deepseekrules.lite` | R1 Chain-of-Thought directives and Continue slash commands |
| **Cline** | `.clinerules` | `.clinerules.lite` | Autonomous agent rules and zero-leak secrets policy |
| **Roo Code** | `.roomodes`, `.clinerules` | `.roomodes.lite`, `.clinerules.lite` | 3 custom modes: Architect, TDD Engineer, Reviewer |
| **Windsurf Cascade** | `.windsurfrules`, workflows | `.windsurfrules.lite` | Interactive workflows (`qed-boost`, `qed-tdd-cycle`) |
| **Aider** | `.aider.conf.yml`, conventions | `.aider.conventions.lite.md` | Auto-testing (`auto-test: true`), Conventional Commits automation |
| **GitHub Copilot** | `.github/copilot-instructions.md` | `copilot-instructions.lite.md` | Reusable prompt files (`qed-boost.prompt.md`, `qed-spec.prompt.md`) |

---

## 2. Platform-Specific Details

### Cursor AI
* **Legacy rule**: `.cursorrules` placed in project root.
* **Modern MDC rules** (Cursor 0.42+): Placed in `.cursor/rules/*.mdc`. Each file uses strict YAML frontmatter:
  ```yaml
  ---
  description: "Rule description"
  globs: "*"
  alwaysApply: true
  ---
  ```
* **Installed files**:
  - `00-constitution.mdc`
  - `01-blast-radius.mdc`
  - `02-anti-duplication.mdc`
  - `03-tdd-discipline.mdc`
  - `04-three-am-readability.mdc`
  - `05-verification-gate.mdc`

### Claude Code
* **Global / Local config**: `CLAUDE.md`.
* **Skills**: Placed in `.claude/skills/<name>/SKILL.md` (and `skills/<name>/SKILL.md` for plugin compatibility).
* **Slash Commands**: Placed in `.claude/commands/<name>.md`. Accessible in the Claude Code REPL via `/boost`, `/qed-boost`, `/qed-verify`, `/qed-review`, and `/qed-blast-radius`.

### Roo Code & Cline
* **Cline**: Reads `.clinerules` in repository root.
* **Roo Code**: Extends Cline with `.roomodes` declaring 3 distinct engineering personas:
  1. `qed-architect`: Focuses on specifications, user scenarios, and Blast Radius analysis. Edit access restricted to docs/specs.
  2. `qed-tdd`: Implementation specialist bound by the Red-Green-Refactor loop.
  3. `qed-reviewer`: Independent auditor validating code against the 4 states and the 3 AM test.

### DeepSeek Harness (`dsh`) & Continue.dev
* **DeepSeek Reasoning Directives (`DEEPSEEK.md`)**: Instructs DeepSeek-R1 to structure its `<think>` block before generating code:
  1. Search for existing helpers (Anti-Duplication).
  2. Map callers (Blast Radius).
  3. Cover Empty, Loading, Error, and Degraded states.
  4. Write failing test first.
* **Continue.dev**: Configures custom slash commands in `.continue/config.json` and `.continue/prompts/`.

---

## 3. Targeted Installation Examples

```bash
# Install Cursor rules only
./install.sh cursor

# Install Claude Code rules only
./install.sh claude

# Install DeepSeek rules only
./install.sh deepseek

# Install Roo Code rules only
./install.sh roo

# Install for all harnesses locally
./install.sh local all

# Install globally to user home directory
./install.sh global all
```
