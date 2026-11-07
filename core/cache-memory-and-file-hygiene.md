# Cache, Memory & Resource Hygiene Standard
*Part of the Q.E.D. Engineering Framework*

This standard codifies the invariants governing cache lifecycles, memory leaks, stream backpressure, and file descriptor hygiene under the **Principle of Earned Complexity**.

---

## 0. Fundamental Axiom: Unbounded Resources are Deferred Crashes

> **RAM, disk space, and file descriptors are finite physical constraints.  
> An unbounded cache is a deferred Out-Of-Memory (OOM) crash.  
> An uncleaned temporary file is a deferred 100% disk exhaustion outage.**

Software rarely crashes from sudden explosions; it slowly degrades and dies from creeping resource leaks. A developer puts an object into an unbounded in-memory map or leaves a temporary file on disk during a failed export, and three months later the production node crashes at 3:00 AM.

Under Q.E.D., all physical resource usage must be **bounded, tracked, and deterministically reclaimed**.

```text
  ┌────────────────────────────────────────────────────────────────────────┐
  │                   THE RESOURCE INTEGRITY TRIAD                         │
  │                                                                        │
  │   1. Memory & Cache Bounding        2. Stream Backpressure             │
  │   - Strictly bounded LRU size       - Never buffer large files in RAM  │
  │   - Mandatory deterministic TTL     - Stream pipelines with chunking   │
  │   - Tenant-scoped cache keys        - Clean event listener teardown    │
  │                                                                        │
  │   3. File & Descriptor Hygiene                                         │
  │   - Guaranteed temp file cleanup (`try...finally` / `defer`)           │
  │   - Atomic writes (write to `.tmp` -> atomic rename)                   │
  │   - Zero unclosed file descriptors or socket leaks                     │
  └────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Part I: The Cache Invariants (Bounded, Expiring, Isolated)

### A. The Bounded Size & Mandatory TTL Invariant
* ❌ *BANNED*: Storing cache entries in raw unbounded maps:
  ```typescript
  // CATASTROPHIC ANTI-PATTERN: Leaks memory until process OOM kills the container
  const cache = new Map<string, any>();
  export function getCachedUser(id: string) { ... }
  ```
* ✅ *REQUIRED*: Every cache MUST enforce two physical boundaries:
  1. **Strict Max Size (LRU Eviction)**: An upper limit on item count (e.g. `max: 500`). When capacity is reached, the least recently used entry is evicted.
  2. **Deterministic Time-To-Live (`ttlMs`)**: Every entry must expire automatically.
  ```typescript
  import { LRUCache } from "lru-cache";
  
  const userCache = new LRUCache<string, User>({
    max: 1000,
    ttl: 1000 * 60 * 5, // 5 minutes TTL
  });
  ```

### B. Invalidation on Mutation (The Ghost Data Invariant)
* When state in the primary database is modified, the associated cache key MUST be invalidated or updated atomically (Write-Through or Invalidate-on-Write).
* Serving stale phantom data (e.g., user pays for an invoice, but UI displays "Unpaid" because the cache key was not purged) is a high-severity regression.

### C. Cache Stampede & Thundering Herd Defense
* When a heavily trafficked cache key expires, thousands of concurrent requests must NOT hit the database simultaneously.
* Apply the **Singleflight / Mutex Pattern**: Only the first request executes the expensive database query; all subsequent concurrent requests subscribe to that pending promise:
  ```typescript
  // src/shared/lib/singleflight.ts
  const inFlight = new Map<string, Promise<any>>();
  
  export async function fetchWithSingleflight<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    if (inFlight.has(key)) return inFlight.get(key)!;
    const promise = fetcher().finally(() => inFlight.delete(key));
    inFlight.set(key, promise);
    return promise;
  }
  ```
* Alternatively, use the **Stale-While-Revalidate (SWR)** strategy: return the stale value immediately while a single asynchronous background task refreshes the cache.

### D. Multi-Tenant Key Isolation
* ❌ *BANNED*: Using naked object IDs in shared cache instances (`cache.get("user:42")` or `cache.get("dashboard_stats")`).
* ✅ *REQUIRED*: Cache keys must be partitioned by tenant/organization:
  `cache.get("tenant:${orgId}:user:${id}")`.
  A failure in key scoping results in critical multi-tenant data leaks (BOLA/IDOR).

---

## 2. Part II: Memory Hygiene & Stream Backpressure

### A. The 10MB Stream Invariant (Zero Buffer Congestion)
* ❌ *BANNED*: Reading unbounded files or network bodies entirely into memory:
  ```typescript
  // CATASTROPHIC: A 2GB CSV file crashes Node with "Array buffer allocation failed"
  const fileData = fs.readFileSync(largeFilePath);
  const rows = fileData.toString().split("\n");
  ```
* ✅ *REQUIRED*: Any payload that can exceed 10MB (file uploads, CSV exports, media, log parsing) MUST be processed via **Streams with Backpressure**:
  ```typescript
  import { pipeline } from "node:stream/promises";
  import fs from "node:fs";
  import zlib from "node:zlib";
  
  // Streams data chunk-by-chunk with bounded memory footprint (<30MB)
  await pipeline(
    fs.createReadStream(inputPath),
    zlib.createGzip(),
    fs.createWriteStream(outputPath)
  );
  ```

### B. Event Listener & Callback Lifecycle Teardown
* Every event listener attached to an emitter, socket, or DOM node MUST have a corresponding teardown in the cleanup lifecycle:
  - Node.js: `emitter.off("event", handler)` or pass `{ signal: abortSignal }`.
  - React: Return a cleanup function from `useEffect()` that detaches listeners.
* Ban on capturing large objects inside long-lived closures or `setInterval` callbacks.

---

## 3. Part III: File System & Descriptor Hygiene

### A. The Scoped Temporary File Invariant (Guaranteed Cleanup)
* Any temporary file created during PDF generation, image transformation, or export MUST be deleted deterministically, even if an exception occurs mid-operation:
  ```typescript
  // src/shared/lib/tempFile.ts
  import fs from "node:fs/promises";
  import path from "node:path";
  import os from "node:os";
  
  export async function withTempFile<T>(
    prefix: string,
    worker: (tempPath: string) => Promise<T>
  ): Promise<T> {
    const tempPath = path.join(os.tmpdir(), `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`);
    try {
      return await worker(tempPath);
    } finally {
      // Guaranteed cleanup: runs even if worker throws
      await fs.unlink(tempPath).catch(() => {});
    }
  }
  ```

### B. File Descriptor & Socket Integrity
* Every open file handle, database connection, or socket must be closed inside a `finally` block or context manager (`using` / Python `with` / Go `defer`).
* Unclosed file handles lead to operating system `EMFILE: too many open files` errors, taking down the entire host.

### C. Atomic File Writes
* Never overwrite important configuration or state files directly in place. If power cuts or process terminates mid-write, the file becomes 0-byte corrupt garbage.
* Always write to a sibling temporary file (`config.json.tmp`) and perform an atomic filesystem rename (`renameSync`), which the OS executes as an atomic pointer swap.

---

## 4. Part IV: The Earned Complexity Ladder for Caching

Do not build distributed Redis infrastructure when an indexed SQL query or simple HTTP header solves the problem.

| Level | Strategy | Appropriate Scenarios | Infrastructure Required |
| :--- | :--- | :--- | :--- |
| **Level 0** | **Database Indexes & HTTP Headers** | CLI tools, low-to-medium traffic apps | None. `Cache-Control: public, max-age=31536000, immutable`, `ETag`, and proper B-Tree DB indexes. |
| **Level 1** | **In-Process Bounded LRU** | Single-instance web services, micro-tools | In-memory `LRUCache(max: 500, ttl: 60s)`. Zero external services. |
| **Level 2** | **Distributed Cache (Redis/Valkey)** | Multi-instance web services, autoscaled containers | External Redis with tenant-prefixed keys, TTL, and Singleflight lock. |
| **Level 3** | **Multi-Tier Hybrid Cache** | Ultra-high throughput APIs (10,000+ RPS) | L1 local in-memory + L2 Redis + Edge CDN + Pub/Sub invalidation events. |

---

## 5. Verification Checklist: Pre-Flight Hygiene Gate

Before committing code touching caching, file operations, or memory streams:
- [ ] Does every in-memory cache have an explicit `maxSize` (LRU) and `ttlMs`?
- [ ] Are all cache keys tenant-scoped (`tenant:${orgId}:...`)?
- [ ] Is cache invalidated immediately upon database mutation?
- [ ] Are temporary files wrapped in guaranteed cleanup blocks (`try...finally` / `withTempFile`)?
- [ ] Are file exports or imports exceeding 10MB handled via streams rather than `readFile`/memory buffers?
- [ ] Are file modifications executed via atomic write-and-rename (`file.tmp` $\rightarrow$ `file`)?
- [ ] Are all event listeners, timers, and file handles torn down cleanly upon task completion?
