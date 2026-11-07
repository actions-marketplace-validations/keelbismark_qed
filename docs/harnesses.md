# Supported Harnesses & Platform Integration Guide
*Part of the Q.E.D. Engineering Framework*

This document provides the complete integration matrix and setup reference for all 20 supported AI coding environments.

---

## 1. Quick Harness Directory

| Harness | Primary Config | Native Features |
| :--- | :--- | :--- |
| **Cursor AI** | `.cursorrules`, `.cursor/rules/*.mdc` | Modern MDC rules with YAML frontmatter (`globs`, `alwaysApply: true`) |
| **Claude Code** | `CLAUDE.md`, `.claude/skills/`, `.claude/commands/` | Native slash commands (`/boost`, `/qed-verify`), plugin manifest |
| **Google Antigravity** | `GEMINI.md`, `.antigravity-plugin/plugin.json` | Autonomous multi-agent directives, marketplace bundle |
| **Gemini CLI** | `GEMINI.md`, `gemini-extension.json` | Extension manifest with generalist subagent mappings |
| **OpenAI Codex** | `CODEX.md`, `AGENTS.md`, `.codex-plugin/` | Codex App & CLI manifest with AGENTS.md conventions |
| **Moonshot Kimi Code** | `KIMI.md`, `.kimi-plugin/plugin.json` | Plugin manifest with automatic `sessionStart` hook |
| **Pi Coding Agent** | `PI.md`, `package.json`, `.pi/extensions/qed.ts` | In-process extension with compaction ordering preservation |
| **Nous Hermes** | `HERMES.md`, `.hermes-plugin/__init__.py` | Python hook `pre_llm_call(**kwargs)` with turn-1 injection |
| **Muse** | `MUSE.md`, `.muse-plugin/plugin.json` | Marketplace manifest and `SessionStart` hooks |
| **Cognition Devin** | `DEVIN.md`, `.devin-plugin/plugin.json` | Devin CLI playbook and runtime guardrails |
| **Factory Droid** | `DROID.md`, `.agents/plugins/marketplace.json` | Marketplace registration and workspace rules |
| **xAI Grok Build CLI** | `GROK.md`, `.grok-plugin/plugin.json` | Grok CLI plugin configuration |
| **Alibaba Qwen Code** | `QWEN.md`, `.qwenrules` | CLI and IDE extension rules |
| **OpenCode** | `opencode.json`, `.opencoderules`, `plugins/qed.js` | In-process plugin supporting V1 (`transform`) and V2 (`setup`) |
| **DeepSeek (dsh / Continue)** | `DEEPSEEK.md`, `.deepseekrules`, `.continue/` | R1 Chain-of-Thought directives and Continue slash commands |
| **Cline** | `.clinerules` | Autonomous agent rules and zero-leak secrets policy |
| **Roo Code** | `.roomodes`, `.clinerules` | 3 custom modes: Architect, TDD Engineer, Reviewer |
| **Windsurf Cascade** | `.windsurfrules`, `.windsurf/workflows/*.md` | Interactive workflows (`qed-boost`, `qed-tdd-cycle`) |
| **Aider** | `.aider.conf.yml`, `.aider.conventions.md` | Auto-testing (`auto-test: true`), Conventional Commits automation |
| **GitHub Copilot** | `.github/copilot-instructions.md`, prompts | Reusable prompt files (`qed-boost.prompt.md`, `qed-spec.prompt.md`) |

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
