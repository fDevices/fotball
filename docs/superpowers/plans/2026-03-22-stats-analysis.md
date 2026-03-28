# Stats Analysis Features Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add 5 new Pro-gated analysis sections to the stats window — 4 locked cards in the Overview tab (Performance Profile, Scoring Streaks, Head-to-Head, Monthly Breakdown) and 1 new chart in the Analyse tab (Rating Trend).

**Architecture:** All new sections are pure render functions that receive the already-filtered `matches` array — no new state. Overview sections use the existing `chart-locked` / `chart-locked-overlay` Pro gate markup. The rating trend chart is a Chart.js line chart with pill toggles wired via the existing ACTIONS map in `actions.js`.

**Tech Stack:** Vanilla JS ES modules, Chart.js v4 (CDN), no test framework (browser SPA — verification is manual).

**Spec:** `docs/superpowers/specs/2026-03-22-stats-analysis-design.md`

---

## File Map

| File | Change |
|---|---|
| `js/i18n.js` | Add 11 new i18n keys to both `no` and `en` objects |
| `style.css` | Add `.rating-pill` CSS class |
| `js/stats-overview.js` | Add 4 render helpers; call them in `renderStats()` |
| `js/stats-analyse.js` | Add `getChartInstance()` export; add rating trend chart + pill HTML to `renderAnalyse()`; extend `CHART_COLORS` |
| `js/actions.js` | Import `getChartInstance`; add `toggleRatingLine` to ACTIONS map |

---

## Task 1: i18n keys + CSS

**Files:**
- Modify: `js/i18n.js`
- Modify: `style.css`

- [x] **Step 1: Add 11 new keys to the `no` object in `i18n.js`**

Find the `no:` object and add these keys (after the existing stats keys is fine):

```js
perf_profile_title:'Egenvurdering snitt',
scoring_streaks_title:'Scoringsrekker',
streak_current:'Nåværende rekke',
streak_best:'Beste rekke',
streak_drought:'Lengste tørkeperiode',
streak_scoring_pct:'Scoret i % av kamper',
streak_matches:'kamper på rad',
streak_drought_matches:'kamper',
h2h_title:'Mot motstandere',
monthly_title:'Per måned',
rating_trend_title:'Egenvurdering over tid',
```

- [x] **Step 2: Add the same 11 keys to the `en` object in `i18n.js`**

```js
perf_profile_title:'Performance profile',
scoring_streaks_title:'Scoring streaks',
streak_current:'Current streak',
streak_best:'Best streak',
streak_drought:'Longest drought',
streak_scoring_pct:'Scored in % of matches',
streak_matches:'matches in a row',
streak_drought_matches:'matches',
h2h_title:'Head-to-head',
monthly_title:'By month',
rating_trend_title:'Performance over time',
```

- [x] **Step 3: Add `.rating-pill` to `style.css`**

Add near the end of the file, before the final `@media` blocks:

