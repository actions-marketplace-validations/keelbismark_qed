# Security Philosophy & Threat-Adaptive Engineering Standard
*Part of the Q.E.D. Engineering Framework*

This standard defines the principles of pragmatic application security (AppSec), establishes context-driven threat modeling across four distinct tiers, and bans user-hostile "security theater."

---

## 0. Fundamental Axiom: Security is Contextual, Not Dogmatic

> **True security is a precise function of where code executes and who accesses the data.  
> It is invisible to legitimate humans and impenetrable to adversaries.**

Over-engineering security on a local developer script (e.g., adding OAuth2 token exchanges, distributed rate limiters, or captcha challenges) is wasteful dogmatism. Under-engineering security on a multi-tenant SaaS or payment service is negligence.

Security is not an exhaustive bureaucratic checklist—it is **threat-model driven, earned, and respectful of human users**.

```text
  ┌──────────────────────────────────────────────────────────────────────────┐
  │                           THE SECURITY PARADOX                           │
  │                                                                          │
  │   Hostile Security Theater            Pragmatic Q.E.D. Security          │
  │   - Disables clipboard paste          - Encourages password managers     │
  │   - Kills sessions every 15 mins      - Silent refresh & drafts preserved│
  │   - Slaps captchas on every form      - Invisible Proof-of-Work / Turnstile│
  │   - Forces 30-day password resets     - Strong passphrases & Passkeys    │
  │                                                                          │
  │   Result: Users bypass security       Result: High security + High UX    │
  │   (sticky notes, disabled firewalls)  (adversaries blocked, humans happy)│
  └──────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Part I: The Anti-Security-Theater Manifesto (Human-Centric UX)

When security measures torture legitimate users, they actively **weaken** system security because users will find workarounds. Q.E.D. enforces NIST SP 800-63B standards and eliminates security theater.

### A. Password Discipline vs. Password Tyranny (NIST 800-63B)
* **The Clipboard Invariant (NEVER Block Paste)**:
  - ❌ *BANNED*: `onpaste="return false"` or disabling paste in password/MFA fields.
  - ✅ *REQUIRED*: Users MUST be allowed to paste from password managers (1Password, Bitwarden, Apple Keychain). Blocking paste forces users to create short, memorable, easily crackable passwords.
* **Length Over Complexity**:
  - Support long passphrases (up to 128+ characters). Do not reject passwords for missing arbitrary punctuation symbols.
* **No Arbitrary Expiration**:
  - ❌ *BANNED*: Forcing users to change passwords every 30/60/90 days without evidence of a breach. Periodic resets lead to predictable transformations (`Spring2025!` $\rightarrow$ `Summer2025!`).
* **Modern Frictionless Auth**:
  - Favor Passkeys (WebAuthn / FIDO2) and established OAuth 2.0 / OIDC providers (Google, GitHub) for single-click, phishing-resistant authentication.

### B. Session Resilience & The Zero-Data-Loss Rule
* **Silent Refresh**:
  - Use secure, rotating refresh tokens (HTTP-only, Secure, SameSite) to silently renew expired access tokens in the background without interrupting the user.
* **The Draft Preservation Invariant**:
  - Never wipe user-entered form data due to an expired session.
  - Client state must auto-save drafts locally (`localStorage` or reactive state). If re-authentication is required, present a non-destructive modal overlay without clearing the form or navigating away.

### C. Bot Mitigation Without Human Torment
* ❌ *BANNED*: Forcing humans to solve multi-step image puzzle captchas (finding traffic lights or crosswalks) on initial login or registration.
* ✅ *REQUIRED*:
  1. **Passive Challenges**: Use invisible bot protection (Cloudflare Turnstile, honeypot input fields, client-side proof-of-work).
  2. **Tiered Escalation**: Interactive challenges may appear **only** after repeated failed attempts ($N \ge 5$) originating from a specific IP or anomalous pattern.

### D. Just-In-Time Permissions (Least Privilege for UX)
* Never ask for broad operating system, OAuth, or hardware permissions upon first launch.
* Request permissions **in context**, at the exact moment the user triggers a relevant feature, accompanied by a plain-language explanation of why it is needed.

---

## 2. Part II: Context-Driven Threat Modeling (The 4 Security Tiers)

Security requirements must match the runtime boundary and data exposure of the specific project:

| Tier | Archetype | Runtime Boundary | Core Threats | What NOT to Build |
| :--- | :--- | :--- | :--- | :--- |
| **Tier 1** | **Local CLI & Tools** | User's local machine & OS | Path traversal, unsafe subshells, secret leaks in logs | DoS limits, OAuth2 servers, multi-tenant IDOR, CORS |
| **Tier 2** | **Client & Static Web** | Public browser runtime | Secret exposure in bundles, DOM XSS, open redirects | SQL injection defenses (no DB), server-side auth |
| **Tier 3** | **Web API & Multi-Tenant SaaS** | Hostile Internet + shared DB | IDOR / Tenant data leaks, mass assignment, error leakage, SSRF | Bank-grade HSMs, multi-region cryptographic escrow |
| **Tier 4** | **FinTech, Auth & Sensitive PII** | Regulated, high-stakes data | Account takeover, timing attacks, financial race conditions | In-house homemade cryptography |

---

### Detailed Tier Specifications

### Tier 1: Local CLI, Automation Scripts & Dev Tools
1. **Path Traversal Shield**:
   - Always resolve and validate file paths against a root sandbox:
     ```typescript
     const targetPath = path.resolve(baseDir, userInput);
     if (!targetPath.startsWith(path.resolve(baseDir) + path.sep)) {
       throw new Error("Security Violation: Path traversal detected");
     }
     ```
2. **Safe Subprocess Spawning**:
   - NEVER construct shell commands via string concatenation (`exec("git log " + branch)`).
   - Use array-based execution without invoking an underlying shell (`execFile("git", ["log", branch])`).
3. **Environment Leakage Invariant**:
   - Never print `process.env` or system environment dumps into terminal output, error dumps, or log files.
4. **Atomic File Writes**:
   - Write files to a temporary sibling file (`file.tmp`) and atomically rename (`renameSync`), preventing corrupted files if the process is terminated mid-write.

---

### Tier 2: Client-Side, Static Sites & SPAs
1. **The Bundle Leak Trap**:
   - Environment variables bundled into frontend code (`NEXT_PUBLIC_*`, `VITE_*`) are **completely public**.
   - NEVER expose private API tokens, Stripe secret keys, database credentials, or admin webhook URLs in frontend environment variables.
2. **XSS & DOM Sanitization**:
   - Never inject raw user input into the DOM via `innerHTML` or `dangerouslySetInnerHTML`.
   - Use text nodes (`textContent`) or sanitize through battle-tested tools (`DOMPurify`) with strict allowed tags.
3. **Safe Navigation**:
   - Enforce `rel="noopener noreferrer"` on all external links opening in new tabs (`target="_blank"`).
   - Validate redirect targets against an explicit domain allowlist to prevent Open Redirect phishing.

---

### Tier 3: Web APIs & Multi-Tenant SaaS
1. **The IDOR & Tenant Isolation Invariant (Broken Object Level Authorization)**:
   - Every database query accessing tenant data MUST bind to the authenticated tenant/organization context:
     ```sql
     -- ❌ VULNERABLE: Direct object reference
     SELECT * FROM invoices WHERE id = :invoiceId;
     
     -- ✅ SECURE: Multi-tenant ownership bound
     SELECT * FROM invoices WHERE id = :invoiceId AND organization_id = :authenticatedOrgId;
     ```
2. **Error Masking & Internal Infrastructure Sanitization**:
   - Never send internal stack traces, database schema details, or server IP addresses to the public client.
   - **Client Payload**: Generic message and correlation ID (`{ "error": "Internal Server Error", "code": "ERR_INTERNAL", "requestId": "req_8a7b9c" }`).
   - **Internal Log**: Full error stack, query parameters, timestamp, and context tied to `requestId`.
3. **Mass Assignment Defense (Strict DTOs)**:
   - Never pass unvalidated request bodies directly to database updates:
     ```typescript
     // ❌ VULNERABLE: Attacker injects { "isAdmin": true, "billingTier": "enterprise" }
     await UserModel.update(userId, req.body);
     
     // ✅ SECURE: Strict DTO schema with whitelisted fields
     const safeData = UpdateUserSchema.parse(req.body);
     await UserModel.update(userId, safeData);
     ```
4. **Server-Side Request Forgery (SSRF) Defense**:
   - If the server fetches URLs provided by users (avatars, webhooks, import links):
     - Resolve DNS before connecting and reject private/loopback IP ranges (`127.0.0.1`, `::1`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`).
     - Restrict protocols strictly to `http:` and `https:`.

