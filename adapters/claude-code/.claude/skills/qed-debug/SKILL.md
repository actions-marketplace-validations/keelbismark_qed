---
name: qed-debug
description: Use when investigating any defect, test failure, crash, reboot, or unexpected behavior — enforces Q.E.D. Empirical Root Cause Investigation, zero guessing, telemetry gathering, failing reproduction test, and root-cause remediation before touching code.
---

# Q.E.D. Systematic Debugging & Root Cause Protocol
> Quod Erat Demonstrandum: Evidence Before Assertions.

<EXTREMELY-IMPORTANT>
THE IRON LAW OF Q.E.D. DEBUGGING:
1. NEVER PROPOSE OR APPLY FIXES BEFORE ROOT CAUSE IS EMPIRICALLY PROVEN.
2. SYMPTOM PATCHES ARE STRICTLY FORBIDDEN (No empty catch blocks, no fallback `|| {}`, no arbitrary timeouts, no loose typecasts).
3. NO FIX WITHOUT A FAILING REPRODUCTION TEST FIRST (RED -> GREEN).
</EXTREMELY-IMPORTANT>

---

## When to Invoke

Invoke this skill immediately whenever encountering:
- Application runtime exceptions, crashes, or unhandled rejections.
- Failing automated tests or CI build errors.
- System incidents, unexpected reboots, BSODs, or service restarts.
- Silent failures, performance degradation, or data corruption.
- When previous fix attempts have failed or symptoms keep shifting.

---

## The 5 Empirical Phases

### Phase 1: Telemetry & Empirical Evidence (Zero Guessing)
**Before proposing any hypothesis, gather raw physical facts from the runtime:**

1. **Stack Traces & Errors**:
   - Read the complete stack trace and error message verbatim.
   - Note exact file paths, line numbers, error codes, and nested inner causes.
2. **System & Environment State**:
   - For OS/Machine crashes (Windows/Linux/macOS):
     - Check boot time and uptime (`systeminfo`, `uptime`, `Get-Uptime`).
     - Query system event logs for critical events (`Get-WinEvent -FilterHashtable @{LogName='System'; Id=41,1074,6008}` on Windows, or `journalctl -xb -p 3` on Linux).
     - Check memory dumps (`C:\Windows\Minidump`, `/var/crash`).
   - For software services:
     - Check process exit codes, memory usage, open handles, and active environment variables.
3. **Multi-Component Boundary Inspection**:
   - In distributed or multi-layer systems (CLI → Engine → Adapters, or Frontend → Gateway → Database):
   - Trace the exact boundary where data transitions from valid to invalid.
   - Log input and output at each layer until the failing component is isolated.

---

### Phase 2: Backward Data Flow Tracing (Find the Source)
**Never patch the line where the exception exploded if it received bad input from elsewhere.**

1. Identify the corrupted variable or broken invariant at the crash site.
2. Step backward through callers:
   - *Who passed this argument?*
   - *What state produced this condition?*
3. Continue tracing upstream until reaching the **original trigger** (malformed input, unhandled edge case, unvalidated wire contract).
4. The fix belongs at the source of corruption, NOT at the crash site.

---

### Phase 3: The Failing Reproduction Test (Red Gate)
**Every fix must begin with mechanical proof of defect.**

1. Construct the minimal reproducible case:
   - Pure unit test (preferred, `< 5ms`).
   - Integration test with realistic ephemeral state.
   - Standalone scratch reproduction script if no test framework is installed.
2. Execute the reproduction test in the terminal:
   - **Confirm it FAILS with the exact same symptom and error code.**
   - If it passes or fails with a different error, STOP. You have not reproduced the bug. Gather more telemetry.

---

### Phase 4: Root-Cause Remediation (Green Gate)
**Apply the single, surgical root-cause fix.**

1. Implement the minimal change addressing the identified source of corruption.
2. **Strict Ban on AI Slop & Band-Aids**:
   - ❌ No empty `catch (e) {}` blocks.
   - ❌ No arbitrary timeouts (`setTimeout(..., 500)`).
   - ❌ No loose `as any` casts to silence typecheckers.
   - ❌ No silent `return null` or fallback dummies hiding corrupted state.
3. Run the reproduction test in the terminal:
   - **Verify it turns 100% GREEN.**
4. Run the entire project test suite to verify no regressions in surrounding contracts.

---

### Phase 5: The Mutation Check & Verification Gate
**Prove that the test is truly testing the fix, and verify repository integrity.**

1. **The Mutation Check**:
   - Temporarily revert the fix or comment out the new branch.
   - Rerun the reproduction test: it MUST fail (Red). This proves the test is not a placebo.
   - Restore the fix and confirm Green.
2. **Calculate Blast Radius**:
   - Run `qed:qed-blast-radius` if the fix altered shared signatures, types, or schemas.
3. **Mechanical Verification Gate**:
   - Run `qed check` in the terminal to verify zero invariant violations.
   - Run `git diff` to ensure zero stray debug logs (`console.log`, `debugger`, `print`).

---

## The Rule of 3 Failures: Architectural Stop

If you attempt **2 fixes and both fail or reveal new symptoms elsewhere**, STOP:
- Do NOT attempt Fix #3 blindly.
- Symptom-shifting indicates an **Architectural Defect or False Premise**, not an isolated bug.
- Step back, reassess the architecture, and present the fundamental findings to your human partner.

---

## Anti-Rationalization Radar

| Rationalization | Reality |
| :--- | :--- |
| *"It's obvious what's wrong, I'll just change this line"* | Obvious fixes without root-cause investigation cause 70% of production regressions. |
| *"I'll write the test after verifying the fix works"* | Post-hoc tests are biased and often placebo mocks. Test first proves the failure. |
| *"I'll add multiple changes at once to save time"* | Confounded variables. When it breaks or works, you will not know why. |
| *"It's probably an OS glitch or network timeout"* | Never blame environment without hard telemetry (logs, dump files, ping traces). |
