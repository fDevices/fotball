# Stats Window — Additional Analysis Features

**Date:** 2026-03-22
**Status:** Approved by user

---

## Overview

Add 5 new Pro-gated analysis features to the stats window:

- 4 card-style sections in the **Overview tab** (visible as blurred/locked cards to free users)
- 1 new chart in the **Analyse tab**

All features use the existing `isDevPremium()` gate. No changes to free content.

---

## Approach

**Approach C — Pro-locked cards in Overview + Analyse chart.**

The 4 card-style features live in the Overview tab as blurred/locked cards with an upgrade prompt — mirrors how the existing Analyse tab preview works today. The rating trend chart goes into the Analyse tab alongside the existing charts.

---

## Feature Specifications

### 1. Performance Profile (Overview tab)

**Location:** After existing per-tournament section, before match history.

**Content:** Average of each of the 6 rating dimensions across all matches in the current filter. Only matches where that specific field is non-null are included in the average and denominator — a null value is excluded entirely (not counted as 0).

Dimensions (display order), using existing i18n keys:

| Label (reuse key) | Field |
|---|---|
| `t('cat_effort')` | `rating_effort` |
| `t('cat_focus')` | `rating_focus` |
| `t('cat_technique')` | `rating_technique` |
| `t('cat_team_play')` | `rating_team_play` |
| `t('cat_impact')` | `rating_impact` |
| `t('cat_overall')` | `rating_overall` |

Each dimension: labelled horizontal bar, numeric average to 1 decimal place. Bar width formula: `Math.min(100, Math.max(20, ((avg - 1) / 4) * 80 + 20))` — maps 1→20%, 5→100%, clamps against out-of-range data. No match count shown. Colour: lime (≥4.0), gold (3.0–3.9), danger (<3.0). Rows with no non-null values for that dimension are omitted.

**Visibility logic:**
- **Free users** (`!isDevPremium()`): blurred locked card shown when `filteredMatches.length > 0` (serves as conversion teaser regardless of whether ratings exist).
- **Pro users** (`isDevPremium()`): shown only when `filteredMatches.length > 0` AND at least one match has at least one non-null rating field. If no ratings exist, card is hidden.

**Pro gate markup:** Reuse existing `chart-locked` / `chart-locked-overlay` / `chart-locked-icon` / `chart-locked-text` / `chart-locked-sub` / `chart-unlock-btn` CSS classes (already in `style.css`).

---

### 2. Scoring Streaks (Overview tab)

**Location:** After Performance Profile.

**Sort:** All streak computations operate on matches sorted by `k.date` ascending.

| Stat | Description |
|---|---|
| Current streak | Count consecutive matches from the most recent backwards where `(k.goals \|\| 0) > 0`. If the most recent match has 0 goals, current streak = 0. |
| Best streak | Longest consecutive run of `(k.goals \|\| 0) > 0` in the full sorted set. |
| Longest drought | Longest consecutive run of `(k.goals \|\| 0) === 0` in the full sorted set. |
| Scoring % | `Math.round(((matches where goals > 0).length / total) * 100)` |

Display format for streak boxes: `n + ' ' + t('streak_matches')` (e.g. "3 kamper på rad"). Show 0 when current streak is 0.

Layout: two large-number boxes (current streak, best streak) in a 2-column grid, then two label/value rows below for drought and scoring %.

**Visibility:** Shown when `filteredMatches.length > 0`. Free users see blurred locked card (conversion teaser).

**Pro gate:** Reuse `chart-locked` / `chart-locked-overlay` markup.

---

### 3. Head-to-Head Records (Overview tab)

**Location:** After Scoring Streaks.

**Content:** Group matches by `k.opponent`. For each group call `calcWDL(opponentMatchesSubset)` — `calcWDL()` is a pure function and accepts any array subset. "Total goals" = `calcWDL(subset).g` (sum of `k.goals`, i.e. player goals, not match score totals).

Sort: by total matches (`s.n`) descending. Ties broken alphabetically by opponent name ascending using `localeCompare`.