---

### Tier 4: FinTech, Auth & Sensitive PII
1. **Cryptographic Standards**:
   - Password hashing: Argon2id (preferred) or bcrypt with tuned cost factor.
   - Symmetric encryption: AES-256-GCM or ChaCha20-Poly1305 (never ECB or unauthenticated CBC).
   - Never write in-house cryptographic algorithms or random number generators.
2. **Timing Attack Immunity**:
   - When comparing hashes, webhook signatures, or API tokens, use constant-time comparison functions:
     ```typescript
     // ❌ VULNERABLE: Early exit leaks timing information
     if (userSignature === expectedSignature) ...
     
     // ✅ SECURE: Constant-time comparison
     crypto.timingSafeEqual(Buffer.from(userSignature), Buffer.from(expectedSignature));
     ```
3. **Financial Idempotency & Race Condition Prevention**:
   - Every mutation that modifies financial balances or charges credit cards MUST require an `Idempotency-Key` header.
   - Use database-level row locking (`SELECT ... FOR UPDATE`) or transactional isolation to prevent double-spend concurrency exploits.
4. **Immutable Audit Trail**:
   - Log all security-critical operations (login, role change, data export, balance modification) to an append-only, tamper-evident audit store.

---

## 3. Part III: Universal Baseline Invariants (Required Everywhere)

