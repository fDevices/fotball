# Tech Debt Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Eliminate three categories of tech debt: Norwegian enum values stored in localStorage/Supabase, Norwegian function names in `supabase.js`, and missing keyboard navigation for custom dropdowns.

**Architecture:** Three independent tasks. Task 1 (enum rename) requires a Supabase SQL migration to run before the code deploy. Tasks 2 and 3 are pure code changes with no data migration. No new modules — all changes are surgical edits to existing files.

**Tech Stack:** Vanilla JS ES modules, browser SPA — no test runner. Verification is manual in the browser. The SQL migration runs in the Supabase dashboard SQL editor.

---

## File Map

| File | Task | Change |
|------|------|--------|
| `js/settings.js` | 1 | Add `migrateSettings()`, update defaults and validations, rename local vars |
| `js/settings-render.js` | 1 | Update ALLOWED_SPORTS, THEMES key, DOM IDs, pill data-values, param names |
| `js/share-viewer.js` | 1 | Update fallback default values |
| `app.html` | 1 | Rename 3 element IDs, update version string |
| `js/main.js` | 1, 3 | Update input ID references (Task 1); extend keydown handler (Task 3) |
| `js/text-refresh.js` | 1 | Update placeholder ID map |
| `js/supabase.js` | 2 | Rename 8 exported functions, delete 1 dead function |
| `js/log.js` | 2 | Update import |
| `js/modal.js` | 2 | Update import |
| `js/assessment.js` | 2 | Update import |
| `js/stats-overview.js` | 2 | Update import |
| `js/export.js` | 2 | Update import |
| `js/profile.js` | 2 | Update import |
| `js/settings.js` | 2 | Update import (also modified in Task 1) |
| `style.css` | 3 | Add `.dropdown-highlight` rule |
| `js/teams.js` | 3 | Clear highlight in `closeAllDropdowns()` |

---

## ✅ Pre-deploy SQL migration — verified not needed

The following SQL was prepared but verified unnecessary on 2026-03-27: `SELECT COUNT(*) FROM profiles WHERE sport = 'fotball' OR season_format IN ('aar', 'sesong')` returned **0**. No rows needed migrating. The localStorage boot migration in `migrateSettings()` remains in place for any edge cases.

---

## Task 1: Rename Norwegian enum values

### Part A — `js/settings.js`

**Files:**
- Modify: `js/settings.js`

- [ ] **Step 1: Add `migrateSettings()` helper after `defaultSettings()`**

Find line 9 (the closing `}` of `defaultSettings()`). Insert the new function immediately after:

```js
export function defaultSettings() {
  return { sport: 'football', seasonFormat: 'year', activeSeason: '', lang: 'no', extraSeasons: [], dateFormat: 'eu', assessmentEnabled: false };
}

function migrateSettings(s) {
  if (s.sport === 'fotball') s.sport = 'football';
  if (s.seasonFormat === 'aar') s.seasonFormat = 'year';
  if (s.seasonFormat === 'sesong') s.seasonFormat = 'season';
  return s;
}
```

- [ ] **Step 2: Call `migrateSettings` in `getSettings()`**

Replace the current `getSettings` body:

```js
export function getSettings() {
  if (_settingsCache) return _settingsCache;
  try { _settingsCache = migrateSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY)) || defaultSettings()); }
  catch(e) { _settingsCache = defaultSettings(); }
  return _settingsCache;
}
```

- [ ] **Step 3: Update `saveSettings()` validations**

Replace the current `saveSettings` body:

```js
export function saveSettings(s) {
  var safe = Object.assign({}, defaultSettings(), migrateSettings(s));
  if (!['no', 'en'].includes(safe.lang)) safe.lang = 'no';
  if (!['year', 'season'].includes(safe.seasonFormat)) safe.seasonFormat = 'year';
  if (!['football', 'orientering', 'ski'].includes(safe.sport)) safe.sport = 'football';
  if (!Array.isArray(safe.extraSeasons)) safe.extraSeasons = [];
  if (typeof safe.activeSeason !== 'string') safe.activeSeason = '';
  if (!['eu', 'us'].includes(safe.dateFormat)) safe.dateFormat = 'eu';
  if (typeof safe.assessmentEnabled !== 'boolean') safe.assessmentEnabled = false;
  _settingsCache = safe;
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(safe));
  saveSettingsToSupabase(safe);
}
```

