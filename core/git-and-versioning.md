# Git, Versioning & Release Engineering Standard
*Part of the Q.E.D. Engineering Framework*

This standard defines the boundary between Git (internal change ledger) and Versioning (external contract of trust), establishes context-driven versioning schemes, and dictates release notes discipline.

---

## 0. Fundamental Axiom: Git is Not Versioning

> **Git is the temporal ledger of how code changed.  
> Versioning is the public contract of what those changes mean to the outside world.**

Conflating Git commits with releases or version tags leads to broken workflows. A repository may have 500 atomic Git commits that represent a single patch release, or a web service deployed continuously 20 times a day without traditional version tags at all.

---

## 1. Part I: The Philosophy of Git (The Temporal Ledger)

Git is a directed acyclic graph (DAG) of content-addressed snapshots. Its primary virtue is **bisectability, provenance, and isolated experimentation**.

### A. The Bisect Invariant (Every Commit Builds and Passes)
* **The Rule**: Every individual commit on a shared branch (`main`, `develop`, release branches) MUST be compilable, testable, and syntactically valid.
* **Why**: If a bug is introduced, an engineer or automation must be able to run `git bisect` to locate the exact commit that broke the build. A commit that breaks the build or leaves the system half-implemented destroys bisectability.
* **Prohibition**: Never commit a broken state with the intention of "fixing it in the next commit". Squash or fix locally before pushing.

### B. One Logical Intent per Commit
* Do not mix unrelated activities in a single commit:
  - ❌ *BAD*: 1 commit containing a bug fix, a general whitespace reformat, and a library upgrade.
  - ✅ *GOOD*:
    1. `refactor(auth): extract token verification into helper`
    2. `test(auth): add reproduction test for expired token edge case`
    3. `fix(auth): handle expired token gracefully with 401 response`

### C. Conventional Commits Standard
Commit messages must follow the imperative Conventional Commits standard:
```text
type(scope): imperative summary under 72 chars

Optional body explaining the WHY behind the change and architectural trade-offs.

Refs: #123
```
* Types: `feat:`, `fix:`, `test:`, `refactor:`, `docs:`, `chore:`, `perf:`.

### D. Ephemeral Branch Hygiene
* Feature branches are short-lived workbenches.
* Once a branch is merged into `main`, delete both the local and remote branch immediately.
* Strictly forbid blind destructive actions (`git reset --hard`, force-pushing to protected branches).

### E. The Remote CI Hand-off Invariant (Push != Done)
* **The Rule**: In any repository with an active CI pipeline (GitHub Actions, GitLab CI, Buildkite, etc.), a task is **NEVER marked complete** upon executing `git push`.
* **Why**: Local verification is necessary, but remote CI runs the definitive multi-OS and container matrix. Pushing code is the *hand-off to the remote gate*, not the finish line.
* **Prohibition**: An engineer or autonomous agent must monitor the CI run (`gh run watch` or `node bin/qed-engine.js ci-watch`) until it terminates with a Green status (`completed success`). Claiming victory before CI returns Green is a direct violation of Q.E.D.

### F. The Multi-Platform Matrix Invariant
* **The Rule**: If a repository maintains scripts or adapters for multiple operating systems (e.g., `.sh` for POSIX and `.ps1` for Windows), local verification must never rely on single-OS evidence.
* **Why**: Subtle shell differences (e.g. bash `$'\/\/'` quoting vs powershell interpolation) cannot be verified by analogy.
* **Enforcement**: If the alternative shell runtime is present locally (Git Bash / WSL on Windows, pwsh on Linux), the multi-platform test runner (`node bin/qed-engine.js test`) must execute both before any commit or push leaves the machine.

---

## 2. Part II: Pragmatic Versioning (Context-Driven Schemes)

Do not force rigid `X.Y.Z` (SemVer) onto projects where it is inappropriate. Choose the versioning scheme that fits the project's delivery model:

### The 4 Pragmatic Versioning Schemes:

