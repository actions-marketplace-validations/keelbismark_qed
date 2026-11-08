![Q.E.D. — Evidence before assertions.](assets/banner.svg)

[English](README.md) · [Русский](README.ru.md) · [简体中文](README.zh-CN.md)

# Better code needs evidence, not confidence.

**Q.E.D. is an engineering standard and a zero-dependency CLI for AI-assisted development.** Give your coding agent explicit rules, then check a practical subset of those rules with a mechanical verification gate.

[CI status](https://github.com/keelbismark/qed/actions/workflows/ci.yml) · [npm package](https://www.npmjs.com/package/qed-standard) · [MIT license](LICENSE)

[Get started](#get-started) · [Guide](docs/GETTING_STARTED.md) · [How it works](#how-it-works) · [CLI reference](#cli-reference) · [Documentation](#documentation)

---

## “Fixed” is not the same as verified.

An agent can produce a convincing explanation while leaving a hanging request, a swallowed exception, or a duplicate helper behind. Q.E.D. makes the expectations explicit: search before creating, reproduce before fixing, and run checks before claiming success.

**Before — an unbounded network request**

```js
const response = await fetch(url);
```

**After — an explicit deadline**

```js
const response = await fetch(url, {
  signal: AbortSignal.timeout(5000),
});
```

The CLI checks for a missing timeout/signal pattern. It does **not** prove that the endpoint is secure or the response is valid: status handling, schema validation, and behavior tests still belong to your application.

| Layer | What it gives you |
| :--- | :--- |
| **Standard** | Written engineering practices for testing, security, data, architecture, and UX. |
| **Agent adapters** | Native instructions and configuration for 20 coding environments. |
| **Verification CLI** | Local checks for selected anti-patterns, plus test and hook commands. |

## Get started

> Looking for a complete, step-by-step engineering walkthrough from installation to Mode A pair programming? Read the **[Getting Started Guide](docs/GETTING_STARTED.md)**.

### 1. Check your project

Requires **Node.js 18+**. Run inside the repository you want to inspect:

```bash
npx qed-standard check
```

No global installation is required. The CLI has no runtime package dependencies. `npx` downloads the package on first use.

Prefer a persistent command?

```bash
npm install -g qed-standard
qed check
```

Automate in **GitHub Actions**:

```yaml
- name: Q.E.D. Verification Gate
  uses: keelbismark/qed@main
  with:
    strict: true
```

### 2. Give your agent the rules

Clone this repository and run its installer **from your target project**. The following example installs Cursor rules:

```bash
git clone https://github.com/keelbismark/qed.git /path/to/qed
cd /path/to/your-project
bash /path/to/qed/install.sh cursor
```

On Windows, use PowerShell:

```powershell
git clone https://github.com/keelbismark/qed.git C:\tools\qed
cd C:\path\to\your-project
& C:\tools\qed\install.ps1 -Harness cursor
```

Replace `cursor` with `claude`, `codex`, `copilot`, `roo`, or another [supported harness](docs/harnesses.md). Review existing configuration first: the installer can overwrite matching files. A local install affects the current project; `global` targets your user profile.

### 3. Make verification routine

```bash
qed init           # Onboard project: detect stack, complexity tier, Anti-Duplication Atlas, BRIEF.md, and hooks
qed check          # Inspect the current project
qed hook           # Install pre-commit and pre-push verification hooks
qed doctor         # Check repository, hooks, adapter drift, and CI availability
qed update         # Synchronize installed adapters and hooks with latest standard
```

Review existing hooks before installing new ones. Q.E.D. complements your typechecker, application tests, security review, and CI; it does not replace them.

**Smaller context budget?** Use the Lite edition:

```bash
bash /path/to/qed/install.sh --lite cursor
```

Or start with the compact [Q.E.D. Lite prompt](QED.lite.md), without running an installer.

## How it works

![Four stages: scope the change, challenge the assumptions, reproduce and fix, verify the result.](assets/pipeline.svg)

1. **Scope.** Find existing implementations and map affected callers.
2. **Challenge.** Cover empty, loading, error, and degraded behavior; consider hostile inputs and concurrency.
3. **Reproduce.** Run a failing test, implement the smallest fix, and verify it passes.
4. **Verify.** Run the relevant typechecker, linter, and regression suite. Report what actually ran and what remains unverified.

This is a workflow the standard asks agents to follow, **not an autonomous pipeline executed by `qed check`**. See the [end-to-end walkthrough](examples/full-lifecycle-walkthrough.md) for a worked example.

### Two modes, explicit trade-offs

**Quality first** is the default: investigate impact, write reproduction tests, and verify changes. **Prototype mode** is opt-in for quick experiments: keep scope minimal and disclose shortcuts and technical debt. Neither mode makes unverified claims acceptable.

## What the CLI checks

The gate detects selected patterns in supported source files. Some rules use lexical or AST analysis; they are not a complete semantic or security audit.

| Area | Examples |
| :--- | :--- |
| Repository hygiene | Temporary root files, leftover debug statements |
| Error and type discipline | Empty catches, loose `as any` casts |
| Resource boundaries | Requests without timeout/signal, exported unbounded maps |
| Secrets and configuration | Hardcoded credential patterns, undocumented environment reads |
| Interface semantics | Clickable divs, blocked paste, emoji-heavy UI chrome |
| Database evolution | Non-concurrent `CREATE INDEX` patterns |

These correspond to **12 rule IDs, QED001–QED012**. The broader standard includes practices that require tests and human judgment. A clean gate is evidence about its checks, not proof that the entire application is correct.

## CLI reference

After a global installation, use `qed`; from this cloned repository, use `node bin/qed-engine.js`.

| Command | Purpose |
| :--- | :--- |
| `qed init [path]` | Onboard project: detect stack, Earned Complexity Tier, Anti-Duplication Atlas, BRIEF.md, and hooks |
| `qed init --explore` | Onboard and display full Agent Reconnaissance Brief directly to stdout |
| `qed check [path]` | Scan the current directory or an explicit project path |
| `qed check --strict` | Treat warnings as failures too |
| `qed check --json` | Produce machine-readable results |
| `qed check --compact` | Produce concise, agent-friendly output |
| `qed test` | Run available `tests/verify-*.sh` and `tests/verify-*.ps1` suites |
| `qed doctor` | Audit repository health, hooks, adapter drift, analysis engine, and remote CI |
| `qed hook` | Install mechanical Git verification hooks |
| `qed update [path]` | Synchronize installed AI agent adapters and Git hooks |
| `qed update --global` | Synchronize global user adapters (`~/.gemini/`, `~/.claude/`, etc.) |
| `qed tokens` | Inspect instruction token usage |

For `check`, exit code `0` means no errors (and no warnings in strict mode); a failed gate exits nonzero. PowerShell suites need PowerShell; POSIX suites need Bash. `doctor` and CI inspection have additional local-tool requirements.

For project-specific policy and configuration, see the [protocol guide](docs/protocols.md) and [configuration schema](schema/qedrc.schema.json).

## One standard, multiple environments

![Engineering standards guide agent adapters; the CLI checks selected rules.](assets/framework.svg)

Cursor · Claude Code · Antigravity · Gemini CLI · Codex · Kimi Code · Pi · Hermes · Muse · Devin · Factory Droid · Grok · Qwen Code · OpenCode · DeepSeek / Continue · Cline · Roo Code · Windsurf · Aider · GitHub Copilot

Adapters differ in format and native features. Use the [harness directory](docs/harnesses.md) to find exact files, install targets, and Lite variants.

## Documentation

| If you want to… | Start here |
| :--- | :--- |
| Start from scratch (step-by-step walkthrough) | [Getting Started Guide](docs/GETTING_STARTED.md) |
| Understand the foundational rules | [Constitution](core/CONSTITUTION.md) |
| Configure an editor or agent | [Harness integration guide](docs/harnesses.md) |
| Follow a complete task | [Lifecycle walkthrough](examples/full-lifecycle-walkthrough.md) |
| Write better tests | [Testing philosophy](core/testing-philosophy.md) |
| Handle API data safely | [Data fetching](core/data-fetching-philosophy.md) |
| Improve security and schema changes | [Security](core/security-philosophy.md) · [Database evolution](core/database-evolution-and-migrations.md) |
| Build useful interfaces | [Visual standard](core/visual-anti-slop-standard.md) · [Workflow ergonomics](core/workflow-ergonomics-and-affordances.md) |
| Reverse engineer external contracts | [Reverse engineering & Grounding (REA)](core/reverse-engineering-and-grounding.md) |
| Verify UIs visually with real browsers | [Computer-Use & Visual verification (CUA)](core/computer-use-and-visual-verification.md) |
| Govern subagents and prevent bloat | [Subagent governance (The Leash Invariant)](core/subagent-governance-and-delegation.md) |
| Understand evaluation results | [Methodology](docs/evals.md) · [Fixture scenarios](evals/scenarios.json) |
| Provide context to an AI agent | [AI_README.md](AI_README.md) · [llms.txt](llms.txt) |

### About the evaluation

The included evaluation runs predefined “vanilla” and “Q.E.D.” code fixtures through the linter across six scenarios. It demonstrates rule detection on those fixtures; it is **not** a live model comparison or a general guarantee of defect reduction. Inspect the [runner](evals/run-benchmark.js) and [methodology](docs/evals.md) before interpreting the results.

## Contribute

Node.js 18+ and Bash are sufficient for the POSIX checks; install PowerShell to also run the Windows suites locally. From a clone:

```bash
node bin/qed-engine.js check
node bin/qed-engine.js test
```

There is no application compilation step. Keep changes focused, include a reproduction for behavioral fixes, and explain which checks ran. Use [issues](https://github.com/keelbismark/qed/issues) for bugs or proposals and [pull requests](https://github.com/keelbismark/qed/pulls) for changes.

## Acknowledgments

Q.E.D. builds on principles and tooling from the open-source community:
- [Awesome-REA](https://github.com/reacher-z/Awesome-REA) & [`rea-agents`](https://www.npmjs.com/package/rea-agents) for reverse engineering and contract extraction.
- [Awesome-CUA](https://github.com/reacher-z/Awesome-CUA) for computer-use agent benchmarks and interface grounding.

---

**Q.E.D.** — *Quod erat demonstrandum*, “which was to be demonstrated.”  
[MIT](LICENSE) · Maintained by [KeelBismarck](https://github.com/keelbismark)
