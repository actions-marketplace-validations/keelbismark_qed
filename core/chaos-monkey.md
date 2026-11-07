# The Chaos Monkey Test Protocol
*Part of the Q.E.D. Engineering Framework*

## Overview
Normal test suites verify the "Happy Path" and a few polite error cases. 
**The Chaos Monkey Test** simulates hostile, erratic, and extreme real-world user behavior and network conditions before code reaches production.

---

## The 4 Vectors of Chaos

### 1. Concurrency & Idempotency (The Double-Clicker)
* **Scenario**: 10 rapid duplicate requests or button clicks within 500ms.
* **Test Expectation**: 
  - UI must debounce/disable triggers.
  - Backend must be idempotent (no duplicate charges, no duplicate DB rows).
  - Out-of-order async responses must not overwrite fresher state (race condition defense).

### 2. Payload Overload (The Data Spammer)
* **Scenario**:
  - Pasting 5MB–10MB of raw text into a search/comment input.
  - Deeply nested JSON payloads ($>20$ levels deep).
  - Extremely large numbers ($> 2^{53}-1$, negative numbers, NaN, floating point precision bugs).
* **Test Expectation**: Application rejects cleanly with HTTP 413 / validation errors without crashing the process or blocking the main event loop.

### 3. Hostile Strings & Encoding (The Polyglot)
* **Scenario**:
  - Complex multi-byte Unicode and composite emojis: `👨‍👩‍👧‍👦`, `🏴‍☠️`, `🏳️‍🌈`.
  - Right-to-Left (RTL) text: Arabic, Hebrew mixed with LTR English.
  - Zero-width characters (`\u200B`), trailing/leading whitespaces, null bytes (`\0`).
  - Raw SQL/HTML/Script tags: `<script>alert(1)</script>`, `' OR '1'='1`.
* **Test Expectation**: Proper escaping, zero XSS, zero SQL injection, layout does not shatter.

### 4. Interrupted State & Network Death
* **Scenario**:
  - Network disconnects halfway through a multipart file upload.
  - Client aborts the HTTP request (`AbortController`) while the backend is processing.
  - Auth token expires while a multi-step wizard is on step 3.
* **Test Expectation**: Graceful recovery, no orphaned database locks, clear user retry prompt.
