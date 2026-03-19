# Tech Debt Cleanup — Design Spec

**Date:** 2026-03-19
**Scope:** All non-auth-blocked technical debt (🟡 Medium + 🟢 Low priority items from CLAUDE.md)
**Approach:** Risk-ordered — riskiest/largest changes first, small fixes last

---

## Overview

Four phases of cleanup, executed in order to minimise cross-change interference:

1. `state.js` private API (breaks imports across multiple files — do first while clean)
2. `stats.js` split into three focused modules (largest refactor — after state is stable)
3. `modal.js` event decoupling + avatar upload migration (medium-risk wiring changes)
4. Small fixes sweep (low-risk, no cross-file dependencies)

---

## Phase 1 — state.js Private API

**Problem:** `allMatches` is a mutable exported `let` that any module can reassign directly, giving no encapsulation or contract.

**Change:**
- Rename internal variable to `_allMatches = []` (unexported)
- Add new `export function getAllMatches() { return _allMatches; }` — this function does not currently exist
- Keep existing `export function setAllMatches(arr)` — already exists, update it to assign `_allMatches` instead of `allMatches`
- `invalidateMatchCache()` now also resets `_allMatches = []`

**Contract clarification for `invalidateMatchCache()`:** All current call sites follow `invalidateMatchCache()` with `loadStats(forceRefresh=true)`, which triggers a fresh Supabase fetch. Resetting `_allMatches = []` is safe because no caller expects in-memory data to survive a cache invalidation — the next `loadStats()` call will populate it from Supabase. This makes the contract explicit: "invalidate = full reset, reload on next access."

**Consumers to update** (replace direct `allMatches` usage with `getAllMatches()` and `setAllMatches(arr)`):
- `stats.js` (becomes `stats-overview.js` after Phase 2)
- `modal.js` (4 sites: 2× `.find()`, 1× `.map()`, 1× `.filter()`)
- `export.js`
- `log.js`
- `assessment.js`

---

## Phase 2 — stats.js Split

**Problem:** `stats.js` is too large — owns data loading, filters, paging, search, overview rendering, analysis rendering, and charts. Hard to navigate and reason about.

**Design constraint:** `setMatchPage()`, `setOpponentSearch()`, and `renderOpponentSearchResults()` all directly read `allMatches`, `activeLag`, `activeSeason`, and `activeTournament`. If these functions moved to `stats-search.js` they would need to import filter state from `stats-overview.js`, creating a circular dependency (`stats-overview.js` → `stats-search.js` → `stats-overview.js`). Therefore: all stateful functions stay in `stats-overview.js`; `stats-search.js` is a pure rendering helper only.

**New structure:**

### `stats-overview.js`
Owns all stateful logic, filter state, and overview rendering.
- Functions: `loadStats()`, `renderStats()`, `calcWDL()`, `getResult()`, `switchStatsView()`, `setSeason()`, `setTeamFilter()`, `setTournamentFilter()`, `setMatchPage(page)`, `setOpponentSearch(val)`
- Exported state: `activeStatsView`, `activeLag`, `activeSeason`, `activeTournament`, `matchPage`, `opponentSearch`
- `loadStats()` is the public entry point; `renderStats()` orchestrates the full stats view
- `renderStats()` internally calls `renderAnalyse(matches)` (imported from `stats-analyse.js`) when `activeStatsView === 'analyse'`
- `renderStats()` uses `renderMatchListPaged(matches, matchPage)` (imported from `stats-search.js`) to render the match history section
- Dependency direction: `stats-overview.js` → `stats-search.js` (one-way) and `stats-overview.js` → `stats-analyse.js` (one-way). No reverse imports.

### `stats-analyse.js`
Owns chart rendering. Pure module — no state.
- Functions: `renderAnalyse(matches)`, `initChartDefaults()`, `destroyCharts()`
- `CHART_COLORS` is a private constant (not exported — confirmed by grep: no other file imports it; remove `export` keyword)
- `renderAnalyse(matches)` receives a pre-filtered matches array as a parameter

