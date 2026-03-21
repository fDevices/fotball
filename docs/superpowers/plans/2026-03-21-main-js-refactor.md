# main.js ACTIONS Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract the ACTIONS routing table and date-toggle logic out of main.js into purpose-appropriate modules, shrinking main.js from ~271 to ~165 lines.

**Architecture:** New `js/actions.js` owns the ACTIONS map and WRITE_ACTIONS set. `js/log.js` gains the two date-toggle functions. `js/main.js` becomes a pure orchestrator: imports, event wiring, cross-module listeners, and bootstrap only. No logic changes — pure file moves.

**Tech Stack:** Vanilla JS ES modules, no bundler, no test framework. Verification is manual in-browser.

**Spec:** `docs/superpowers/specs/2026-03-21-main-js-refactor-design.md`

---

### Task 1: Create `js/actions.js`

**Files:**
- Create: `js/actions.js`

- [ ] **Step 1: Create `js/actions.js` with all imports and the ACTIONS + WRITE_ACTIONS content moved verbatim from `main.js`**

The file must be exactly:

```js
import { saveProfile, uploadImage, dismissProfilePrompt, renderLogSub } from './profile.js';
import { renderTeamDropdown, renderTournamentDropdown, toggleTeamDropdown, toggleTournamentDropdown, saveNewTeamFromDropdown, saveNewTournamentFromDropdown, toggleNewTeamInput, toggleNewTournamentInput, addTeamFromProfile, addTournament, deleteTeam, deleteTournament, setFavoriteTeam, setFavoriteTournament, toggleModalTeamDropdown, toggleModalTournamentDropdown, selectModalTeam, selectModalTournament } from './teams.js';
import { switchTab } from './navigation.js';
import { toggleLangPicker } from './i18n.js';
import { setLang } from './text-refresh.js';
import { loadStats, switchStatsView, setSeason, setTeamFilter, setTournamentFilter, setMatchPage, setOpponentSearch } from './stats-overview.js';
import { adjust, saveMatch, setMatchType } from './log.js';
import { openEditModal, closeModal, setModalMatchType, modalAdjust, saveEditedMatch, deleteMatch, cancelDeleteMatch, confirmDeleteMatch } from './modal.js';
import { closeAssessmentSheet, saveAssessment, setRating } from './assessment.js';
import { exportCSV, exportPDF } from './export.js';
import { setSport, setSeasonFormat, setDateFormat, setActiveSeason, addSeason } from './settings-render.js';
import { showToast } from './toast.js';
import { logout } from './auth.js';
import { dismissDemoBanner, toggleAuthView, handleAuthLogin, handleAuthSignup } from './auth-ui.js';

export const WRITE_ACTIONS = new Set([
  'saveMatch', 'saveProfile', 'saveEditedMatch', 'confirmDeleteMatch',
  'addTeamFromProfile', 'addTournament', 'deleteTeam', 'deleteTournament',
  'setFavoriteTeam', 'setFavoriteTournament', 'saveNewTeamFromDropdown',
  'saveNewTournamentFromDropdown', 'addSeason', 'setSport', 'setSeasonFormat',
  'setDateFormat', 'setActiveSeason', 'saveAssessment', 'exportCSV', 'exportPDF'
]);

export const ACTIONS = {
  saveMatch:                     () => saveMatch(),
  adjust:                        (e) => { var el = e.target.closest('[data-type]'); if (!el) return; adjust(el.dataset.type, Number(el.dataset.delta)); },
  setMatchType:                  (e) => { var el = e.target.closest('[data-match-type]'); if (!el) return; setMatchType(el.dataset.matchType); },
  switchTab:                     (e) => { var el = e.target.closest('[data-tab]'); if (!el) return; switchTab(el.dataset.tab); },
  setLang:                       (e) => { var el = e.target.closest('[data-lang]'); if (!el) return; setLang(el.dataset.lang); },
  toggleLangPicker:              (e) => toggleLangPicker(e.target.closest('[data-action]')),
  saveProfile:                   () => saveProfile(),
  addTeamFromProfile:            () => addTeamFromProfile(),
  addTournament:                 () => addTournament(),
  toggleTeamDropdown:            () => toggleTeamDropdown(),
  toggleTournamentDropdown:      () => toggleTournamentDropdown(),
  saveNewTeamFromDropdown:       () => saveNewTeamFromDropdown(),
  saveNewTournamentFromDropdown: () => saveNewTournamentFromDropdown(),
  toggleNewTeamInput:            () => toggleNewTeamInput(),
  toggleNewTournamentInput:      () => toggleNewTournamentInput(),
  selectTeam:                    (e) => { var el = e.target.closest('[data-name]'); if (!el) return; selectTeam(el.dataset.name); },
  selectTournament:              (e) => { var el = e.target.closest('[data-name]'); if (!el) return; selectTournament(el.dataset.name); },
  setFavoriteTeam:               (e) => { var el = e.target.closest('[data-name]'); if (!el) return; setFavoriteTeam(el.dataset.name); },
  deleteTeam:                    (e) => { var el = e.target.closest('[data-name]'); if (!el) return; deleteTeam(el.dataset.name); },
  setFavoriteTournament:         (e) => { var el = e.target.closest('[data-name]'); if (!el) return; setFavoriteTournament(el.dataset.name); },
  deleteTournament:              (e) => { var el = e.target.closest('[data-name]'); if (!el) return; deleteTournament(el.dataset.name); },
  toggleModalTeamDropdown:       () => toggleModalTeamDropdown(),
  toggleModalTournamentDropdown: () => toggleModalTournamentDropdown(),
  selectModalTeam:               (e) => { var el = e.target.closest('[data-name]'); if (!el) return; selectModalTeam(el.dataset.name); },
  selectModalTournament:         (e) => { var el = e.target.closest('[data-name]'); if (!el) return; selectModalTournament(el.dataset.name); },
  openEditModal:                 (e) => { var el = e.target.closest('[data-id]'); if (!el) return; openEditModal(el.dataset.id); },
  closeModal:                    () => closeModal(),
  modalAdjust:                   (e) => { var el = e.target.closest('[data-type]'); if (!el) return; modalAdjust(el.dataset.type, Number(el.dataset.delta)); },
  setModalMatchType:             (e) => { var el = e.target.closest('[data-match-type]'); if (!el) return; setModalMatchType(el.dataset.matchType); },
  saveEditedMatch:               () => saveEditedMatch(),
  deleteMatch:                   () => deleteMatch(),
  cancelDeleteMatch:             () => cancelDeleteMatch(),
  confirmDeleteMatch:            () => confirmDeleteMatch(),
  switchStatsView:               (e) => { var el = e.target.closest('[data-view]'); if (!el) return; switchStatsView(el.dataset.view); },
  setSeason:                     (e) => { var el = e.target.closest('[data-season]'); if (!el) return; setSeason(el.dataset.season); },
  setTeamFilter:                 (e) => { var el = e.target.closest('[data-team]'); if (!el) return; setTeamFilter(el.dataset.team); },
  setTournamentFilter:           (e) => { var el = e.target.closest('[data-tournament]'); if (!el) return; setTournamentFilter(el.dataset.tournament); },
  setMatchPage:                  (e) => { var el = e.target.closest('[data-page]'); if (!el) return; setMatchPage(Number(el.dataset.page)); },
  setOpponentSearch:             (e) => setOpponentSearch(e.target.value),
  clearOpponentSearch:           () => { var i = document.getElementById('opponent-search-input'); if (i) i.value = ''; setOpponentSearch(''); },
  exportCSV:                     () => exportCSV(),
  exportPDF:                     () => exportPDF(),
  addSeason:                     () => addSeason(),
  setSport:                      (e) => { var el = e.target.closest('[data-sport]'); if (!el) return; setSport(el.dataset.sport); },
  setSeasonFormat:               (e) => { var el = e.target.closest('[data-format]'); if (!el) return; setSeasonFormat(el.dataset.format); },
  setDateFormat:                 (e) => { var el = e.target.closest('[data-format]'); if (!el) return; setDateFormat(el.dataset.format); },
  setActiveSeason:               (e) => { var el = e.target.closest('[data-season]'); if (!el) return; setActiveSeason(el.dataset.season); },
  showProToast:                  () => showToast('Coming soon \u2013 Stripe i Fase 4 \u{1F680}', 'success'),
  closeAssessmentSheet:          () => closeAssessmentSheet(),
  saveAssessment:                () => saveAssessment(),
  setRating:                     (e) => { var el = e.target.closest('[data-category]'); if (!el) return; setRating(el.dataset.category, Number(el.dataset.value), el.dataset.context); },
  triggerAvatarUpload:           () => { var i = document.getElementById('avatar-upload'); if (i) i.click(); },
  dismissProfilePrompt:          () => dismissProfilePrompt(),
  logout:              () => logout(),
  openAuthOverlay:     () => openAuthOverlay('login'),
  dismissDemoBanner:   () => dismissDemoBanner(),
  authToggleView:      () => toggleAuthView(),
  authLogin:           () => handleAuthLogin(),
  authSignup:          () => handleAuthSignup(),
};
```

