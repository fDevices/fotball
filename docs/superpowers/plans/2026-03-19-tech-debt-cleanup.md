# Tech Debt Cleanup Implementation Plan

> **Status: COMPLETE — PR open at https://github.com/fDevices/fotball/pull/1 (2026-03-20)**

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Resolve all non-auth-blocked technical debt from CLAUDE.md in four risk-ordered phases: state.js encapsulation, stats.js module split, modal/avatar wiring, and small fixes.

**Architecture:** Risk-ordered: most-breaking changes first (state API), largest refactor second (stats split), medium-risk wiring changes third, low-risk comments/renames last. Each phase ends with a pause checkpoint and commit before the next begins.

**Tech Stack:** Vanilla JS ES modules, no build tool, no test framework. Verification is manual browser smoke-testing.

**Spec:** `docs/superpowers/specs/2026-03-19-tech-debt-cleanup-design.md`

---

## Pre-flight: Understand the codebase

- [x] Read `js/state.js`, `js/stats.js` (all of it), `js/modal.js`, `js/log.js`, `js/export.js`, `js/assessment.js`, `js/utils.js`, `js/main.js`, `js/settings.js`, `js/teams.js`, `js/navigation.js`
- [x] Read `CLAUDE.md` (especially the debt table and critical conventions)

---

## Task 1: Phase 1 — state.js private API

**Files:**
- Modify: `js/state.js`
- Modify: `js/stats.js` (temporary — will be split in Task 3–5)
- Modify: `js/modal.js`
- Modify: `js/export.js`
- Modify: `js/log.js`

> Note: `assessment.js` does NOT import from `state.js` — skip it here.

- [x] **Step 1.1 — Update state.js**

Replace the entire file:

```js
import { CACHE_KEY } from './config.js';

var _allMatches = [];

export function getAllMatches() {
  return _allMatches;
}

export function setAllMatches(matches) {
  if (!Array.isArray(matches)) {
    console.warn('setAllMatches: expected array, got', typeof matches);
    return;
  }
  _allMatches = matches;
  try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(matches)); } catch(e) { console.warn('setAllMatches: sessionStorage write failed', e); }
}

export function invalidateMatchCache() {
  _allMatches = [];
  try { sessionStorage.removeItem(CACHE_KEY); } catch(e) { console.warn('invalidateMatchCache: sessionStorage remove failed', e); }
}
```

- [x] **Step 1.2 — Update stats.js imports and usages**

Change import line 2:
```js
// Before:
import { allMatches, setAllMatches } from './state.js';
// After:
import { getAllMatches, setAllMatches } from './state.js';
```

Find all uses of bare `allMatches` in stats.js and replace with `getAllMatches()`. Key locations:
- `loadStats`: `if (!forceRefresh && allMatches.length > 0)` → `getAllMatches().length > 0`
- `renderStats`: `getAllSeasons(allMatches)` and `allMatches.filter(...)` — two occurrences
- `renderAnalyse`: `getAllSeasons(allMatches)`
- `setMatchPage`: two `allMatches.filter(...)` calls
- `setOpponentSearch` / `renderOpponentSearchResults`: `allMatches.filter(...)`

Run a find-in-file for `allMatches` in `stats.js` and confirm zero occurrences remain after replacement.

- [x] **Step 1.3 — Update modal.js**

Change import line 1:
```js
// Before:
import { allMatches, setAllMatches } from './state.js';
// After:
import { getAllMatches, setAllMatches } from './state.js';
```

Four replacement sites (replace `allMatches` with `getAllMatches()`):
- `openEditModal`: `getAllMatches().find(...)`
- `saveEditedMatch`: `setAllMatches(getAllMatches().map(...))`
- `deleteMatch`: `getAllMatches().find(...)`
- `confirmDeleteMatch`: `getAllMatches().filter(...)`

- [x] **Step 1.4 — Update export.js**

Change import line 1:
```js
// Before:
import { allMatches } from './state.js';
// After:
import { getAllMatches } from './state.js';
```

One replacement in `getMatchesForExport()`:
```js
// Before:
if (allMatches.length > 0) return allMatches;
// After:
if (getAllMatches().length > 0) return getAllMatches();
```

- [x] **Step 1.5 — Update log.js**

Change import line 2:
```js
// Before:
import { allMatches, setAllMatches, invalidateMatchCache } from './state.js';
// After:
import { getAllMatches, setAllMatches, invalidateMatchCache } from './state.js';
```

One replacement in `saveMatch()`:
```js
// Before:
setAllMatches([newMatches[0]].concat(allMatches));
// After:
setAllMatches([newMatches[0]].concat(getAllMatches()));
```

- [x] **Step 1.6 — Verify: grep for any remaining `allMatches` imports across all js files**

```bash
grep -rn "import.*allMatches" js/
```

Expected: zero results.

- [x] **Step 1.7 — Smoke test Phase 1**

Open the app in the browser. Verify:
1. Log tab loads (no console errors)
2. Save a match — it appears in Stats
3. Open Stats tab — matches display
4. No `allMatches is not defined` errors in console

- [x] **Step 1.8 — Commit Phase 1**

```bash
git add js/state.js js/stats.js js/modal.js js/export.js js/log.js
git commit -m "refactor: make allMatches private in state.js; add getAllMatches() getter"
```

---

## ⏸ PAUSE CHECKPOINT 1

**Stop here.** Verify the app works correctly before proceeding. Open the app and run the full smoke test from the spec:
1. Log a match — save, check stats update
2. Edit a match — open modal, change, save
3. Delete a match — confirm, check gone
4. Check browser console for errors

**Only continue to Task 2 when the app is working correctly.**

---

## Task 2: Prerequisite for Phase 2 — move getResult to utils.js

`stats-search.js` and `stats-analyse.js` both need `getResult`. It cannot live in `stats-overview.js` because that would create a circular import. The fix: move it to `utils.js` as a pure utility.

