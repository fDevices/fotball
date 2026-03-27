# Tech Debt Cleanup — Design Spec

**Date:** 2026-03-27
**Scope:** Three independent tasks: Norwegian enum rename, Norwegian function name rename in supabase.js, dropdown keyboard navigation.

---

## Task 1 — Norwegian enum values → English

### Problem
Settings values `'fotball'`, `'aar'`, `'sesong'` are stored in localStorage (`athlytics_settings`) and in Supabase `profiles` (`sport`, `season_format` columns). They appear in comparisons, validations, DOM IDs, `data-*` attributes, and fallback defaults in `share-viewer.js`.

### Target values

| Old | New | Field |
|-----|-----|-------|
| `'fotball'` | `'football'` | `sport` |
| `'aar'` | `'year'` | `seasonFormat` / `season_format` |
| `'sesong'` | `'season'` | `seasonFormat` / `season_format` |

### Migration — Supabase (SQL, run manually in Supabase editor)

```sql
UPDATE profiles SET sport = 'football' WHERE sport = 'fotball';
UPDATE profiles SET season_format = 'year' WHERE season_format = 'aar';
UPDATE profiles SET season_format = 'season' WHERE season_format = 'sesong';
```

Run all three statements before deploying the code change. After the SQL runs, no old values remain in the DB.

### Migration — localStorage (boot-time, in `settings.js`)

Add a `migrateSettings(s)` helper called inside `getSettings()` before caching, and also inside `saveSettings()` before validation:

```js
function migrateSettings(s) {
  if (s.sport === 'fotball') s.sport = 'football';
  if (s.seasonFormat === 'aar') s.seasonFormat = 'year';
  if (s.seasonFormat === 'sesong') s.seasonFormat = 'season';
  return s;
}
```

This ensures any user whose localStorage hasn't been touched since the SQL migration gets translated on first read and written back as the new values.

### Code changes

**`js/settings.js`**
- `defaultSettings()`: change `sport: 'fotball'` → `'football'`, `seasonFormat: 'aar'` → `'year'`
- `saveSettings()` validation: update allowed lists to `['year', 'season']` and `['football', 'orientering', 'ski']`
- `buildSeasonLabel()`: change `if (format === 'sesong')` → `if (format === 'season')`
- Add `migrateSettings()` helper; call it in `getSettings()` and `saveSettings()`

**`js/settings-render.js`**
- `ALLOWED_SPORTS`: `'fotball'` → `'football'`
- `THEMES` keys: `fotball` → `football`
- `applyTheme()`: `THEMES[sport] || THEMES.football`
- `setSport()`: ALLOWED_SPORTS check updates automatically from above
- `renderSettings()`: sport pill keys `'fotball'` → `'football'`; season format pill keys `'aar'` → `'year'`, `'sesong'` → `'season'`; element ID `'settings-sesong-options'` → `'settings-season-format-options'`
- `renderActiveSeasonPills()`: element ID `'settings-aktiv-sesong-options'` → `'settings-active-season-options'` (no Norwegian)

**`js/navigation.js`**
- Sport icon comparison: `s.sport === 'orientering'` and `s.sport === 'ski'` stay as-is (English values); `s.sport === 'fotball'` fallback (the `else` branch) stays as-is since it's already the default

**`js/share-viewer.js`**
- Fallback values: `season_format: profileData.season_format || 'aar'` → `|| 'year'`; `sport: profileData.sport || 'fotball'` → `|| 'football'`

**`app.html`**
- Element ID `settings-sesong-options` → `settings-season-format-options`
- Element ID `settings-aktiv-sesong-options` → `settings-active-season-options`
- Element ID `settings-ny-sesong` → `settings-new-season`
- Version line `fotball` → `football`

**`js/main.js`** (and `js/text-refresh.js`)
- References to `'settings-ny-sesong'` input ID → `'settings-new-season'`

---

## Task 2 — Norwegian function names in `supabase.js`

### Renames

