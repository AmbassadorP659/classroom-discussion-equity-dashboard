# Minimalist Professional Footer Component

Add a clean, ultra-slim, low-profile footer to the bottom of the Classroom Equity Dashboard with official attribution to Chris Pirkl and the Maine Department of Education, including the copyright symbol before the year.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences were confirmed:
> - **Positioning**: Natural bottom flow (`mt-auto` within the page container) so that it scrolls naturally below all dashboard content with zero vertical obstruction or overlay on seating charts.
> - **Metadata / Version Format**: Year with copyright symbol (`© 2026`).
> - **Attribution String**: *"Created by Chris Pirkl | Maine Department of Education • Classroom Equity Dashboard • © 2026"*

- **Confirmed Decision 1**: Natural bottom layout flow below the main workspace view container (`<main>`).
- **Confirmed Decision 2**: Single-line text with subtle typographic separators (`|` and `•`), adhering to anti-pill metadata discipline.
- **Confirmed Decision 3**: Include copyright symbol (`©`) before the year `2026`.

---

## 1. Overview & Core Concept

- **What It Does**: Renders a clean, lightweight, single-line footer at the bottom of the dashboard layout displaying educational attribution: *"Created by Chris Pirkl | Maine Department of Education • Classroom Equity Dashboard • © 2026"*.
- **Target Audience**: Teachers, educational coaches, and administrators observing class equity discussions.
- **Key Value**: Provides clean institutional attribution and provenance without consuming precious classroom viewport space.

---

## 2. User Experience & Visual Design

- **Visual Direction**: Understated, utilitarian, and distraction-free. Designed to sit quietly at the base of the page without drawing visual attention away from the seating chart and equity analytics.
- **Styling & Layout**:
  - **Height & Spacing**: Ultra-slim vertical footprint (`py-3 sm:py-3.5`).
  - **Hairline Border**: `border-t border-slate-200/80` spanning full container width.
  - **Typography**: Single-line `text-xs text-slate-400 font-medium tracking-wide`, responsive wrapping on narrow mobile screens if needed.
  - **Zero Pills**: Pure typographic separators (`|`, `•`), avoiding badges, chip boxes, or heavy background fills.
  - **Flexbox Layout**: Centered or balanced horizontal layout that seamlessly blends with the `bg-slate-100` page backdrop.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Natural Document Flow vs. Sticky Viewport Bottom**
  - *Chosen Approach*: Natural bottom flow using flexbox `min-h-screen flex flex-col` with `<main className="flex-1">` and `<footer>` at the base.
  - *Why*: Sticky footers consume valuable vertical pixels on laptops and tablets, potentially occluding student desk tiles or action bars. Natural bottom placement ensures zero obstruction.
  - *Alternatives Considered*: Fixed sticky bar (`fixed bottom-0`), rejected to protect seating chart clickability.

- **Decision 2: Dedicated Component File (`src/components/Footer.tsx`)**
  - *Chosen Approach*: Create a dedicated `Footer.tsx` component and mount it at the end of `src/App.tsx`.
  - *Why*: Keeps `App.tsx` clean and modular, allowing future additions without cluttering top-level state.

---

## 4. Technical Architecture & Component Hierarchy

```
┌────────────────────────────────────────────────────────┐
│                        App.tsx                         │
│  (min-h-screen flex flex-col bg-slate-100)             │
├────────────────────────────────────────────────────────┤
│  <Header />                                            │
├────────────────────────────────────────────────────────┤
│  <main className="flex-1 ...">                         │
│    ├── Tab Navigation (Centered)                       │
│    └── Active Workspace (Seating / Table / Log)        │
├────────────────────────────────────────────────────────┤
│  <Footer /> (Ultra-slim natural bottom bar)            │
│    "Created by Chris Pirkl | Maine Department of       │
│     Education • Classroom Equity Dashboard • © 2026"   │
└────────────────────────────────────────────────────────┘
```

### Verification Plan

1. Verify `Footer.tsx` is created and imported cleanly in `App.tsx`.
2. Confirm the footer is placed after `<main>` with single-line subtle text and `© 2026`.
3. Run `compile_applet` and `lint_applet` to confirm zero compilation or type errors.