**Files:**
- Modify: `js/utils.js`
- Modify: `js/stats.js` (update to import from utils.js)
- Modify: `js/export.js` (currently imports getResult from stats.js)

- [x] **Step 2.1 — Add getResult to utils.js**

Append to `js/utils.js`:

```js
export function getResult(k) {
  if (k.match_type === 'home') return k.home_score > k.away_score ? 'wins' : k.home_score < k.away_score ? 'loss' : 'draw';
  return k.away_score > k.home_score ? 'wins' : k.away_score < k.home_score ? 'loss' : 'draw';
}
```

- [x] **Step 2.2 — Update stats.js to import getResult from utils.js**

In `js/stats.js`, change the import lines at the top:
```js
// Before:
import { esc } from './utils.js';
import { isPremium } from './utils.js';
// After (merge into one line, add getResult):
import { esc, isPremium, getResult } from './utils.js';
```

Then delete the `export function getResult(k)` definition from `stats.js` (lines 83–86).

- [x] **Step 2.3 — Update export.js to import getResult from utils.js**

```js
// Before:
import { esc } from './utils.js';
import { getResult } from './stats.js';
// After:
import { esc, getResult } from './utils.js';
```

Remove the `import { getResult } from './stats.js'` line entirely.

- [x] **Step 2.4 — Verify**

```bash
grep -n "getResult" js/stats.js
```
Expected: `getResult` appears in calls (e.g. `getResult(k)`) but NOT in an `export function getResult` declaration.

```bash
grep -n "from './stats.js'" js/export.js
```
Expected: `export.js` no longer imports from `stats.js` at all (it now only imports from `utils.js`, `supabase.js`, `settings.js`, `profile.js`, `toast.js`, `i18n.js`).

- [x] **Step 2.5 — Quick smoke test**

Open app, open Stats tab, verify matches display. Check console for errors.

- [x] **Step 2.6 — Rename isPremium → isDevPremium in utils.js**

This must happen now — before creating the new stats modules — because `stats-analyse.js` will import `isDevPremium` directly.

In `js/utils.js`, rename the function and add a comment:
```js
// TODO Phase 4: replace with Stripe subscription check
export function isDevPremium() {
  return true;
}
```

Update call sites immediately:
- `js/stats.js` line 7: `import { isPremium }` → `import { isDevPremium }` and the call site `if (!isPremium())` → `if (!isDevPremium())`
- `js/assessment.js` line 4: `import { isPremium }` → `import { isDevPremium }` and call site `if (context === 'sheet' && !isPremium())` → `!isDevPremium()`

Verify:
```bash
grep -rn "isPremium" js/
```
Expected: zero results.

- [x] **Step 2.7 — Commit**

```bash
git add js/utils.js js/stats.js js/export.js js/assessment.js
git commit -m "refactor: move getResult to utils.js; rename isPremium → isDevPremium — prerequisites for stats split"
```

---

## Task 3: Phase 2a — create stats-search.js

A pure rendering helper for the match history list. No state. No imports from other stats modules.

**Files:**
- Create: `js/stats-search.js`

- [x] **Step 3.1 — Create stats-search.js**

```js
import { getResult, esc } from './utils.js';
import { t } from './i18n.js';
import { getDateLocale } from './settings.js';

var PAGE_SIZE = 20;

function fmtDate(dateStr, opts) {
  return new Date(dateStr).toLocaleDateString(getDateLocale(), opts);
}

function renderMatchList(matches) {
  return matches.map(function(k) {
    var r = getResult(k);
    var resIkon = r === 'wins' ? t('win_short') : r === 'draw' ? t('draw_short') : t('loss_short');
    var date = fmtDate(k.date, { day: '2-digit', month: 'short' });
    var homeTeam = k.match_type === 'home' ? (k.own_team || '') : (k.opponent || '');
    var awayTeam = k.match_type === 'home' ? (k.opponent || '') : (k.own_team || '');
    var tournament = k.tournament ? ' \xb7 ' + esc(k.tournament) : '';
    var goalText = (k.goals || 0) > 0
      ? ' \xb7 ' + k.goals + String.fromCodePoint(9917) + ((k.assists || 0) > 0 ? ' ' + k.assists + String.fromCodePoint(127919) : '')
      : '';
    return '<div class="match-item" data-action="openEditModal" data-id="' + k.id + '">' +
      '<div class="match-result ' + r + '">' + resIkon + '</div>' +
      '<div class="match-info">' +
        '<div class="match-title-row">' +
          '<div class="match-opponent">' + esc(homeTeam) + '</div>' +
          (awayTeam ? '<div class="match-team-name">\xb7 ' + esc(awayTeam) + '</div>' : '') +
        '</div>' +
        '<div class="match-meta">' + date + tournament + goalText + '</div>' +
      '</div>' +
      '<div class="match-score">' + k.home_score + '\u2013' + k.away_score + '</div>' +
      '<div class="match-edit-icon">\u270F\uFE0F</div>' +
    '</div>';
  }).join('');
}

export function renderMatchListPaged(matches, page) {
  var matchPage = page || 0;
  var total = matches.length;
  var totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  if (matchPage >= totalPages) matchPage = totalPages - 1;
  var start = matchPage * PAGE_SIZE;
  var pageMatches = matches.slice(start, start + PAGE_SIZE);
  var html = renderMatchList(pageMatches);
  if (totalPages > 1) {
    var from = start + 1;
    var to = Math.min(start + PAGE_SIZE, total);
    html += '<div class="pagination">' +
      '<button class="page-btn" data-action="setMatchPage" data-page="' + (matchPage - 1) + '" ' + (matchPage === 0 ? 'disabled' : '') + '>' + t('page_prev') + '</button>' +
      '<span class="page-info">' + from + '\u2013' + to + ' ' + t('page_of') + ' ' + total + '</span>' +
      '<button class="page-btn" data-action="setMatchPage" data-page="' + (matchPage + 1) + '" ' + (matchPage >= totalPages - 1 ? 'disabled' : '') + '>' + t('page_next') + '</button>' +
    '</div>';
  }
  return html;
}
```

