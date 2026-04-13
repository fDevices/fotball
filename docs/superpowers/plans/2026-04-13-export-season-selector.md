# Export Season Selector Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an inline season dropdown to the export card so users can choose any season — or all seasons — before exporting CSV or PDF.

**Architecture:** A `<select>` element is inserted into the export card HTML and populated by `renderSettings()` in `settings-render.js`. Both `exportCSV()` and `exportPDF()` read from that element at call time. The dropdown value is ephemeral — it is never persisted to settings or localStorage.

**Tech Stack:** Vanilla JS ES modules, plain CSS (no Tailwind on this feature — consistent with other dynamic elements in `style.css`), no new dependencies.

---

## File Map

| File | Change |
|------|--------|
| `app.html` | Add `.export-season-row` div (label + select) between export description and buttons |
| `style.css` | Add styles for `.export-season-row` and `#export-season-select` |
| `js/i18n.js` | Add `export_all_seasons` key (no + en) |
| `js/settings-render.js` | Populate `#export-season-select` inside `renderSettings()` |
| `js/export.js` | Replace `getActiveSeasonMatches` with `resolveExportScope` + `buildYearRange` |

---

## Task 1: Add i18n key for "All seasons"

**Files:**
- Modify: `js/i18n.js`

- [ ] **Step 1: Add Norwegian key**

In `js/i18n.js`, find the line:
```js
    export_season:'Sesong',
```
Add the new key immediately after it:
```js
    export_season:'Sesong',
    export_all_seasons:'Alle sesonger',
```

- [ ] **Step 2: Add English key**

Find the English equivalent (search for `export_season:'Season'`):
```js
    export_season:'Season',
```
Add immediately after:
```js
    export_season:'Season',
    export_all_seasons:'All seasons',
```

- [ ] **Step 3: Commit**

```bash
git add js/i18n.js
git commit -m "feat(export): add export_all_seasons i18n key"
```

---

## Task 2: Add season row HTML to export card

**Files:**
- Modify: `app.html`

- [ ] **Step 1: Insert the season row**

In `app.html`, find the export description paragraph and the buttons div:
```html
      <p class="export-desc text-on-surface-variant text-xs font-body mb-3" data-i18n="export_desc">Download your match history as CSV or PDF.</p>
      <div class="export-btns flex gap-2">
```

Insert the season row between them:
```html
      <p class="export-desc text-on-surface-variant text-xs font-body mb-3" data-i18n="export_desc">Download your match history as CSV or PDF.</p>
      <div class="export-season-row">
        <span data-i18n="export_season">Season</span>
        <select id="export-season-select"></select>
      </div>
      <div class="export-btns flex gap-2">
```

Note: `data-i18n="export_season"` reuses the existing key ("Sesong"/"Season") — no new key needed for this label.

- [ ] **Step 2: Commit**

```bash
git add app.html
git commit -m "feat(export): add season selector row to export card"
```

---

## Task 3: Style the season row and select

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Add CSS**

Find a logical place in `style.css` near other export styles (search for `.export-btn` or `.export-section`). Add after that block:

```css
.export-season-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.export-season-row span {
  font-size: 11px;
  color: var(--muted);
  white-space: nowrap;
}

#export-season-select {
  flex: 1;
  background: var(--elevated);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  color: var(--white);
  font-size: 13px;
  font-family: inherit;
  padding: 7px 10px;
  cursor: pointer;
  outline: none;
}

#export-season-select:focus {
  border-color: rgba(0, 242, 255, 0.5);
}
```

- [ ] **Step 2: Verify visually**

Open the app, go to Settings tab. The export card should show a "Season" label with a dark-themed select box between the description text and the CSV/PDF buttons. The select is empty at this point — that's expected until Task 4.

- [ ] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat(export): style export season selector"
```

---

## Task 4: Populate the dropdown in renderSettings()

**Files:**
- Modify: `js/settings-render.js`

- [ ] **Step 1: Add population logic**

In `js/settings-render.js`, find the end of `renderSettings()`:
```js
  renderActiveSeasonPills();
  initDangerZone();
}
```

Insert the population block immediately before `renderActiveSeasonPills()`:
```js
  var exportSeasonSel = document.getElementById('export-season-select');
  if (exportSeasonSel) {
    var exportSeasons = getAllSeasons(getAllMatches());
    exportSeasonSel.innerHTML = '';
    var allOpt = document.createElement('option');
    allOpt.value = 'all';
    allOpt.textContent = t('export_all_seasons');
    exportSeasonSel.appendChild(allOpt);
    exportSeasons.forEach(function(season) {
      var opt = document.createElement('option');
      opt.value = season;
      opt.textContent = season;
      exportSeasonSel.appendChild(opt);
    });
    var activeS = s.activeSeason || String(new Date().getFullYear());
    exportSeasonSel.value = exportSeasons.includes(activeS) ? activeS : (exportSeasons[exportSeasons.length - 1] || 'all');
  }

  renderActiveSeasonPills();
  initDangerZone();
}
```

Note: `s`, `getAllSeasons`, `getAllMatches`, and `t` are all already imported and available in this function.

- [ ] **Step 2: Verify**

Open the app, go to Settings. The season dropdown should now show "All seasons" + one option per season from your match data. The active season should be pre-selected.

- [ ] **Step 3: Commit**

```bash
git add js/settings-render.js
git commit -m "feat(export): populate export season dropdown in renderSettings"
```

---

## Task 5: Update export.js to use the dropdown

**Files:**
- Modify: `js/export.js`

- [ ] **Step 1: Replace helper functions**

In `js/export.js`, find and remove the entire `getActiveSeasonMatches` function:
```js
function getActiveSeasonMatches(all, s) {
  var season = s.activeSeason || String(new Date().getFullYear());
  return { matches: all.filter(function(k) { return matchesSeason(k, season); }), season: season };
}
```

Replace it with two new functions:
```js
function buildYearRange(matches) {
  var years = matches.map(function(k) { return parseInt((k.date || '').slice(0, 4), 10); }).filter(Boolean);
  if (!years.length) return String(new Date().getFullYear());
  var min = Math.min.apply(null, years);
  var max = Math.max.apply(null, years);
  return min === max ? String(min) : min + '\u2013' + max;
}

