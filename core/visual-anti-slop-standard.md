# Visual Anti-Slop & Human Interface Standard
*Part of the Q.E.D. Engineering Framework*

This standard codifies non-negotiable design and frontend engineering invariants to eradicate generic generative AI visual tropes ("AI Slop"), technical narcissism, and layout clutter from digital products.

---

## 0. Fundamental Axiom: Interfaces Exist for Human Utility, Not AI Aesthetics

> **Software exists to help a busy, tired human accomplish a real-world task in the fewest possible seconds.  
> An interface is not an art gallery for AI design cliches.  
> Every unnecessary border, meaningless bento card, fake hacker terminal badge, and speculative KPI sparkline is cognitive tax stolen from the user.**

Generative AI models default to "sterile synthetic design" — packing every sentence into rounded gray boxes, applying monotonous 3-column grids, spraying emoji salad across headers, and bragging about backend database internals in client interfaces.

Under Q.E.D., every visual interface MUST pass the **Three-Filter Human Reality Audit**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│                   THREE-FILTER HUMAN REALITY AUDIT                     │
│                                                                        │
│   [ Raw AI Mockup / Code ]                                             │
│              │                                                         │
│              ▼                                                         │
│   ┌────────────────────────────────────────┐                           │
│   │ 1. THE AI SLOP PURGE                   │                           │
│   │    - Strip box-itis (Unboxed default)  │                           │
│   │    - Ban bento-mania & 3x3 monotony    │                           │
│   │    - Eliminate cyber/sci-fi terminalism│                           │
│   │    - Zero emoji salad                  │                           │
│   └──────────────────┬─────────────────────┘                           │
│                      │                                                 │
│                      ▼                                                 │
│   ┌────────────────────────────────────────┐                           │
│   │ 2. THE "WHO CARES?" PURGE              │                           │
│   │    - Cut backend exhibitionism (DBs)   │                           │
│   │    - Replace text walls with actions   │                           │
│   │    - Remove pseudo-math micro-precision│                           │
│   └──────────────────┬─────────────────────┘                           │
│                      │                                                 │
│                      ▼                                                 │
│   ┌────────────────────────────────────────┐                           │
│   │ 3. PURE HUMAN UTILITY                  │                           │
│   │    - High-density domain typography    │                           │
│   │    - Direct keyboard affordances       │                           │
│   │    - 100% actionable user value        │                           │
│   └──────────────────┬─────────────────────┘                           │
│                      │                                                 │
│                      ▼                                                 │
│   [ Honest, Fast, Human-Centric Interface ]                            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 1. The Slop Pendulum: Type 1 (Plastic Carnival) vs. Type 2 (Sterile Hospital Sheet)

Generative AI models operate in destructive extremes. When an agent designs an interface, it falls into **Type 1 Slop**. When told to "remove the slop", it swings the pendulum 180 degrees into **Type 2 Slop**:

```text
       Type 1 Slop                                                       Type 2 Slop
  [ PLASTIC CARNIVAL ]      ◀════════════════════════════════════════▶  [ STERILE HOSPITAL SHEET ]
  • Bento-mania & Box-itis                                              • Monotone depression / brutalism
  • Purple glow & neon borders                                          • Plain Times New Roman / unstyled text
  • Emoji salad & fake terminals                                        • Murders unique clever ideas
  • Floating badges & cyber slashes                                     • Zero soul, zero craft, zero delight
                                         ▲
                                         │
                             [ THE Q.E.D. GOLDEN MEAN ]
                             «The Signature Spark (Фирменная искра)
                              liberated from decorative scaffolding»
```

### A. The Two Failure Modes
1. **Type 1 Slop (The Plastic Carnival / Synthetic Bloat)**:
   - Over-engineered cards, glowing gradient borders, floating chips, emoji icons, and fake metrics.
   - *However*, amidst this circus, the model may occasionally generate a **genuinely brilliant, high-utility feature** (e.g., an interactive pricing slider with live cost breakdowns, an intuitive before/after diff slider, or an elegant interactive filtering canvas).
2. **Type 2 Slop (The Sterile Hospital Sheet / Anti-Slop Slop)**:
   - Upon being prompted *"Remove the AI slop"*, the terrified agent swings to performative austerity:
   - It strips *all* design, turns the screen into a joyless Wikipedia-like document, and **deletes the brilliant interactive feature**, falsely claiming: *"I removed all slop and made it minimal!"*
   - *Result*: The site loses its soul, its unique identity, and its core competitive advantage.

### B. The Archaeologist Invariant (Don't Bulldoze — Excavate the Artifact)
> **Never bulldoze an excavation site to clear dust. Excavate the artifact, clean the mud off, and illuminate it.**