> **Note:** `selectTeam` and `selectTournament` in the ACTIONS map call the teams.js functions by name — but those are not imported in `actions.js` because they're *not* listed in the imports above. The ACTIONS map entries for `selectTeam`/`selectTournament` call the local variables imported from teams.js inside main.js. Wait — re-read the original main.js: `selectTeam` and `selectTournament` ARE in the ACTIONS map (lines 44-45), so they DO need to be imported in actions.js. Add them to the teams.js import line: add `selectTeam, selectTournament` to the teams.js import.
>
> Also: `openAuthOverlay` is called in the ACTIONS map (`openAuthOverlay: () => openAuthOverlay('login')`). It must be imported from `auth-ui.js` in actions.js. Add it to the auth-ui.js import line.

**Corrected teams.js import line for actions.js:**
```js
import { renderTeamDropdown, renderTournamentDropdown, selectTeam, selectTournament, toggleTeamDropdown, toggleTournamentDropdown, saveNewTeamFromDropdown, saveNewTournamentFromDropdown, toggleNewTeamInput, toggleNewTournamentInput, addTeamFromProfile, addTournament, deleteTeam, deleteTournament, setFavoriteTeam, setFavoriteTournament, toggleModalTeamDropdown, toggleModalTournamentDropdown, selectModalTeam, selectModalTournament } from './teams.js';
```

