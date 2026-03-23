# Assessment Toggle Setting Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a premium On/Off toggle in the Settings tab that controls whether the self-assessment sheet appears after saving a match (off by default).

**Architecture:** `assessmentEnabled` is stored in localStorage alongside other settings. `log.js` gates the `athlytics:showAssessment` dispatch behind this flag. `settings-render.js` renders On/Off pills in a new settings section and owns the `setAssessmentEnabled()` action.

**Tech Stack:** Vanilla JS ES modules, localStorage, existing pill/settings UI pattern

**Spec:** `docs/superpowers/specs/2026-03-23-assessment-toggle-design.md`

---

### Task 1: Add `assessmentEnabled` to the settings data layer

**Files:**
- Modify: `js/settings.js:8` (`defaultSettings`)
- Modify: `js/settings.js:19-28` (`saveSettings` validation block)

- [ ] **Step 1: Open `js/settings.js` and update `defaultSettings()`**

  Line 8 currently reads:
  ```js
  return { sport: 'fotball', seasonFormat: 'aar', activeSeason: '', lang: 'no', extraSeasons: [], dateFormat: 'eu' };
  ```
  Change to:
  ```js
  return { sport: 'fotball', seasonFormat: 'aar', activeSeason: '', lang: 'no', extraSeasons: [], dateFormat: 'eu', assessmentEnabled: false };
  ```

- [ ] **Step 2: Add boolean type-guard in `saveSettings()`**

  After line 25 (`if (!['eu', 'us'].includes(safe.dateFormat)) safe.dateFormat = 'eu';`), add:
  ```js
  if (typeof safe.assessmentEnabled !== 'boolean') safe.assessmentEnabled = false;
  ```

