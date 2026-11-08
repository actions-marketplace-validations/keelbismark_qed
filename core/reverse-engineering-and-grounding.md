# Q.E.D. — Reverse Engineering & Empirical Grounding (REA Invariant)
*Quod Erat Demonstrandum: Empirical Contract Extraction Over Hallucinated Specs*

---

## 1. The Core Problem: Contract Hallucination

When an AI coding assistant or engineer integrates with third-party APIs, legacy codebases, closed proprietary protocols, mobile backends, minified web bundles, or undocumented binary systems, they suffer from **Contract Hallucination**:
- Inventing endpoints, request parameters, and authentication headers based on generic knowledge.
- Mocking imaginary responses instead of capturing real network telemetry.
- Guessing data structures and schemas instead of extracting ground-truth types.

Under the **Q.E.D. Engineering Standard**, contract guessing is strictly prohibited.

---

## 2. The REA Invariant: Wire & Binary Archaeology

Before writing integration code for any unverified external system or undocumented internal service, the agent MUST perform **Empirical Reverse Engineering**:

```
[Target Service / Binary / Bundle]
               │
               ▼ (Dynamic Inspection / Decompilation)
[Ground-Truth Payloads & Protocol Traces]
               │
               ▼ (Schema Extraction & Typing)
[Formal Contract / Zod / Pydantic / TypeScript Types]
               │
               ▼ (Q.E.D. Verification Gate)
[Production Integration Code + Replay Tests]
```

### The 4 Levels of Reverse Engineering Grounding:

1. **Level 1 — Web & HTTP Bundles (DevTools & Bundle Splitting)**:
   - Decompile minified source maps or parse Webpack/Vite chunks to find actual API definitions.
   - Inspect HAR/HTTP network logs or WebSocket framing rather than relying on stale documentation.
   - Extract raw JSON payloads and run automated schema synthesis (e.g. `quicktype`, Zod schema inference).

2. **Level 2 — Mobile & Binary APK/IPA Extraction**:
   - For undocumented mobile backends, decompile APKs (JADX) or inspect Frida / Mitmproxy traffic.
   - Extract actual proto definitions, gRPC services, and certificate pinning logic.

3. **Level 3 — Native Binaries & Shared Libraries**:
   - For native extensions (`.so`, `.dll`, `.dylib`, Mach-O), inspect symbols (`nm`, `objdump`, `readelf`, Ghidra/IDA).
   - Verify FFI bindings against actual exported C ABIs, memory layouts, and struct alignments.

4. **Level 4 — Protocol & Wire Framing**:
   - For custom TCP/UDP/WebSocket protocols, capture pcap streams and document exact byte order, framing flags, and CRC/checksum algorithms.

---

## 3. Tooling Integration: `rea` (Reverse Engineer Anything)

Q.E.D. natively interfaces with the **REA** toolchain (`rea-agents` / `Awesome-REA` catalog):

- **REA Agent & CLI (`rea`)**:
  - Run `rea mcp doctor` to ensure reverse engineering inspection tools (AST analysis, decompilation, network tracing) are operational.
  - Use `rea analyze` or `rea trace` to extract contracts and ground-truth behavior.
- **Artifact Anchoring**:
  - Store extracted schemas, sample payloads, and protocol traces in `contracts/` or `test/fixtures/` before writing client code.
  - Never write an API client without a captured golden payload fixture.

---

## 4. Adversarial Rules for Reverse Engineering

1. **Zero Guesswork**: If an API parameter's type or optionality is not proven by empirical telemetry or official schema, it MUST be treated as unknown and guarded with strict runtime validation.
2. **Golden Fixture Requirement**: Every external integration must include at least one sanitized real-world response fixture captured via reverse engineering or real API calls.
3. **Drift Detection**: Wire contracts must be validated in CI with schema contract tests so breaking changes in the target API fail loudly and immediately.