- [ ] **Step 4: Update `buildSeasonLabel()` — rename param and value**

Replace:

```js
export function buildSeasonLabel(aar, format) {
  if (!aar) return '';
  if (format === 'sesong') { var y = parseInt(aar); return y + '\u2013' + (y + 1); }
  return String(aar);
}
```

With:

```js
export function buildSeasonLabel(year, format) {
  if (!year) return '';
  if (format === 'season') { var y = parseInt(year); return y + '\u2013' + (y + 1); }
  return String(year);
}
```

- [ ] **Step 5: Update `getAllSeasons()` — rename local vars**

Replace the function:

```js
export function getAllSeasons(allMatches) {
  var s = getSettings();
  var extra = s.extraSeasons || [];
  var fromMatches = [];
  if (allMatches) {
    allMatches.forEach(function(k) {
      var year = k.date ? k.date.substring(0, 4) : null;
      if (year && !fromMatches.includes(year)) fromMatches.push(year);
    });
  }
  var seasons = [];
  fromMatches.concat(extra).forEach(function(year) {
    var label = buildSeasonLabel(year, s.seasonFormat);
    if (!seasons.includes(label)) seasons.push(label);
  });
  return seasons.sort(function(a, b) { return parseInt(a) - parseInt(b); });
}
```

- [ ] **Step 6: Commit**

```bash
git add js/settings.js
git commit -m "feat(settings): rename Norwegian enum values to English, add migration"
```

---

### Part B — `js/settings-render.js`

**Files:**
- Modify: `js/settings-render.js`

- [ ] **Step 1: Update `ALLOWED_SPORTS` and `THEMES`**

Replace lines 5–11:

```js
const ALLOWED_SPORTS = ['football', 'orientering', 'ski'];

const THEMES = {
  football:    { grass: '#1a3a1f', lime: '#a8e063', card: '#162b1a' },
  orientering: { grass: '#1a2a3a', lime: '#63b8e0', card: '#162130' },
  ski:         { grass: '#1a1a3a', lime: '#a0a8e0', card: '#161628' }
};
```

- [ ] **Step 2: Update `applyTheme()` fallback key**

Replace:

```js
  var th = THEMES[sport] || THEMES.fotball;
```

With:

```js
  var th = THEMES[sport] || THEMES.football;
```

- [ ] **Step 3: Update sport pills in `renderSettings()`**

Find the sport pill array and replace `'fotball'` with `'football'`:

```js
    [{ key: 'football', label: t('sport_fotball'), soon: false }, { key: 'orientering', label: t('sport_ori'), soon: true }, { key: 'ski', label: t('sport_ski'), soon: true }].forEach(function(sp) {
      var btn = document.createElement('button');
      btn.className = 'settings-pill' + (sp.soon ? ' soon' : '') + (s.sport === sp.key ? ' active' : '');
      btn.innerHTML = sp.label + (sp.soon ? ' <span style="font-size:10px">(' + t('snart') + ')</span>' : '');
      if (!sp.soon) {
        btn.dataset.action = 'setSport';
        btn.dataset.sport = sp.key;
      }
      sportEl.appendChild(btn);
    });
```

- [ ] **Step 4: Update season format element ID and pill keys in `renderSettings()`**

Replace:

```js
  var sfEl = document.getElementById('settings-sesong-options');
  if (sfEl) {
    sfEl.innerHTML = '';
    [{ key: 'aar', label: t('format_aar') }, { key: 'sesong', label: t('format_season') }].forEach(function(f) {
```

With:

```js
  var sfEl = document.getElementById('settings-season-format-options');
  if (sfEl) {
    sfEl.innerHTML = '';
    [{ key: 'year', label: t('format_aar') }, { key: 'season', label: t('format_season') }].forEach(function(f) {
```