---

## Task 4: Phase 2b — create stats-analyse.js

Owns chart rendering, `renderFormStreak`, `destroyCharts`, `initChartDefaults`. Pure module — no state.

**Files:**
- Create: `js/stats-analyse.js`

- [x] **Step 4.1 — Create stats-analyse.js**

Copy the following functions out of `stats.js` into the new file. Adapt imports as needed.

```js
import { getAllSeasons, getDateLocale } from './settings.js';
import { getProfile } from './profile.js';
import { getResult, esc, isDevPremium } from './utils.js';
import { t } from './i18n.js';

var CHART_COLORS = {
  lime:     '#a8e063',
  gold:     '#f0c050',
  danger:   '#e05555',
  muted:    '#8a9a80',
  card:     '#162b1a',
  border:   'rgba(168,224,99,0.15)',
  gridLine: 'rgba(168,224,99,0.08)'
};

var chartInstances = {};

function fmtDate(dateStr, opts) {
  return new Date(dateStr).toLocaleDateString(getDateLocale(), opts);
}

export function destroyCharts() {
  Object.values(chartInstances).forEach(function(c) { if (c) c.destroy(); });
  chartInstances = {};
}

export function initChartDefaults() {
  if (typeof Chart === 'undefined') return;
  Chart.defaults.color = CHART_COLORS.muted;
  Chart.defaults.borderColor = CHART_COLORS.gridLine;
  Chart.defaults.font.family = 'Barlow Condensed';
}

export function renderFormStreak(matches) {
  var last10 = matches.slice(0, 10).reverse();
  if (last10.length === 0) {
    return '<div class="stat-row-card form-streak-wrap">' +
      '<div class="stat-row-title">' + t('form_title') + '</div>' +
      '<div class="form-streak-empty">' + t('no_matches_yet') + '</div>' +
    '</div>';
  }
  var boxes = last10.map(function(k) {
    var r = getResult(k);
    var lbl = r === 'wins' ? t('win_short') : r === 'draw' ? t('draw_short') : t('loss_short');
    return '<div class="form-streak-box ' + r + '" title="' + esc(k.opponent) + ' ' + k.home_score + '-' + k.away_score + '">' + lbl + '</div>';
  }).join('');
  return '<div class="stat-row-card form-streak-wrap">' +
    '<div class="stat-row-title">' + t('form_title') + ' (' + t('matches_short') + ': ' + last10.length + ')</div>' +
    '<div class="form-streak-boxes">' + boxes + '</div>' +
  '</div>';
}

export function renderAnalyse(matches) {
  destroyCharts();
  initChartDefaults();

  var container = document.getElementById('stats-content');
  if (!container) return;

  var asc = matches.slice().sort(function(a, b) { return a.date < b.date ? -1 : 1; });

  var allMatches = matches; // matches passed in are already filtered; getAllSeasons needs all — see note below
  // NOTE: renderAnalyse receives already-filtered matches. getAllSeasons call below uses the
  // same filtered set for selector rendering (consistent with current behaviour in stats.js).
  var seasons = getAllSeasons(matches);
  if (!seasons.length) seasons = [String(new Date().getFullYear())];
  var profileTeams = getProfile().team || [];

  // activeLag and activeSeason are read from the container element's data attributes
  // injected by stats-overview.js before calling renderAnalyse. See stats-overview.js for how
  // these are passed. For now, renderAnalyse reads them via parameters (see Task 5).
```

> **STOP — design clarification needed before writing renderAnalyse body.**
>
> `renderAnalyse` in `stats.js` reads `activeLag`, `activeSeason`, and `activeTournament` directly as module-level vars. After the split these live in `stats-overview.js`. Since `stats-analyse.js` must NOT import from `stats-overview.js` (would create circular dep), these must be passed as parameters.
>
> **Update the function signature:** `renderAnalyse(matches, activeLag, activeSeason)`. `stats-overview.js` passes them when calling.

Revised `stats-analyse.js` for `renderAnalyse`:

