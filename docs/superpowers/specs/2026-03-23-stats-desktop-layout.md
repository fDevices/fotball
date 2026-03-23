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

`#stats-content-analyse` is empty on mobile and ignored (no CSS rule makes it visible). On desktop it becomes the right column and receives the Analyse render. During the loading state, `#stats-content-analyse` will remain empty — this is acceptable known behaviour.

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

  /* Remove .stats-body horizontal padding so columns control their own */
  #screen-stats .stats-body {
    padding-left: 0;
    padding-right: 0;
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

  /* Analyse column — hidden on mobile (empty), shown on desktop */
  #stats-content-analyse {
    display: block;
    padding: 0 20px 40px;
  }

  /* Toggle hidden on desktop — both views always shown */
  #stats-view-toggle {
    display: none;
  }
}
```

> Note: Do NOT use `#stats-filters { display: flex !important }` — inline styles set by `switchStatsView()` override CSS `!important`. Filter visibility on desktop is handled entirely in JS (see below).

---

## JS changes

### `js/stats-analyse.js` — add `containerId` and `secondary` parameters

`renderAnalyse()` currently:
1. Calls `destroyCharts()` at the top
2. Writes inline season/team selectors into the container
3. Updates `#stats-sub` subtitle
4. Renders charts via hardcoded canvas IDs

For the desktop secondary render (right column), all three of these must be suppressed. Add two optional parameters:

```js
export function renderAnalyse(matches, lag, season, containerId, secondary) {
```

- `containerId` (string | undefined): the container to render into. Defaults to `'stats-content'`.
- `secondary` (boolean | undefined): when `true`, skip `destroyCharts()`, skip inline selectors, skip `#stats-sub` update.

**Changes inside `renderAnalyse()`:**

```js
export function renderAnalyse(matches, lag, season, containerId, secondary) {
  if (!secondary) destroyCharts();  // ← guard: only destroy when primary render

  var container = document.getElementById(containerId || 'stats-content');
  if (!container) return;

  // ...existing setup code (labels, chart data prep, etc.)...

  // stats-sub update: skip when secondary
  if (!secondary) {
    var statsSubEl2 = document.getElementById('stats-sub');
    if (statsSubEl2) statsSubEl2.textContent = n + ' ' + t('matches_short') + ' · ' + teamText;
  }

  // Selector HTML: skip when secondary (filters already visible in #stats-filters)
  container.innerHTML = (secondary ? '' : selectorHTML) + formHTML + chartsHTML + ...;

  // Chart initialisation (canvas getElementById calls): no change needed
  // — canvas IDs appear only inside the container just populated, so no DOM collision
```

All existing callers pass no `containerId`/`secondary`, so mobile behaviour is unchanged.

### `js/stats-overview.js` — desktop detection in `renderStats()`

Add desktop detection at the top of `renderStats()`, after `destroyCharts()`:

```js
export function renderStats() {
  destroyCharts();
  var isDesktop = window.matchMedia('(min-width: 900px)').matches;
  // ... existing setup (seasons, filters, season selector, etc.) ...
```

**Fix filter visibility** (currently hides filters when in analyse view):
```js
// Before:
if (filtersDiv) filtersDiv.style.display = activeStatsView === 'overview' ? '' : 'none';

// After:
if (filtersDiv) filtersDiv.style.display = (isDesktop || activeStatsView === 'overview') ? '' : 'none';
```

**Replace the existing view branch** at the bottom of `renderStats()`:
```js
// Before:
if (activeStatsView === 'analyse') {
  renderAnalyse(matches, activeLag, activeSeason);
  return;
}
// ... overview render into #stats-content ...

// After:
if (activeStatsView === 'analyse' && !isDesktop) {
  renderAnalyse(matches, activeLag, activeSeason);  // primary render, no extra params
  return;
}
// ... overview render into #stats-content (unchanged) ...

// At the very end of renderStats(), after overview is fully rendered:
if (isDesktop) {
  renderAnalyse(matches, activeLag, activeSeason, 'stats-content-analyse', true);
}
```

### `js/stats-overview.js` — fix filter visibility in `switchStatsView()`

`switchStatsView()` sets `filters.style.display` as an inline style. On desktop the toggle button is hidden (CSS), but the function is still wired in the ACTIONS map. Add a desktop guard:

```js
export function switchStatsView(view) {
  activeStatsView = view;
  var btnOversikt = document.getElementById('stats-view-btn-overview');
  var btnAnalyse  = document.getElementById('stats-view-btn-analyse');
  if (btnOversikt) btnOversikt.classList.toggle('active', view === 'overview');
  if (btnAnalyse)  btnAnalyse.classList.toggle('active', view === 'analyse');
  var isDesktop = window.matchMedia('(min-width: 900px)').matches;
  var filters = document.getElementById('stats-filters');
  if (filters && !isDesktop) filters.style.display = view === 'overview' ? '' : 'none';
  renderStats();
}
```

---

## What does NOT change

- `loadStats()` — no changes
- `destroyCharts()` — called at the top of `renderStats()` as before; the `secondary` guard in `renderAnalyse()` prevents the double-destroy
- Log, Profile, Settings screens — untouched
- Portrait-lock overlay — untouched
- `share.html` / share viewer — untouched
- Mobile behaviour — unchanged; all new params are optional and default to existing behaviour

---

## Files changed

| File | Change |
|------|--------|
| `app.html` | Wrap `#stats-content` in `#stats-desktop-grid`, add `#stats-content-analyse` |
| `style.css` | Add `@media (min-width: 900px)` desktop rules |
| `js/stats-analyse.js` | Add `containerId` and `secondary` params to `renderAnalyse()`; guard `destroyCharts()`, selector HTML, and `#stats-sub` update behind `!secondary` |
| `js/stats-overview.js` | Add `isDesktop` detection in `renderStats()` and `switchStatsView()`; fix filter visibility; render analyse as secondary on desktop |

---

## Out of scope

- No changes to other tabs
- No top nav or sidebar navigation (Fase 4)
- No desktop layout for Log, Profile, or Settings
- No changes to mobile layout or behaviour
