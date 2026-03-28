# Stats Desktop Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** At ≥900px viewport width, show Stats Oversikt and Analyse side-by-side in a two-column layout, with the toggle hidden and the tab bar stretching full width.

**Architecture:** Three surgical changes — add a grid wrapper in `app.html`, add a desktop media query in `style.css`, and guard the existing mobile branching logic in `stats-analyse.js`/`stats-overview.js` behind `isDesktop` detection so the secondary render always fires on desktop.

**Tech Stack:** Vanilla JS ES modules, Chart.js 4 (CDN), CSS custom properties, `window.matchMedia`

---

## File Map

| File | Change |
|------|--------|
| `app.html` | Wrap `#stats-content` in `#stats-desktop-grid`; add empty `#stats-content-analyse` sibling |
| `style.css` | Add `@media (min-width: 900px)` block for stats two-column layout |
| `js/stats-analyse.js` | Add `containerId` + `secondary` params to `renderAnalyse()`; guard `destroyCharts()`, selector HTML, and `#stats-sub` update |
| `js/stats-overview.js` | Add `isDesktop` detection in `renderStats()` and `switchStatsView()`; fix filter visibility; call secondary render on desktop |

---

## Task 1: HTML — wrap stats content in desktop grid

**Files:**
- Modify: `app.html` (around line 228)

The current markup:
```html
<div id="stats-content">
  <div class="loading"><div class="spinner"></div>Henter statistikk...</div>
</div>
```

Replace with:
```html
<div id="stats-desktop-grid">
  <div id="stats-content">
    <div class="loading"><div class="spinner"></div>Henter statistikk...</div>
  </div>
  <div id="stats-content-analyse"></div>
</div>
```

- [x] **Step 1: Open `app.html` and locate the `#stats-content` div** (line ~228)

- [x] **Step 2: Wrap it in `#stats-desktop-grid` and add `#stats-content-analyse`**

```html
<div id="stats-desktop-grid">
  <div id="stats-content">
    <div class="loading"><div class="spinner"></div>Henter statistikk...</div>
  </div>
  <div id="stats-content-analyse"></div>
</div>
```

- [x] **Step 3: Verify in browser at 480px width**

Load `app.html` locally. Open Stats tab. Confirm: no visual change on mobile — the new wrapper is invisible and `#stats-content-analyse` is empty.

- [x] **Step 4: Commit**

```bash
git add app.html
git commit -m "feat(stats): wrap stats content in desktop grid container"
```

---

## Task 2: CSS — add desktop media query

**Files:**
- Modify: `style.css` (append after existing `@media (min-width: 900px)` block ending around line 930)

The existing `@media (min-width: 900px)` block is for `share.html` share-viewer styles only. Append the new stats rules to it (do not create a duplicate block).

- [x] **Step 1: Find the end of the existing `@media (min-width: 900px)` block in `style.css`** (starts at line 897)

- [x] **Step 2: Append these rules inside that block (before the closing `}`)**

```css
  /* Stats screen breaks out of 480px cap */
  #screen-stats {
    max-width: none;
  }

  /* Tab bar stretches to full width */
  .tab-bar {
    max-width: none;
  }

  /* Remove .stats-body horizontal padding — columns control their own */
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

  /* Analyse column — empty on mobile, shown on desktop */
  #stats-content-analyse {
    display: block;
    padding: 0 20px 40px;
  }

  /* Toggle hidden — both views always shown on desktop */
  #stats-view-toggle {
    display: none;
  }
```

- [x] **Step 3: Verify at 900px+ in browser**

Resize the browser to ≥900px. Open Stats tab. Confirm:
- Tab bar stretches full width
- Stats area breaks out of 480px cap
- Two equal columns appear (right column empty until JS is wired)
- Toggle buttons are hidden
- At <900px everything is unchanged

- [x] **Step 4: Commit**

```bash
git add style.css
git commit -m "feat(stats): add desktop two-column grid media query"
```

---

## Task 3: `stats-analyse.js` — add `containerId` and `secondary` params

**Files:**
- Modify: `js/stats-analyse.js:61` — `renderAnalyse()` signature and body

The goal is:
- When called with `secondary = true`, skip `destroyCharts()`, skip the inline selector HTML, skip updating `#stats-sub`, and render into the provided `containerId`.
- All existing callers pass no extra args → unchanged behaviour.

- [x] **Step 1: Update the function signature (line 61)**

Change:
```js
export function renderAnalyse(matches, activeLag, activeSeason) {
```
To:
```js
export function renderAnalyse(matches, activeLag, activeSeason, containerId, secondary) {
```

- [x] **Step 2: Guard `destroyCharts()` (line 62)**

Change:
```js
  destroyCharts();
```
To:
```js
  if (!secondary) destroyCharts();
```

- [x] **Step 3: Use `containerId` when getting the container element (line 65)**

Change:
```js
  var container = document.getElementById('stats-content');
```
To:
```js
  var container = document.getElementById(containerId || 'stats-content');
```

- [x] **Step 4: Guard the `#stats-sub` update (line 96–97)**

Change:
```js
  var statsSubEl2 = document.getElementById('stats-sub');
  if (statsSubEl2) statsSubEl2.textContent = n + ' ' + t('matches_short') + ' \xb7 ' + teamText;
```
To:
```js
  if (!secondary) {
    var statsSubEl2 = document.getElementById('stats-sub');
    if (statsSubEl2) statsSubEl2.textContent = n + ' ' + t('matches_short') + ' \xb7 ' + teamText;
  }
```

- [x] **Step 5: Suppress `selectorHTML` injection when secondary — three `container.innerHTML` assignment sites**

