# Dependency Philosophy & Supply Chain Standard
*Part of the Q.E.D. Engineering Framework*

This standard establishes the decision-making framework, health audits, and isolation invariants governing third-party dependencies in projects developed by AI agents and software engineers.

---

## 0. The Dependency Trilemma

Every decision to introduce or avoid a dependency navigates three competing tensions:

```text
               Battle-Tested Maturity (Industry Giants)
                                 ▲
                                / \
                               /   \
  Lightweight & Minimal       /     \     Not-Invented-Here (DIY)
  (The Micro-Package Trap)   ─────────    (Reinventing Fragile Wheels)
```

1. **The Bloatware Trap**: Pulling in a 50MB monolithic library and 200 transitive packages just to use a single helper function.
2. **The NIH (Not-Invented-Here) Trap**: Insisting on writing everything from scratch. Writing custom cryptography, custom JWT parsers, or custom time-zone calculations creates severe security vulnerabilities and endless maintenance debt.
3. **The Micro-Package Trap**: Choosing an obscure 40-line package from an anonymous GitHub author simply because it looks "tiny." Such packages frequently lack tests, leak memory, contain zero type safety, and get abandoned after 6 months.

Under Q.E.D., dependencies must be **rigorously evaluated, earned, and contained**.

---

## 1. The Build vs. Buy Decision Matrix

| Domain Category | Strategy | Standard Rule | Examples |
| :--- | :--- | :--- | :--- |
| **Security, Auth & Crypto** | **BUY (Battle-Tested Only)** | **NEVER write your own.** Writing custom hashing, encryption, or JWT verification is a critical security vulnerability. Use established industry standards. | `bcrypt`, `argon2`, `jose`, `jsonwebtoken`, standard library crypto. |
| **Complex Protocols & Math** | **BUY (Specialized Standards)** | Complex state machines (WebSockets with backoff, AST parsers, Markdown parsers, virtualized rendering) should use mature, proven tools. | `ws`, `prosemirror`, `katex`, `tanstack-virtual`. |
| **Trivial Utilities** | **BUILD / STDLIB (Zero Packages)** | **NEVER install a package for trivial operations.** Modern runtimes (Node 20+, Python 3.12+, Go, Rust) have rich standard libraries. | `clamp`, `is-odd`, `slugify`, `deep-clone` (use `structuredClone`), `debounce` (10 lines). |
| **Specialized UI & Clients** | **EVALUATED EXTERNAL** | Permitted only after passing the 4-Pillar Package Health Audit (Section 2). | UI component libraries, charting, ORMs. |

---

## 2. The 4-Pillar Package Health Audit

Before adding any third-party dependency, the agent or engineer must audit it against four non-negotiable health criteria:

### Pillar 1: Transitive Blast Radius (Sub-Dependency Tree)
* A package may claim to be 5KB, but silently pull 45 nested dependencies into `node_modules` or `Cargo.lock`.
* Every nested dependency increases attack surface (supply chain poisoning) and installation latency.
* **Audit Command**: Check `npm info <package> dependencies` or `cargo tree`. Packages with zero or minimal sub-dependencies are strictly preferred.

### Pillar 2: Maintenance Vitality & Bus Factor
* **Abandoned Code Warning**: If a library has had zero commits in the last 12 months and 50+ unresolved issues, it is considered abandonware.
* **Lineage**: Prefer libraries backed by established organizations, foundations (Apache, Linux Foundation), or maintainers with a multi-year track record.

### Pillar 3: Native Type Integrity
* The library MUST ship with first-class, natively maintained types (built-in `.d.ts` or Rust/Go type contracts).
* Reject libraries that rely on third-party community `@types/` packages lagging 2 major versions behind.

### Pillar 4: Legal & License Compliance
* **Permissive Licenses (Approved)**: MIT, Apache 2.0, BSD-2/3-Clause, ISC.
* **Copyleft Warning (Strictly Restricted)**: GPL, AGPL, and LGPL packages must NEVER be introduced into commercial or proprietary repositories without explicit, recorded user authorization.

---

## 3. The Wrapper Invariant (Dependency Isolation)

Even when a premier, battle-tested library is selected, **it must never leak directly across the application codebase**:

> **Rule: Any external dependency that touches business logic must be encapsulated behind an internal interface/adapter.**

### The Anti-Pattern (Leaking Third-Party Types):
Importing an external library (`dayjs`, `axios`, `stripe`) into 40 separate UI components or controllers. When the library releases a breaking change, suffers a vulnerability, or is deprecated, 40 files must be rewritten.

### The Q.E.D. Pattern (The Internal Facade):
Wrap the third-party dependency in a single internal module:

```typescript
// src/shared/lib/dateTime.ts
// Encapsulates the external library behind our own stable application interface.
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

export interface FormattedDateRange {
  startDate: string;
  endDate: string;
}

export function formatInvoicePeriod(startMs: number, endMs: number): FormattedDateRange {
  return {
    startDate: dayjs(startMs).utc().format("YYYY-MM-DD"),
    endDate: dayjs(endMs).utc().format("YYYY-MM-DD"),
  };
}
```

*Benefit*: If `dayjs` is later replaced with Temporal or another engine, **only 1 file is edited**. The remaining 40 components never change.

---

## 4. Verification Checklist for Adding Dependencies

Before running `npm install`, `pip install`, `cargo add`, or `go get`:
- [ ] Could this be solved cleanly in < 25 lines of native standard library code?
- [ ] If this is crypto, auth, or protocol logic, are we using the proven industry standard (not a homegrown hack or micro-package)?
- [ ] Does the package have zero or very few transitive dependencies?
- [ ] Has the package had releases/commits within the last 6–12 months?
- [ ] Does it provide first-class native types?
- [ ] Is the license permissive (MIT/Apache 2.0/BSD)?
- [ ] Is the library wrapped behind an internal application facade?