### `stats-search.js`
Pure rendering helpers for the match list. No state, no imports from other stats modules.
- Functions: `renderMatchListPaged(matches, matchPage)` — returns an HTML string for the paged match list
- This is a pure function: given matches and a page number, returns markup. All filtering is done by the caller before passing `matches`.
- `setMatchPage(page)` and `setOpponentSearch(val)` move to `stats-overview.js` (not here)

**`stats.js`** is deleted. `main.js` updates its imports:
- `loadStats`, `switchStatsView`, `setSeason`, `setTeamFilter`, `setTournamentFilter`, `setMatchPage`, `setOpponentSearch` → from `stats-overview.js`
- `destroyCharts`, `initChartDefaults` → from `stats-analyse.js`
- `athlytics:destroyCharts` event listener in `main.js` stays unchanged; `main.js` updates its import of `destroyCharts` to `stats-analyse.js`
- `stats-search.js` is not imported by `main.js` directly — it is only used by `stats-overview.js`

---

## Phase 3 — modal.js Decoupling + Avatar Upload Migration

### modal.js decoupling
**Problem:** `saveEditedMatch()` and `confirmDeleteMatch()` call `renderStats()` directly — tight coupling between modal and stats modules.

**Change:**
- Replace direct `renderStats()` calls with `document.dispatchEvent(new CustomEvent('athlytics:matchesChanged'))`
- In `main.js`: add listener for `athlytics:matchesChanged` → calls `loadStats(true)` (force refresh from Supabase)
- Add `athlytics:matchesChanged` to the cross-module events list in CLAUDE.md

**Behavioural note:** The current code calls `renderStats()` (renders from in-memory state, no network fetch). The new flow calls `loadStats(true)` (re-fetches from Supabase). This is intentional: `saveEditedMatch()` and `confirmDeleteMatch()` both call `invalidateMatchCache()` first, so re-fetching ensures the displayed data matches what was committed to the DB. The extra network round-trip is acceptable.

### Avatar upload migration
**Problem:** Avatar input uses `onchange="window._uploadImage(this)"` — the last remaining `on*` attribute in the codebase and a global `window` exposure.

**Change:**
- `index.html`: replace `onchange="window._uploadImage(this)"` with `data-action="uploadImage"`
- `main.js`: add a dedicated `document.addEventListener('change', function(e) { var el = e.target.closest('input[data-action]'); if (!el) return; if (el.dataset.action === 'uploadImage') uploadImage(el); })` — separate from the existing `click` delegator
- `main.js`: verify that `uploadImage` is imported from `profile.js` (it is — line 1 of current `main.js`); add the import if absent
- `main.js`: remove the `window._uploadImage = uploadImage` global assignment (currently lines 184–185)

---

## Phase 4 — Small Fixes Sweep

Low-risk, targeted fixes.

| File | Fix | Call sites to update |
|------|-----|---------------------|
| `utils.js` | Rename `isPremium()` → `isDevPremium()`; add `// TODO Phase 4: replace with Stripe subscription check` | `stats-overview.js` (1 site — the premium gate in the overview section, moved from `stats.js` during Phase 2), `assessment.js` (1 site) |
| `teams.js` | Convert `renderTeamDropdown()` from HTML string to DOM API (matching `renderTournamentDropdown()` strategy) | None — internal to `teams.js` |
| `settings.js` | Rename exported `renderSettings()` → `requestRenderSettings()`. This function (line 71) only fires `athlytics:renderSettings` and has no external import consumers (`i18n.js` dispatches the event directly; `main.js` imports `renderSettings` from `settings-render.js`, not `settings.js`). Update the export declaration only. Also export `defaultSettings()` — it is documented as part of the public API in CLAUDE.md but currently unexported. | None outside `settings.js`. Update CLAUDE.md function contract table for `settings.js` to reflect new names. |
| `navigation.js` | Add comment on sport-icon mapping in `updateLogBadge()`: `// TODO Phase 3: move to SPORT_META map` | None |
| `log.js` | Add comment in `resetForm()`: `// Intentional: keeps last selected team for convenience` | None |
| `main.js` | Add bootstrap comments at lazy-init event dispatch points (`athlytics:renderSettings`, `athlytics:loadStats`, `athlytics:destroyCharts`, `athlytics:updateAllText`) | None |