- [ ] **Step 5: Update active season element ID in `renderActiveSeasonPills()`**

Replace:

```js
  var el = document.getElementById('settings-aktiv-sesong-options');
```

With:

```js
  var el = document.getElementById('settings-active-season-options');
```

Also rename the loop variable `sesong` → `season` in the same function:

```js
  seasons.forEach(function(season) {
    var btn = document.createElement('button');
    btn.className = 'settings-pill' + (s.activeSeason === season ? ' active' : '');
    btn.textContent = season;
    btn.dataset.action = 'setActiveSeason';
    btn.dataset.season = season;
    el.appendChild(btn);
  });
```

- [ ] **Step 6: Rename param in `setActiveSeason()`**

Replace:

```js
export function setActiveSeason(sesong) {
  var s = getSettings();
  s.activeSeason = (s.activeSeason === sesong) ? '' : sesong;
  saveSettings(s);
  renderActiveSeasonPills();
  updateLogBadge();
  showToast(t('toast_active_season') + (s.activeSeason || t('none')), 'success');
}
```

With:

```js
export function setActiveSeason(season) {
  var s = getSettings();
  s.activeSeason = (s.activeSeason === season) ? '' : season;
  saveSettings(s);
  renderActiveSeasonPills();
  updateLogBadge();
  showToast(t('toast_active_season') + (s.activeSeason || t('none')), 'success');
}
```

- [ ] **Step 7: Update `addSeason()` element ID**

Replace:

```js
  var input = document.getElementById('settings-ny-sesong');
```

With:

```js
  var input = document.getElementById('settings-new-season');
```

- [ ] **Step 8: Commit**

```bash
git add js/settings-render.js
git commit -m "feat(settings-render): update enum values, DOM IDs, and param names to English"
```

---

### Part C — `app.html`, `js/main.js`, `js/text-refresh.js`, `js/share-viewer.js`

**Files:**
- Modify: `app.html`
- Modify: `js/main.js`
- Modify: `js/text-refresh.js`
- Modify: `js/share-viewer.js`

- [ ] **Step 1: Update three element IDs in `app.html`**

Line 355 — replace:
```html
      <div class="settings-options" id="settings-sesong-options"></div>
```
With:
```html
      <div class="settings-options" id="settings-season-format-options"></div>
```

Line 367 — replace:
```html
      <div class="settings-options" id="settings-aktiv-sesong-options"></div>
```
With:
```html
      <div class="settings-options" id="settings-active-season-options"></div>
```

Line 369 — replace:
```html
        <input id="settings-ny-sesong" type="text" class="settings-add-season-input" placeholder="Legg til sesong (f.eks. 2027)">
```
With:
```html
        <input id="settings-new-season" type="text" class="settings-add-season-input" placeholder="Legg til sesong (f.eks. 2027)">
```

Line 408 — replace:
```html
    <div class="settings-version">Athlytics Sport v0.1 · fotball</div>
```
With:
```html
    <div class="settings-version">Athlytics Sport v0.1 · football</div>
```

- [ ] **Step 2: Update two references to `settings-ny-sesong` in `js/main.js`**

Line 65 — replace:
```js
      var writeInputIds = ['team-new-input', 'tournament-new-input', 'profile-team-input', 'profile-new-tournament', 'settings-ny-sesong'];
```
With:
```js
      var writeInputIds = ['team-new-input', 'tournament-new-input', 'profile-team-input', 'profile-new-tournament', 'settings-new-season'];
```

Line 75 — replace:
```js
    if (e.target.id === 'settings-ny-sesong') addSeason();
```
With:
```js
    if (e.target.id === 'settings-new-season') addSeason();
```

- [ ] **Step 3: Update placeholder ID map in `js/text-refresh.js`**

