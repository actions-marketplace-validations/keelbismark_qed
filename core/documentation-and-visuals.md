# Documentation & Visual Assets Standard
*Part of the Q.E.D. Engineering Framework*

This standard governs how AI agents and engineers write documentation, design diagrams, and create visual assets across ANY project.

---

## 1. The Separation of Audiences (Human vs. AI)

Never mix high-density machine prompts with human onboarding documentation. Every production repository must maintain two clear entrypoints:

### A. The Human Front Door (`README.md`)
- **Fast to Scan**: A human engineer must understand the core value within 60 seconds.
- **The Relatable Hook**: Start with the concrete developer pain point, not abstract marketing buzzwords.
- **Before & After Contrast**: Show the difference immediately using concrete code blocks.
- **Zero Wall of Text**: Offload deep tables, full API references, and multi-platform guides to `docs/`.
- **Zero Emoji Salad**: Never prepend every header with cartoon emojis (`🚀 ⚡ 🎯 🛠️`). A few subtle icons are acceptable only where strictly functional (e.g. status marks).

### B. The Machine Front Door (`AI_README.md` / `llms.txt`)
- **Token-Optimized**: High token density, zero conversational filler or marketing narrative.
- **Invariants & Gates**: Exact command sequences, TDD rules, forbidden patterns, and file structure mappings.
- **Open Standard**: Follow the `llms.txt` specification so external coding tools and subagents can ingest context in one request.

---

## 2. Visual Ergonomics (Ban on Diagram Slop)

### The Anti-Pattern: The 3-Screen Vertical Noodle
A frequent failure mode of AI is generating massive vertical Mermaid flowcharts (`flowchart TD` with multiple subgraphs) that render as a 2500-pixel-high gray column on GitHub, forcing the user to scroll through three empty viewports.

### The Standard:
1. **Vertical Constraint**: Main-page workflow illustrations must not exceed 150px in vertical height.
2. **Horizontal Flow**: Use horizontal pipelines (`flowchart LR`, compact ASCII pipelines, or tailored SVGs) that fit the screen width naturally.
3. **Terminal Snapshots Over Abstract Graphs**: Developers trust logs. Whenever illustrating an execution flow, prefer a crisp, monospaced terminal execution transcript showing real commands, failing tests (Red), and passes (Green).

---

## 3. High-Assurance SVG & Illustration Standards

When the agent generates SVG diagrams, banners, or architecture graphs, it must adhere to production graphic standards:

1. **Responsive Viewports**:
   - Always define `viewBox="0 0 W H"`.
   - Use `width="100%" height="auto"` with `preserveAspectRatio="xMidYMid meet"`. Never hardcode static pixel heights that distort on mobile devices.
2. **Theme Resilience (Self-Contained Canvas)**:
   - GitHub users switch between Dark and Light modes. An SVG with transparent background and light text becomes invisible in Light Mode.
   - Every diagram SVG must include an outer protective container (`<rect x="2" y="2" width="W-4" height="H-4" rx="14" fill="url(#canvasGrad)" stroke="#1e293b"/>`). This ensures 100% consistent, crisp contrast regardless of user theme.
3. **Typography**:
   - Use clean modern system font stacks:
     ```svg
     font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
     ```
   - Use calibrated letter-spacing on small caps and badge pills (`letter-spacing="1"`).
4. **Palette & Contrast Tokens**:
   - Canvas background: `#0b0f17` to `#111827`.
   - Card backgrounds: `#1e293b` to `#0f172a`.
   - Card borders: `#334155` (neutral), `#3b82f6` (accent), `#10b981` (success).
   - Text contrast: `#f8fafc` (primary), `#94a3b8` (secondary), `#64748b` (muted).
   - Accents: Refined slate blue (`#3b82f6`), violet (`#8b5cf6`), and emerald (`#10b981`).
   - Use subtle gradient fills (`linearGradient`), subtle drop shadows (`feDropShadow`), and rounded corners (`rx="10"` or `rx="14"`) rather than harsh flat rectangles.
5. **Clean Badges**:
   - Use `style=flat-square` for shields.io badges to maintain a modern, serious developer tool aesthetic.
   - Use meaningful color codes:
     - Blue (`3b82f6`): License, specifications.
     - Violet (`8b5cf6`): Platforms, tools.
     - Green (`10b981`): Verification gates, passing tests.
     - Amber (`f59e0b`): Machine entrypoints (`llms.txt`).

---

## 4. Checklist for Generating Project Docs

Before committing any documentation or visual asset in any project, verify:
- [ ] Is `README.md` free of conversational fluff and cartoon emoji spam?
- [ ] Does `README.md` have a Before/After code contrast showing why this project matters?
- [ ] Are deep tables and specs offloaded to `docs/`?
- [ ] Is there an `AI_README.md` or `llms.txt` for machine agents?
- [ ] Are all inline diagrams horizontal and under 150px vertical height?
- [ ] Are all SVGs vector, responsive (`width="100%" height="auto"`), and theme-resilient?
