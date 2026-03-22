# Head-to-Head Search — Design Spec

**Date:** 2026-03-22
**Status:** Approved

## Problem

The current `renderHeadToHead` card lists every opponent in a scrollable list, which takes up too much vertical space in the Overview tab — especially as the number of opponents grows.

## Solution

Replace the full list with a compact search card. The user types an opponent name; the top matching opponent's stats appear inline. No match shows a short message. Empty state shows only the input and an opponent count hint.

---

## UI States

### 1. Empty (no search query)
- Search input with placeholder `t('h2h_search_placeholder')`
- Below input: muted hint — `t('h2h_matches_count').replace('{n}', totalOpponents)` where `totalOpponents` is the count of unique opponent names in the currently-filtered match set (same set passed to `renderHeadToHead`)
- No result card shown

### 2. Match found
- Search input with current query
- Result card for the **top match**: first opponent (after sorting all opponents by total match count descending, ties broken alphabetically) whose name contains the query (case-insensitive)
  - Header: `esc(name) + ' · ' + total + ' ' + t('matches_short')`
  - If more than one opponent matched, a muted secondary line: `'+ ' + (matchCount - 1) + ' ' + t('h2h_more_opponents')`
  - W/D/L colour bar (green/gold/red segments, `Math.round((count/total)*100)%` widths — rounding may not sum to exactly 100%, which is an acceptable visual imprecision; total is always ≥ 1 when a result is shown)
  - Stat rows: `t('stat_wins')` / `t('stat_draws')` / `t('stat_losses')` with coloured values (lime / gold / danger)
  - Divider, then two goal rows:
    - `t('stat_goals')` — **team** goals scored against this opponent: sum of `match_type === 'home' ? home_score : away_score` across those matches
    - `t('h2h_goals_conceded')` — team goals conceded: sum of `match_type === 'home' ? away_score : home_score`

### 3. No match
- Short muted message: `t('h2h_no_match')`

---

## Data & Logic

- **Opponent matching:** `opponent.toLowerCase().includes(query.toLowerCase())`
- **Sort:** by total match count descending, ties broken alphabetically (`localeCompare`)
- **Goals scored** = team's goals (not the player's personal `goals` field): `match_type === 'home' ? k.home_score : k.away_score`
- **Goals conceded** = opponent's goals: `match_type === 'home' ? k.away_score : k.home_score` — assumes `match_type` is always `'home'` or `'away'` per DB contract; no defensive fallback needed

---

## State

New module-private variable in `stats-overview.js` (using `var`, consistent with file style — not exported):
```js
var h2hSearch = '';
```

New export (only the setter is exported):
```js
export function setH2hSearch(v) { h2hSearch = v; loadStats(); }
```

`main.js` adds a branch in the existing `input` event handler:
```js
if (e.target.id === 'h2h-search-input') {
  setH2hSearch(e.target.value);
}
```

Full `loadStats()` re-render on each keystroke is intentional — the match cache (`sessionStorage`) is warm, so no network call occurs per keystroke. No debounce is needed given the app's data scale. Implementors should not add a debounce.

---

## Implementation scope

| File | Change |
|---|---|
| `js/stats-overview.js` | Replace `renderHeadToHead`; add `h2hSearch` state var + `setH2hSearch` export |
| `js/i18n.js` | Add 5 new keys to both `no` and `en` objects |
| `js/main.js` | Add `setH2hSearch` to the existing `import … from './stats-overview.js'` line; add input handler branch |

No changes to `app.html`, `style.css`, or `actions.js`.

---

## i18n keys

New keys to add to both `no` and `en` objects:

| Key | NO | EN |
|---|---|---|
| `h2h_search_placeholder` | `Søk motstander…` | `Search opponent…` |
| `h2h_no_match` | `Ingen motstandere matcher` | `No opponents match` |
| `h2h_matches_count` | `{n} motstandere` | `{n} opponents` |
| `h2h_goals_conceded` | `Mål sluppet inn` | `Goals conceded` |
| `h2h_more_opponents` | `andre matcher` | `more matches` |

Existing keys reused (no changes):
- `matches_short` — 'kamper' / 'matches'
- `stat_wins` / `stat_draws` / `stat_losses` — W/D/L row labels
- `stat_goals` — goals row label (reused here for team goals scored, consistent with its use elsewhere as a generic goal label)
