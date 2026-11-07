# Naming Philosophy & Semantic Standards
*Part of the Q.E.D. Engineering Framework*

This standard defines the semantic discipline, lexical conventions, and strict prohibitions governing how identifiers (variables, functions, types, classes, files) must be named by AI agents and software engineers.

---

## 0. Fundamental Axioms

> **1. Names are the user interface of your code.**  
> If an engineer must read a function's implementation to understand what it does, the name has failed.
>
> **2. Scope determines length.**  
> The smaller the scope, the shorter the name can be. The broader the scope, the more specific and descriptive the name must be.
>
> **3. Name units of measurement explicitly.**  
> Raw numbers without units are bugs waiting to happen. An integer representing time or size must carry its unit in its name (`timeoutMs`, `fileSizeBytes`, `priceInCents`).

---

## 1. The 6 Deadly Sins of AI Naming (Forbidden Patterns)

### Sin 1: The Garbage Placeholder ("Lazy Slop")
* **The Anti-Pattern**: Using generic, meaningless words that convey zero domain context:
  ```typescript
  // BAD: Garbage placeholders
  const data = await fetchUserData();
  const item = cart[0];
  const temp = calculateTotal();
  const res = executePayment();
  const info = getSession();
  ```
* **The Q.E.D. Rule**: Every variable must describe the specific domain concept it holds:
  ```typescript
  // GOOD: Clear domain concepts
  const userProfile = await fetchUserData();
  const primaryCartItem = cart[0];
  const orderSubtotalInCents = calculateTotal();
  const paymentReceipt = executePayment();
  const activeSessionMetadata = getSession();
  ```

### Sin 2: Ambiguous "God-Object" Suffixes
* **The Anti-Pattern**: Appending vague suffixes that hide a class's lack of single responsibility:
  `UserManager`, `PaymentHandler`, `DataProcessor`, `GeneralHelper`.
  *What does a `UserManager` do? Does it hash passwords? Save to SQL? Send welcome emails? Delete accounts?*
* **The Q.E.D. Rule**: Replace vague pattern buzzwords with precise single-responsibility verbs:
  - `UserManager` $\rightarrow$ `UserRepository`, `UserAuthenticator`, or `AccountLifecycleService`.
  - `PaymentHandler` $\rightarrow$ `StripePaymentGateway`, `IdempotentChargeCoordinator`.
  - `DataProcessor` $\rightarrow$ `TelemetryMetricsAggregator`, `CsvInvoiceParser`.

### Sin 3: Negative & Inverted Booleans
* **The Anti-Pattern**: Naming boolean flags with negative connotations, forcing double-negative logic:
  ```typescript
  // BAD: Double negative nightmare
  if (!isNotDisabled) { ... }
  if (disableAutoSave === false) { ... }
  ```
* **The Q.E.D. Rule**: Booleans must always be **positive assertions**:
  ```typescript
  // GOOD: Crystal-clear positive assertion
  if (isEnabled) { ... }
  if (isAutoSaveActive) { ... }
  ```

### Sin 4: Hungarian Notation & Type-in-Name Slop
* **The Anti-Pattern**: Encoding the data structure or primitive type into the identifier:
  `userArray`, `orderList`, `nameString`, `customerDict`, `accountObject`.
* **The Q.E.D. Rule**: Trust the type system. Pluralize collections and describe mappings semantically (see Section 3).

### Sin 5: Misleading Function Names (The Hidden Side-Effect)
* **The Anti-Pattern**: A function named like a pure query that secretly mutates persistent state or dispatches network side-effects:
  ```typescript
  // BAD: Misleading name. Sounds like a getter, but mutates DB and sends emails!
  function getUser(id: string) {
    const user = db.find(id);
    user.lastLogin = new Date();
    db.save(user);
    emailService.sendLoginNotification(user);
    return user;
  }
  ```
* **The Q.E.D. Rule**: The verb MUST reveal the side-effect. If it mutates, name it `recordUserLogin()` or `authenticateAndRecordAccess()`.

### Sin 6: Numeric Clones (`utils2.ts`, `processDataV2`)
* **The Anti-Pattern**: Appending incrementing numbers when an agent is too lazy to refactor or search for existing utilities:
  `formatDateCustom.ts`, `helper2.ts`, `UserDTO2`.
* **The Q.E.D. Rule**: **Zero tolerance for numeric duplication.** Extend the original abstraction or deprecate it cleanly under SemVer rules.

---

## 2. The Scope Proportionality Rule

The length and descriptive precision of an identifier must be directly proportional to its lexical scope:

```text
[Small Scope: 1–3 Lines]        ──>  Short, concise identifiers ((x) => x.id, for (let i = 0...))
[Medium Scope: Inside Function]  ──>  Domain nouns (activeOrder, pendingInvoice)
[Global Scope: Exported Module]  ──>  Exhaustively descriptive (calculateProratedSubscriptionRefund)
```

1. **Tiny Scopes (Inline Lambdas, Array Methods)**:
   - In a 1-line `.map()` or `.filter()`, short identifiers are encouraged to avoid visual clutter:
     ```typescript
     // GOOD: Short in tiny scope
     const userIds = users.map((u) => u.id);
     ```