Line 39 — replace:
```js
    'profile-new-tournament': 'ph_add_tournament', 'profile-team-input': 'ph_add_team', 'settings-ny-sesong': 'ph_new_season',
```
With:
```js
    'profile-new-tournament': 'ph_add_tournament', 'profile-team-input': 'ph_add_team', 'settings-new-season': 'ph_new_season',
```

- [ ] **Step 4: Update fallback defaults in `js/share-viewer.js`**

Lines 510–511 — replace:
```js
    seasonFormat:  profileData.season_format || 'aar',
    sport:         profileData.sport || 'fotball'
```
With:
```js
    seasonFormat:  profileData.season_format || 'year',
    sport:         profileData.sport || 'football'
```

- [ ] **Step 5: Verify in browser**

Open the app locally. Open the Settings tab:
- Season format pills show correctly and toggling saves/restores
- Adding a season works (type a year, press the add button and Enter)
- Active season pills render and toggle correctly
- Sport pills show Football as active
- Open the app's Settings → toggle sport to football → reload → football is still selected

Open the Stats tab — season labels display correctly for both `year` and `season` format.

Load `share.html?code=...` (if you have a share code) — no console errors.

Open DevTools → Application → Local Storage → confirm `athlytics_settings` now stores `sport: "football"`, `seasonFormat: "year"` or `"season"`.

- [ ] **Step 6: Commit**

```bash
git add app.html js/main.js js/text-refresh.js js/share-viewer.js
git commit -m "feat(app): update element IDs and fallback values to English enum names"
```

---

## Task 2: Rename Norwegian function names in `supabase.js`

### Part A — Rename in `js/supabase.js`

**Files:**
- Modify: `js/supabase.js`

- [ ] **Step 1: Rename match functions**

Replace the four match function declarations and their internal error strings:

```js
export async function fetchMatches() {
  var res = await fetch(SUPABASE_URL + '/rest/v1/matches?select=*&order=date.desc', {
    headers: headers()
  });
  if (!res.ok) throw new Error('fetchMatches failed: ' + res.status);
  return res.json();
}

export async function insertMatch(body) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/matches', {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json', 'Prefer': 'return=representation' }),
    body: JSON.stringify(body)
  });
  return res;
}

export async function updateMatch(id, body) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/matches?id=eq.' + id, {
    method: 'PATCH',
    headers: headers({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
    body: JSON.stringify(body)
  });
  return res;
}

export async function deleteMatch(id) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/matches?id=eq.' + id, {
    method: 'DELETE',
    headers: headers()
  });
  return res;
}
```

- [ ] **Step 2: Rename profile functions**

Replace the two profile function declarations:

```js
export async function fetchProfile(userId) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/profiles?id=eq.' + userId + '&select=*', {
    headers: headers()
  });
  if (!res.ok) throw new Error('fetchProfile failed: ' + res.status);
  var data = await res.json();
  return (data && data[0]) ? data[0] : null;
}

export async function upsertProfile(body) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/profiles', {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' }),
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('upsertProfile failed: ' + res.status);
}
```

- [ ] **Step 3: Rename `upsertSettings` → `upsertProfileSettings`, delete `fetchSettings`**

In the Settings section (lines 80–98), replace the entire block:

```js
// ── Settings ─────────────────────────────────────────────────────────────────

export async function upsertProfileSettings(body) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/profiles', {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json', 'Prefer': 'resolution=merge-duplicates' }),
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error('upsertProfileSettings failed: ' + res.status);
}
```

(`fetchSettings` is deleted — it was exported but never imported anywhere.)

- [ ] **Step 4: Commit**

```bash
git add js/supabase.js
git commit -m "refactor(supabase): rename Norwegian function names to English, delete dead fetchSettings"
```

---

### Part B — Update all import sites

**Files:**
- Modify: `js/log.js`
- Modify: `js/modal.js`
- Modify: `js/assessment.js`
- Modify: `js/stats-overview.js`
- Modify: `js/export.js`
- Modify: `js/profile.js`
- Modify: `js/settings.js`

- [ ] **Step 1: `js/log.js` — line 1**

