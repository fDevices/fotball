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
- Export only `getAllMatches()` and `setAllMatches(arr)`
- `invalidateMatchCache()` now also resets `_allMatches = []`, clarifying the contract: cache invalidation = full state reset, data reloaded from Supabase on next access

**Consumers to update** (replace `allMatches` with `getAllMatches()` and `setAllMatches(arr)`):
- `stats.js`
- `modal.js`
- `export.js`
- `log.js`
- `assessment.js`

---

## Phase 2 — stats.js Split

**Problem:** `stats.js` is too large — owns data loading, filters, paging, search, overview rendering, analysis rendering, and charts. Hard to navigate and reason about.

**New structure:**

### `stats-overview.js`
Owns the overview tab rendering and filter state.
- Functions: `loadStats()`, `renderStats()`, `calcWDL()`, `getResult()`, `switchStatsView()`, `setSeason()`, `setTeamFilter()`, `setTournamentFilter()`
- Exported state: `activeStatsView`, `activeLag`, `activeSeason`, `activeTournament`, `CHART_COLORS`
- `loadStats()` stays here as the public entry point — it orchestrates overview + search rendering

### `stats-analyse.js`
Owns the analyse tab charts and rendering.
- Functions: `renderAnalyse()`, `initChartDefaults()`, `destroyCharts()`

### `stats-search.js`
Owns the match history list, paging, and opponent search.
- Functions: `setMatchPage()`, `setOpponentSearch()`
- Exported state: `matchPage`, `opponentSearch`

**`stats.js`** is deleted. `main.js` imports directly from the three new modules.

---

## Phase 3 — modal.js Decoupling + Avatar Upload Migration

### modal.js decoupling
**Problem:** `saveEditedMatch()` and `confirmDeleteMatch()` call `renderStats()` directly — tight coupling between modal and stats modules.

**Change:**
- Replace direct `renderStats()` calls with `document.dispatchEvent(new CustomEvent('athlytics:matchesChanged'))`
- In `main.js`: add listener for `athlytics:matchesChanged` → calls `loadStats(true)` (force refresh)
- Add `athlytics:matchesChanged` to the cross-module events list in CLAUDE.md

### Avatar upload migration
**Problem:** Avatar input uses `onchange="window._uploadImage(this)"` — the last remaining `on*` attribute in the codebase and a global `window` exposure.

**Change:**
- `index.html`: replace `onchange="window._uploadImage(this)"` with `data-action="uploadImage"`
- `main.js`: add `uploadImage: (e) => uploadImage(e.target)` to ACTIONS map
- `main.js`: add delegated `change` listener for `input[data-action="uploadImage"]`
- `main.js`: remove `window._uploadImage` global assignment

---

## Phase 4 — Small Fixes Sweep

Low-risk, targeted fixes — no cross-file dependencies.

| File | Fix |
|------|-----|
| `utils.js` | Rename `isPremium()` → `isDevPremium()`; add `// TODO Phase 4: replace with Stripe subscription check`; update all call sites |
| `teams.js` | Convert `renderTeamDropdown()` from HTML string to DOM API (matching `renderTournamentDropdown()` strategy) |
| `settings.js` | Rename `renderSettings()` → `requestRenderSettings()` (only fires event, doesn't render); export `defaultSettings()` |
| `navigation.js` | Add comment on sport-icon mapping in `updateLogBadge()`: `// TODO Phase 3: move to SPORT_META map` |
| `log.js` | Add comment in `resetForm()`: `// Intentional: keeps last selected team for convenience` |
| `main.js` | Add bootstrap comments at lazy-init event dispatch points (`athlytics:renderSettings`, `athlytics:loadStats`, etc.) |

---

## Files Changed Summary

| File | Change type |
|------|-------------|
| `js/state.js` | Encapsulate `_allMatches`, update exports |
| `js/stats.js` | Delete (split into three) |
| `js/stats-overview.js` | New file |
| `js/stats-analyse.js` | New file |
| `js/stats-search.js` | New file |
| `js/modal.js` | Dispatch event instead of direct call |
| `js/main.js` | New event listener, avatar delegation, import updates, comments |
| `index.html` | Avatar input: `onchange` → `data-action` |
| `js/utils.js` | Rename `isPremium` |
| `js/teams.js` | Standardize render strategy |
| `js/settings.js` | Rename + export |
| `js/navigation.js` | Comment |
| `js/log.js` | Comment |
| `js/export.js` | Update `allMatches` → `getAllMatches()` |
| `js/log.js` | Update `allMatches` → `getAllMatches()` |
| `js/assessment.js` | Update `allMatches` → `getAllMatches()` |
| `CLAUDE.md` | Mark resolved items ✅, add `athlytics:matchesChanged` to event list |

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

- No `window._uploadImage` global
- No direct `renderStats()` call from `modal.js`
- `allMatches` is not importable directly from `state.js`
- `stats.js` file does not exist; three replacement files do
- All existing functionality works identically after changes
- CLAUDE.md updated to reflect resolved items