```js
export function renderAnalyse(matches, activeLag, activeSeason) {
  destroyCharts();
  initChartDefaults();

  var container = document.getElementById('stats-content');
  if (!container) return;

  var asc = matches.slice().sort(function(a, b) { return a.date < b.date ? -1 : 1; });

  var seasons = getAllSeasons(matches);
  if (!seasons.length) seasons = [String(new Date().getFullYear())];
  var profileTeams = getProfile().team || [];
  var lag = activeLag || 'all';
  var teamPills = [{ key: 'all', label: t('alle_lag') }].concat(profileTeams.map(function(l) { return { key: l, label: l }; }));

  var selectorHTML =
    '<div class="form-section" style="margin-bottom:8px">' +
      '<div class="season-selector">' +
        seasons.map(function(s) {
          return '<button class="season-pill ' + (s === activeSeason ? 'active' : '') + '" data-action="setSeason" data-season="' + s + '">' + s + '</button>';
        }).join('') +
      '</div>' +
    '</div>' +
    '<div class="form-section" style="margin-bottom:12px">' +
      '<div class="season-selector">' +
        teamPills.map(function(p) {
          return '<button class="season-pill ' + (lag === p.key ? 'active' : '') + '" data-action="setTeamFilter" data-team="' + esc(p.key) + '">' + esc(p.label) + '</button>';
        }).join('') +
      '</div>' +
    '</div>';

  var n = matches.length;
  var teamText = lag === 'all' ? t('all_teams_subtitle') : lag;
  var statsSubEl2 = document.getElementById('stats-sub');
  if (statsSubEl2) statsSubEl2.textContent = n + ' ' + t('matches_short') + ' \xb7 ' + teamText;

  if (!isDevPremium()) {
    container.innerHTML = selectorHTML + renderFormStreak(matches) +
      '<div class="chart-locked">' +
        '<div class="chart-card" style="filter:blur(3px);pointer-events:none">' +
          '<div class="chart-card-title">' + t('chart_win_pct') + '</div>' +
          '<div class="chart-canvas-wrap" style="height:160px;background:rgba(168,224,99,0.04);border-radius:8px"></div>' +
        '</div>' +
        '<div class="chart-locked-overlay">' +
          '<div class="chart-locked-icon">\u{1F512}</div>' +
          '<div class="chart-locked-text">' + t('pro_feature') + '</div>' +
          '<div class="chart-locked-sub">' + t('pro_upgrade_text') + '</div>' +
          '<button class="chart-unlock-btn" data-action="showProToast">' + t('pro_unlock_btn') + '</button>' +
        '</div>' +
      '</div>';
    return;
  }

  if (n === 0) {
    container.innerHTML = selectorHTML + '<div class="loading">' + t('no_matches_season') + '</div>';
    return;
  }

  container.innerHTML = selectorHTML +
    renderFormStreak(matches) +
    '<div class="chart-card" id="chart-card-winpct">' +
      '<div class="chart-card-title">' + t('chart_win_pct') + '</div>' +
      '<div class="chart-canvas-wrap"><canvas id="chart-winpct" height="180"></canvas></div>' +
    '</div>' +
    '<div class="chart-card" id="chart-card-goals">' +
      '<div class="chart-card-title">' + t('chart_goals_assists') + '</div>' +
      '<div class="chart-canvas-wrap"><canvas id="chart-goals" height="180"></canvas></div>' +
    '</div>' +
    '<div class="chart-card" id="chart-card-tournament">' +
      '<div class="chart-card-title">' + t('chart_goals_tourn') + '</div>' +
      '<div class="chart-canvas-wrap" id="chart-tournament-wrap"><canvas id="chart-tournament"></canvas></div>' +
    '</div>';

  if (typeof Chart === 'undefined') {
    container.querySelectorAll('.chart-canvas-wrap').forEach(function(el) {
      el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--muted);font-size:13px">' + t('loading_charts') + '</div>';
    });
    return;
  }

  var labels1 = [], winPctData = [], wins1 = 0;
  asc.forEach(function(k, i) {
    if (getResult(k) === 'wins') wins1++;
    labels1.push(fmtDate(k.date, { day: '2-digit', month: 'short' }));
    winPctData.push(Math.round((wins1 / (i + 1)) * 100));
  });
  chartInstances['winpct'] = new Chart(document.getElementById('chart-winpct'), {
    type: 'line',
    data: { labels: labels1, datasets: [{ label: t('chart_win_pct'), data: winPctData, borderColor: CHART_COLORS.lime, backgroundColor: 'rgba(168,224,99,0.08)', borderWidth: 2, pointRadius: asc.length > 20 ? 0 : 3, pointHoverRadius: 5, pointBackgroundColor: CHART_COLORS.lime, fill: true, tension: 0.3 }] },
    options: { responsive: true, plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(ctx) { return ctx.parsed.y + '%'; } } } }, scales: { x: { ticks: { maxRotation: 0, maxTicksLimit: 6, font: { size: 10 } }, grid: { color: CHART_COLORS.gridLine } }, y: { min: 0, max: 100, ticks: { callback: function(v) { return v + '%'; }, stepSize: 25, font: { size: 10 } }, grid: { color: CHART_COLORS.gridLine } } } }
  });

  var labels2 = [], goalData = [], assistData = [];
  asc.forEach(function(k) {
    labels2.push(fmtDate(k.date, { day: '2-digit', month: 'short' }));
    goalData.push(k.goals || 0);
    assistData.push(k.assists || 0);
  });
  chartInstances['goals'] = new Chart(document.getElementById('chart-goals'), {
    type: 'line',
    data: { labels: labels2, datasets: [{ label: t('stat_goals'), data: goalData, borderColor: CHART_COLORS.lime, backgroundColor: 'rgba(168,224,99,0.08)', borderWidth: 2, pointRadius: asc.length > 20 ? 0 : 3, pointHoverRadius: 5, pointBackgroundColor: CHART_COLORS.lime, fill: true, tension: 0.2 }, { label: t('stat_assists'), data: assistData, borderColor: CHART_COLORS.gold, backgroundColor: 'rgba(240,192,80,0.06)', borderWidth: 2, pointRadius: asc.length > 20 ? 0 : 3, pointHoverRadius: 5, pointBackgroundColor: CHART_COLORS.gold, fill: true, tension: 0.2 }] },
    options: { responsive: true, plugins: { legend: { display: true, labels: { color: CHART_COLORS.muted, font: { size: 11, family: 'Barlow Condensed', weight: '700' }, boxWidth: 12, padding: 12 } } }, scales: { x: { ticks: { maxRotation: 0, maxTicksLimit: 6, font: { size: 10 } }, grid: { color: CHART_COLORS.gridLine } }, y: { min: 0, ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: CHART_COLORS.gridLine } } } }
  });

  var tournMap = {};
  matches.forEach(function(k) {
    var tn = k.tournament || '\u2014';
    if (!tournMap[tn]) tournMap[tn] = { g: 0, a: 0 };
    tournMap[tn].g += k.goals   || 0;
    tournMap[tn].a += k.assists || 0;
  });
  var tournKeys = Object.keys(tournMap).sort(function(a, b) { return tournMap[b].g - tournMap[a].g; });
  var barHeight = Math.max(120, tournKeys.length * 44);
  document.getElementById('chart-tournament-wrap').style.height = barHeight + 'px';
  chartInstances['tournament'] = new Chart(document.getElementById('chart-tournament'), {
    type: 'bar',
    data: { labels: tournKeys, datasets: [{ label: t('stat_goals'), data: tournKeys.map(function(k) { return tournMap[k].g; }), backgroundColor: 'rgba(168,224,99,0.6)', borderColor: CHART_COLORS.lime, borderWidth: 1, borderRadius: 4 }, { label: t('stat_assists'), data: tournKeys.map(function(k) { return tournMap[k].a; }), backgroundColor: 'rgba(240,192,80,0.5)', borderColor: CHART_COLORS.gold, borderWidth: 1, borderRadius: 4 }] },
    options: { indexAxis: 'y', responsive: true, maintainAspectRatio: false, plugins: { legend: { display: true, labels: { color: CHART_COLORS.muted, font: { size: 11, family: 'Barlow Condensed', weight: '700' }, boxWidth: 12, padding: 12 } } }, scales: { x: { ticks: { stepSize: 1, font: { size: 10 } }, grid: { color: CHART_COLORS.gridLine } }, y: { ticks: { font: { size: 11 } }, grid: { display: false } } } }
  });
}
```

