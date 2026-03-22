# Desktop Layout for Share Link Page

**Date:** 2026-03-22
**Status:** Approved for planning

---

## Overview

The share link page (`share.html` / `share-viewer.js`) is primarily viewed on desktop by coaches, parents, and scouts who receive a shared link. The current layout is mobile-first (max-width 480px centered column). This spec adds a responsive desktop layout that activates at ≥900px viewport width. Mobile behaviour is completely unchanged.

---

## Layout

### Mobile (< 900px) — unchanged
Current single-column layout: profile card at top, then content below.

### Desktop (≥ 900px) — new

```
┌────────────────────┬──────────────────────────────────┐
│  LEFT SIDEBAR      │  RIGHT CONTENT                   │
│  260px, sticky     │  flex:1, independently scrollable│
│                    │                                  │
│  Avatar            │  Overview / Analysis toggle      │
│  Name              │  Form streak                     │
│  Club / Team       │  WDL cards                       │
│  ──────────────    │  Match distribution bar          │
│  Language flag     │  Goals / Assists / G+A cards     │
│  ──────────────    │  Average per match               │
│  Season pills      │  Home vs Away                    │
│  Team pills        │  Tournament breakdown            │
│  Tournament pills  │  Match history list (paginated)  │
└────────────────────┴──────────────────────────────────┘
```

- The **left sidebar** stays fixed while the right scrolls. This is achieved via `height: 100vh; overflow-y: auto` on both columns (not `position: sticky`) combined with `overflow: hidden` on the body at desktop widths. It holds the player profile and all filter controls.
- The **right content** area scrolls independently. It contains the view toggle (Overview/Analysis) and all stats content rendered by `renderStats()`.
- Max-width of the overall layout: **1200px**, centered on the page.
- The profile card that currently sits above the content on mobile is repurposed as the sidebar on desktop — same data, different placement.

---

## Implementation approach

### CSS only for layout switching
A single `@media (min-width: 900px)` block in `style.css` handles the layout change. No JavaScript logic changes for layout.

New CSS classes needed:
- `.share-desktop-layout` — the grid container (`grid-template-columns: 260px 1fr`)
- `.share-sidebar` — left sticky column
- `.share-main` — right scrollable column

### share-viewer.js changes
The `renderStats()` function currently renders:
```
[profile card]
[share-viewer-content]
  [stats-body]
    [toggle]
    [filters]
    [stats-content]
```

On desktop, the rendered HTML structure needs to become:
```
[share-desktop-layout]
  [share-sidebar]
    [profile info]
    [language flag]
    [season pills]
    [team pills]
    [tournament pills]
  [share-main]
    [toggle]
    [stats-content]
```

The layout switching is CSS-driven, so `renderStats()` can output the desktop structure always — on mobile, the CSS makes `.share-sidebar` display as a normal block above the content, and `.share-main` as the full-width content area. On desktop, the grid kicks in.

Concretely:
- Remove the separate `renderProfileCard()` call from the top of the root
- Embed profile info directly inside `.share-sidebar`
- Move filter pills from `.stats-body` into `.share-sidebar`
- `.share-main` gets the toggle + stats content only

### Language flag
The flag button moves from the profile card into the sidebar (desktop) / top of page (mobile). Since the sidebar is always rendered, the flag is always in the sidebar — on mobile the sidebar just stacks above the content naturally.

---

## CSS breakpoint strategy

The existing mobile layout uses two separate max-width-480px containers: `.share-profile-card` and `.share-viewer-content`. The new structure **replaces both** with a single `.share-desktop-layout` root that contains everything.

**Mobile rendering of new markup** (visually identical to today):
```
.share-desktop-layout   (flex-col, max-width 480px, centered)
  .share-sidebar         (normal block: avatar + name + flag + pills)
  .share-main            (normal block: toggle + stats content)
```

This matches the current visual output — profile card on top, content below — because the sidebar stacks as a normal block.

**Desktop grid** (≥900px):
```
.share-desktop-layout   (grid 260px 1fr, max-width 1200px)
  .share-sidebar         (sticky, height 100vh, overflow-y auto)
  .share-main            (height 100vh, overflow-y auto)
```

For independent column scrolling to work, the page body must not scroll. Add to `share-viewer-body`:
```css
.share-viewer-body { overflow: hidden; }
```
This is scoped to the share page only and has no effect on `app.html`.

```css
/* Default (mobile) */
.share-desktop-layout {
  display: flex;
  flex-direction: column;
  max-width: 480px;
  margin: 0 auto;
}

@media (min-width: 900px) {
  .share-viewer-body { overflow: hidden; }
  .share-desktop-layout {
    display: grid;
    grid-template-columns: 260px 1fr;
    max-width: 1200px;
    height: 100vh;
    margin: 0 auto;
  }
  .share-sidebar {
    height: 100vh;
    overflow-y: auto;
    border-right: 1px solid var(--border);
    padding: 24px 16px;
  }
  .share-main {
    height: 100vh;
    overflow-y: auto;
    padding: 20px 24px;
  }
}
```

---

## Files changed

| File | Change |
|------|--------|
| `style.css` | Add `.share-desktop-layout`, `.share-sidebar`, `.share-main` + `@media (min-width: 900px)` block |
| `js/share-viewer.js` | Restructure `renderStats()` HTML output to use sidebar/main split; move filters and profile into sidebar |

No changes to `share.html`, `supabase.js`, or any other file.

---

## Out of scope

- Analysis tab desktop layout (charts still render in the right column as-is)
- Opponent search field (not shown on share page, no change)
- Any changes to the mobile app (`app.html`, `main.js`, etc.)
