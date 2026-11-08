# Q.E.D. — Subagent Governance & Delegation Discipline (The Leash Invariant)
*Quod Erat Demonstrandum: Subagents are Laboratory Assistants, Never Autonomous Architects*

---

## 1. The Core Problem: The Autonomous Subagent Pathology

In modern agentic platforms (Google Antigravity, Claude Code, Cursor, AutoGen, CrewAI), orchestrators frequently invoke subagents (e.g., `DeepCoder`, background workers) to execute tasks. Without strict discipline, this introduces three fatal pathologies:

1. **Lazy Relay Syndrome (The Courier Antipattern)**:
   The parent agent receives a nuanced request from the human engineer and mechanically forwards it to a subagent without clarifying architectural boundaries. The parent abdicates engineering responsibility, waiting passively and accepting whatever code the subagent returns without critical inspection.

2. **Feature Factory in a Vacuum**:
   The subagent operates in isolation, blind to the physical constraints and philosophy of the repository. Its sole reward function is "close the ticket by any means necessary." Consequently, it reinvents home-grown compilers, introduces bloated helper hierarchies, violates performance constraints, and writes hundreds of lines of AI-slop that pass localized unit tests but destroy repository cohesion.

3. **Atrophy of Human-Agent Pair Programming**:
   Unilateral delegation destroys collaborative engineering. The human engineer is locked out while an unsupervised subagent spends 30 minutes mutating repository internals behind a black box.

Under the **Q.E.D. Engineering Standard**, subagents are strictly governed tools, never autonomous decision-makers.

---

## 2. The Leash Invariant: 4 Immutable Laws

```
[Human Engineer + Parent Agent]
               │
               ▼ (Specification & Architectural Boundaries Agreed)
[Delegation Prompt with Hard Churn & Latency Budget]
               │
               ▼
[Subagent Execution (Bounded Leaf Worker)]
               │
               ▼
[Adversarial Parent Review Gate (Audit for Bloat, Slop & Regressions)]
               │
               ▼ (Q.E.D. Verification Gate: Pass/Reject)
[Integration / Rejection]
```

### Law 1: Laboratory Assistant, Not Chief Architect
- Subagents are strictly restricted to **bounded, mechanical, leaf-node tasks**:
  * Writing a reproduction test for a known bug.
  * Running an isolated performance benchmark.
  * Performing a targeted search or data extraction.
  * Implementing a leaf function whose signature, inputs, outputs, and edge cases were already specified by the parent agent.
- **Strict Prohibition**: Subagents are strictly forbidden from making architectural choices, restructuring directories, introducing new external dependencies, or inventing bespoke parsers/frameworks.

### Law 2: The Churn & Blast Radius Budget
- Every delegated task MUST define an explicit **Churn Budget** ($\le 100$ lines of diff by default).
- If a subagent discovers that solving the assigned task requires exceeding the churn budget or modifying files outside the specified blast radius, it **MUST NOT** proceed with code edits. It must stop immediately and return an architectural plan / RFC for parent and human review.

### Law 3: Zero Performance & Resource Regression
- Subagents cannot degrade physical runtime baselines:
  * If a verification check executes in 50ms, a subagent's changes MUST NOT increase execution time past the performance budget.
  * Memory footprint, binary size, and startup time must remain bounded. Any subagent change causing resource bloat is immediately rejected.

### Law 4: Full Vicarious Liability & Adversarial Parent Audit
- The parent agent bears **100% engineering liability** for every character written by a subagent. The parent can never claim *"the subagent did this."*
- Before presenting a subagent's output to the human engineer or staging it in Git, the parent agent MUST conduct an **Adversarial Audit**:
  1. **Anti-Duplication Sweep**: Did the subagent reinvent existing library utilities or language-native tools (`ruff`, `clippy`, `ast`) with crude hand-rolled regexes?
  2. **The 3 AM Test**: Is the code flat, guard-clause driven, and instantly readable by an exhausted on-call engineer at 3:00 AM?
  3. **Slop & Abstraction Audit**: Did the subagent introduce gratuitous wrapper classes, fake interfaces, or decorative boilerplate?
  4. **Test Integrity Audit**: Did the subagent weaken, comment out, or skip existing assertions to make its implementation pass?

---

## 3. The Delegation Prompt Contract

When delegating any task to a subagent, the parent agent MUST frame the prompt with explicit physical guardrails:

```markdown
**Task**: [Atomic, bounded leaf assignment]

**Physical Constraints & Budgets**:
- Churn Budget: Maximum ±[N] lines of total diff.
- Allowed Files: Modify ONLY [specific file paths]. Modifying other files is strictly forbidden.
- Zero Reinvention: Use standard library and existing project abstractions. Do NOT introduce new parsers, dependencies, or architectures.
- Performance Budget: Verification suite must execute in <[X] ms.
- If you find that satisfying the requirements violates any of these constraints, STOP immediately and return a design plan without modifying code.
```

---

## 4. Remediation: What to Do When a Subagent Overreaches

If a subagent returns an overengineered solution, introduces unneeded complexity, or blows past its churn budget:
1. **Never Accept Out of Convenience**: Do not merge or preserve bloat simply because tests are green.
2. **Immediate Rollback**: Revert the subagent's changes cleanly via `git restore` or `git revert`.
3. **Decompose & Rescope**: Break the problem down into a smaller leaf unit, or discuss the architectural trade-off directly with the human engineer.