When refactoring an interface to remove slop:
- **Scrap the Scaffolding (Мусор)**: Decorative card borders, glowing shadows, emoji salad, faux-terminal prompts, and meaningless metric badges $\rightarrow$ **Purge mercilessly.**
- **Preserve the Signature Spark (Фирменная искра)**: The clever interactive widget, the high-utility visualization, the tactile calculation mechanic $\rightarrow$ **Keep and liberate.**
- **The Execution**: Do not delete the unique mechanic; strip the surrounding neon plastic so the mechanic lives cleanly on the open canvas as the hero component.

### C. The Bathwater Check (Тест «Ребенок и вода»)
Before finalizing any anti-slop refactoring, answer:
1. *Did the initial version contain an interactive mechanic or visual rhythm that genuinely engaged or assisted the user?*
2. *Did I preserve that feature, or did I lazily delete it to make my job easier?*
3. *Does this page look like a world-class professional tool, or does it look like an amputated, unfinished wireframe?*

---

## 2. Filter 1: The AI Slop Purge (Generative Design Tropes)

### A. Box Syndrome (Боксомания) $\rightarrow$ The "Unboxed by Default" Invariant
* **The Symptom**: Every heading, metric, paragraph, and button is wrapped in its own separate rounded card (`border border-slate-800 rounded-xl bg-card p-6 shadow-xs`). The screen resembles an IKEA warehouse of identical gray containers.
* ❌ *BANNED*: Wrapping standalone text or logical groups into decorative boxes:
  ```html
  <!-- SLOP: Pointless card wrapping a simple paragraph -->
  <div class="rounded-xl border border-border bg-card p-6 shadow-sm">
    <h3 class="text-lg font-bold">Fast Delivery</h3>
    <p class="text-sm text-muted">Orders arrive within 2 business days.</p>
  </div>
  ```
* ✅ *REQUIRED*: **Unboxed by Default**. Elements live directly on the open canvas structured by whitespace and typography. Borders are permitted **only** when separating genuinely distinct interactive regions (e.g. modals, data table frames, or persistent sidebar panels):
  ```html
  <!-- CLEAN: Structured purely by typography and negative space -->
  <div class="space-y-1">
    <h3 class="font-semibold text-foreground">Fast Delivery</h3>
    <p class="text-sm text-muted-foreground">Orders arrive within 2 business days.</p>
  </div>
  ```

### B. Bento-Mania (Плиточная мания) $\rightarrow$ Form Follows Data Topology
* **The Symptom**: Forcing every dataset into an Apple/Vercel-style Bento grid. AI equalizes the height of adjacent columns (`grid-cols-3` or `h-full justify-between`), leaving massive, awkward blank holes inside cards.
* ❌ *BANNED*: Forcing tabular, chronological, or hierarchical data into equal-sized bento tiles.
* ✅ *REQUIRED*: Structure follows the native geometry of the data:
  - Tabular records $\rightarrow$ High-density data tables with sticky headers and column alignment.
  - Event sequences $\rightarrow$ Linear vertical or horizontal timelines.
  - Hierarchies $\rightarrow$ Tree views or nested breadcrumb drill-downs.

### C. Monotonous 3x3 Grids $\rightarrow$ Organic Asymmetry & Information Density
* **The Symptom**: Autopilot generation of 3 columns everywhere: 3 features, 3 pricing tiers, 3 testimonials, 3 setup steps. The user's eye glazes over in two seconds.
* ✅ *REQUIRED*: Asymmetric, content-driven layouts. Pair high-priority primary modules with compact secondary sidebars (e.g., 8/4 or 7/5 grid ratios), horizontal data streams, or collapsible sections.

### D. Cyber / Sci-Fi / Terminal Fetishism $\rightarrow$ Domain Authenticity
* **The Symptom**: Pretending a mundane web service (CRM, invoicing, booking) is a NASA spaceship or Linux terminal:
  - Faux-terminal prompts: `$ cat invoice_report.log`
  - Decorative slashes: `// 01 OVERVIEW`, `// 02 CONFIG`
  - Irrelevant GPS coordinates: `55.7512° N, 37.6184° E`
  - Neon cyan/purple laser gradients and scanline grid backgrounds.
* ❌ *BANNED*: All faux-cyberpunk decorations in non-terminal software.
* ✅ *REQUIRED*: Clean, modern domain aesthetics. If building an accounting tool, it must look like a world-class financial tool, not a movie hacker simulation.

### E. Emoji Salad $\rightarrow$ Zero Emojis in Professional UI
* **The Symptom**: Sprinkling emojis into every header, navigation tab, and button (`🚀 Launch`, `🔥 Trending`, `⚡ Fast`, `💡 Features`).
* ❌ *BANNED*: Using emojis as UI icons or list bullets. Emojis immediately degrade serious software into spammy amateur prototypes.
* ✅ *REQUIRED*: **Strictly ZERO Emojis in UI chrome and navigation**. Use crisp, calibrated SVG vector icons (Lucide, Heroicons, or Radix Icons) with `aria-hidden="true"`, sized consistently (`size-4` / 16px).

