# Q.E.D. Engineering Standard for Google Antigravity
# Drop this file into ~/.gemini/GEMINI.md or your project root

This agent operates strictly under the Q.E.D. Engineering Framework:

## 0. Fundamental Directive: Quality > Speed
- Never write production code on unverified assumptions.
- Evidence before assertions: Run tests and verify real output before marking tasks done.
- Root cause only: No empty catch blocks, no arbitrary timeouts, no loose `any` casts.

## 1. Dual Execution Modes
- Mode A (Default: Quality > Speed): Full TDD, Blast Radius, Adversarial QA, Verification Gate.
- Mode B (On-Demand: Speed > Quality): Active only when user explicitly requests speed ("быстро", "прототип", "draft", "quick"). Delivers fast POC with a clear report on shortcuts taken.

## 2. Adaptive Architecture & Blast Radius
- **Anti-Dogmatism & Earned Complexity**: No rigid cookie-cutter templates. Structure follows actual data flow and native ecosystem idioms (Go, Rust, Python, Web). Scale structure organically; never build enterprise layer bloat for small tools.
- **Pristine Root Invariant**: Zero scratch files or temporary dumps in root. 10-second entrypoint discovery. Locality of change.
- **"Search Before You Create"**: Grep for existing helpers/types before writing new ones. Never duplicate.
- **Calculate Blast Radius**: Identify direct callers and indirect API/DB impact before editing shared code.

## 3. Adversarial QA & The 4 Mandatory States
- Always implement: Empty state, Loading state, Error state with retry, Degraded/Offline state.
- Include Chaos Monkey edge cases: rapid double clicks, oversized payloads, hostile Unicode.

## 4. The 3 AM Test & Clean Comments
- Code must be instantly clear to an engineer at 3 AM: guard clauses, early returns, no 6-method functional chains, clear intermediate variables.
- Comment WHY, never WHAT: Strict ban on echo noise (`// set count to 0`). Comments only for architectural trade-offs, platform workarounds with issue links, and domain rules.
- Concrete I/O examples for complex algorithms and regexes. Actionable TODOs must reference issue IDs (`// TODO(#123)`).

## 5. Testing Philosophy & Verification Gate
- **Zero Placebo Mocks**: Pure unit tests must run with zero mocks (<5ms). Real DB/IO must use realistic ephemeral environments, not imaginary mocks.
- **Boundary Value Matrix**: Every test suite must cover: 0 (empty), 1, N, N+1, Max, Null/Undefined, Hostile Unicode (`👨‍👩‍👧‍👦`), and Concurrency (double-clicks in 50ms).
- **Zero Flaky Sleep**: Strict ban on `sleep()` or arbitrary timeouts in tests. Use fake timers or deterministic condition polling.
- **The Mutation Check**: A test must be capable of failing; commenting out business logic must cause Red.
- **Reproduction First (Red -> Green)**: For bug fixes, write failing reproduction test first, verify failure, fix root cause, confirm pass.
- **Pre-Commit Sanitization Sweep**: Zero temporary debug statements (`console.log`, `print`, `debugger`, `fmt.Println`). Delete all throwaway scratch files. Zero dead imports or commented-out code.
- Verify type checks, linters, and full test suite before declaring completion.

## 6. Documentation & Visual Ergonomics (Anti-Slop)
- Separate Human vs. Machine entrypoints (`README.md` for humans, `AI_README.md`/`llms.txt` for agents).
- Zero emoji salad in headers; no marketing puffery.
- Strict ban on 3-screen vertical Mermaid noodles: inline workflow diagrams must be horizontal (`flowchart LR` or tailored SVGs) and under 150px height.
- High-assurance SVGs: pure vector, responsive (`viewBox`, `100%` width, `height="auto"`), self-contained dark canvas card for light/dark theme immunity, modern system fonts.
- Prefer real terminal command/test logs over abstract decorative graphics.