---

## Task 5: Phase 2c — create stats-overview.js

This is the main stats module. It takes everything from `stats.js` that isn't in `stats-analyse.js` or `stats-search.js`.

**Files:**
- Create: `js/stats-overview.js`

- [x] **Step 5.1 — Create stats-overview.js**

The file should contain everything from `stats.js` **except**:
- `CHART_COLORS`, `chartInstances`, `destroyCharts`, `initChartDefaults`, `renderFormStreak`, `renderAnalyse` → moved to `stats-analyse.js`
- `renderMatchList`, `renderMatchListPaged` (private) → moved to `stats-search.js`
- `getResult` → moved to `utils.js`

Key changes when writing `stats-overview.js`:

**Imports:**
```js
import { fetchKamper } from './supabase.js';
import { getAllMatches, setAllMatches } from './state.js';
import { getSettings, getAllSeasons, getDateLocale } from './settings.js';
import { getProfile } from './profile.js';
import { t } from './i18n.js';
import { esc, getResult } from './utils.js';
import { renderAnalyse, destroyCharts, renderFormStreak } from './stats-analyse.js';
import { renderMatchListPaged } from './stats-search.js';
```

**Exported state vars** (unchanged from stats.js lines 9–14):
```js
export var activeStatsView = 'overview';
export var activeLag = 'all';
export var activeSeason = getSettings().activeSeason || String(new Date().getFullYear());
export var activeTournament = 'all';
export var matchPage = 0;
export var opponentSearch = '';
```

**Private helpers** (copy verbatim from stats.js):
- `matchesTeamFilter(k, lag)`
- `getSeasonBaseYear(season)`
- `renderHomeAwaySection(matches)` — uses `calcWDL`, `t`, `esc`
- `renderTournamentSection(matches)` — uses `calcWDL`, `esc`, `t`
- `renderOpponentSearchResults(container)` — uses `getAllMatches()`, `matchesTeamFilter`, `calcWDL`, `renderMatchListPaged`, `t`, `esc`; when calling `renderMatchListPaged` pass current `matchPage`

**Exported functions** (copy from stats.js, adapt as needed):
- `export function calcWDL(matchArr)` — unchanged
- `export function destroyCharts` — NOT here, imported from stats-analyse.js and re-exported for main.js:
  ```js
  export { destroyCharts, initChartDefaults } from './stats-analyse.js';
  ```
  Wait — this creates a circular export path. Better: `main.js` imports `destroyCharts` from `stats-analyse.js` directly. Do NOT re-export.

- `export function switchStatsView(view)` — same as stats.js but `renderAnalyse` call becomes `renderAnalyse(matches, activeLag, activeSeason)`. However `switchStatsView` doesn't have `matches` context. Look at current code: `switchStatsView` calls `renderStats()`, which internally handles the analyse branch. Keep this pattern: `switchStatsView` just sets state and calls `renderStats()`. `renderStats()` handles the `analyse` branch by calling `renderAnalyse(filteredMatches, activeLag, activeSeason)`.

- `export async function loadStats(forceRefresh)` — replace `allMatches` with `getAllMatches()`