| Old | New |
|-----|-----|
| `fetchKamper` | `fetchMatches` |
| `insertKamp` | `insertMatch` |
| `updateKamp` | `updateMatch` |
| `deleteKamp` | `deleteMatch` |
| `fetchProfil` | `fetchProfile` |
| `upsertProfil` | `upsertProfile` |
| `fetchSettings` | _delete_ (exported but never imported — dead code) |
| `upsertSettings` | `upsertProfileSettings` |

No behavior change. Error message strings inside each function also updated to match (e.g. `'fetchKamper failed'` → `'fetchMatches failed'`).

### Import sites to update

| File | Old imports | New imports |
|------|------------|-------------|
| `js/log.js` | `insertKamp` | `insertMatch` |
| `js/modal.js` | `updateKamp, deleteKamp` | `updateMatch, deleteMatch` |
| `js/assessment.js` | `updateKamp` | `updateMatch` |
| `js/stats-overview.js` | `fetchKamper` | `fetchMatches` |
| `js/export.js` | `fetchKamper` | `fetchMatches` |
| `js/profile.js` | `fetchProfil, upsertProfil` | `fetchProfile, upsertProfile` |
| `js/settings.js` | `upsertSettings` | `upsertProfileSettings` |

---

## Task 3 — Dropdown keyboard navigation

### Scope
Four combobox dropdowns: `#team-dropdown`, `#tournament-dropdown`, `#modal-team-dropdown`, `#modal-tournament-dropdown`.

### Behaviour
- **Arrow Down / Arrow Up**: moves visual highlight through `.team-option` items (wraps at ends)
- **Enter**: selects the highlighted option (triggers its `data-action` click)
- **Escape**: closes the open dropdown (calls `closeAllDropdowns()`)
- Keys only fire when a dropdown is open

### Implementation
All logic lives in the existing `keydown` listener in `main.js`. No changes to `teams.js`.

**Finding the open dropdown:**
```js
var openDd = document.querySelector('.team-dropdown.open');
```

**Highlight tracking:** use a CSS class `dropdown-highlight` on the currently focused option. No state variable needed — query the DOM.

**CSS** (add to `style.css`):
```css
.team-option.dropdown-highlight {
  background: rgba(168, 224, 99, 0.12);
}
```

**Keydown handler additions** (inside the existing `keydown` listener, before the `Enter` block):
```js
var openDd = document.querySelector('.team-dropdown.open');
if (openDd && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
  e.preventDefault();
  var opts = Array.from(openDd.querySelectorAll('.team-option'));
  var cur = openDd.querySelector('.team-option.dropdown-highlight');
  var idx = cur ? opts.indexOf(cur) : -1;
  if (cur) cur.classList.remove('dropdown-highlight');
  if (e.key === 'ArrowDown') idx = (idx + 1) % opts.length;
  else idx = (idx - 1 + opts.length) % opts.length;
  opts[idx].classList.add('dropdown-highlight');
  opts[idx].scrollIntoView({ block: 'nearest' });
}
if (openDd && e.key === 'Escape') {
  e.preventDefault();
  closeAllDropdowns();
}
```

**Enter on highlighted option** (extend the existing Enter block):
```js
// At the top of the Enter handler, before other checks:
var highlighted = document.querySelector('.team-dropdown.open .team-option.dropdown-highlight');
if (highlighted) {
  e.preventDefault();
  highlighted.click();
  return;
}
```

**Clear highlight on close:** `closeAllDropdowns()` in `teams.js` should also clear any `.dropdown-highlight` class. Add one line:
```js
document.querySelectorAll('.team-option.dropdown-highlight').forEach(function(el) {
  el.classList.remove('dropdown-highlight');
});
```

---

## Order of execution

1. **Run SQL** in Supabase editor (Task 1 migration) — do this before deploying
2. **Task 1** — enum rename (settings.js, settings-render.js, app.html, share-viewer.js, main.js, text-refresh.js)
3. **Task 2** — function rename (supabase.js + all import sites)
4. **Task 3** — keyboard nav (style.css, main.js, teams.js)

Tasks 2 and 3 are independent of each other and can be done in any order. Task 1 code changes must be deployed immediately after the SQL runs — do not let users hit the app between the SQL migration and the deploy.
