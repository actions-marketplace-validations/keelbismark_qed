# The 3 AM Readability Test
*Part of the Q.E.D. Engineering Framework*

## The Benchmark
> *"Can an exhausted on-call engineer understand, trace, and debug this code at 3:00 AM during a production incident without needing aspirin?"*

If the answer is "no", the code fails the 3 AM Test — regardless of how concise, clever, or mathematically elegant it looks.

---

## 3 Core Principles

### 1. Guard Clauses & Early Returns Over Deep Nesting
Never nest `if/else` ladders 4 levels deep. Return or throw early to flatten execution flow.

```typescript
// ❌ FAILS 3 AM TEST (Cognitive overload)
function processOrder(order: Order, user: User) {
  if (user.isActive) {
    if (order.items.length > 0) {
      if (order.total > 0) {
        return executePayment(order);
      } else {
        throw new Error("Invalid total");
      }
    } else {
      throw new Error("Empty items");
    }
  } else {
    throw new Error("Inactive user");
  }
}

// ✅ PASSES 3 AM TEST (Instant comprehension)
function processOrder(order: Order, user: User) {
  if (!user.isActive) throw new Error("Inactive user");
  if (order.items.length === 0) throw new Error("Empty items");
  if (order.total <= 0) throw new Error("Invalid total");

  return executePayment(order);
}
```

### 2. Descriptive Intermediate Variables Over Long Functional Chains
Chaining `.map().filter().reduce().some().flat()` into a single 15-line statement is a debugging nightmare. Name the intermediate steps.

```typescript
// ❌ FAILS 3 AM TEST
const result = data.filter(x => x.v > 10).map(x => x.u).reduce((a, b) => ({ ...a, [b.id]: b.val }), {});

// ✅ PASSES 3 AM TEST
const activeMetrics = data.filter(item => item.value > THRESHOLD);
const userProfiles = activeMetrics.map(item => item.user);
const userValueMap = Object.fromEntries(
  userProfiles.map(profile => [profile.id, profile.value])
);
```

### 3. Concrete Examples for Non-Trivial Logic
If an algorithm involves non-obvious bitwise manipulation, regex, or mathematical transformation, provide a 2-line doc comment showing concrete inputs and expected outputs:

```typescript
/**
 * Strips protocol and normalizes domain names.
 * Example: "https://www.example.com:8080/path?q=1" -> "example.com"
 */
export function extractRootDomain(rawUrl: string): string { ... }
```