Each row: opponent name, W/D/L count badges using `.t-badge.win` / `.t-badge.draw` / `.t-badge.loss`, then player goals badge using `.t-badge.goals` with ⚽ prefix — consistent with existing `renderTournamentSection` pattern.

**Visibility:** Shown when `filteredMatches.length > 0`. Free users see blurred locked card.

**Pro gate:** Reuse `chart-locked` / `chart-locked-overlay` markup.

---

### 4. Monthly Breakdown (Overview tab)

**Location:** After Head-to-Head, before match history.

**Content:** Group matches by `k.date.slice(0, 7)` (YYYY-MM string). Sort groups ascending. Only months with ≥1 match shown.

**Month label:** Determine if filtered set spans more than one calendar year: `new Set(matches.map(k => k.date.slice(0, 4))).size > 1`. If multi-year: append 2-digit year to every row label (e.g. "Aug 24"). If single-year: abbreviated month name only (e.g. "Aug"). Use `new Date(yearMonth + '-01').toLocaleDateString(getDateLocale(), { month: 'short' })` for the month abbreviation.

**WDL mini-bar:** Reuse `.wdl-bar` / `.wdl-seg.w` / `.wdl-seg.d` / `.wdl-seg.l` CSS classes. Width calculation matches existing `renderStats()` pattern: `pctW = Math.round((s.w/s.n)*100)`, `pctD = Math.round((s.d/s.n)*100)`, `pctL = 100 - pctW - pctD` (loss segment absorbs rounding remainder).

Total goals per month = `calcWDL(monthMatches).g`.

**Visibility:** Shown when `filteredMatches.length > 0`. Free users see blurred locked card.

**Pro gate:** Reuse `chart-locked` / `chart-locked-overlay` markup.

---

### 5. Rating Trend Chart (Analyse tab)

**Location:** After the "Goals by tournament" chart in `renderAnalyse()`, inside the existing `isDevPremium()` Pro block (after the `n === 0` check).

**Guard order (within Pro block):**
1. The existing `n === 0` guard already handles zero matches.
2. Add an additional check: if no matches in the filtered set have any non-null rating field, omit the rating trend chart card from the rendered HTML. The other 3 charts still render normally.
3. There is no top-level guard — this check is scoped entirely within the Pro branch. Free users always see the locked Analyse preview (existing behaviour unchanged).

**Content:** Line chart (Chart.js v4). X-axis: match date labels formatted `DD Mon` using `fmtDate()` — same helper as existing charts. Y-axis: fixed 1–5 range. Data source: all filtered matches, sorted ascending by date. Same-date matches appear as separate adjacent data points with the same label — consistent with existing chart behaviour.

**Per-dataset data:** For each dataset, build an array over all sorted filtered matches: use the rating value if non-null, else `null`. Set `spanGaps: false` so null values render as gaps.

**6 datasets (index order is fixed — pill wiring depends on it):**

| Index | i18n key | Field | Color hex | Border dash | Default |
|---|---|---|---|---|---|
| 0 | `cat_overall` | `rating_overall` | `#a8e063` | solid, width 2 | visible |
| 1 | `cat_effort` | `rating_effort` | `#f0c050` | `[4,3]`, width 1.5 | visible |
| 2 | `cat_impact` | `rating_impact` | `#63b8e0` | `[2,3]`, width 1.5 | visible |
| 3 | `cat_focus` | `rating_focus` | `#b08ae0` | `[4,3]`, width 1.5 | hidden |
| 4 | `cat_technique` | `rating_technique` | `#e05555` | `[2,3]`, width 1.5 | hidden |
| 5 | `cat_team_play` | `rating_team_play` | `#50d0a0` | `[4,3]`, width 1.5 | hidden |

Add to `CHART_COLORS` in `stats-analyse.js`: `blue: '#63b8e0'`, `purple: '#b08ae0'`, `teal: '#50d0a0'`.

**Chart registration:** `chartInstances['ratingTrend']` — picked up by existing `destroyCharts()`.

**Toggle pill markup:**

```html
<button class="rating-pill rating-pill-on"
        data-action="toggleRatingLine"
        data-dataset-index="0"
        data-color="#a8e063">Totalt inntrykk</button>
```

