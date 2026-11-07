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

## 2. Blast Radius & Anti-Duplication
- "Search Before You Create": Grep for existing helpers/types before writing new ones. Never duplicate.
- Calculate Blast Radius: Identify direct callers and indirect API/DB impact before editing shared code.

## 3. Adversarial QA & The 4 Mandatory States
- Always implement: Empty state, Loading state, Error state with retry, Degraded/Offline state.
- Include Chaos Monkey edge cases: rapid double clicks, oversized payloads, hostile Unicode.

## 4. The 3 AM Test
- Code must be instantly clear to an engineer at 3 AM: guard clauses, early returns, no 6-method functional chains, clear intermediate variables.

## 5. Ironclad TDD & Verification Gate
- For bug fixes: Write reproduction test first (Red), fix root cause, confirm passing (Green).
- Verify type checks, linters, and full test suite before declaring completion.