There are three places where `container.innerHTML` is set:
1. The "not premium" path (line ~100): `container.innerHTML = selectorHTML + renderFormStreak(...) + ...`
2. The "n === 0" path (line ~117): `container.innerHTML = selectorHTML + '<div class="loading">...'`
3. The main charts path (line ~156): `container.innerHTML = selectorHTML + renderFormStreak(...) + ...`

In each case, replace `selectorHTML` with `(secondary ? '' : selectorHTML)`:

```js
// not-premium path
container.innerHTML = (secondary ? '' : selectorHTML) + renderFormStreak(matches) + ...;

// n===0 path
container.innerHTML = (secondary ? '' : selectorHTML) + '<div class="loading">' + t('no_matches_season') + '</div>';

// main charts path
container.innerHTML = (secondary ? '' : selectorHTML) +
  renderFormStreak(matches) +
  ...;
```

- [x] **Step 6: Verify mobile is unchanged**

Load at <900px. Switch to Analyse view. Confirm: season/team selectors still appear inside `#stats-content`, charts render normally, `#stats-sub` updates.

- [x] **Step 7: Commit**

```bash
git add js/stats-analyse.js
git commit -m "feat(stats-analyse): add containerId and secondary params to renderAnalyse"
```

---

## Task 4: `stats-overview.js` — wire desktop secondary render

**Files:**
- Modify: `js/stats-overview.js` — `renderStats()` (line ~479) and `switchStatsView()` (line ~453)

### Part A — `renderStats()`

- [x] **Step 1: Add `isDesktop` detection at the top of `renderStats()`, after `destroyCharts()`**

Current (line 480):
```js
export function renderStats() {
  destroyCharts();

  var seasons = getAllSeasons(getAllMatches());
```

Change to:
```js
export function renderStats() {
  destroyCharts();
  var isDesktop = window.matchMedia('(min-width: 900px)').matches;

  var seasons = getAllSeasons(getAllMatches());
```

- [x] **Step 2: Fix filter visibility to always show filters on desktop (line ~492)**

Change:
```js
  if (filtersDiv) filtersDiv.style.display = activeStatsView === 'overview' ? '' : 'none';
```
To:
```js
  if (filtersDiv) filtersDiv.style.display = (isDesktop || activeStatsView === 'overview') ? '' : 'none';
```

- [x] **Step 3: Update the view-branch at the bottom of `renderStats()` (line ~534)**

Change:
```js
  if (activeStatsView === 'analyse') {
    renderAnalyse(matches, activeLag, activeSeason);
    return;
  }
```
To:
```js
  if (activeStatsView === 'analyse' && !isDesktop) {
    renderAnalyse(matches, activeLag, activeSeason);
    return;
  }
```

- [x] **Step 4: Add secondary render call at the very end of `renderStats()`, after the overview HTML is set**

After all the overview `statsContent.innerHTML = ...` code, add:
```js
  if (isDesktop) {
    renderAnalyse(matches, activeLag, activeSeason, 'stats-content-analyse', true);
  }
```

### Part B — `switchStatsView()`

- [x] **Step 5: Add desktop guard to `switchStatsView()` so it doesn't reset filter visibility on desktop (line ~453)**

Change:
```js
export function switchStatsView(view) {
  activeStatsView = view;
  var btnOversikt = document.getElementById('stats-view-btn-overview');
  var btnAnalyse  = document.getElementById('stats-view-btn-analyse');
  if (btnOversikt) btnOversikt.classList.toggle('active', view === 'overview');
  if (btnAnalyse)  btnAnalyse.classList.toggle('active', view === 'analyse');
  var filters = document.getElementById('stats-filters');
  if (filters) filters.style.display = view === 'overview' ? '' : 'none';
  renderStats();
}
```
To:
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

- [x] **Step 6: Verify desktop behaviour end-to-end**

At ≥900px:
- Stats tab shows two columns: Oversikt on left, Analyse on right
- Filters (season/team pills) are visible above Oversikt column
- Toggle buttons are hidden
- Charts render without duplication
- Resizing below 900px reverts to single-column/toggle behaviour

At <900px (regression check):
- Oversikt/Analyse toggle still works
- Switching to Analyse hides filters and renders into `#stats-content`
- Charts render correctly; no double-render

- [x] **Step 7: Commit**

```bash
git add js/stats-overview.js
git commit -m "feat(stats): wire desktop secondary analyse render and fix filter visibility"
```

---

## Task 5: Final verification and cleanup

- [x] **Step 1: Test at exactly 900px boundary**

Open DevTools, set viewport to 899px → single column, toggle visible. Set to 900px → two columns, toggle hidden. Confirm the breakpoint snaps cleanly.

- [x] **Step 2: Test filter interactions on desktop**

Change season pill, team filter — confirm both columns update together (both use the same `activeSeason`/`activeLag` state in `stats-overview.js`).

- [x] **Step 3: Test chart destroy safety**

Navigate away from Stats tab and back. Confirm no "Canvas already in use" Chart.js errors in the console.

- [x] **Step 4: Test Log, Profile, Settings tabs on desktop**

Confirm they remain 480px centered and are completely unaffected.

- [x] **Step 5: Update `CLAUDE.md` and `CHANGELOG.md`, then commit**

Add entry to `CHANGELOG.md`:
```
## [date] Stats desktop layout
- Two-column Oversikt + Analyse layout at ≥900px
- Tab bar stretches full width on desktop
- Toggle hidden on desktop; both views always visible
```

```bash
git add CHANGELOG.md
git commit -m "docs: add stats desktop layout changelog entry"
```