**Corrected auth-ui.js import line for actions.js:**
```js
import { openAuthOverlay, dismissDemoBanner, toggleAuthView, handleAuthLogin, handleAuthSignup } from './auth-ui.js';
```

> **Note 2:** `renderTeamDropdown` and `renderTournamentDropdown` are only used in main.js bootstrap, not in ACTIONS. Remove them from the actions.js teams.js import to keep it clean.

**Final teams.js import for actions.js:**
```js
import { selectTeam, selectTournament, toggleTeamDropdown, toggleTournamentDropdown, saveNewTeamFromDropdown, saveNewTournamentFromDropdown, toggleNewTeamInput, toggleNewTournamentInput, addTeamFromProfile, addTournament, deleteTeam, deleteTournament, setFavoriteTeam, setFavoriteTournament, toggleModalTeamDropdown, toggleModalTournamentDropdown, selectModalTeam, selectModalTournament } from './teams.js';
```

- [ ] **Step 2: Open the app in browser and verify it loads without console errors**

Open `app.html` via local server or `file://`. Check browser console — expect zero module import errors.

- [ ] **Step 3: Commit**

```bash
git add js/actions.js
git commit -m "refactor: extract ACTIONS map and WRITE_ACTIONS to actions.js"
```

---

### Task 2: Move date-toggle functions to `js/log.js`

**Files:**
- Modify: `js/log.js`

- [ ] **Step 1: Add `getDateLocale` to the settings.js import in `log.js`**

Current import at top of `log.js` (there is no settings.js import yet — add it):
```js
import { getDateLocale } from './settings.js';
```

`t` is already imported from `./i18n.js` — no change needed there.

- [ ] **Step 2: Append `updateDateLabel` and `setupDateToggle` to the bottom of `log.js`, with exports**

```js
export function updateDateLabel(val) {
  var el = document.getElementById('date-display-label');
  if (!el) return;
  var today = new Date().toISOString().split('T')[0];
  if (!val || val === today) {
    el.textContent = t('today');
  } else {
    var d = new Date(val + 'T00:00:00');
    el.textContent = d.toLocaleDateString(getDateLocale(), { weekday: 'short', day: 'numeric', month: 'short' });
  }
}

export function setupDateToggle() {
  var btn = document.getElementById('date-toggle-btn');
  var input = document.getElementById('date');
  if (!btn || !input) return;
  var blurTimer = null;
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    var isOpen = input.classList.toggle('open');
    if (isOpen) input.focus();
  });
  input.addEventListener('change', function() {
    updateDateLabel(input.value);
  });
  input.addEventListener('blur', function() {
    blurTimer = setTimeout(function() {
      input.classList.remove('open');
    }, 200);
  });
  input.addEventListener('focus', function() {
    clearTimeout(blurTimer);
  });
}
```

- [ ] **Step 3: Verify app still loads with no console errors**

Reload the app in browser. The date toggle doesn't work yet (main.js still has the old functions) — that's fine. No errors expected.

- [ ] **Step 4: Commit**

```bash
git add js/log.js
git commit -m "refactor: move updateDateLabel and setupDateToggle to log.js"
```

---

### Task 3: Trim `js/main.js`

**Files:**
- Modify: `js/main.js`

