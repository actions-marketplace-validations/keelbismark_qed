# Q.E.D. — Computer-Use & Visual Verification Gate (CUA Invariant)
*Quod Erat Demonstrandum: Empirical UI Interaction Over Blind Assumptions*

---

## 1. The Core Problem: The Blind UI Fallacy

AI coding agents frequently claim UI tasks are complete by simply running a headless unit test or asserting that JSX/HTML compiles without errors. This leads to **The Blind UI Fallacy**:
- Buttons rendered behind transparent overlays or clipped by overflow containers.
- Form submissions failing silently due to unhandled promise rejections in event handlers.
- Broken responsive breakpoints where text overlaps or buttons become unclickable.
- Severe contrast and accessibility failures invisible to pure text ASTs.

Under the **Q.E.D. Engineering Standard**, frontend and user-facing features are NEVER complete until verified through real interface perception and interaction.

---

## 2. The CUA Invariant: Interface Grounding & Perception

Drawing from the **Awesome-CUA** methodology (Computer-Use Agents, WebArena, OSWorld, OmniParser, UI-TARS), Q.E.D. enforces **Interface Grounding**:

```
[UI Code / Component Mutation]
               │
               ▼ (Browser Engine / Headless Agent)
[DOM & Accessibility Tree Grounding]
               │
               ▼ (Perceptual Screenshot & Visual Diff)
[Real Event Emulation (Click, Keypress, Scroll)]
               │
               ▼ (Verification Gate: 0 Red Flashes, 0 Overlaps)
[Certified Frontend Delivery]
```

### The 4 Pillars of Computer-Use Verification:

1. **Pillar 1 — Real Browser Driving (Playwright / Puppeteer / CDP)**:
   - For all frontend tasks, drive an actual headless Chromium/Firefox instance.
   - Emulate realistic human interactions: debounced typing, natural click dispatching, mouse wheel scrolling.
   - Verify network requests, WebSocket events, and console errors (`page.on('console')`, `page.on('pageerror')`).

2. **Pillar 2 — Perceptual Grounding & Screenshot Proof**:
   - Capture full-page or component screenshots at mobile (375px), tablet (768px), and desktop (1440px) breakpoints.
   - Inspect visually for layout overflows, clipping, color contrast, and font rendering artifacts.
   - Store visual evidence in verification reports before declaring completion.

3. **Pillar 3 — Accessibility & Affordance Tree Integrity**:
   - Query elements via accessible roles (`role="button"`, `name="Submit"`) rather than fragile CSS classes (`.btn-v2`).
   - Ground interaction in accessibility snapshots (`page.accessibility.snapshot()`). If an element is not reachable by keyboard or screen reader, it is defective.

4. **Pillar 4 — Adversarial Interaction Scenarios**:
   - Rapid double-clicks (50ms gap) to verify idempotency and debouncing.
   - Extreme inputs: 10,000 character strings, right-to-left (RTL) Arabic/Hebrew text, hostile Unicode (`👨‍👩‍👧‍👦`, ZWNJ).
   - Network degradation: test under simulated slow 3G and offline conditions to verify loading and error states.

---

## 3. Tooling Integration: Computer-Use Harness

Q.E.D. integrates CUA tools across supported harnesses:

- **Browser Automation Suite**:
  - `npx playwright test` or `npm run test:e2e` for deterministic headless verification.
  - Headless CDP / DevTools protocol inspection for console logs and network telemetry.
- **Catalog Grounding**:
  - Integration with the `Awesome-CUA` catalog (`scripts/catalog.py`) for benchmarking multimodal agent perception and GUI navigation.
- **Visual Evidence Artifacts**:
  - Save failure screenshots and diffs directly to the test reports directory (`test-results/` or `.qed/artifacts/`).
