# Workflow Ergonomics & Human Affordances Standard
*Part of the Q.E.D. Engineering Framework*

This standard codifies non-negotiable frontend, interaction, and system engineering invariants to eliminate user friction, preserve mental flow state, prevent accidental data loss, and guarantee professional operational velocity.

---

## 0. Fundamental Axiom: Eliminating Friction Between Human Intent and System Result

> **Software exists to translate human intent into machine execution with zero cognitive tax.  
> An interface that looks clean on a screenshot but fights the user during an 8-hour workday is broken.  
> Every lost form draft, blocked paste action, modal interruption, untraceable error, and missing keyboard shortcut steals human life and compounds operator fatigue.**

Professional software (Linear, VS Code, Figma, Bloomberg, Excel) earns trust through **predictability, speed, and forgiveness**.

Under Q.E.D., every digital interface and administrative workflow MUST satisfy the **Workflow Ergonomics Integrity Pentad**:

```text
┌────────────────────────────────────────────────────────────────────────┐
│               THE WORKFLOW ERGONOMICS INTEGRITY PENTAD                 │
│                                                                        │
│ 1. Continuity of State & Flow         2. Motorics & Keyboard Velocity  │
│    - State-in-URL (Shareable truth)      - Focus preservation & return │
│    - Unbreakable Drafts (Zero loss)      - Command palette (`Cmd+K`)   │
│    - The Anchor Invariant (Tabs/Links)   - 1-click copy & open paste   │
│                                                                        │
│ 3. Forgiving by Design (Resilience)   4. Cognitive Load & Disclosure   │
│    - Undo over Modal Friction            - Progressive Disclosure (80/20)│
│    - Validation on Blur (No shouting)    - Optimistic UI (Zero latency)│
│    - Soft deletes with recovery          - Smart defaults & pre-fill   │
│                                                                        │
│ 5. Power Operator & Data Density                                       │
│    - Bulk actions & Range select (`Shift`)                             │
│    - Tabular figure alignment (`tabular-nums`)                         │
│    - Correlation ID on every error (Instant support traceability)      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 1. Dimension 1: Continuity of State & Flow

### A. The State-in-URL Invariant (Shareable & Survives Refresh)
* **The Symptom**: Storing active filters, search keywords, selected tabs, pagination indices, or side-drawer states solely in ephemeral component memory (`useState`).
* **The Human Failure**: The user configures complex filters, accidentally hits `F5` or the browser Back button, and everything resets. Sharing the link with a teammate loads a blank default view instead of the intended data.
* ❌ *BANNED*: Managing navigable view state in isolated local state without URL reflection:
  ```typescript
  // CATASTROPHIC ERGONOMICS: Vanishes on refresh or link sharing
  const [activeTab, setActiveTab] = useState("billing");
  const [searchQuery, setSearchQuery] = useState("");
  ```
* ✅ *REQUIRED*: View parameters MUST be synchronized with URL query search parameters:
  ```typescript
  // High-Assurance: URL is the single source of navigational truth
  // URL: /dashboard?tab=billing&q=invoice&page=2&drawer=inv_982
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "general";
  ```

### B. The Unbreakable Draft Invariant (Zero Data Loss)
* **The Human Failure**: A user fills out a 15-field incident report or contract. An accidental swipe gesture or browser crash occurs, wiping 20 minutes of work.
* ❌ *BANNED*: Forms requiring $>2$ fields that do not preserve in-progress input.
* ✅ *REQUIRED*: Automatically persist draft state into `sessionStorage` or `localStorage` debounced by form key and record ID. When returning, restore the draft cleanly:
  ```typescript
  export function useFormDraft<T>(draftKey: string, initialValues: T) {
    const [values, setValues] = useState<T>(() => {
      const saved = localStorage.getItem(draftKey);
      return saved ? (JSON.parse(saved) as T) : initialValues;
    });

    useEffect(() => {
      const handle = setTimeout(() => {
        localStorage.setItem(draftKey, JSON.stringify(values));
      }, 500); // 500ms debounce
      return () => clearTimeout(handle);
    }, [draftKey, values]);

    const clearDraft = () => localStorage.removeItem(draftKey);
    return [values, setValues, clearDraft] as const;
  }
  ```

### C. The Anchor Invariant (Native Hyperlinks)
* ❌ *BANNED*: Simulating navigation with click handlers on non-link elements:
  ```html
  <!-- BROKEN: Breaks Middle-Click, Ctrl+Click, Open in New Tab, and Bookmarks -->
  <div onClick={() => navigate(`/orders/${order.id}`)}>Order #{order.id}</div>
  ```
* ✅ *REQUIRED*: Every clickable destination MUST be a semantic `<a href="...">` (or framework `<Link href="...">`). Elements styled as buttons (`<button>`) are strictly reserved for state-changing mutations and actions.

---

## 2. Dimension 2: Motorics, Keyboard Velocity & Muscle Memory

### A. Focus Preservation & Deterministic Return
* **The Symptom**: When an overlay modal or dropdown closes, keyboard focus jumps to `document.body`. When a user deletes a row in a table, focus teleports to the top of the page.
* ✅ *REQUIRED*:
  1. **Dialog Return**: When closing a modal or drawer, focus **MUST return to the element that triggered it**.
  2. **List Continuity**: When deleting item $N$ from an active list, focus MUST transition to item $N+1$ (or $N-1$ if the last item was deleted), allowing rapid sequential review via the keyboard.

### B. The Command Palette (`Cmd+K` / `Ctrl+K`)
* Power users navigate through muscle memory, not nested hover menus.
* Any professional tool with $>10$ views or search capabilities MUST provide a global command palette:
  - Global shortcut: `Cmd+K` (macOS) / `Ctrl+K` (Windows/Linux).
  - Instant fuzzy search across entities, pages, and quick actions.
  - Keyboard-navigable with `Up`, `Down`, `Enter`, and `Escape`.

### C. Frictionless Clipboard
* ❌ *BANNED*: Blocking clipboard paste:
  ```html
  <!-- USER-HOSTILE: Blocks password managers, 2FA apps, and secure tokens -->
  <input onPaste={(e) => e.preventDefault()} />
  ```
* ✅ *REQUIRED*: Paste MUST work unconditionally in all input fields.
* ✅ *REQUIRED*: Every technical identifier (UUID, commit hash, API token, order number, email) MUST feature a 1-click copy affordance with an immediate, non-intrusive visual confirmation:
  ```typescript
  export function CopyButton({ textToCopy, label = "Copy ID" }: { textToCopy: string; label?: string }) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    };

    return (
      <button
        type="button"
        onClick={handleCopy}
        aria-label={label}
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        {copied ? <span>Copied!</span> : <span>Copy</span>}
      </button>
    );
  }
  ```

---

## 3. Dimension 3: Forgiving by Design (Error Resilience)

### A. Undo Over Modal Friction
* **Modal Blindness**: Repeatedly popping up *“Are you sure you want to delete?”* trains users to press `Enter` automatically without reading.
* ✅ *REQUIRED*:
  - **Reversible Actions**: Execute immediately and display a transient toast with an **Undo action** (7–10 second window):
    `"Item moved to trash. [Undo (Ctrl+Z)]"`.
  - **Catastrophic Irreversible Actions**: Reserved strictly for high-blast-radius destruction (deleting a production workspace, wiping billing accounts). Require explicit manual typing of the entity's name (e.g. *"Type 'prod-cluster' to confirm"*).

### B. Soft Deletes by Default (The Recycle Bin Principle)
* User-created business data must not be hard-deleted on initial action.
* Entities are flagged with `deleted_at: timestamp` and stored in a recoverable Recycle Bin for a minimum 30-day retention window before hard purging.

### C. Validation on Blur (Do Not Shout While Typing)
* ❌ *BANNED*: Shouting validation errors on `onChange` while the user is mid-keystroke:
  ```typescript
  // TOXIC: Types 'a' -> interface screams 'Invalid email address'
  <input onChange={(e) => validateEmailImmediately(e.target.value)} />
  ```
* ✅ *REQUIRED*: Validate inputs upon `onBlur` (field exit) or after an idle typing debounce of $\ge 800\text{ms}$. Errors must state **how to resolve the issue**, not just report failure.

---

## 4. Dimension 4: Cognitive Load, Latency Perception & Disclosure

### A. Optimistic UI with Graceful Rollback (Zero Perceived Latency)
* Common binary interactions (checking a task, toggling a feature flag, favoriting, renaming a label) MUST reflect on the screen in **0ms**.
* Never block the user with full-page or inline loading spinners for single-state toggles.
* If the asynchronous network request fails:
  1. Roll back the UI state cleanly to the previous snapshot.
  2. Display an actionable notification: `"Failed to save changes. [Retry]"`.

### B. Progressive Disclosure (The 80/20 Rule)
* 80% of users need 3 core inputs; 20% of power users need advanced knobs.
* Avoid dumping 40 configuration inputs on a single canvas. Present the clean primary workflow prominently; tuck advanced parameters into an expandable `"Advanced Settings"` disclosure panel.

### C. Smart Defaults & Muscle Memory
* Remember the operator's last-used context (selected warehouse, active workspace, preferred export format).
* Auto-focus the primary input on modal open (`autoFocus`).
* Enable `Enter` to submit forms from any standard text field.

---

## 5. Dimension 5: Power Operator & High-Density Data Operations

### A. Bulk Operations & Range Selection (`Shift+Click`)
* Any collection table or operational queue MUST support multi-selection:
  - Range selection via `Shift+Click` (select from item 4 to item 45 with two clicks).
  - Select all items on active page / Select all matching filter.
  - Floating contextual action bar offering bulk actions (Delete, Change Status, Assign, Export).

### B. Tabular Numerics & Sticky Headers
* Tables spanning beyond the viewport height MUST employ `position: sticky` on headers (`top: 0`) and fixed action columns.
* Financial and numeric figures MUST use tabular monospaced numbers (`tabular-nums`) right-aligned to allow effortless vertical ocular comparison.

### C. Incident Correlation IDs on Errors
* Never show a naked `"500 Internal Server Error"` or unhelpful alert box.
* Every UI error boundary and API failure banner MUST display a copyable correlation ID:
  ```text
  ┌──────────────────────────────────────────────────────────────┐
  │  Unable to complete transaction                              │
  │  Our payment gateway encountered a timeout.                  │
  │  Incident ID: #req-8f2a1b9c [Copy ID]       [Retry Action]   │
  └──────────────────────────────────────────────────────────────┘
  ```
* When the user pastes `#req-8f2a1b9c` to customer support, an on-call engineer can locate the exact structured log trace within 3 seconds.

---

## 6. The 3 AM Workflow Ergonomics Checklist

Before certifying any user workflow or administrative dashboard:

- [ ] **State in URL**: Are active filters, tabs, search queries, and drawers synchronized in URL query parameters?
- [ ] **Unbreakable Drafts**: Does typing in multi-field forms auto-save to local storage?
- [ ] **Native Anchors**: Are navigable items implemented as genuine `<a href="...">` links?
- [ ] **No Blocked Paste**: Can users paste from password managers into all text inputs?
- [ ] **1-Click Copy**: Do all UUIDs, transaction codes, and credentials have a 1-click copy button with visual feedback?
- [ ] **Deterministic Focus**: Does closing a modal or deleting a row keep keyboard focus in an actionable spot?
- [ ] **Undo Over Dialogs**: Are reversible operations executed instantly with an Undo toast instead of confirmation dialogs?
- [ ] **Validation on Blur**: Does field validation wait until blur rather than screaming while typing?
- [ ] **Optimistic Toggles**: Do binary switches and checkboxes update in 0ms without blocking spinners?
- [ ] **Incident Correlation ID**: Do error banners include a copyable `#req-...` correlation ID for support tracing?