function resolveExportScope(all) {
  var sel = document.getElementById('export-season-select');
  var value = sel ? sel.value : '';
  if (!value || value === 'all') {
    return { matches: all, season: 'all', label: buildYearRange(all) };
  }
  return {
    matches: all.filter(function(k) { return matchesSeason(k, value); }),
    season: value,
    label: t('export_season') + ' ' + value
  };
}
```

- [ ] **Step 2: Update exportCSV()**

Find `exportCSV()`. Remove `var s = getSettings();` and replace `getActiveSeasonMatches(all, s)` with `resolveExportScope(all)`:

```js
export async function exportCSV() {
  showToast(t('export_fetching'), 'info');
  var all = await getMatchesForExport();
  var result = resolveExportScope(all);
  if (!result.matches.length) { showToast(t('export_no_matches'), 'error'); return; }
  var header = [t('date'), t('home_label'), t('away_label'), t('export_tournament'),
    t('export_h_score'), t('export_a_score'), t('stat_goals'), t('stat_assists'), t('result_label')].join(',');
  var lines = [header];
  result.matches.forEach(function(k) {
    var resLabel = buildMatchResultLabel(k);
    var teams = buildHomeAwayTeams(k);
    function csvEsc(v) { var str = String(v || ''); return str.includes(',') ? '"' + str.replace(/"/g, '""') + '"' : str; }
    lines.push([
      csvEsc(k.date), csvEsc(teams.homeTeam), csvEsc(teams.awayTeam), csvEsc(k.tournament),
      k.home_score || 0, k.away_score || 0, k.goals || 0, k.assists || 0,
      csvEsc(resLabel)
    ].join(','));
  });
  var blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url; a.download = 'athlytics-' + result.season + '.csv';
  a.click(); URL.revokeObjectURL(url);
  showToast(t('export_csv_done'), 'success');
}
```

- [ ] **Step 3: Update exportPDF()**

Find `exportPDF()`. Remove `var s = getSettings();` and replace `getActiveSeasonMatches(all, s)` with `resolveExportScope(all)`. Also update the PDF `<title>` and `<h2>` to use `result.label`:

```js
export async function exportPDF() {
  showToast(t('export_fetching'), 'info');
  var all = await getMatchesForExport();
  var result = resolveExportScope(all);
  if (!result.matches.length) { showToast(t('export_no_matches'), 'error'); return; }
  var profil = getProfile();
  var matches = result.matches;
  var locale = getDateLocale();

  var w = 0, d = 0, l = 0, g = 0, a = 0;
  matches.forEach(function(k) {
    var r = getResult(k);
    if (r === 'wins') w++; else if (r === 'draw') d++; else l++;
    g += k.goals || 0; a += k.assists || 0;
  });
  var n = matches.length;
```

Then find the `<title>` and `<h2>` lines in the HTML string and update them:
```js
  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
    '<title>Athlytics \u2013 ' + result.label + '</title>' +
```
```js
    '<h2>' + esc(result.label) + (profil.club ? ' \xb7 ' + esc(profil.club) : '') + '</h2>' +
```

The `<h2>` no longer prepends `t('export_season') + ' '` — the label already contains "Season 2025" for specific seasons, or "2024–2026" for all seasons.

Also remove the now-unused `var season = result.season;` line if it was only used for the title/heading (verify: `season` was also used in `a.download` for CSV but not in PDF).

- [ ] **Step 4: Remove unused getSettings import if applicable**

Check whether `getSettings` is still imported in `export.js` (it was used only for `getActiveSeasonMatches`). If no other code in the file uses it, remove it from the import line:

```js
import { getDateLocale } from './settings.js';
```

(Remove `getSettings` from that import, keeping `getDateLocale`.)

- [ ] **Step 5: Verify CSV export**

Open the app → Settings → Export. Select "2025" from the dropdown. Click CSV. File should download as `athlytics-2025.csv` with only 2025 matches.

Select "All seasons". Click CSV. File should download as `athlytics-all.csv` with all matches.

- [ ] **Step 6: Verify PDF export**

Select a specific season (e.g. "2025"). Click PDF. Print dialog opens. The subheading should read "Season 2025" (or "Sesong 2025" in Norwegian).

Select "All seasons". Click PDF. The subheading should read the year range, e.g. "2024–2026".

- [ ] **Step 7: Commit**

```bash
git add js/export.js
git commit -m "feat(export): add season selector — export any season or all seasons"
```

---

## Task 6: Verify language switching

- [ ] **Step 1: Switch to English**

Go to Settings → language → English. Go back to the export card. The dropdown should show "All seasons" (not "Alle sesonger"). Switch back to Norwegian — should show "Alle sesonger".

This works automatically because the dropdown is repopulated on every `renderSettings()` call, which is triggered by `setLang()` via the `athlytics:renderSettings` event.

- [ ] **Step 2: Final commit if any fixes needed**

If language switching revealed a bug, fix it and commit. Otherwise no action needed.