```css
/* Rating trend pill toggles */
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

- [x] **Step 4: Verify in browser**

Open the app → Settings tab → switch language to English, then back to Norwegian. No errors in console. The new keys don't appear yet (nothing calls them yet) — that's expected.

- [x] **Step 5: Commit**

```bash
git add js/i18n.js style.css
git commit -m "feat(stats): add i18n keys and rating-pill CSS for analysis features"
```

---

## Task 2: Performance Profile section

**Files:**
- Modify: `js/stats-overview.js`

- [x] **Step 1: Add the `renderPerformanceProfile` helper function**

Add this function near the bottom of `stats-overview.js`, above `renderStats()`:

```js
function renderPerformanceProfile(matches) {
  var dims = [
    { key: 'cat_effort',    field: 'rating_effort' },
    { key: 'cat_focus',     field: 'rating_focus' },
    { key: 'cat_technique', field: 'rating_technique' },
    { key: 'cat_team_play', field: 'rating_team_play' },
    { key: 'cat_impact',    field: 'rating_impact' },
    { key: 'cat_overall',   field: 'rating_overall' }
  ];

  function avgField(field) {
    var vals = matches.map(function(k) { return k[field]; }).filter(function(v) { return v != null; });
    if (!vals.length) return null;
    return vals.reduce(function(s, v) { return s + v; }, 0) / vals.length;
  }

  function barColor(avg) {
    if (avg >= 4.0) return 'var(--lime)';
    if (avg >= 3.0) return 'var(--gold)';
    return 'var(--danger)';
  }

  function barWidth(avg) {
    return Math.min(100, Math.max(20, ((avg - 1) / 4) * 80 + 20));
  }

  var rows = dims.map(function(d) {
    var avg = avgField(d.field);
    if (avg === null) return '';
    var color = barColor(avg);
    var width = barWidth(avg);
    return '<div class="rating-avg-row">' +
      '<span class="rating-avg-label">' + t(d.key) + '</span>' +
      '<div class="rating-avg-bar-wrap"><div class="rating-avg-bar" style="width:' + width + '%;background:' + color + '"></div></div>' +
      '<span class="rating-avg-val" style="color:' + color + '">' + avg.toFixed(1) + '</span>' +
    '</div>';
  }).join('');

  var hasAnyRating = dims.some(function(d) { return avgField(d.field) !== null; });

  var inner = '<div class="stat-row-card">' +
    '<div class="stat-row-title">' + t('perf_profile_title') + '</div>' +
    (rows || '<div style="text-align:center;color:var(--muted);font-size:12px;padding:8px 0">\u2014</div>') +
  '</div>';

  if (!isDevPremium()) {
    return '<div class="chart-locked" style="margin-bottom:8px">' +
      inner +
      '<div class="chart-locked-overlay">' +
        '<div class="chart-locked-icon">\u26A1</div>' +
        '<div class="chart-locked-text">' + t('pro_feature') + '</div>' +
        '<div class="chart-locked-sub">' + t('pro_upgrade_text') + '</div>' +
        '<button class="chart-unlock-btn" data-action="showProToast">' + t('pro_unlock_btn') + '</button>' +
      '</div>' +
    '</div>';
  }

  if (!hasAnyRating) return '';
  return inner;
}
```

- [x] **Step 2: Add the required import for `isDevPremium`**

Check the top of `stats-overview.js` — `isDevPremium` is imported from `./utils.js`. If it is already imported (in the `import { esc, getResult }` line), add it there. It is currently `import { esc, getResult } from './utils.js';` — change to:

```js
import { esc, getResult, isDevPremium } from './utils.js';
```

- [x] **Step 3: Add CSS for the rating rows to `style.css`**

```css
.rating-avg-row {
  display: flex;
  align-items: center;
  margin-bottom: 5px;
}
.rating-avg-label {
  font-size: 10px;
  color: var(--muted);
  width: 60px;
  flex-shrink: 0;
}
.rating-avg-bar-wrap {
  flex: 1;
  height: 5px;
  background: rgba(168,224,99,0.1);
  border-radius: 3px;
  margin: 0 8px;
}
.rating-avg-bar {
  height: 5px;
  border-radius: 3px;
}
.rating-avg-val {
  font-size: 10px;
  font-weight: 800;
  width: 24px;
  text-align: right;
}
```

- [x] **Step 4: Call `renderPerformanceProfile` inside `renderStats()`**

In `renderStats()`, find the line that assembles `statsContent.innerHTML`. It currently ends with:

```js
renderTournamentSection(matches) +
'<div class="opponent-search-wrap">' +
```

Insert the new section between `renderTournamentSection` and the opponent search:

```js
renderTournamentSection(matches) +
renderPerformanceProfile(matches) +
'<div class="opponent-search-wrap">' +
```

- [x] **Step 5: Verify in browser**

Open app → Stats tab → Overview. With `isDevPremium()` returning `true` (current dev state):
- If any logged matches have rating data: a "Egenvurdering snitt" card appears after the tournament section, showing bars per dimension.
- If no matches have ratings: card is hidden entirely — no empty card shown.

As free user test: temporarily edit `utils.js` to make `isDevPremium()` return `false`, reload — the card should appear blurred with a lock overlay. Revert after checking.

- [x] **Step 6: Commit**

```bash
git add js/stats-overview.js js/utils.js style.css
git commit -m "feat(stats): add Performance Profile Pro card to Overview tab"
```

---

## Task 3: Scoring Streaks section

**Files:**
- Modify: `js/stats-overview.js`

- [x] **Step 1: Add the `calcStreaks` helper function**

Add above `renderPerformanceProfile` in `stats-overview.js`:

```js
function calcStreaks(matches) {
  // matches must be sorted ascending by date before calling
  var sorted = matches.slice().sort(function(a, b) { return a.date < b.date ? -1 : 1; });
  var n = sorted.length;

  var currentStreak = 0;
  for (var i = n - 1; i >= 0; i--) {
    if ((sorted[i].goals || 0) > 0) currentStreak++;
    else break;
  }

  var bestStreak = 0, runStreak = 0;
  var bestDrought = 0, runDrought = 0;
  for (var j = 0; j < n; j++) {
    if ((sorted[j].goals || 0) > 0) {
      runStreak++;
      runDrought = 0;
    } else {
      runDrought++;
      runStreak = 0;
    }
    if (runStreak > bestStreak) bestStreak = runStreak;
    if (runDrought > bestDrought) bestDrought = runDrought;
  }

  var scoringCount = sorted.filter(function(k) { return (k.goals || 0) > 0; }).length;
  var scoringPct = n > 0 ? Math.round((scoringCount / n) * 100) : 0;

  return { currentStreak: currentStreak, bestStreak: bestStreak, bestDrought: bestDrought, scoringPct: scoringPct };
}
```

- [x] **Step 2: Add the `renderScoringStreaks` helper function**

```js
function renderScoringStreaks(matches) {
  var s = calcStreaks(matches);

  var inner = '<div class="stat-row-card">' +
    '<div class="stat-row-title">' + t('scoring_streaks_title') + '</div>' +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">' +
      '<div style="background:rgba(168,224,99,0.06);border-radius:8px;padding:8px;text-align:center">' +
        '<div style="font-size:9px;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);margin-bottom:4px">' + t('streak_current') + '</div>' +
        '<div style="font-size:24px;font-weight:800;color:var(--lime);line-height:1">' + s.currentStreak + '</div>' +
        '<div style="font-size:9px;color:var(--muted);margin-top:2px">' + t('streak_matches') + '</div>' +
      '</div>' +
      '<div style="background:rgba(240,192,80,0.06);border-radius:8px;padding:8px;text-align:center">' +
        '<div style="font-size:9px;text-transform:uppercase;letter-spacing:0.08em;color:var(--muted);margin-bottom:4px">' + t('streak_best') + '</div>' +
        '<div style="font-size:24px;font-weight:800;color:var(--gold);line-height:1">' + s.bestStreak + '</div>' +
        '<div style="font-size:9px;color:var(--muted);margin-top:2px">' + t('streak_matches') + '</div>' +
      '</div>' +
    '</div>' +
    '<div class="stat-row"><span class="stat-row-label">' + t('streak_drought') + '</span><span class="stat-row-value" style="color:var(--danger)">' + s.bestDrought + ' ' + t('streak_drought_matches') + '</span></div>' +
    '<div class="stat-row"><span class="stat-row-label">' + t('streak_scoring_pct') + '</span><span class="stat-row-value" style="color:var(--lime)">' + s.scoringPct + '%</span></div>' +
  '</div>';

  if (!isDevPremium()) {
    return '<div class="chart-locked" style="margin-bottom:8px">' +
      inner +
      '<div class="chart-locked-overlay">' +
        '<div class="chart-locked-icon">\u26A1</div>' +
        '<div class="chart-locked-text">' + t('pro_feature') + '</div>' +
        '<div class="chart-locked-sub">' + t('pro_upgrade_text') + '</div>' +
        '<button class="chart-unlock-btn" data-action="showProToast">' + t('pro_unlock_btn') + '</button>' +
      '</div>' +
    '</div>';
  }

  return inner;
}
```

- [x] **Step 3: Call it in `renderStats()`**

Add after `renderPerformanceProfile(matches)`:

```js
renderPerformanceProfile(matches) +
renderScoringStreaks(matches) +
'<div class="opponent-search-wrap">' +
```

- [x] **Step 4: Verify in browser**

Stats → Overview: a "Scoringsrekker" card appears showing current streak, best streak, drought, and scoring %. Values should match your logged matches. No console errors.

- [x] **Step 5: Commit**

```bash
git add js/stats-overview.js
git commit -m "feat(stats): add Scoring Streaks Pro card to Overview tab"
```

---

## Task 4: Head-to-Head Records section

**Files:**
- Modify: `js/stats-overview.js`

- [x] **Step 1: Add the `renderHeadToHead` helper function**

```js
function renderHeadToHead(matches) {
  var oppMap = {};
  matches.forEach(function(k) {
    var name = k.opponent || '\u2014';
    if (!oppMap[name]) oppMap[name] = [];
    oppMap[name].push(k);
  });

  var opponents = Object.keys(oppMap).sort(function(a, b) {
    var diff = oppMap[b].length - oppMap[a].length;
    return diff !== 0 ? diff : a.localeCompare(b);
  });

  var rows = opponents.map(function(opp) {
    var s = calcWDL(oppMap[opp]);
    return '<div class="tournament-stat-row">' +
      '<div class="tournament-stat-name">' + esc(opp) + ' <span style="color:var(--muted);font-size:11px;font-weight:400">(' + s.n + ')</span></div>' +
      '<div class="tournament-stat-badges">' +
        '<span class="t-badge win">' + s.w + t('win_short') + '</span>' +
        '<span class="t-badge draw">' + s.d + t('draw_short') + '</span>' +
        '<span class="t-badge loss">' + s.l + t('loss_short') + '</span>' +
        '<span class="tournament-wdl-sep"></span>' +
        '<span class="t-badge goals">\u26BD' + s.g + '</span>' +
      '</div>' +
    '</div>';
  }).join('');

  var inner = '<div class="stat-row-card">' +
    '<div class="stat-row-title">' + t('h2h_title') + '</div>' +
    rows +
  '</div>';

  if (!isDevPremium()) {
    return '<div class="chart-locked" style="margin-bottom:8px">' +
      inner +
      '<div class="chart-locked-overlay">' +
        '<div class="chart-locked-icon">\u26A1</div>' +
        '<div class="chart-locked-text">' + t('pro_feature') + '</div>' +
        '<div class="chart-locked-sub">' + t('pro_upgrade_text') + '</div>' +
        '<button class="chart-unlock-btn" data-action="showProToast">' + t('pro_unlock_btn') + '</button>' +
      '</div>' +
    '</div>';
  }

  return inner;
}
```

- [x] **Step 2: Call it in `renderStats()`**

```js
renderScoringStreaks(matches) +
renderHeadToHead(matches) +
'<div class="opponent-search-wrap">' +
```

- [x] **Step 3: Verify in browser**

Stats → Overview: "Mot motstandere" card shows all opponents with W/D/L badges and ⚽ goal count, sorted by most-played. Opponents with equal match counts should be sorted alphabetically.

- [x] **Step 4: Commit**

```bash
git add js/stats-overview.js
git commit -m "feat(stats): add Head-to-Head Records Pro card to Overview tab"
```

---

## Task 5: Monthly Breakdown section

**Files:**
- Modify: `js/stats-overview.js`

- [x] **Step 1: Add the `renderMonthlyBreakdown` helper function**

```js
function renderMonthlyBreakdown(matches) {
  var monthMap = {};
  matches.forEach(function(k) {
    var ym = (k.date || '').slice(0, 7);
    if (!ym) return;
    if (!monthMap[ym]) monthMap[ym] = [];
    monthMap[ym].push(k);
  });

  var keys = Object.keys(monthMap).sort();
  if (!keys.length) return '';

  var multiYear = new Set(matches.map(function(k) { return (k.date || '').slice(0, 4); })).size > 1;

  function monthLabel(ym) {
    var d = new Date(ym + '-02'); // day 2 avoids UTC offset edge cases
    var mon = d.toLocaleDateString(getDateLocale(), { month: 'short' });
    if (multiYear) {
      var yr = String(d.getFullYear()).slice(2);
      return mon + ' ' + yr;
    }
    return mon;
  }

  var rows = keys.map(function(ym) {
    var s = calcWDL(monthMap[ym]);
    var pctW = Math.round((s.w / s.n) * 100);
    var pctD = Math.round((s.d / s.n) * 100);
    var pctL = 100 - pctW - pctD;
    return '<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px">' +
      '<span style="font-size:10px;color:var(--muted);width:40px;flex-shrink:0">' + monthLabel(ym) + '</span>' +
      '<div class="wdl-bar" style="flex:1;height:14px;margin-bottom:0">' +
        '<div class="wdl-seg w" style="width:' + pctW + '%"></div>' +
        '<div class="wdl-seg d" style="width:' + pctD + '%"></div>' +
        '<div class="wdl-seg l" style="width:' + pctL + '%"></div>' +
      '</div>' +
      '<span style="font-size:9px;color:var(--lime);width:28px;text-align:right">\u26BD' + s.g + '</span>' +
    '</div>';
  }).join('');

  var inner = '<div class="stat-row-card" style="margin-bottom:8px">' +
    '<div class="stat-row-title">' + t('monthly_title') + '</div>' +
    rows +
  '</div>';

  if (!isDevPremium()) {
    return '<div class="chart-locked" style="margin-bottom:8px">' +
      inner +
      '<div class="chart-locked-overlay">' +
        '<div class="chart-locked-icon">\u26A1</div>' +
        '<div class="chart-locked-text">' + t('pro_feature') + '</div>' +
        '<div class="chart-locked-sub">' + t('pro_upgrade_text') + '</div>' +
        '<button class="chart-unlock-btn" data-action="showProToast">' + t('pro_unlock_btn') + '</button>' +
      '</div>' +
    '</div>';
  }

  return inner;
}
```

Note: `getDateLocale` is already imported from `./settings.js` in `stats-analyse.js` but not in `stats-overview.js`. Add it to the import:

```js
import { getSettings, getAllSeasons, getDateLocale } from './settings.js';
```

- [x] **Step 2: Call it in `renderStats()`**

```js
renderHeadToHead(matches) +
renderMonthlyBreakdown(matches) +
'<div class="opponent-search-wrap">' +
```

- [x] **Step 3: Verify in browser**

Stats → Overview: "Per måned" card appears with one row per month, WDL bar and ⚽ goal count. If you only have data from one year, no year suffix. Filter to a season spanning two years — month labels should gain "24"/"25" suffixes.

- [x] **Step 4: Commit**

```bash
git add js/stats-overview.js
git commit -m "feat(stats): add Monthly Breakdown Pro card to Overview tab"
```

---

## Task 6: Wire up chart toggle infrastructure

**Files:**
- Modify: `js/stats-analyse.js`
- Modify: `js/actions.js`

- [x] **Step 1: Export `getChartInstance` from `stats-analyse.js`**

Add at the end of `stats-analyse.js` (after all existing exports):

```js
export function getChartInstance(key) {
  return chartInstances[key] || null;
}
```

- [x] **Step 2: Add new CHART_COLORS entries in `stats-analyse.js`**

Find `var CHART_COLORS = {` and add three new entries:

```js
var CHART_COLORS = {
  lime:     '#a8e063',
  gold:     '#f0c050',
  danger:   '#e05555',
  muted:    '#8a9a80',
  card:     '#162b1a',
  border:   'rgba(168,224,99,0.15)',
  gridLine: 'rgba(168,224,99,0.08)',
  blue:     '#63b8e0',
  purple:   '#b08ae0',
  teal:     '#50d0a0'
};
```

- [x] **Step 3: Add `toggleRatingLine` to `actions.js`**

Add this import at the top of `actions.js` (with the other imports):

```js
import { getChartInstance } from './stats-analyse.js';
```

Add this entry to the `ACTIONS` map (anywhere in the map, e.g. near the other stats actions):

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
},
```

- [x] **Step 4: Verify no import errors**

Open the app in browser. Open DevTools console. No import/module errors. The `toggleRatingLine` action does nothing visible yet (chart doesn't exist yet) — that's expected.

- [x] **Step 5: Commit**

```bash
git add js/stats-analyse.js js/actions.js
git commit -m "feat(stats): add getChartInstance export and toggleRatingLine action"
```

---

## Task 7: Rating Trend Chart

**Files:**
- Modify: `js/stats-analyse.js`

- [x] **Step 1: Define the dataset configuration array**

Add this constant inside `renderAnalyse()`, just before the section where you'll build the chart HTML (after the `n === 0` check):

```js
var RATING_DIMS = [
  { key: 'cat_overall',   field: 'rating_overall',   color: CHART_COLORS.lime,   dash: [],    width: 2,   defaultVisible: true },
  { key: 'cat_effort',    field: 'rating_effort',    color: CHART_COLORS.gold,   dash: [4,3], width: 1.5, defaultVisible: true },
  { key: 'cat_impact',    field: 'rating_impact',    color: CHART_COLORS.blue,   dash: [2,3], width: 1.5, defaultVisible: true },
  { key: 'cat_focus',     field: 'rating_focus',     color: CHART_COLORS.purple, dash: [4,3], width: 1.5, defaultVisible: false },
  { key: 'cat_technique', field: 'rating_technique', color: CHART_COLORS.danger, dash: [2,3], width: 1.5, defaultVisible: false },
  { key: 'cat_team_play', field: 'rating_team_play', color: CHART_COLORS.teal,   dash: [4,3], width: 1.5, defaultVisible: false }
];
```

- [x] **Step 2: Build the rating chart HTML and pill toggles**

In `renderAnalyse()`, find the line that builds `container.innerHTML`. It currently ends with the `chart-card` for the tournament chart:

```js
'<div class="chart-card" id="chart-card-tournament">' + ...
```

Determine whether to include the rating trend chart:

```js
var ratingMatches = asc.filter(function(k) {
  return RATING_DIMS.some(function(d) { return k[d.field] != null; });
});
var ratingCardHTML = '';
if (ratingMatches.length > 0) {
  var pillsHTML = RATING_DIMS.map(function(d, i) {
    var on = d.defaultVisible;
    var style = on
      ? 'background:' + d.color + '22;border-color:' + d.color + '66;color:' + d.color
      : '';
    return '<button class="rating-pill' + (on ? ' rating-pill-on' : '') + '"' +
      ' data-action="toggleRatingLine"' +
      ' data-dataset-index="' + i + '"' +
      ' data-color="' + d.color + '"' +
      ' style="' + style + '">' +
      t(d.key) +
    '</button>';
  }).join('');
  ratingCardHTML =
    '<div class="chart-card" id="chart-card-rating">' +
      '<div class="chart-card-title">' + t('rating_trend_title') + '</div>' +
      '<div class="chart-canvas-wrap"><canvas id="chart-rating" height="180"></canvas></div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:8px">' + pillsHTML + '</div>' +
    '</div>';
}
```

Then append `ratingCardHTML` to `container.innerHTML`:

```js
container.innerHTML = selectorHTML +
  renderFormStreak(matches) +
  '<div class="chart-card" id="chart-card-winpct">...</div>' +
  '<div class="chart-card" id="chart-card-goals">...</div>' +
  '<div class="chart-card" id="chart-card-tournament">...</div>' +
  ratingCardHTML;
```

- [x] **Step 3: Instantiate the Chart.js chart**

After the existing tournament chart instantiation, add:

```js
if (ratingMatches.length > 0 && document.getElementById('chart-rating')) {
  var ratingLabels = asc.map(function(k) {
    return fmtDate(k.date, { day: '2-digit', month: 'short' });
  });

  var ratingDatasets = RATING_DIMS.map(function(d, i) {
    var data = asc.map(function(k) { return k[d.field] != null ? k[d.field] : null; });
    return {
      label: t(d.key),
      data: data,
      borderColor: d.color,
      backgroundColor: 'transparent',
      borderWidth: d.width,
      borderDash: d.dash,
      pointRadius: asc.length > 20 ? 0 : 3,
      pointHoverRadius: 5,
      pointBackgroundColor: d.color,
      spanGaps: false,
      hidden: !d.defaultVisible,
      tension: 0.2
    };
  });

  chartInstances['ratingTrend'] = new Chart(document.getElementById('chart-rating'), {
    type: 'line',
    data: { labels: ratingLabels, datasets: ratingDatasets },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { maxRotation: 0, maxTicksLimit: 6, font: { size: 10 } }, grid: { color: CHART_COLORS.gridLine } },
        y: { min: 1, max: 5, ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: CHART_COLORS.gridLine } }
      }
    }
  });
}
```

Note: `borderDash` in Chart.js v4 is set via `borderDash` on the dataset, not `borderDashOffset`. The `borderDash` property sets the line dash pattern.

- [x] **Step 4: Verify in browser**

Navigate to Stats → Analyse tab. If matches with rating data exist:
- A "Egenvurdering over tid" chart appears at the bottom.
- 6 pill buttons appear below. First 3 (Totalt, Innsats, Impact) are coloured/active; last 3 are dimmed/inactive.
- Clicking a pill toggles the corresponding line on/off.
- Switching season/team filters re-renders the chart correctly.
- Switching away from Stats tab and back destroys/recreates chart without double-rendering.

If no matches have ratings: the chart card is absent (no empty card, no error).

- [x] **Step 5: Commit**

```bash
git add js/stats-analyse.js
git commit -m "feat(stats): add Rating Trend chart with dimension toggles to Analyse tab"
```

---

## Task 8: Final integration check + CHANGELOG

- [x] **Step 1: Full smoke test**

Open the app. Go through each scenario:

| Scenario | Expected |
|---|---|
| Stats → Overview, Pro user, has ratings | All 4 Pro cards visible with data |
| Stats → Overview, Pro user, no ratings | Performance Profile hidden; other 3 cards visible |
| Stats → Overview, free user (set `isDevPremium()` to `false`) | All 4 cards show as blurred locked with upgrade button |
| Stats → Analyse, Pro user, has ratings | Rating trend chart visible, pills work |
| Stats → Analyse, Pro user, no ratings | Rating trend card absent; other 3 charts visible |
| Stats → Analyse, free user | Existing locked preview unchanged |
| Switch language NO ↔ EN | All new section titles update |
| Change season/team filter | All sections re-render with correct filtered data |
| Edit/delete a match | Stats refresh correctly, no double chart renders |

- [x] **Step 2: Update `CHANGELOG.md`**

Add a new entry at the top:

```markdown
## [Unreleased]
### Added
- Stats Overview: Performance Profile Pro card — avg rating per dimension with colour-coded bars
- Stats Overview: Scoring Streaks Pro card — current/best streak, drought, and scoring %
- Stats Overview: Head-to-Head Records Pro card — W/D/L and goals per opponent
- Stats Overview: Monthly Breakdown Pro card — WDL bar and goals per calendar month
- Stats Analyse: Rating Trend chart (Pro) — 6 dimension lines with pill toggles
```

- [x] **Step 3: Final commit**

```bash
git add CHANGELOG.md
git commit -m "docs: update CHANGELOG for stats analysis features"
```