Regardless of tier, these three non-negotiable rules apply to every codebase:

1. **Zero Secrets in Version Control**:
   - Never commit API keys, tokens, certificates, or `.env` files containing secrets.
   - Use `.env.example` with non-secret dummy placeholders.
   - Once a secret is committed to Git history, it is **permanently compromised** and must be rotated immediately—simply deleting it in a subsequent commit does NOT remove it from history.
2. **Parameterized Data Access**:
   - Zero SQL/NoSQL string concatenation. All database queries must use prepared statements or parameterized queries.
3. **Bounded Inputs (Anti-Exhaustion)**:
   - All external endpoints and file ingestors must enforce upper bounds on payload size (e.g. JSON body limit 100KB, file upload limit 10MB) to prevent memory exhaustion DoS.

---

## 4. Verification Checklist: Pre-Flight Security Gate

Before committing code or deploying to production, verify:
- [ ] Are we free of "security theater" that blocks password managers, paste, or destroys user drafts?
- [ ] Is input validation enforced using strict DTO schemas (rejecting mass assignment)?
- [ ] Do multi-tenant queries bind directly to the authenticated organization/tenant context?
- [ ] Are internal stack traces and server IP addresses masked behind public request IDs?
- [ ] Are subprocess commands spawned via argument arrays without shell string concatenation?
- [ ] Are external webhooks and token comparisons performed with constant-time equality?
- [ ] Has `git status` and `git diff` been audited to ensure zero secrets or API keys are staged?