Active state (`.rating-pill-on`): background and border-color set inline from `data-color` at render time (`style="background:${color}22;border-color:${color}66;color:${color}"`). Inactive: transparent background, `color: var(--muted)`, `border-color: rgba(168,224,99,0.15)`.

**`toggleRatingLine` handler in `actions.js`:**

Add import at top of `actions.js`:
```js
import { getChartInstance } from './stats-analyse.js';
```

Add to ACTIONS map:
```js
toggleRatingLine: function(e) {
  var el = e.target.closest('[data-dataset-index]');
  if (!el) return;
  var idx = parseInt(el.dataset.datasetIndex, 10);
  var chart = getChartInstance('ratingTrend');
  if (!chart) return;
  var meta = chart.getDatasetMeta(idx);
  meta.hidden = !meta.hidden;
  chart.update();
  el.classList.toggle('rating-pill-on', !meta.hidden);
}
```

**`getChartInstance` export — add to `stats-analyse.js`:**

```js
export function getChartInstance(key) {
  return chartInstances[key] || null;
}
```

---

## Ordering in Overview tab

1. Form streak *(free, existing)*
2. WDL grid + bar *(free, existing)*
3. Goals/assists grid *(free, existing)*
4. Averages per match *(free, existing)*
5. Home vs Away *(free, existing)*
6. Per tournament *(free, existing)*
7. **Performance Profile** *(Pro locked card, new)*
8. **Scoring Streaks** *(Pro locked card, new)*
9. **Head-to-Head Records** *(Pro locked card, new)*
10. **Monthly Breakdown** *(Pro locked card, new)*
11. Opponent search + Match history *(free, existing)*

---

## Data & Filtering

All 5 features receive the already-filtered `matches` array from `renderStats()` / `renderAnalyse()`. No additional filtering logic needed.

---

## i18n Keys

**Reuse existing keys** (no changes needed):
- Dimension labels: `cat_effort`, `cat_focus`, `cat_technique`, `cat_team_play`, `cat_impact`, `cat_overall`
- Result labels: `win_short`, `draw_short`, `loss_short`

**New keys** — add to both `no` and `en` in `i18n.js`:

| Key | Norwegian | English |
|---|---|---|
| `perf_profile_title` | `'Egenvurdering snitt'` | `'Performance profile'` |
| `scoring_streaks_title` | `'Scoringsrekker'` | `'Scoring streaks'` |
| `streak_current` | `'Nåværende rekke'` | `'Current streak'` |
| `streak_best` | `'Beste rekke'` | `'Best streak'` |
| `streak_drought` | `'Lengste tørkeperiode'` | `'Longest drought'` |
| `streak_scoring_pct` | `'Scoret i % av kamper'` | `'Scored in % of matches'` |
| `streak_matches` | `'kamper på rad'` | `'matches in a row'` |
| `streak_drought_matches` | `'kamper'` | `'matches'` |
| `h2h_title` | `'Mot motstandere'` | `'Head-to-head'` |
| `monthly_title` | `'Per måned'` | `'By month'` |
| `rating_trend_title` | `'Egenvurdering over tid'` | `'Performance over time'` |

---

## CSS additions (`style.css`)

```css
.rating-pill {
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 9px;
  border: 1px solid rgba(168,224,99,0.15);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  font-family: 'Barlow Condensed', sans-serif;
}
```

Active pill state (`.rating-pill-on`) sets `background`, `border-color`, and `color` inline via `data-color` at render time — no additional CSS class needed beyond the base `.rating-pill`.

---

## Implementation Notes

- **`chart-locked` CSS:** Already exists in `style.css` — reuse for all 4 Overview Pro cards.
- **`getChartInstance` export:** Add to `stats-analyse.js`; import in `actions.js`.
- **`toggleRatingLine` action:** Add to ACTIONS map in `actions.js`.
- **No new module state** — all computations are pure functions over the `matches` array.

---

## Out of Scope

- Multi-season comparisons
- Export of new sections to CSV/PDF
- Radar/spider chart for performance profile (considered, deferred)
- Keyboard navigation for pill toggles (deferred to Fase 3/4 desktop pass)