- [ ] **Step 3: Verify in browser console**

  Open the app. In DevTools console run:
  ```js
  JSON.parse(localStorage.getItem('athlytics_settings'))
  ```
  Expected: object does NOT yet have `assessmentEnabled` (it's not saved until `saveSettings()` is called). That's fine — `defaultSettings()` fallback covers it.

  Then run:
  ```js
  import('/js/settings.js').then(m => console.log(m.defaultSettings()))
  ```
  Expected: `{ ..., assessmentEnabled: false }`

- [ ] **Step 4: Commit**

  ```bash
  git add js/settings.js
  git commit -m "feat(settings): add assessmentEnabled field (default false)"
  ```

---

### Task 2: Add i18n translation keys

**Files:**
- Modify: `js/i18n.js` — `no` block (~line 95) and `en` block (~line 237)

- [ ] **Step 1: Add keys to the `no` block**

  Search for `assess_saved` in the `no` block (currently line 95) and insert after it:
  ```js
  assess_toggle_title:'Selvvurdering', assess_toggle_desc:'Vis selvvurderingsskjema etter hver kamp.',
  toast_assess_on:'✓ Selvvurdering aktivert', toast_assess_off:'✓ Selvvurdering deaktivert',
  on:'På', off:'Av',
  ```
  > Note: search for existing `on` and `off` keys before adding — they are absent today but verify first.

- [ ] **Step 2: Add keys to the `en` block**

  Search for `assess_saved` in the `en` block (currently around line 237) and insert after it:
  ```js
  assess_toggle_title:'Self-assessment', assess_toggle_desc:'Show self-assessment sheet after each match.',
  toast_assess_on:'✓ Self-assessment enabled', toast_assess_off:'✓ Self-assessment disabled',
  on:'On', off:'Off',
  ```
  > Note: same `on`/`off` check applies — verify they don't already exist.

- [ ] **Step 3: Verify**

  In the browser console:
  ```js
  import('/js/i18n.js').then(m => console.log(m.t('assess_toggle_title'), m.t('on'), m.t('off')))
  ```
  Expected (with Norwegian language): `Selvvurdering På Av`

- [ ] **Step 4: Commit**

  ```bash
  git add js/i18n.js
  git commit -m "feat(i18n): add assessment toggle translation keys"
  ```

---

### Task 3: Add settings section HTML to `app.html`

**Files:**
- Modify: `app.html:369` — insert new `settings-section` after the active season section

- [ ] **Step 1: Insert new section**

  After line 369 (the closing `</div>` of the active season `settings-section`), insert:
  ```html
  <div class="settings-section">
    <div class="settings-section-title" id="st-assess-title">
      <span id="st-assess-title-text">⭐ Selvvurdering</span>
      <span class="export-premium-badge">⭐ Premium</span>
    </div>
    <div class="settings-desc" id="st-assess-desc">Vis selvvurderingsskjema etter hver kamp.</div>
    <div class="settings-options" id="settings-assess-options"></div>
  </div>
  ```

- [ ] **Step 2: Verify in browser**

  Reload the app, navigate to the Settings tab. Expected: a new section appears with title "⭐ Selvvurdering", a "⭐ Premium" badge, the description text, and an empty options area (pills not yet rendered — that's Task 4).

- [ ] **Step 3: Commit**

  ```bash
  git add app.html
  git commit -m "feat(settings): add assessment toggle section HTML"
  ```

---

### Task 4: Render toggle pills and add `setAssessmentEnabled()` in `settings-render.js`

**Files:**
- Modify: `js/settings-render.js:1` (imports block — add `isDevPremium`)
- Modify: `js/settings-render.js` — add rendering block inside `renderSettings()`
- Modify: `js/settings-render.js` — add `setAssessmentEnabled()` export

- [ ] **Step 1: Add `isDevPremium` import**

  `settings-render.js` currently has no import from `utils.js`. Add a new import line at the top (after the existing imports):
  ```js
  import { isDevPremium } from './utils.js';
  ```

- [ ] **Step 2: Add i18n text refresh inside `renderSettings()`**

  In `renderSettings()`, after the block that updates `stAsDesc` (the active season description, around line 43-44), add:
  ```js
  var stAssessTitle = document.getElementById('st-assess-title-text');
  if (stAssessTitle) stAssessTitle.textContent = '⭐ ' + t('assess_toggle_title');
  var stAssessDesc = document.getElementById('st-assess-desc');
  if (stAssessDesc) stAssessDesc.textContent = t('assess_toggle_desc');
  ```

- [ ] **Step 3: Add pill rendering block inside `renderSettings()`**

  Insert after line 99 (closing `}` of the `dfEl` date-format block) and before line 101 (start of the `stShareTitle` block), add:
  ```js
  var assessEl = document.getElementById('settings-assess-options');
  if (assessEl) {
    assessEl.innerHTML = '';
    [{ val: true, label: t('on') }, { val: false, label: t('off') }].forEach(function(opt) {
      var btn = document.createElement('button');
      btn.className = 'settings-pill' + (s.assessmentEnabled === opt.val ? ' active' : '');
      btn.textContent = opt.label;
      if (isDevPremium()) {
        btn.dataset.action = 'setAssessmentEnabled';
        btn.dataset.value = String(opt.val);
      } else {
        btn.disabled = true;
        btn.style.opacity = '0.4';
      }
      assessEl.appendChild(btn);
    });
  }
  ```

- [ ] **Step 4: Add `setAssessmentEnabled()` export at the bottom of `settings-render.js`**

  After the `addSeason()` function:
  ```js
  export function setAssessmentEnabled(val) {
    if (!isDevPremium()) return;
    var s = getSettings();
    s.assessmentEnabled = val;
    saveSettings(s);
    renderSettings();
    showToast(val ? t('toast_assess_on') : t('toast_assess_off'), 'success');
  }
  ```

- [ ] **Step 5: Verify in browser**

  Reload and navigate to Settings. Expected: two pills — "På" and "Av" — appear under the Selvvurdering section. "Av" pill should be active (highlighted) since `assessmentEnabled` defaults to `false`. Clicking "På" should show a toast "✓ Selvvurdering aktivert" and highlight "På". Clicking "Av" switches back.

- [ ] **Step 6: Commit**

  ```bash
  git add js/settings-render.js
  git commit -m "feat(settings): render assessment toggle pills, add setAssessmentEnabled()"
  ```

---

### Task 5: Wire `setAssessmentEnabled` into the actions map

**Files:**
- Modify: `js/actions.js:11` — add `setAssessmentEnabled` to import from `settings-render.js`
- Modify: `js/actions.js:18-25` — add to `WRITE_ACTIONS`
- Modify: `js/actions.js:27-109` — add to `ACTIONS` map

- [ ] **Step 1: Extend the `settings-render.js` import line**

  Line 11 currently reads:
  ```js
  import { setSport, setSeasonFormat, setDateFormat, setActiveSeason, addSeason } from './settings-render.js';
  ```
  Change to:
  ```js
  import { setSport, setSeasonFormat, setDateFormat, setActiveSeason, addSeason, setAssessmentEnabled } from './settings-render.js';
  ```

- [ ] **Step 2: Add to `WRITE_ACTIONS`**

  In the `WRITE_ACTIONS` Set (lines 18-25), add `'setAssessmentEnabled'` to the list:
  ```js
  export const WRITE_ACTIONS = new Set([
    'saveMatch', 'saveProfile', 'saveEditedMatch', 'confirmDeleteMatch',
    'addTeamFromProfile', 'addTournament', 'deleteTeam', 'deleteTournament',
    'setFavoriteTeam', 'setFavoriteTournament', 'saveNewTeamFromDropdown',
    'saveNewTournamentFromDropdown', 'addSeason', 'setSport', 'setSeasonFormat',
    'setDateFormat', 'setActiveSeason', 'saveAssessment', 'exportCSV', 'exportPDF',
    'createShareToken', 'deleteShareToken', 'setAssessmentEnabled'
  ]);
  ```

- [ ] **Step 3: Add to `ACTIONS` map**

  After the `setActiveSeason` entry, add:
  ```js
  setAssessmentEnabled: (e) => { var el = e.target.closest('[data-value]'); if (!el) return; setAssessmentEnabled(el.dataset.value === 'true'); },
  ```

- [ ] **Step 4: Verify in browser**

  Reload. Navigate to Settings. Click "På" and "Av" pills. Expected: pills toggle correctly, toast appears, setting persists after page reload (`localStorage` should show `assessmentEnabled: true/false`). If not authenticated (demo mode), clicking should trigger the auth overlay (WRITE_ACTIONS gate).

- [ ] **Step 5: Commit**

  ```bash
  git add js/actions.js
  git commit -m "feat(actions): wire setAssessmentEnabled into ACTIONS and WRITE_ACTIONS"
  ```

---

### Task 6: Gate the assessment sheet dispatch in `log.js`

**Files:**
- Modify: `js/log.js:1` — add `getSettings` import
- Modify: `js/log.js:109-111` — wrap `athlytics:showAssessment` dispatch

- [ ] **Step 1: Add `getSettings` import**

  `log.js` line 7 already imports from `settings.js`:
  ```js
  import { getDateLocale } from './settings.js';
  ```
  Extend it to:
  ```js
  import { getDateLocale, getSettings } from './settings.js';
  ```

- [ ] **Step 2: Wrap the `athlytics:showAssessment` dispatch**

  Lines 109-111 currently read:
  ```js
  if (newMatches && newMatches[0] && newMatches[0].id) {
    document.dispatchEvent(new CustomEvent('athlytics:showAssessment', { detail: { matchId: newMatches[0].id } }));
  }
  ```
  Change to:
  ```js
  if (newMatches && newMatches[0] && newMatches[0].id && getSettings().assessmentEnabled) {
    document.dispatchEvent(new CustomEvent('athlytics:showAssessment', { detail: { matchId: newMatches[0].id } }));
  }
  ```

- [ ] **Step 3: Verify — assessment OFF (default)**

  With `assessmentEnabled: false` (default): fill in the log form (date, opponent, team), save a match. Expected: match saves successfully, toast appears, form resets — no assessment sheet.

- [ ] **Step 4: Verify — assessment ON**

  In Settings, tap "På" to enable. Save a match. Expected: after save, assessment sheet opens as before.

- [ ] **Step 5: Commit**

  ```bash
  git add js/log.js
  git commit -m "feat(log): gate assessment sheet behind assessmentEnabled setting"
  ```

---

### Task 7: Final smoke test and push

- [ ] **Step 1: Full flow test**

  1. Reload the app fresh (hard reload: Cmd+Shift+R)
  2. Navigate to Settings — confirm "Selvvurdering" section shows with "Av" active
  3. Switch to English — confirm section title changes to "Self-assessment", pills show "On" / "Off"
  4. Enable assessment (tap "On") — confirm toast and "On" pill becomes active
  5. Log a match — confirm assessment sheet opens after save
  6. Disable assessment (tap "Off") — confirm toast and "Off" pill becomes active
  7. Log a match — confirm assessment sheet does NOT open
  8. Reload page — confirm the Off/On state persists from localStorage

- [ ] **Step 2: Push**

  ```bash
  git push
  ```
