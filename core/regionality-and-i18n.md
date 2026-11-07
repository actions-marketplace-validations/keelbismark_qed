# Regionality, Localization & Data Sovereignty Standard
*Part of the Q.E.D. Engineering Framework*

This standard codifies the principles of internationalization (I18n), localization (L10n), temporal and monetary integrity, and multi-region data residency under the **Principle of Earned Complexity**.

---

## 0. Fundamental Axiom: Earned Regionality

> **Level 0 regional invariants cost zero bytes, zero dependencies, and are mandatory everywhere.  
> Every subsequent step up the regionality ladder must be earned by actual user footprint and legal jurisdiction.**

Software routinely falls victim to two opposite extremes:
1. **The Provincial ASCII / UTC Trap**: Building software that assumes the entire world operates on server local time, speaks 7-bit ASCII English, has a "First and Last Name", and measures money in raw floating-point numbers. When the first international user arrives, the database schema must be scrapped and rebuilt.
2. **Premature Geo-Overengineering**: Setting up multi-region distributed databases (Spanner, CockroachDB), 50 translation dictionary files with keys like `t('btn.save')`, and dynamic foreign exchange brokers for a day-one prototype or internal CLI tool.

Under Q.E.D., regionality follows an **evolutionary 4-stage ladder**.

```text
  ┌────────────────────────────────────────────────────────────────────────┐
  │                    THE EARNED REGIONALITY LADDER                       │
  │                                                                        │
  │  Level 0: Zero-Cost Baseline Invariants (Mandatory Everywhere)         │
  │  ├─ UTF-8 everywhere (DB collations, strings, headers)                 │
  │  ├─ UTC persistence & ISO 8601 serialization                           │
  │  ├─ Money as integer minor units + ISO 4217 currency code             │
  │  └─ Flexible unconstrained name fields                                 │
  │                                                                        │
  │  Level 1: Monolingual, Locale-Aware (Zero I18n Bloat)                  │
  │  ├─ Client-side timezone presentation via native Intl                  │
  │  ├─ Timezone-aware SQL date aggregations (`AT TIME ZONE`)             │
  │  └─ Native `Intl.PluralRules` (no `ru.json` or `i18next` bloat)        │
  │                                                                        │
  │  Level 2: Multi-Language & Multi-Currency (International Expansion)    │
  │  ├─ ICU MessageFormat dictionaries (one/few/many/other plurals)        │
  │  ├─ Accept-Language content negotiation with fallback trees           │
  │  ├─ CSS Logical Properties for RTL layout resilience                  │
  │  └─ Global Anycast CDN for static edge delivery                        │
  │                                                                        │
  │  Level 3: Sovereign Multi-Region & Compliance (Enterprise & Laws)      │
  │  ├─ Data residency compliance (152-ФЗ, GDPR, CCPA, PIPL)               │
  │  ├─ Geographically routed database clusters (GeoDNS)                  │
  │  └─ Automated Right-to-be-Forgotten PII scrubbing pipelines           │
  └────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Part I: The Zero-Cost Baseline Invariants (Level 0 — Everywhere)

These four rules require zero additional dependencies, add zero runtime overhead, and must be implemented from the very first commit of any project:

### A. UTF-8 Everywhere
* **Database & Tables**: Always configure database collations to UTF-8 (`utf8mb4_unicode_ci` in MySQL, `UTF8` in PostgreSQL/SQLite).
* **Network & File I/O**: Explicitly declare `charset=utf-8` on HTTP content types. Read and write file streams in UTF-8.
* **Length Safety**: Never measure string length by raw byte count when character counts are required. Use code-point iterators (`Array.from(str).length`) or `Intl.Segmenter` for grapheme clusters (e.g., emojis `👨‍👩‍👧‍👦` or accented characters `é`).

### B. Time: UTC on the Wire, Local in the View
* **Storage Invariant**: Database columns storing timestamps MUST be `TIMESTAMPTZ` (PostgreSQL) or UTC integer milliseconds/ISO-8601 strings.
  - ❌ *BANNED*: Saving naive timestamps without timezone offset (e.g., `2026-11-07 19:30:00` with no offset).
  - ✅ *REQUIRED*: Always serialize as ISO 8601 / RFC 3339 in UTC: `2026-11-07T16:30:00.000Z`.
* **The Analytics Day-Boundary Rule**:
  - When grouping by day in SQL reports, you MUST evaluate the calendar day in the **requesting user's IANA timezone**, not server UTC:
    ```sql
    -- ❌ WRONG: Groups by London midnight; users in Tokyo or SF get warped metrics
    SELECT DATE(created_at), COUNT(*) FROM orders GROUP BY DATE(created_at);
    
    -- ✅ CORRECT: Groups by user's calendar day
    SELECT DATE(created_at AT TIME ZONE :userTimeZone), COUNT(*) 
    FROM orders 
    GROUP BY DATE(created_at AT TIME ZONE :userTimeZone);
    ```

### C. Money: Integer Minor Units & ISO 4217
* **No IEEE-754 Floats**: Never use `float` or `double` for currency balances, invoicing, or transactions (`0.1 + 0.2 = 0.30000000000000004`).
* **Integer Minor Units**: Store monetary amounts in the currency's smallest integer division (e.g., cents for USD/EUR, kopecks for RUB, pence for GBP).
  - Example: \$14.99 is stored as `{ "amount": 1499, "currency": "USD" }`.
  - Zero-decimal currencies: Currencies like Japanese Yen (`JPY`) or South Korean Won (`KRW`) have no minor units (`1500 JPY` = 1500).
* **ISO 4217 Invariant**: Always store amounts alongside their 3-letter currency code (`USD`, `EUR`, `RUB`, `JPY`). Never store a raw number without its currency identifier.

### D. Human Names: Avoid Anglo-Centric Assumptions
* Do not split names into mandatory `first_name` and `last_name` columns unless required by strict legal KYC:
  - Many cultures place the family name first (China, Japan, Hungary, Vietnam).
  - Many people have single mononyms (Indonesia, Iceland) or multiple maternal and paternal surnames (Spain, Latin America).
* Use a single `full_name` field for display and communication, with an optional `preferred_name` or `short_name`.

---

## 2. Part II: Single-Language Locale-Awareness (Level 1)

When a project targets a single language (e.g., English-only or Russian-only), **do not introduce translation frameworks or dictionary files**. Use the runtime's native `Intl` APIs for high-assurance ergonomics without bloat.

### A. Dependency-Free Native Pluralization
Instead of writing sloppy hacks (`${count} file(s)` or `${count} файл(ов)`), use native `Intl.PluralRules` in < 15 lines of code:

```typescript
// src/shared/lib/plurals.ts
// Native pluralization without i18n dependencies
export function pluralizeRu(count: number, forms: { one: string; few: string; many: string }): string {
  const pr = new Intl.PluralRules("ru");
  const rule = pr.select(count); // 'one' | 'few' | 'many' | 'other'
  
  switch (rule) {
    case "one": return `${count} ${forms.one}`;   // 1 день
    case "few": return `${count} ${forms.few}`;   // 2, 3, 4 дня
    default:    return `${count} ${forms.many}`;  // 5 дней, 0 дней, 11 дней
  }
}
```

### B. Client-Side Date and Currency Rendering
* Let the browser or runtime format values using the user's system locale:
  ```typescript
  // Formats correctly based on user's browser: "$100.00" in US, "100,00 €" in France
  export function formatCurrency(minorUnits: number, currency: string, locale = "default"): string {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).format(minorUnits / 100);
  }
  ```

### C. Locale-Aware Sorting
* Never use raw `array.sort()` for user-facing lists of names or strings:
  - Standard sort uses Unicode code points, sorting Swedish `ä` or German `ö` after `z`.
  - Use `Intl.Collator`:
    ```typescript
    const collator = new Intl.Collator(userLocale, { sensitivity: "base" });
    items.sort((a, b) => collator.compare(a.name, b.name));
    ```

---

## 3. Part III: Multi-Language & Multi-Currency (Level 2)

When real demand for international markets emerges, introduce structured localization without sacrificing maintainability.

### A. ICU MessageFormat Over Naive Key-Value Maps
* ❌ *BANNED*: Naive string replacement maps:
  ```json
  { "notifications": "You have {count} new messages" }
  ```
  *(This breaks completely in Russian, Arabic, Polish, and Hebrew where multiple plural forms exist).*
* ✅ *REQUIRED*: ICU MessageFormat:
  ```json
  {
    "messagesCount": "{count, plural, one{# новое сообщение} few{# новых сообщения} many{# новых сообщений} other{# нового сообщения}}"
  }
  ```

### B. Content Negotiation & Fallback Tree
* Parse the `Accept-Language` HTTP header with quality values (`ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7`).
* Follow a deterministic fallback tree:
  `Specific Variant (pt-BR)` $\rightarrow$ `Base Language (pt)` $\rightarrow$ `Default Fallback (en)`.
* Always provide an explicit language selector UI that overrides browser auto-detection and persists in a secure cookie or user profile.

### C. Right-to-Left (RTL) Layout Resilience
* If supporting Arabic, Hebrew, or Persian, never hardcode directional CSS properties:
  - ❌ *BANNED*: `margin-left: 16px`, `text-align: right`, `left: 0`.
  - ✅ *REQUIRED*: CSS Logical Properties:
    `margin-inline-start: 16px`, `text-align: start`, `inset-inline-start: 0`.

### D. Global Anycast CDN Edge Distribution
* Static assets (JavaScript, CSS, fonts, images) must be distributed via global Anycast edge networks (Cloudflare, AWS CloudFront, Fastly) to ensure low Time-to-First-Byte (TTFB) worldwide regardless of origin server location.

---

## 4. Part IV: Sovereign Multi-Region & Data Residency (Level 3)

For regulated industries (FinTech, HealthTech, GovTech) or enterprise workloads under sovereign data laws (GDPR in the EU, 152-ФЗ in Russia, CCPA in California, PIPL in China):

### A. Physical Data Residency (Sovereignty Boundaries)
* **Primary Citizen Data**: Must be ingested, processed, and stored on infrastructure physically located within the designated jurisdiction.
* **Partitioned Databases**:
  - Direct incoming traffic to regional database clusters via GeoDNS routing:
    - EU users $\rightarrow$ Frankfurt (`eu-central-1`)
    - RU users $\rightarrow$ Moscow / St. Petersburg
    - US users $\rightarrow$ North Virginia (`us-east-1`)
* Cross-border replication of PII is prohibited without strict tokenization, encryption, and statutory legal basis.

### B. Geographic Latency & Read Replicas
* **Speed of Light**: Round-trip time (RTT) between distant continents is bounded by physics (~150–250ms).
* Place read replicas close to end-user clusters to serve reads with sub-20ms latency.
* Funnel mutations (writes) to the primary regional master with optimistic UI feedback to mask latency.

### C. The Right to be Forgotten (GDPR / 152-ФЗ Automated Scrubbing)
* Build automated deletion and anonymization routines into data pipelines:
  - Deleting a user must cascade to search indices (Elasticsearch), analytics data lakes, and transactional tables.
  - Backup retention policy: PII in backups must age out deterministically (e.g., 30-day snapshot rotation).

---

## 5. Verification Checklist: Pre-Flight Regionality Gate

Before deploying features touching dates, money, strings, or geographic data:
- [ ] Are all database columns and network payloads storing timestamps in UTC with ISO 8601 formatting?
- [ ] Are date-aggregation SQL queries (`GROUP BY`) grouped using the user's specific IANA timezone?
- [ ] Is money stored exclusively as integer minor units (or exact Decimal) accompanied by an ISO 4217 currency code?
- [ ] Are strings and database tables configured to UTF-8?
- [ ] If monolingual, are plurals handled via native `Intl.PluralRules` rather than sloppy `(s)` or `(ов)` concatenation?
- [ ] Are user names collected without rigid, culturally insensitive first/last name splits?
- [ ] If multi-language, are translation strings formatted using ICU MessageFormat pluralization rules?
- [ ] Has premature multi-region infrastructure complexity been rejected if user footprint does not justify it?