| Scheme | Format | Best Suited For | Real-World Examples | Why It Fits |
| :--- | :--- | :--- | :--- | :--- |
| **SemVer** | `MAJOR.MINOR.PATCH` | **Public libraries, SDKs, shared packages, open APIs** | `react@18.2.0`, `lodash@4.17.21` | Downstream developers compile against your interfaces. They need mathematical guarantees on breaking changes. |
| **CalVer** | `YYYY.MM.PATCH` | **CLI tools, desktop apps, operating systems, runtime platforms** | `Ubuntu 24.04`, `JetBrains 2026.1`, `pip 24.0` | Users care about recency, maintenance status, and yearly release cadence rather than library API shifts. |
| **ZeroVer** | `0.X.Y` | **Pre-launch, prototypes, rapid iteration** | New startups, internal alpha tools | Signals that architecture is still fluid and contracts may evolve rapidly. |
| **Continuous / SHA** | `sha-a8f2c3d` or `YYYYMMDD-build` | **SaaS products, web applications, continuous deployment (CD)** | Web dashboards, internal microservices | Code is deployed continuously (10+ times/day). The version serves observability and rollback tracking, not external packaging. |

---

## 3. The Lifecycle Boundary: Pre-1.0 vs. Post-1.0

### A. Pre-1.0 / Internal Dev (Zero Bureaucracy)
When a project has zero external users or is in early active development:
* **Radical Refactoring**: Do NOT waste time with `@deprecated` annotations or multi-month grace periods. If a function is bad, rename or delete it immediately.
* **Internal Blast Radius Only**: The only requirement is to verify that internal callers within the repository are updated and tests pass.

### B. Post-1.0 / Public Contract (The Contract of Trust)
Once external clients, third-party apps, or public SDK users depend on your system:
* **The Deprecation Lifecycle**:
  1. *Active*: Primary supported API.
  2. *Deprecated*: In minor version `N.M.0`, mark with `@deprecated`, log a non-fatal warning, and document the replacement in docstrings.
  3. *Removal*: Method is physically removed ONLY in the next major version `(N+1).0.0`.
* **Database Schema Migrations (Expand and Contract)**:
  Zero-downtime database evolution:
  1. *Expand*: Add new column/table (nullable).
  2. *Dual-Write*: Application writes to both old and new columns; reads from old.
  3. *Backfill*: Background script backfills historical data.
  4. *Switch*: Application reads and writes exclusively to the new column.
  5. *Contract*: Drop the old column in a subsequent release.

---

## 4. Part III: Changelog Separation & Privacy Standard

Never present technical developer logs to end users, and never leak internal secrets in public release notes.

```text
                                  [Git Commit Stream]
                                           │
                   ┌───────────────────────┴───────────────────────┐
                   ▼                                               ▼
     [Technical CHANGELOG.md]                         [User-Facing Release Notes]
     • Audience: Engineers, DevOps                    • Audience: End Users & Customers
     • Scope: Technical exactness                     • Scope: Tangible user benefits
     • Contents:                                      • Contents:
       - API breaking changes & signatures              - New features in plain language
       - DB schema migrations                           - Performance improvements ("PDF export is 3x faster")
       - Environment flags & config updates             - Fixed annoyances & UI enhancements
       - Upgraded dependencies & CVE IDs                - Zero technical jargon
```

### The Sensitivity & Security Filter (What Stays Private)
1. **Security Vulnerabilities (Zero-Day Exploits)**:
   - When patching a vulnerability, do NOT publish reproduction payloads or exploit descriptions before users have had time to patch.
   - Public release note: `Security: address boundary validation edge case in auth token parser.`
   - Technical CVE disclosure occurs only after coordinated deployment.
2. **Internal Refactoring**:
   - Migrating from one Redis driver to another, fixing an internal flaky test, or cleaning up linter warnings does not belong in user-facing release notes.
3. **Unannounced Business Capabilities**:
   - Feature flags for unreleased features or upcoming partnerships must remain scrubbed from public release announcements until business launch.