- [ ] **Step 1: Replace the import block in `main.js` with the trimmed version below**

Remove all imports that now live in `actions.js` or `log.js`. The complete new import block for `main.js`:

```js
import { fetchProfileFromSupabase, loadProfileData, renderLogSub, updateAvatar, uploadImage, updateProfilePrompt } from './profile.js';
import { getSettings } from './settings.js';
import { renderTeamDropdown, renderTournamentDropdown, renderProfileTeamList, renderProfileTournamentList, selectTeam, selectTournament, closeAllDropdowns, saveNewTeamFromDropdown, saveNewTournamentFromDropdown, addTeamFromProfile, addTournament } from './teams.js';
import { updateLogBadge } from './navigation.js';
import { updateFlags, updateAllText } from './text-refresh.js';
import { loadStats, setOpponentSearch } from './stats-overview.js';
import { destroyCharts, initChartDefaults } from './stats-analyse.js';
import { updateResult, setupDateToggle, updateDateLabel } from './log.js';
import { openAssessmentSheet } from './assessment.js';
import { renderSettings, applyTheme, addSeason } from './settings-render.js';
import { showToast } from './toast.js';
import { restoreSession, isAuthenticated } from './auth.js';
import { openAuthOverlay, updateDemoBanner } from './auth-ui.js';
import { ACTIONS, WRITE_ACTIONS } from './actions.js';
```

> **Why these extras stay in main.js:** `setOpponentSearch` is called directly in the `input` event listener inside `setupEventDelegation` (live search path). `saveNewTeamFromDropdown`, `saveNewTournamentFromDropdown`, `addTeamFromProfile`, `addTournament`, and `addSeason` are called directly in the `keydown` handler inside `setupEventDelegation` (Enter-key path for add inputs). These are NOT dispatched via ACTIONS — they bypass the routing table entirely. They must be imported in both `actions.js` (for click-delegation) and `main.js` (for keydown delegation).

- [ ] **Step 2: Remove the `WRITE_ACTIONS` and `ACTIONS` declarations from `main.js`**

Delete lines 18–88 (the `const WRITE_ACTIONS = ...` block and the entire `const ACTIONS = { ... }` block).

- [ ] **Step 3: Remove the `updateDateLabel` and `setupDateToggle` function declarations from `main.js`**

Delete lines 90–123 (both function definitions).

- [ ] **Step 4: Verify the bootstrap still calls both date functions correctly**

The bootstrap `window.addEventListener('load', ...)` should contain (unchanged):
```js
document.getElementById('date').value = today;
updateDateLabel(today);
setupDateToggle();
```
These now resolve from the `log.js` import. No change needed — just confirm the calls are present.

- [ ] **Step 5: Open app in browser, verify full functionality**

Test the following manually:
- Page loads, no console errors
- Logging a match (score adjust, goals/assist adjust, save) works
- Date toggle opens/closes, date label updates correctly
- Editing a match via the stats modal works
- Team/tournament dropdowns open and select correctly
- Switching tabs (log/stats/profile/settings) works
- Language toggle works
- Auth overlay opens when clicking a write action while logged out
- Export CSV/PDF buttons fire (logged in)

- [ ] **Step 6: Commit**

```bash
git add js/main.js
git commit -m "refactor: trim main.js imports — ACTIONS and date-toggle now in dedicated modules"
```

---

### Task 4: Final verification and CLAUDE.md update

- [ ] **Step 1: Check final line count of main.js**

```bash
wc -l js/main.js
```

Expected: ~165 lines.

- [ ] **Step 2: Update the tech debt entry in `CLAUDE.md`**

Find the row:

```
| `main.js` er blitt et god-object: eier routing, auth-overlay, demo-banner, dato-toggle, cache og bootstrap | `main.js` | 🟡 Medium | 🟡 Delvis løst – auth-ui.js ekstrahert 2026-03-20. Gjenstår: ACTIONS-map og dato-toggle. |
```

Replace with:

```
| `main.js` er blitt et god-object: eier routing, auth-overlay, demo-banner, dato-toggle, cache og bootstrap | `main.js` | ✅ Ferdig | auth-ui.js ekstrahert 2026-03-20. ACTIONS-map → actions.js, dato-toggle → log.js 2026-03-21. |
```

- [ ] **Step 3: Add entry to `CHANGELOG.md`**

Add under today's date:
```
## 2026-03-21
- refactor: extract ACTIONS map to actions.js and date-toggle to log.js — main.js shrinks from 271 to ~165 lines
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md CHANGELOG.md
git commit -m "docs: mark main.js god-object debt resolved"
```