2. **Local Scope (Inside a Function)**:
   - Descriptive enough that someone scanning the middle of the function knows what it holds:
     ```typescript
     const remainingDaysInBillingCycle = getBillingCycleDaysLeft(subscription);
     ```
3. **Public / Exported Boundaries (Modules, APIs, Types)**:
   - Must be globally unambiguous and unique across the entire codebase:
     ```typescript
     export class DistributedRedisRateLimiter { ... }
     ```

---

## 3. Lexical Conventions for Identifiers

### A. Booleans (Predicates)
Always prefix booleans with a modal auxiliary verb:
* **`is[Adjective]`**: `isActive`, `isExpired`, `isDebitEligible`, `isSynced`.
* **`has[Noun]`**: `hasAdminPrivileges`, `hasActiveSubscription`, `hasUnsavedChanges`.
* **`can[Verb]`**: `canExecuteRefund`, `canModifyBillingSettings`, `canTransitionToState`.
* **`should[Verb]`**: `shouldRetryWithExponentialBackoff`, `shouldNotifyCustomer`.

### B. Collections, Arrays, and Sets
Use **plural nouns**, never type suffixes:
* `users` (not `userList` or `userArray`)
* `activeOrderIds` (not `activeOrderIdList`)
* `supportedCurrencies` (not `supportedCurrencySet`)

### C. Dictionaries, HashMaps, and Lookups
Always declare the **Key-to-Value relationship**:
* `usersById` (Map of User ID $\rightarrow$ User)
* `rolesByUserId` (Map of User ID $\rightarrow$ Array of Roles)
* `exchangeRateByCurrency` (Map of Currency Code $\rightarrow$ Rate)
* `cachedResponseByRequestHash` (Map of Hash $\rightarrow$ Cached HTTP response)

### D. Counts and Quantities
Always use `count` or explicit quantifier nouns:
* `userCount` or `totalUsers` (never `usersNum` or `userQuantity`)
* `remainingRetryAttempts` (not `retriesLeft`)

---

## 4. Semantic Verb Hierarchy for Functions

The first word of any function must be an active verb declaring its operational contract:

| Verb Prefix | Operation Type | Permitted Side Effects | Example |
| :--- | :--- | :--- | :--- |
| **`get`** | Pure query / Fast lookup | Zero side effects. Memory lookup or deterministic cache hit. | `getUserById(id)` |
| **`fetch`** | Network / Remote query | Asynchronous I/O. May experience network latency/failure. | `fetchLatestExchangeRates()` |
| **`find`** | Search / Query | Zero side effects. May return `null` / `undefined` if absent. | `findEligibleDiscount(cart)` |
| **`calculate`** | Pure computation | Zero side effects. Pure mathematical algorithm. | `calculateCompoundInterest(p, r, t)` |
| **`parse`** | String / Payload transformation | Zero side effects. Converts raw string into typed model; may throw validation error. | `parseIso8601Timestamp(raw)` |
| **`to[Type]`** | Format / DTO projection | Zero side effects. Pure transformation from one shape to another. | `toUserPublicDto(user)` |
| **`create` / `insert`** | Construction & Storage | Persistent side effect. Allocates new record. | `createBillingSubscription(dto)` |
| **`update` / `patch`** | Mutation | Persistent side effect. Alters existing record. | `updateWalletBalance(id, delta)` |
| **`delete` / `archive`** | Removal / Soft-delete | Persistent side effect. Removes or flags record. | `archiveCustomerAccount(id)` |
| **`assert` / `validate`** | Verification | May throw validation exception. Zero return or boolean. | `assertValidEmailFormat(email)` |
| **`sync` / `dispatch`** | Coordination | External side effects. Triggers background events or workers. | `dispatchOrderFulfilledEvent(order)` |

*Strict Ban*: Do NOT use vague verbs: `process()`, `handle()`, `doWork()`, `manage()`, `check()`.

---

## 5. Grep-ability (Searchability)

Every exported identifier must be uniquely discoverable in the codebase via `ripgrep` or IDE symbol search:

1. **Avoid Generic Single Words for Shared Symbols**:
   - Naming an exported helper `format()` makes finding its usages impossible (`rg "format\("` yields 10,000 matches).
   - Name it `formatCurrencyForInvoice()` so `rg "formatCurrencyForInvoice"` yields exact call sites.
2. **Consistent Casing Discipline**:
   - `PascalCase`: Types, Interfaces, Classes, Enums, React/UI Components.
   - `camelCase`: Variables, functions, methods, class instances.
   - `UPPER_SNAKE_CASE`: Global immutable constants and configuration flags.
   - `kebab-case`: File names, directory names, package names, CLI commands.

---

## 6. Verification Checklist for Naming

Before submitting code, audit identifiers in the diff:
- [ ] Are all variables named with domain meaning (zero `data`, `item`, `res`, `temp`)?
- [ ] Do all time and size numbers specify units (`timeoutMs`, `fileSizeBytes`)?
- [ ] Are all booleans positive predicates (`isActive`, `canCheckout`, `hasRole`)?
- [ ] Are all collections plural nouns and all maps formatted as `[values]By[Key]`?
- [ ] Do all functions start with an accurate contract verb (`get`, `fetch`, `calculate`, `create`)?
- [ ] Is every exported symbol uniquely grep-able across the repository?