### F. KPI Hallucination & Fake Sparklines $\rightarrow$ Real Telemetry or Omission
* **The Symptom**: Placing four generic KPI cards at the top of an interface with static green polyline SVGs and arbitrary percentages (`+14.2% from last week`) that connect to no real backend schema.
* ❌ *BANNED*: Mock sparklines and invented trend percentages.
* ✅ *REQUIRED*: If real historical timeseries data exists, render verified metrics with labeled axes and timeframes. If timeseries data does not exist, show the absolute number without fake trend embellishments.

---

## 3. Filter 2: The "Who Cares?" Purge (Technical Narcissism)

What developers and AI assistants love to exhibit on screen that real users actively despise:

### A. Backend Exhibitionism
* ❌ *BANNED*: Boasting about internal tech stack, databases, or algorithms in user interfaces:
  - *"Powered by Sharded PostgreSQL with pgvector"* $\rightarrow$ Real user: "Can I find my document?"
  - *"Dijkstra route calibration completed in 0.18ms"* $\rightarrow$ Real user: "How long is the walk?"
  - *"Internal Entity UUID: #3f9a12b-88c9"* $\rightarrow$ Real user: "What is my invoice number?"
* ✅ *REQUIRED*: Speak strictly in user domain concepts. Keep architecture details in technical documentation and resume portfolios.

### B. Text Walls vs. Direct Visual Actions
* ❌ *BANNED*: Multistep written instructions telling the user how to move their eyes or click:
  - *"1. Look at the left sidebar, 2. Click the blue Settings tab, 3. Scroll to Security..."*
* ✅ *REQUIRED*: A single direct deep link or contextual button: `[Open Security Settings]`.

### C. Pseudo-Mathematical Micro-Precision
* ❌ *BANNED*: Exposing raw floating-point timestamps or precision micro-measurements:
  - *"Route distance: 141.248 meters · ETA: 2.381 minutes"*
  - *"Query finished in 0.003912 seconds"*
* ✅ *REQUIRED*: Human-scale approximations: *"~150 m · 3 min walk"*.

---

## 4. Filter 3: Pure Human Utility (The Affordance Standard)

### A. Information Density Over Infinite Scrolling
* Enterprise users, operators, and developers need high information density:
  - Compact table row heights (`h-9` / 36px or `h-10` / 40px, not giant 80px cards).
  - Explicit column alignment: numbers right-aligned with tabular figures (`font-variant-numeric: tabular-nums`); text left-aligned; status badges centered.
  - Sticky headers and fixed action columns for wide horizontal tables.

### B. Keyboard First & Clear Affordances
* Every interactive control must have:
  - Visible, high-contrast focus rings (`focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2`).
  - Native keyboard navigation (`Tab`, `Shift+Tab`, `Enter`, `Escape`, arrow keys for lists/menus).
  - Explicit hover and active states (no motionless elements that leave the user wondering if a click registered).

---

## 5. The 4 Mandatory Visual States

Every screen and component MUST implement:

1. **Empty State**: Never a blank void or an empty card. Must include a clear human explanation of why it is empty, plus a single primary action (e.g. *"No invoices created yet. [Create First Invoice]"*).
2. **Loading State**: Content-matched skeletons with exact dimensions to eliminate Cumulative Layout Shift (CLS). Spinners are permitted only for atomic inline button actions.
3. **Error State**: Actionable, human-friendly error explaining what happened and providing a one-click **Retry** mechanism. Never dump raw JavaScript stack traces or raw HTTP status codes to end users.
4. **Degraded / Offline State**: Subtle non-blocking banner notifying the user of connection loss, while auto-saving uncommitted form drafts to local storage to prevent data loss.

---

## 6. The 3 AM Human Reality Checklist

Before approving any UI code or screen mockup:

- [ ] **The Archaeologist Check**: Did you preserve the signature interactive spark (unique calculator, live slider, diff view) while purging the surrounding neon card slop?
- [ ] **No Type 2 Slop**: Did you avoid turning the site into a depressing, unstyled, sterile hospital sheet under the guise of minimalism?
- [ ] **Unboxed by Default**: Did you strip unnecessary card wrappers and borders?
- [ ] **Form Follows Data**: Are tables used for tabular data and lists for lists, rather than forcing everything into Bento tiles?
- [ ] **Zero Sci-Fi Slop**: Did you purge fake terminal prompts (`$`), code slashes (`//`), and neon cyber glow?
- [ ] **Zero Emojis**: Are all headings, tabs, and buttons completely free of emoji characters?
- [ ] **No Backend Bragging**: Is every sentence written in user-domain concepts rather than database/algorithm names?
- [ ] **No Fake Sparklines**: Are all trend lines backed by actual timeseries data?
- [ ] **Tabular Numerics**: Do financial and numerical columns use `tabular-nums` with right-alignment?
- [ ] **CLS-Free Loading**: Do loading skeletons match the exact dimensions of final rendered content?