---

## Files Changed Summary

| File | Change type |
|------|-------------|
| `js/state.js` | Make `_allMatches` private, update exports |
| `js/stats.js` | Delete (split into three) |
| `js/stats-overview.js` | New file — overview rendering, filter state, `loadStats()` |
| `js/stats-analyse.js` | New file — charts, `renderAnalyse()`, `CHART_COLORS` |
| `js/stats-search.js` | New file — pure rendering helpers for match list (no state) |
| `js/modal.js` | Update `allMatches` → `getAllMatches()` (4 sites); dispatch `athlytics:matchesChanged`; remove `renderStats` import |
| `js/main.js` | New event listeners (`athlytics:matchesChanged`, delegated `change`); import updates; bootstrap comments; remove `window._uploadImage` |
| `index.html` | Avatar input: `onchange` → `data-action="uploadImage"` |
| `js/utils.js` | Rename `isPremium` → `isDevPremium` |
| `js/stats-overview.js` | Update `isPremium` → `isDevPremium` call site (1) |
| `js/assessment.js` | Update `isPremium` → `isDevPremium` (1 site); update `allMatches` → `getAllMatches()` |
| `js/teams.js` | Standardize render strategy in `renderTeamDropdown()` |
| `js/settings.js` | Rename `renderSettings` → `requestRenderSettings`; export `defaultSettings` |
| `js/navigation.js` | Add comment on sport-icon mapping |
| `js/log.js` | Add comment on `resetForm`; update `allMatches` → `getAllMatches()` |
| `js/export.js` | Update `allMatches` → `getAllMatches()` |
| `CLAUDE.md` | Mark resolved items ✅; add `athlytics:matchesChanged` to event list; update `settings.js` function contract |

---

## Out of Scope

The following debt items are blocked by Phase 4 (auth) and are NOT addressed here:

- `id=eq.default` hardcoded in `supabase.js` and `settings.js`
- Base64 avatar in localStorage (`profile.js`)
- `headers()` static anon key
- RLS policies
- Semantic HTML / ARIA

---

## Success Criteria

### Structural checks (grep/inspect)
- `window._uploadImage` does not exist after bootstrap
- `modal.js` does not import from `stats-overview.js` or `stats.js`
- `allMatches` is not a named export of `state.js`
- `stats.js` file does not exist; `stats-overview.js`, `stats-analyse.js`, `stats-search.js` all exist
- `isPremium` identifier does not appear in `utils.js` (renamed to `isDevPremium`)
- `isDevPremium` appears in both `stats-overview.js` and `assessment.js` (all call sites updated)
- Avatar input in `index.html` has `data-action="uploadImage"` and no `onchange` attribute

### Smoke test — critical flows to verify manually
1. **Log a match** — save succeeds, stats tab updates, form resets with team preserved
2. **Edit a match** — open modal, change score, save → stats tab refreshes correctly
3. **Delete a match** — confirm delete → match gone from history, stats updated
4. **Switch language** — settings re-render correctly in both Norwegian and English (verifies `athlytics:renderSettings` event chain still works after `settings.js` rename)
5. **Upload avatar** — select image file → avatar updates; no `onchange` in HTML, no `window._uploadImage` in console
6. **Stats tab** — Oversikt and Analyse views both render, charts display, no console errors
7. **Filter by season/team/tournament** — results update correctly in both overview and match history
8. **Assessment sheet** — opens after saving match, ratings save on match edit