Replace:
```js
import { insertKamp } from './supabase.js';
```
With:
```js
import { insertMatch } from './supabase.js';
```

Then update the call site. Find `insertKamp(` and replace with `insertMatch(`.

- [ ] **Step 2: `js/modal.js` — line 2**

Replace:
```js
import { updateKamp, deleteKamp } from './supabase.js';
```
With:
```js
import { updateMatch, deleteMatch } from './supabase.js';
```

Then replace call sites: `updateKamp(` → `updateMatch(`, `deleteKamp(` → `deleteMatch(`.

- [ ] **Step 3: `js/assessment.js` — line 1**

Replace:
```js
import { updateKamp } from './supabase.js';
```
With:
```js
import { updateMatch } from './supabase.js';
```

Then replace call site: `updateKamp(` → `updateMatch(`.

- [ ] **Step 4: `js/stats-overview.js` — line 1**

Replace:
```js
import { fetchKamper } from './supabase.js';
```
With:
```js
import { fetchMatches } from './supabase.js';
```

Then replace call site: `fetchKamper()` → `fetchMatches()`.

- [ ] **Step 5: `js/export.js` — line 2**

Replace:
```js
import { fetchKamper } from './supabase.js';
```
With:
```js
import { fetchMatches } from './supabase.js';
```

Then replace call site: `fetchKamper()` → `fetchMatches()`.

- [ ] **Step 6: `js/profile.js` — line 3**

Replace:
```js
import { fetchProfil, upsertProfil, uploadAvatar } from './supabase.js';
```
With:
```js
import { fetchProfile, upsertProfile, uploadAvatar } from './supabase.js';
```

Then replace all call sites in the file: `fetchProfil(` → `fetchProfile(`, `upsertProfil(` → `upsertProfile(`.

- [ ] **Step 7: `js/settings.js` — line 3**

Replace:
```js
import { upsertSettings } from './supabase.js';
```
With:
```js
import { upsertProfileSettings } from './supabase.js';
```

Then replace call site: `upsertSettings(` → `upsertProfileSettings(`.

- [ ] **Step 8: Verify in browser**

Open the app. Log in or use demo mode. Open the Log tab and save a match — no console errors. Open Stats tab — matches load. Open Profile tab — profile loads. Open Settings and toggle a setting — no console errors.

- [ ] **Step 9: Commit**

```bash
git add js/log.js js/modal.js js/assessment.js js/stats-overview.js js/export.js js/profile.js js/settings.js
git commit -m "refactor: update all import sites to use renamed supabase functions"
```

---

## Task 3: Dropdown keyboard navigation

**Files:**
- Modify: `style.css`
- Modify: `js/teams.js`
- Modify: `js/main.js`

### Part A — CSS highlight rule

- [ ] **Step 1: Add `.dropdown-highlight` rule to `style.css`**

Find the existing `.team-option.selected` rule (or add near the end of the dropdown styles section). Add:

```css
.team-option.dropdown-highlight {
  background: rgba(168, 224, 99, 0.12);
}
```

- [ ] **Step 2: Commit**

```bash
git add style.css
git commit -m "feat(dropdown): add keyboard highlight CSS"
```

---

### Part B — Clear highlight on close in `js/teams.js`

- [ ] **Step 1: Clear `.dropdown-highlight` at the top of `closeAllDropdowns()`**

Find `closeAllDropdowns()` (line 367). Add one line at the top of the function body:

```js
export function closeAllDropdowns() {
  document.querySelectorAll('.team-option.dropdown-highlight').forEach(function(el) {
    el.classList.remove('dropdown-highlight');
  });
  var tdd = document.getElementById('tournament-dropdown');
  // ... rest of function unchanged
```

- [ ] **Step 2: Commit**

```bash
git add js/teams.js
git commit -m "feat(dropdown): clear keyboard highlight when dropdowns close"
```

---

### Part C — Keydown handler in `js/main.js`

- [ ] **Step 1: Extend the `keydown` listener to handle arrow keys and Escape**