- `export function renderStats()` — the big one. Changes:
  - Replace `allMatches` with `getAllMatches()`
  - Call `destroyCharts()` (imported from stats-analyse.js)
  - Call `renderFormStreak(matches)` (imported from stats-analyse.js)
  - Call `renderAnalyse(matches, activeLag, activeSeason)` (pass filter state as params)
  - Call `renderMatchListPaged(matches, matchPage)` (imported from stats-search.js, pass matchPage)
  - Remove the `export var CHART_COLORS` line (it's private in stats-analyse.js now)

- `export function setSeason(s)`, `setTeamFilter`, `setTournamentFilter` — unchanged logic, update `renderMatchListPaged` calls to pass `matchPage`

- `export function setMatchPage(page)`:
  - Same logic as stats.js but call `renderMatchListPaged(matches, matchPage)` with explicit page param
  - Replace `allMatches` with `getAllMatches()`

- `export function setOpponentSearch(val)`:
  - Same logic, replace `allMatches` → `getAllMatches()`
  - `renderOpponentSearchResults` stays private here

---

## Task 6: Phase 2d — update main.js, delete stats.js

**Files:**
- Modify: `js/main.js`
- Delete: `js/stats.js`

- [x] **Step 6.1 — Update main.js import line for stats**

```js
// Before:
import { loadStats, switchStatsView, setSeason, setTeamFilter, setTournamentFilter, setMatchPage, setOpponentSearch, destroyCharts, initChartDefaults } from './stats.js';

// After:
import { loadStats, switchStatsView, setSeason, setTeamFilter, setTournamentFilter, setMatchPage, setOpponentSearch } from './stats-overview.js';
import { destroyCharts, initChartDefaults } from './stats-analyse.js';
```

- [x] **Step 6.2 — Delete stats.js**

```bash
git rm js/stats.js
```

- [x] **Step 6.3 — Verify no remaining imports of stats.js**

```bash
grep -rn "from './stats.js'" js/
```

Expected: zero results.

- [x] **Step 6.4 — Smoke test Phase 2**

Open app in browser. Verify:
1. Stats tab loads — overview cards render, no console errors
2. Switch to Analyse view — charts render
3. Switch back to Oversikt — works
4. Season/team filter pills work
5. Match history list paginates correctly
6. Opponent search works

- [x] **Step 6.5 — Commit Phase 2**

```bash
git add js/stats-overview.js js/stats-analyse.js js/stats-search.js js/main.js
git commit -m "refactor: split stats.js into stats-overview, stats-analyse, stats-search"
```

---

## ⏸ PAUSE CHECKPOINT 2

**Stop here.** Run the full smoke test from the spec. The stats split is the highest-risk change. Verify every stats feature:
1. Oversikt and Analyse views both render, charts display
2. Season / team / tournament filters work in both views
3. Match history paginates (if you have >20 matches)
4. Opponent search finds matches
5. No console errors anywhere

**Only continue to Task 7 when stats are fully working.**

---

## Task 7: Phase 3a — modal.js event decoupling

Replace direct `renderStats()` call with `athlytics:matchesChanged` event.

**Files:**
- Modify: `js/modal.js`
- Modify: `js/main.js`

- [x] **Step 7.1 — Update modal.js**

Remove `renderStats` from the import:
```js
// Before:
import { renderStats } from './stats.js';
// Remove this line entirely (stats.js is gone; modal.js should not depend on stats)
```

In `saveEditedMatch()`, replace:
```js
closeModal();
renderStats();
showToast(t('toast_match_updated'), 'success');
```
With:
```js
closeModal();
document.dispatchEvent(new CustomEvent('athlytics:matchesChanged'));
showToast(t('toast_match_updated'), 'success');
```

In `confirmDeleteMatch()`, replace:
```js
closeModal();
renderStats();
showToast(t('toast_match_deleted'), 'success');
```
With:
```js
closeModal();
document.dispatchEvent(new CustomEvent('athlytics:matchesChanged'));
showToast(t('toast_match_deleted'), 'success');
```

- [x] **Step 7.2 — Add athlytics:matchesChanged listener in main.js**

In `main.js`, after the existing `athlytics:loadStats` listener (around line 160), add:

```js
document.addEventListener('athlytics:matchesChanged', function() {
  // Fired by modal.js after save/delete — force re-fetch from Supabase
  loadStats(true);
});
```

- [x] **Step 7.3 — Verify**

Open app, edit a match, save. Stats tab should update. Delete a match, confirm — stats should update. No `renderStats is not defined` errors.

---

## Task 8: Phase 3b — avatar upload migration

Remove the last `on*` attribute and `window._uploadImage` global.

**Files:**
- Modify: `index.html`
- Modify: `js/main.js`

- [x] **Step 8.1 — Find avatar input in HTML**

```bash
grep -n "uploadImage\|avatar" index.html | head -20
```

- [x] **Step 8.2 — Update avatar input**

Find the avatar file input. It will look like:
```html
<input type="file" ... onchange="window._uploadImage(this)" ...>
```
Change to:
```html
<input type="file" ... data-action="uploadImage" ...>
```
Remove the `onchange` attribute entirely. Keep all other attributes (`accept`, `id`, etc.).

- [x] **Step 8.3 — Add change delegator in main.js**

In `setupEventDelegation()` in `main.js`, after the existing `input` event listener, add:

```js
document.addEventListener('change', function(e) {
  var el = e.target.closest('input[data-action]');
  if (!el) return;
  if (el.dataset.action === 'uploadImage') uploadImage(el);
});
```

- [x] **Step 8.4 — Remove window._uploadImage from main.js**

Find and delete these two lines:
```js
// Expose uploadImage globally for avatar onchange handler
window._uploadImage = uploadImage;
```

- [x] **Step 8.5 — Verify**

Open app. Go to Profile tab. Select an image file for avatar. Confirm avatar updates. Open browser console — confirm `window._uploadImage` is `undefined`. Confirm no `onchange` attribute on the avatar input in DevTools Elements panel.

- [x] **Step 8.6 — Commit Phase 3**

```bash
git add js/modal.js js/main.js index.html
git commit -m "refactor: decouple modal from renderStats via event; migrate avatar upload to delegated change listener"
```

---

## ⏸ PAUSE CHECKPOINT 3

**Stop here.** Verify:
1. Edit a match → stats refresh
2. Delete a match → stats refresh
3. Upload avatar → updates without page reload
4. `window._uploadImage` is undefined in console
5. No `onchange` on avatar input (check DevTools Elements)

---

## Task 9: Phase 4 — small fixes sweep

Low-risk, targeted. Each sub-task is independent.

**Files:**
- Modify: `js/utils.js`
- Modify: `js/stats-overview.js`
- Modify: `js/assessment.js`
- Modify: `js/teams.js`
- Modify: `js/settings.js`
- Modify: `js/navigation.js`
- Modify: `js/log.js`
- Modify: `js/main.js`

- [x] **Step 9.0 — Fix split-season date filtering (functional bug)**

**The bug:** `getSeasonBaseYear('2025–2026')` returns `'2025'`. Filtering with `k.date.startsWith('2025')` silently drops all matches played in 2026 (the second half of the season) — affects both the stats view and CSV/PDF export.

**Fix in `js/stats.js` (and later `js/stats-overview.js`):**

Replace `getSeasonBaseYear`:
```js
function matchesSeason(k, season) {
  var base = parseInt(season.split(/[–\-]/)[0].trim(), 10);
  var year = parseInt((k.date || '').slice(0, 4), 10);
  // Split-season format (e.g. 2025–2026): include both years
  if (/[–\-]/.test(season)) return year === base || year === base + 1;
  // Single-year format: direct startsWith match
  return (k.date || '').startsWith(season);
}
```

Replace both season filter calls in `stats.js` (lines ~150 and ~338):
```js
// Before:
var seasonMatches = allMatches.filter(function(k) { return k.date.startsWith(getSeasonBaseYear(activeSeason)); });
// After:
var seasonMatches = getAllMatches().filter(function(k) { return matchesSeason(k, activeSeason); });
```

Delete `getSeasonBaseYear()` — it is replaced by `matchesSeason()`.

**Fix in `js/export.js`:**

Replace `getActiveSeasonMatches()`:
```js
function getActiveSeasonMatches(all, s) {
  var season = s.activeSeason || String(new Date().getFullYear());
  var base = parseInt(season.split(/[–\-]/)[0].trim(), 10);
  var matches = all.filter(function(k) {
    if (!k.date) return false;
    var year = parseInt(k.date.slice(0, 4), 10);
    if (/[–\-]/.test(season)) return year === base || year === base + 1;
    return k.date.startsWith(season);
  });
  return { matches: matches, season: season };
}
```

**Verify:**
```bash
grep -n "getSeasonBaseYear\|startsWith.*activeSeason\|startsWith.*baseYear" js/stats.js js/export.js
```
Expected: zero results.

Manual test: if you have any matches dated in 2026 under a `2025–2026` season, they should now appear in both stats and export.

- [x] **Step 9.1 — Verify isDevPremium rename is complete (done in Task 2)**

```bash
grep -rn "isPremium" js/
```
Expected: zero results. If any remain (e.g. in `stats-analyse.js` after its creation), fix them now.

- [x] **Step 9.2 — teams.js: convert renderTeamDropdown to DOM API**

Open `js/teams.js`. Find `renderTeamDropdown()`. It currently builds an HTML string and sets `innerHTML`. Rewrite it to use DOM API, matching the pattern used by `renderTournamentDropdown()` in the same file.

Read `renderTournamentDropdown()` first to understand the target pattern, then rewrite `renderTeamDropdown()` to match it.

- [x] **Step 9.3 — Extract shared clamp helper to utils.js; update log.js and modal.js**

`adjust()` in `log.js` and `modalAdjust()` in `modal.js` duplicate the same goals/assists clamping logic. CLAUDE.md already flags this as a critical invariant — divergence here causes impossible match data bugs. Extract to a shared pure helper.

In `js/utils.js`, add:
```js
// Clamps goals and assists to be valid relative to own team's score.
// Returns { goals, assists } with both clamped to [0, ownScore].
export function clampStats(goals, assists, ownScore) {
  var g = Math.max(0, Math.min(goals, ownScore));
  var a = Math.max(0, Math.min(assists, ownScore - g));
  return { goals: g, assists: a };
}
```

In `js/log.js`, import `clampStats` from `./utils.js` and replace the manual clamping block in `adjust()` with a call to `clampStats(goals, assists, ownScore)`, then write back `goals` and `assists` from the returned object.

In `js/modal.js`, do the same for `modalAdjust()`.

Verify:
```bash
grep -n "Math.min.*goals\|Math.min.*assists" js/log.js js/modal.js
```
Expected: zero results (all clamping now lives in utils.js).

- [x] **Step 9.4 — settings.js: rename renderSettings, export defaultSettings**

In `js/settings.js`:

```js
// Before:
export function renderSettings() {
  document.dispatchEvent(new CustomEvent('athlytics:renderSettings'));
}
// After:
export function requestRenderSettings() {
  // Fires event to break circular dep chain: settings → settings-render → settings
  document.dispatchEvent(new CustomEvent('athlytics:renderSettings'));
}
```

Also find `function defaultSettings()` (it exists but is not exported). Add `export`:
```js
export function defaultSettings() {
  // ... existing body unchanged
}
```

Verify no external files import `renderSettings` from `settings.js` (should be zero):
```bash
grep -rn "renderSettings.*settings\.js\|from.*settings.*renderSettings" js/
```

- [x] **Step 9.5 — navigation.js: add TODO comment**

In `js/navigation.js`, find `updateLogBadge()`. Add a comment above the sport-icon mapping:
```js
// TODO Phase 3: move to SPORT_META map when multi-sport is implemented
```

- [x] **Step 9.6 — log.js: add comment in resetForm**

In `js/log.js`, find `resetForm()`. Add a comment before `renderTeamDropdown()` at the end (or wherever team state is NOT reset):
```js
// Intentional: keeps last selected team for convenience — user often logs multiple matches for the same team
```

- [x] **Step 9.7 — main.js: add bootstrap comments**

In `js/main.js`, add comments at each lazy-init event dispatch point in the cross-module event listeners section:

```js
document.addEventListener('athlytics:renderSettings', function() {
  // Dispatched by settings.js:requestRenderSettings() to break circular dep
  renderSettings();
});

document.addEventListener('athlytics:updateAllText', function() {
  // Dispatched by i18n.js:setLang() after language change
  renderLogSub();
  updateResult();
  updateLogBadge();
});

document.addEventListener('athlytics:loadStats', function() {
  // Dispatched by navigation.js:switchTab() when navigating to stats tab
  loadStats();
});

document.addEventListener('athlytics:destroyCharts', function() {
  // Dispatched by navigation.js:switchTab() when leaving stats tab
  destroyCharts();
});

document.addEventListener('athlytics:matchesChanged', function() {
  // Dispatched by modal.js after save/delete — force re-fetch from Supabase
  loadStats(true);
});
```

- [x] **Step 9.9 — Normalize profile `team` → `teams` field name**

`CLAUDE.md` documents the Supabase column as `teams` (jsonb), but `profile.js` reads `row.team || []` and stores the in-memory profile object under key `team`. If the real DB column is `teams`, fetches silently return `[]` and profile teams are never persisted.

**First — verify the actual column name:**
```bash
grep -n "team" js/profile.js
```
Check `fetchProfileFromSupabase()`: it reads `row.team`. If the DB column is `teams`, this is broken.

**Fix if DB column is `teams`:**
In `profile.js`:
- `fetchProfileFromSupabase()`: `team: row.team || []` → `teams: row.teams || []`
- `saveProfile_local(profil)`: `team: Array.isArray(profil.team)` → `teams: Array.isArray(profil.teams)`
- `saveProfileToSupabase(profil)`: update the upsert body to write `teams: profil.teams`
- `getProfile()` return shape: rename `team` → `teams`

Then update all call sites that read `.team` from the profile:
- `js/stats.js` (and `stats-overview.js` after split): `getProfile().team || []` → `getProfile().teams || []`
- `js/teams.js`: all `profil.team` references → `profil.teams`
- `js/main.js` line ~202: `p.favoriteTeam && p.team.includes(...)` → `p.teams.includes(...)`

Verify:
```bash
grep -rn "\.team\b" js/
```
Expected: only legitimate matches (like `data-team`, `setTeamFilter`), no `.team` property access on profile objects.

Update localStorage key contract in `CLAUDE.md` if needed (currently shows `teams[]` which suggests `teams` is correct).

- [x] **Step 9.8 — Document favorite-selection side effect in teams.js**

`setFavoriteTeam()` and `setFavoriteTournament()` both call `selectTeam()`/`selectTournament()` as a side effect — marking a favorite also changes the active working selection. This is a product decision hidden inside a persistence action. Add an explicit comment so future contributors understand it is intentional, not accidental.

In `js/teams.js`, find `setFavoriteTeam()` and add above the `selectTeam()` call:
```js
// Intentional: marking a favorite also activates it as the current filter selection
```

Find `setFavoriteTournament()` and add the same comment above `selectTournament()`.

If the behavior is NOT intentional, separate the two concerns instead: remove the `selectTeam/selectTournament` call and let the user's current selection remain unchanged.

- [x] **Step 9.10 — Commit Phase 4**

```bash
git add js/utils.js js/stats-overview.js js/stats-analyse.js js/assessment.js js/teams.js js/settings.js js/navigation.js js/log.js js/main.js js/export.js
git commit -m "fix: correct split-season filtering; refactor: clamp helper, rename isPremium, standardize team dropdown, add comments"
```

---

## ⏸ PAUSE CHECKPOINT 4

**Stop here.** Quick smoke test:
1. No console errors on load
2. Team dropdown in log form still works (renderTeamDropdown rewrite)
3. Language switch still works (settings.js rename didn't break event chain)
4. Assessment sheet still opens (isDevPremium rename)

---

## Task 10: Update CLAUDE.md

- [x] **Step 10.1 — Mark resolved debt items as ✅ Ferdig**

In `CLAUDE.md`, find the tech debt table entries for:
- `stats.js` too large → mark ✅ Ferdig
- `renderSettings()` rename / `defaultSettings()` export → mark ✅ Ferdig
- `modal.js` tight coupling → mark ✅ Ferdig
- `isPremium()` dev toggle → mark ✅ Ferdig
- `state.js` mutable `allMatches` → mark ✅ Ferdig
- `teams.js` inconsistent render strategy → mark ✅ Ferdig
- Avatar upload `window._uploadImage` / `onchange` → mark ✅ Ferdig (main.js section)

- [x] **Step 10.2 — Add athlytics:matchesChanged to cross-module event list**

In `CLAUDE.md`, in the "Cross-modul events" section, add:
```
- `athlytics:matchesChanged` – dispatched by `modal.js` after save/delete → `loadStats(true)` in main.js
```

- [x] **Step 10.3 — Update settings.js function contract**

In `CLAUDE.md`, in the "Viktige funksjoner" section under `settings.js`, update:
- `renderSettings()` → `requestRenderSettings()`
- Add `defaultSettings()` to the list

- [x] **Step 10.4 — Update filstruktur section**

Update the file list to replace `stats.js` with the three new files:
```
  stats-overview.js     – loadStats(), renderStats(), filter state, stateful pagination/search
  stats-analyse.js      – renderAnalyse(), charts, destroyCharts(), renderFormStreak()
  stats-search.js       – renderMatchListPaged() pure renderer
```

- [x] **Step 10.5 — Commit CLAUDE.md update**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for tech debt cleanup — mark resolved items, new event, updated contracts"
```

---

## Final: Run full smoke test from spec

- [x] Log a match — save succeeds, stats tab updates, form resets with team preserved
- [x] Edit a match — open modal, change score, save → stats tab refreshes
- [x] Delete a match — confirm delete → match gone, stats updated
- [x] Switch language — settings re-render correctly in both Norwegian and English
- [x] Upload avatar — updates; confirm no `onchange` in HTML DevTools, `window._uploadImage` undefined
- [x] Stats tab — Oversikt and Analyse views both render, charts display, no console errors
- [x] Filter by season/team/tournament — results update correctly
- [x] Assessment sheet — opens after saving match, ratings save on match edit

**Structural checks:**
```bash
# allMatches no longer exported from state.js
grep -n "export.*allMatches" js/state.js    # expected: 0 results

# stats.js no longer exists
ls js/stats.js    # expected: No such file

# window._uploadImage gone
grep -n "_uploadImage" js/main.js    # expected: 0 results

# isPremium gone, replaced by isDevPremium
grep -rn "isPremium" js/    # expected: 0 results

# isDevPremium present in both files
grep -rn "isDevPremium" js/    # expected: utils.js, stats-analyse.js, assessment.js
```

- [x] **Final commit (if CLAUDE.md not already committed)**

```bash
git add CHANGELOG.md CLAUDE.md
git commit -m "chore: log tech debt cleanup in CHANGELOG"
```
