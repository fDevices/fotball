# Spec: Stats Desktop Layout

**Date:** 2026-03-23
**Status:** Approved

---

## Overview

At ≥900px viewport width, the Stats tab expands beyond 480px and shows Oversikt and Analyse side-by-side in a two-column grid. The Oversikt/Analyse toggle is hidden on desktop. The tab bar stretches to full width. All other tabs stay 480px centered — no changes to Log, Profile, or Settings screens.

---

## Breakpoint

`min-width: 900px` — consistent with the existing share viewer desktop breakpoint.

---

## HTML changes (`app.html`)

The stats section currently has:
```html
<div id="stats-content">...</div>
```

Wrap it in a desktop grid container and add the analyse column alongside it:
```html
<div id="stats-desktop-grid">
  <div id="stats-content">
    <div class="loading"><div class="spinner"></div>Henter statistikk...</div>
  </div>
  <div id="stats-content-analyse"></div>
</div>
```

`#stats-content-analyse` is empty and hidden on mobile (via CSS). On desktop it becomes the right column and receives the Analyse render.

---

## CSS changes (`style.css`)

Add a new `@media (min-width: 900px)` block:

```css
@media (min-width: 900px) {
  /* Stats screen breaks out of 480px cap */
  #screen-stats {
    max-width: none;
  }

  /* Tab bar stretches to full width */
  .tab-bar {
    max-width: none;
  }

  /* Two-column grid */
  #stats-desktop-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
  }

  /* Oversikt column */
  #stats-content {
    border-right: 1px solid var(--border);
    padding: 0 20px 40px;
  }

  /* Analyse column — hidden on mobile, shown on desktop */
  #stats-content-analyse {
    display: block;
    padding: 0 20px 40px;
  }

  /* Toggle hidden on desktop — both views always shown */
  #stats-view-toggle {
    display: none;
  }

  /* Filters always visible on desktop (override JS-set display:none) */
  #stats-filters {
    display: flex !important;
  }
}
```

`#stats-content-analyse` has no default style needed — it is naturally hidden because it is empty and `display: block` is a no-op on an empty div. On desktop the CSS makes it block and JS populates it.

---

## JS changes

### `js/stats-analyse.js` — add optional `containerId` parameter

`renderAnalyse()` currently always renders into `#stats-content`. Add an optional second parameter so the caller can redirect output to `#stats-content-analyse` on desktop:

```js
export function renderAnalyse(matches, lag, season, containerId) {
  // ...existing setup...
  var container = document.getElementById(containerId || 'stats-content');
  if (!container) return;
  // rest of function unchanged
```

No other changes to `stats-analyse.js`.

### `js/stats-overview.js` — desktop detection in `renderStats()`

Add desktop detection at the top of `renderStats()`:

```js
export function renderStats() {
  destroyCharts();
  var isDesktop = window.matchMedia('(min-width: 900px)').matches;
  // ... existing setup (seasons, filters, season selector, etc.) ...
```

**Fix filter visibility** (currently hides filters in analyse view):
```js
// Before (mobile-only logic):
if (filtersDiv) filtersDiv.style.display = activeStatsView === 'overview' ? '' : 'none';

// After:
if (filtersDiv) filtersDiv.style.display = (isDesktop || activeStatsView === 'overview') ? '' : 'none';
```

**Replace the existing view branch** near the bottom of `renderStats()`:
```js
// Before:
if (activeStatsView === 'analyse') {
  renderAnalyse(matches, activeLag, activeSeason);
  return;
}
// ... overview render into #stats-content ...

// After:
if (activeStatsView === 'analyse' && !isDesktop) {
  renderAnalyse(matches, activeLag, activeSeason);
  return;
}
// ... overview render into #stats-content (unchanged) ...

// At the end of renderStats(), after overview is rendered:
if (isDesktop) {
  renderAnalyse(matches, activeLag, activeSeason, 'stats-content-analyse');
}
```

### `js/stats-overview.js` — `switchStatsView()` on desktop

`switchStatsView()` currently hides `#stats-filters` when switching to analyse. On desktop the toggle is hidden (CSS), so users can't trigger this. No change needed — the `isDesktop` guard in `renderStats()` handles filter visibility on re-render.

---

## What does NOT change

- `loadStats()` — no changes
- `switchStatsView()` — no changes (toggle hidden on desktop, so it won't be called)
- `destroyCharts()` — no changes; called at the top of `renderStats()` as before, destroys all instances before both columns re-render
- Log, Profile, Settings screens — untouched
- Portrait-lock overlay — untouched (it triggers at `max-height: 600px` in landscape, independent of this)
- `share.html` / share viewer — untouched

---

## Files changed

| File | Change |
|------|--------|
| `app.html` | Wrap `#stats-content` in `#stats-desktop-grid`, add `#stats-content-analyse` |
| `style.css` | Add `@media (min-width: 900px)` desktop rules |
| `js/stats-analyse.js` | Add optional `containerId` parameter to `renderAnalyse()` |
| `js/stats-overview.js` | Desktop detection in `renderStats()`, fix filter visibility, render analyse on desktop |

---

## Out of scope

- No changes to other tabs
- No top nav or sidebar navigation (Fase 4)
- No desktop layout for Log, Profile, or Settings
- No changes to mobile layout or behaviour
