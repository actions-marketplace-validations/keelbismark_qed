---
name: systematic-debugging
description: Use when encountering any bug, crash, test failure, reboot, or unexpected behavior, before proposing fixes — enforces Q.E.D. Empirical Root Cause Investigation, telemetry gathering, and failing reproduction tests.
---

# Q.E.D. Systematic Debugging

> Quod Erat Demonstrandum: Evidence Before Assertions.

<EXTREMELY-IMPORTANT>
NO FIXES WITHOUT ROOT CAUSE INVESTIGATION FIRST.
Symptom fixes are strictly banned under Q.E.D. (No empty catch blocks, no fallback `|| {}`, no arbitrary timeouts, no loose `any` casts).
</EXTREMELY-IMPORTANT>

Refer to the complete standard in `qed:qed-debug` for detailed telemetry commands, backward data flow tracing, and the mutation check.

## The 4 Mandatory Phases

### Phase 1: Root Cause & Telemetry Investigation
1. **Read Error Messages & Traces Completely**: Note exact line numbers, error codes, and nested inner causes.
2. **Collect Hard Runtime Facts**:
   - For machine/OS crashes: check boot time, kernel events (Windows Event ID 41/1074/6008, Linux `journalctl`), and minidumps (`C:\Windows\Minidump`).
   - For software: inspect process exits, environment variables, and wire payloads at component boundaries.
3. **Trace Backward to Source**: Step upstream through callers to find where the bad value originated. Never patch the line where the exception exploded if it received corrupted input from higher up.

### Phase 2: Hypothesis & Minimal Test
1. Form a single, concrete hypothesis: *"I think X caused Y because of evidence Z."*
2. Test the hypothesis with the smallest possible inspection or probe.

### Phase 3: Failing Reproduction Gate (Red)
1. Construct the minimal reproducible case (automated unit test or standalone script).
2. Run it in the terminal: confirm it fails with the exact defect symptom.
3. If not reproducible: STOP. Gather more telemetry. Do not guess.

### Phase 4: Root-Cause Remediation (Green) & Verification
1. Apply the minimal fix at the source of corruption.
2. Run the reproduction test: verify it turns 100% Green.
3. **The Mutation Check**: Temporarily comment out the fix — prove the test fails again.
4. **Mechanical Gate**: Run `qed check` and the project test suite to guarantee zero regressions.

**Rule of 3 Failures**: If 2 fixes fail or shift symptoms elsewhere, STOP. You have an architectural defect or false premise. Discuss fundamentals with your human partner.