The current keydown listener (line 62) only handles `Enter`. Change it to handle `ArrowDown`, `ArrowUp`, and `Escape` as well. Replace the entire listener:

```js
  document.addEventListener('keydown', function(e) {
    var openDd = document.querySelector('.team-dropdown.open');

    // Arrow nav and Escape for open dropdowns
    if (openDd && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault();
      var opts = Array.from(openDd.querySelectorAll('.team-option'));
      var cur = openDd.querySelector('.team-option.dropdown-highlight');
      var idx = cur ? opts.indexOf(cur) : -1;
      if (cur) cur.classList.remove('dropdown-highlight');
      idx = e.key === 'ArrowDown' ? (idx + 1) % opts.length : (idx - 1 + opts.length) % opts.length;
      opts[idx].classList.add('dropdown-highlight');
      opts[idx].scrollIntoView({ block: 'nearest' });
      return;
    }

    if (openDd && e.key === 'Escape') {
      e.preventDefault();
      closeAllDropdowns();
      return;
    }

    if (e.key !== 'Enter') return;

    // Enter: select highlighted dropdown option first
    var highlighted = document.querySelector('.team-dropdown.open .team-option.dropdown-highlight');
    if (highlighted) {
      e.preventDefault();
      highlighted.click();
      return;
    }

    if (!isAuthenticated()) {
      var writeInputIds = ['team-new-input', 'tournament-new-input', 'profile-team-input', 'profile-new-tournament', 'settings-new-season'];
      if (writeInputIds.includes(e.target.id)) {
        document.dispatchEvent(new CustomEvent('athlytics:requireAuth'));
        return;
      }
    }
    if (e.target.id === 'team-new-input') saveNewTeamFromDropdown();
    if (e.target.id === 'tournament-new-input') saveNewTournamentFromDropdown();
    if (e.target.id === 'profile-team-input') addTeamFromProfile();
    if (e.target.id === 'profile-new-tournament') addTournament();
    if (e.target.id === 'settings-new-season') addSeason();
  });
```

- [ ] **Step 2: Verify keyboard nav in browser**

Open the Log tab. Click the team dropdown to open it.

| Action | Expected |
|--------|----------|
| Press Arrow Down | First option gets green highlight |
| Press Arrow Down again | Highlight moves to second option |
| Press Arrow Up | Highlight moves back to first option |
| Press Arrow Down past last item | Wraps to first option |
| Press Arrow Up on first item | Wraps to last option |
| Press Enter on highlighted option | Option is selected, dropdown closes |
| Press Escape when dropdown open | Dropdown closes, highlight cleared |
| Click outside dropdown | Dropdown closes, highlight cleared |
| Open tournament dropdown, use arrow keys | Same behaviour |
| Open modal (edit a match), use arrow keys in modal dropdowns | Same behaviour |

No console errors in any scenario.

- [ ] **Step 3: Commit**

```bash
git add js/main.js
git commit -m "feat(dropdown): add arrow key and Escape keyboard navigation"
```

---

## Task 4: Update CLAUDE.md and CHANGELOG

- [ ] **Step 1: Mark tech debt items as resolved in `CLAUDE.md`**

In the `settings.js` debt table, update the Norwegian enum values row to `✅ Ferdig`.

In the `supabase.js` debt table, update the `fetchSettings`/`upsertSettings` naming row to `✅ Ferdig`.

In the MVP-gjeld table, update the custom dropdown keyboard nav row to `✅ Ferdig`.

- [ ] **Step 2: Add entry to `CHANGELOG.md`**

```markdown
## [Unreleased]
### Changed
- Settings: Norwegian enum values renamed to English (`'fotball'`→`'football'`, `'aar'`→`'year'`, `'sesong'`→`'season'`) — includes Supabase + localStorage migration
- supabase.js: Norwegian function names renamed to English (`fetchKamper`→`fetchMatches`, etc.)
- Dropdowns: arrow key and Escape keyboard navigation for all four team/tournament dropdowns
```

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md CHANGELOG.md
git commit -m "docs: mark tech debt items as resolved"
```
