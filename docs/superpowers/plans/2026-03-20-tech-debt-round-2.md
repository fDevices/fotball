# Tech Debt Round 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve code maintainability by splitting `main.js` (extract `auth-ui.js`), splitting `i18n.js` (extract `text-refresh.js`), and making `closeModal()` extensible via `MODAL_DEFAULTS`.

**Architecture:** Three independent file-level refactors with no new functionality. Each task moves existing code to a new module with clearly defined imports and exports — no logic changes. All inter-module wiring via ES module imports; cross-module side effects via existing custom DOM events.

> **Task order note:** The spec lists auth-ui.js first (decreasing risk order). This plan does text-refresh.js first — it's the simpler change (touches one import line in main.js vs a larger surgery), making it a safer warm-up before the main.js split. Both tasks are independent; the reversal does not create dependencies.

**Tech Stack:** Vanilla JS ES modules, no build step, no test framework (manual browser verification). Supabase REST API. Runs directly in browser via `file://` or Vercel.

**Spec:** `docs/superpowers/specs/2026-03-20-tech-debt-round-2-design.md`

---

## Prerequisites

There are uncommitted changes in the working tree from recent feature work. Commit them before starting:

- [ ] **Commit pending changes**

```bash
git add app.html js/auth.js js/export.js js/main.js js/modal.js js/profile.js CLAUDE.md
git commit -m "feat: auth, first-login flow, and avatar storage migration"
```

---

## File Map

| File | Action | Responsibility after this plan |
|---|---|---|
| `js/text-refresh.js` | **Create** | DOM text/flag updates: `setLang`, `updateFlags`, `updateAllText` |
| `js/auth-ui.js` | **Create** | Auth overlay, login/signup handlers, demo banner |
| `js/i18n.js` | **Modify** | Pure dictionary only: `TEKST`, `t()`, `toggleLangPicker()` |
| `js/main.js` | **Modify** | Bootstrap + event delegation only — no auth/banner logic |
| `js/modal.js` | **Modify** | Add `MODAL_DEFAULTS`; refactor `closeModal()` |
| `CLAUDE.md` | **Modify** | Update filstruktur, avhengighetsgraf, gjeldstabell |

---

## Task 1 — Create `text-refresh.js` and strip `i18n.js`

**Files:**
- Create: `js/text-refresh.js`
- Modify: `js/i18n.js` (remove `setLang`, `updateFlags`, `updateAllText`, `showToastLang`; remove `saveSettings` from import)
- Modify: `js/main.js` (update import line 5 only)

- [ ] **Step 1: Create `js/text-refresh.js`**

The entire content (copy `updateAllText`, `updateFlags`, `setLang` + the private `showToastLang` from `i18n.js`, add new imports at top):

```js
import { t } from './i18n.js';
import { getSettings, saveSettings } from './settings.js';

export function setLang(lang) {
  var s = getSettings();
  s.lang = lang;
  saveSettings(s);
  document.querySelectorAll('.lang-picker-dropdown').forEach(function(d) { d.classList.remove('open'); });
  updateFlags();
  updateAllText();
  document.dispatchEvent(new CustomEvent('athlytics:toast', {
    detail: { msg: lang === 'no' ? '🇳🇴 Norsk' : '🇬🇧 English', type: 'success' }
  }));
}

export function updateFlags() {
  var s = getSettings();
  var flag = s.lang === 'en' ? '🇬🇧' : '🇳🇴';
  document.querySelectorAll('.lang-flag-btn').forEach(function(btn) {
    btn.textContent = flag;
  });
}

export function updateAllText() {
  var labels = {
    'label-date': 'date', 'label-opponent': 'opponentTeam',
    'label-egetlag': 'own_team', 'label-turnering': 'turnering',
    'label-goals': 'goals', 'label-assist': 'assist',
    'label-home': 'home_label', 'label-away': 'away_label',
    'label-matchType': 'match_type_label', 'label-result': 'result_label'
  };
  Object.keys(labels).forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.textContent = t(labels[id]);
  });
  var ph = {
    'opponent': 'ph_opponent',
    'profil-name': 'ph_navn', 'profil-club': 'ph_klubb', 'profil-posisjon': 'ph_posisjon',
    'profile-new-tournament': 'ph_add_tournament', 'profile-team-input': 'ph_add_team', 'settings-ny-sesong': 'ph_new_season',
    'team-new-input': 'ph_new_team', 'tournament-new-input': 'ph_new_tournament'
  };
  Object.keys(ph).forEach(function(id) {
    var el = document.getElementById(id);
    if (el) el.placeholder = t(ph[id]);
  });
  var dateLabel = document.getElementById('date-display-label');
  if (dateLabel) dateLabel.textContent = t('today');
  var teamNewSave = document.getElementById('team-new-save-btn');
  if (teamNewSave) teamNewSave.textContent = t('add_item');
  var tournamentNewSave = document.getElementById('tournament-new-save-btn');
  if (tournamentNewSave) tournamentNewSave.textContent = t('add_item');
  var statsOverview = document.getElementById('stats-view-btn-overview');
  if (statsOverview) statsOverview.textContent = t('stats_overview');
  var statsAnalyseText = document.getElementById('stats-analyse-text');
  if (statsAnalyseText) statsAnalyseText.textContent = t('stats_analyse');
  var spillerinfo = document.getElementById('profil-card-spillerinfo');
  if (spillerinfo) spillerinfo.textContent = t('spillerinfo');
  var labelName = document.getElementById('profil-label-name');
  if (labelName) labelName.textContent = t('name');
  var labelClub = document.getElementById('profil-label-club');
  if (labelClub) labelClub.textContent = t('club');
  var labelPosisjon = document.getElementById('profil-label-posisjon');
  if (labelPosisjon) labelPosisjon.textContent = t('posisjon');
  var tournamentsTitle = document.getElementById('profil-card-tournaments');
  if (tournamentsTitle) tournamentsTitle.textContent = t('tournaments_title');
  var teamsTitle = document.getElementById('profil-card-teams');
  if (teamsTitle) teamsTitle.textContent = t('mine_lag');
  var profilSaved = document.getElementById('profil-saved');
  if (profilSaved) profilSaved.textContent = t('saved');
  var btnSave = document.getElementById('submit-btn');
  if (btnSave) btnSave.textContent = t('save_match');
  var btnProfile = document.getElementById('btn-save-profil');
  if (btnProfile) btnProfile.textContent = t('save_profile');
  var btnHome = document.getElementById('btn-home-toggle');
  var btnAway = document.getElementById('btn-away-toggle');
  if (btnHome) { var spH = btnHome.querySelector('span'); if (spH) spH.textContent = t('hjemmekamp'); }
  if (btnAway) { var spA = btnAway.querySelector('span'); if (spA) spA.textContent = t('bortekamp'); }
  var teamTxt = document.getElementById('team-selected-text');
  if (teamTxt && teamTxt.classList.contains('placeholder')) {
    teamTxt.textContent = t('select_team');
  }
  var tournamentTxt = document.getElementById('tournament-selected-text');
  if (tournamentTxt && !tournamentTxt._selected) {
    tournamentTxt.textContent = t('select_tournament');
  }
  var tabKeys = { log: 'tab_log', stats: 'tab_stats', profil: 'tab_profile', settings: 'tab_settings' };
  ['log','stats','profil','settings'].forEach(function(tab) {
    var el = document.querySelector('#tab-' + tab + ' .tab-label');
    if (el) el.textContent = t(tabKeys[tab]);
  });

  // IMPORTANT: keep this dispatch — main.js listens to call renderLogSub(), updateResult(), updateLogBadge()
  document.dispatchEvent(new CustomEvent('athlytics:updateAllText'));

  var profileTitle = document.getElementById('profil-title');
  if (profileTitle) {
    var titleParts = t('profile_title').split(' ');
    // innerHTML intentional: wraps second word in <span> for split-colour heading style
    profileTitle.innerHTML = titleParts[0] + (titleParts.length > 1 ? '<span> ' + titleParts.slice(1).join(' ') + '</span>' : '');
  }
  var profileSub = document.getElementById('profil-sub');
  if (profileSub) profileSub.textContent = t('profile_sub');
  var promptTitle = document.getElementById('profile-prompt-title');
  if (promptTitle) promptTitle.textContent = t('profile_prompt_title');
  var promptDesc = document.getElementById('profile-prompt-desc');
  if (promptDesc) promptDesc.textContent = t('profile_prompt_desc');
  var promptSkip = document.getElementById('profile-prompt-skip');
  if (promptSkip) promptSkip.textContent = t('profile_prompt_skip');
  var settingsSub = document.getElementById('settings-sub');
  if (settingsSub) settingsSub.textContent = t('settings_sub');
  if (document.getElementById('screen-settings') &&
      document.getElementById('screen-settings').classList.contains('active')) {
    document.dispatchEvent(new CustomEvent('athlytics:renderSettings'));
  }
}
```

- [ ] **Step 2: Strip `i18n.js`**

Replace the first line of `i18n.js`:
```js
// Before:
import { getSettings, saveSettings } from './settings.js';

// After:
import { getSettings } from './settings.js';
```

Delete the four functions from `i18n.js` (lines 197–320): `setLang`, `showToastLang`, `updateFlags`, `updateAllText`. Keep only `TEKST`, `t()`, and `toggleLangPicker()`. The resulting `i18n.js` ends at the closing brace of `toggleLangPicker`.

- [ ] **Step 3: Update `main.js` import line 5**

```js
// Before (line 5):
import { t, setLang, toggleLangPicker, updateFlags, updateAllText } from './i18n.js';

// After (replace line 5 with two lines):
import { t, toggleLangPicker } from './i18n.js';
import { setLang, updateFlags, updateAllText } from './text-refresh.js';
```

- [ ] **Step 4: Open app in browser, check console for errors**

Open `app.html` (or via local server). Verify:
- No console errors on load
- All tab labels show correct text (Logg, Statistikk, Profil, Innstillinger)
- Language switch (🇳🇴 / 🇬🇧 flag button) updates all labels and flags
- `updateAllText()` on bootstrap: all placeholders are Norwegian by default

- [ ] **Step 5: Commit**

```bash
git add js/text-refresh.js js/i18n.js js/main.js
git commit -m "refactor: extract text-refresh.js from i18n.js — DOM update functions in own module"
```

---

## Task 2 — Create `auth-ui.js` and strip `main.js`

**Files:**
- Create: `js/auth-ui.js`
- Modify: `js/main.js` (remove auth/banner section, update imports, update ACTIONS map)

- [ ] **Step 1: Create `js/auth-ui.js`**

```js
import { isAuthenticated } from './auth.js';
import { fetchProfileFromSupabase, loadProfileData, getProfile, isProfileComplete } from './profile.js';
import { switchTab } from './navigation.js';
import { t } from './i18n.js';
import { PROFIL_KEY, SETTINGS_KEY, CACHE_KEY } from './config.js';

var _demoBannerDismissed = false;

// Removes stale profile/settings caches on fresh login.
// Do NOT replace with auth.js:clearSession() — that would also remove the session token just created.
function _clearCaches() {
  localStorage.removeItem(PROFIL_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  sessionStorage.removeItem(CACHE_KEY);
}

export function openAuthOverlay(view) {
  var overlay = document.getElementById('auth-overlay');
  if (overlay) overlay.classList.remove('hidden');
  showAuthView(view || 'login');
}

export function closeAuthOverlay() {
  var overlay = document.getElementById('auth-overlay');
  if (overlay) overlay.classList.add('hidden');
}

function showAuthView(view) {
  var loginView  = document.getElementById('auth-login-view');
  var signupView = document.getElementById('auth-signup-view');
  if (!loginView || !signupView) return;
  if (view === 'signup') {
    loginView.classList.add('hidden');
    signupView.classList.remove('hidden');
  } else {
    signupView.classList.add('hidden');
    loginView.classList.remove('hidden');
  }
}

export function toggleAuthView() {
  var loginView = document.getElementById('auth-login-view');
  var isLoginVisible = loginView && !loginView.classList.contains('hidden');
  showAuthView(isLoginVisible ? 'signup' : 'login');
}

function showAuthError(viewId, msg) {
  var el = document.getElementById(viewId);
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}

function clearAuthErrors() {
  ['auth-login-error', 'auth-signup-error'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) { el.textContent = ''; el.classList.add('hidden'); }
  });
}

// Exported so main.js ACTIONS map can call them directly.
// These are implementation details — only main.js should call them.
export async function handleAuthLogin() {
  clearAuthErrors();
  var email    = (document.getElementById('auth-login-email')    || {}).value || '';
  var password = (document.getElementById('auth-login-password') || {}).value || '';
  var { login: authLogin } = await import('./auth.js');
  var result = await authLogin(email, password);
  if (result.error) { showAuthError('auth-login-error', result.error); return; }
  closeAuthOverlay();
  _clearCaches();
  var p = await fetchProfileFromSupabase();
  loadProfileData(p);
  switchTab(isProfileComplete() ? 'log' : 'profile');
  updateDemoBanner();
}

export async function handleAuthSignup() {
  clearAuthErrors();
  var email    = (document.getElementById('auth-signup-email')    || {}).value || '';
  var password = (document.getElementById('auth-signup-password') || {}).value || '';
  var confirm  = (document.getElementById('auth-signup-confirm')  || {}).value || '';
  if (password !== confirm) {
    showAuthError('auth-signup-error', t('auth_error_pw_mismatch'));
    return;
  }
  var { signup: authSignup } = await import('./auth.js');
  var result = await authSignup(email, password);
  if (result.error) { showAuthError('auth-signup-error', result.error); return; }
  closeAuthOverlay();
  _clearCaches();
  loadProfileData(getProfile());
  switchTab('profile');
  updateDemoBanner();
}

export function updateDemoBanner() {
  var banner = document.getElementById('demo-banner');
  if (!banner) return;
  if (isAuthenticated() || _demoBannerDismissed) {
    banner.classList.add('hidden');
  } else {
    banner.classList.remove('hidden');
  }
}

export function dismissDemoBanner() {
  _demoBannerDismissed = true;
  updateDemoBanner();
}
```

- [ ] **Step 2: Update `main.js` imports (top of file)**

Replace the import block at lines 1–15 with:

```js
import { fetchProfileFromSupabase, loadProfileData, renderLogSub, saveProfile, updateAvatar, uploadImage, dismissProfilePrompt, updateProfilePrompt, getProfile, isProfileComplete } from './profile.js';
import { getSettings, getDateLocale } from './settings.js';
import { renderTeamDropdown, renderTournamentDropdown, renderProfileTeamList, renderProfileTournamentList, selectTeam, selectTournament, toggleTeamDropdown, toggleTournamentDropdown, saveNewTeamFromDropdown, saveNewTournamentFromDropdown, toggleNewTeamInput, toggleNewTournamentInput, addTeamFromProfile, addTournament, deleteTeam, deleteTournament, setFavoriteTeam, setFavoriteTournament, closeAllDropdowns, toggleModalTeamDropdown, toggleModalTournamentDropdown, selectModalTeam, selectModalTournament } from './teams.js';
import { switchTab, updateLogBadge } from './navigation.js';
import { t, toggleLangPicker } from './i18n.js';
import { setLang, updateFlags, updateAllText } from './text-refresh.js';
import { loadStats, switchStatsView, setSeason, setTeamFilter, setTournamentFilter, setMatchPage, setOpponentSearch } from './stats-overview.js';
import { destroyCharts, initChartDefaults } from './stats-analyse.js';
import { adjust, saveMatch, setMatchType, updateResult } from './log.js';
import { openEditModal, closeModal, setModalMatchType, modalAdjust, saveEditedMatch, deleteMatch, cancelDeleteMatch, confirmDeleteMatch } from './modal.js';
import { openAssessmentSheet, closeAssessmentSheet, saveAssessment, setRating } from './assessment.js';
import { exportCSV, exportPDF } from './export.js';
import { renderSettings, setSport, setSeasonFormat, setDateFormat, setActiveSeason, addSeason, applyTheme } from './settings-render.js';
import { showToast } from './toast.js';
import { restoreSession, isAuthenticated, logout } from './auth.js';
import { openAuthOverlay, closeAuthOverlay, updateDemoBanner, dismissDemoBanner, toggleAuthView, handleAuthLogin, handleAuthSignup } from './auth-ui.js';
```

- [ ] **Step 3: Remove the auth/banner section from `main.js`**

Delete everything between the imports and the ACTIONS map, specifically:
- The `// ── Auth helpers ──` section (lines 17–23: `_clearCaches` function)
- `const WRITE_ACTIONS` — **keep this**
- `var _demoBannerDismissed = false;` — **delete this line**
- The `// ── Auth overlay ─` section (lines 99–189): all of `openAuthOverlay`, `closeAuthOverlay`, `showAuthView`, `toggleAuthView`, `showAuthError`, `clearAuthErrors`, `handleAuthLogin`, `handleAuthSignup`, `updateDemoBanner`

> **Important:** After deleting the local function bodies, `openAuthOverlay` and `updateDemoBanner` remain active call sites in `main.js` at two locations outside the ACTIONS map:
> - Line ~330: `openAuthOverlay('login')` inside the `athlytics:requireAuth` event listener
> - Line ~366: `updateDemoBanner()` inside the `window.load` bootstrap handler
>
> Do NOT touch these lines — they will resolve correctly via the `auth-ui.js` import added in Step 2.

- [ ] **Step 4: Update the `dismissDemoBanner` ACTIONS entry**

```js
// Before:
dismissDemoBanner:   () => { _demoBannerDismissed = true; updateDemoBanner(); },

// After:
dismissDemoBanner:   () => dismissDemoBanner(),
```

Also update these three entries that previously called local functions (now imported):
```js
authToggleView:      () => toggleAuthView(),
authLogin:           () => handleAuthLogin(),
authSignup:          () => handleAuthSignup(),
```
These three lines are already correct in form — just confirm that `toggleAuthView`, `handleAuthLogin`, `handleAuthSignup` resolve to the newly imported functions (they will since they're now in scope from the `auth-ui.js` import).

- [ ] **Step 5: Open app in browser, check console for errors**

Verify:
- No console errors on load
- Login flow: click login button → overlay opens → enter credentials → overlay closes → correct tab shown
- Signup flow: click signup → enter details → account created → profile tab shown
- Demo banner: visible when not logged in, hidden after login
- Demo banner: dismiss button hides it; page refresh shows it again (in-memory dismiss only)
- Auth errors: wrong password shows inline error message (not a toast)

- [ ] **Step 6: Commit**

```bash
git add js/auth-ui.js js/main.js
git commit -m "refactor: extract auth-ui.js from main.js — auth overlay and demo banner in own module"
```

---

## Task 3 — Refactor `closeModal()` with `MODAL_DEFAULTS`

**Files:**
- Modify: `js/modal.js`

- [ ] **Step 1: Add `MODAL_DEFAULTS` constant**

Insert this block immediately after the import block at the top of `modal.js` (before `var modalMatchId`):

```js
const MODAL_DEFAULTS = {
  mHome: 0, mAway: 0, mGoals: 0, mAssists: 0, mMatchType: 'home',
  'modal-dato': '', 'modal-motstander': '',
  'modal-assess-reflection-good': '', 'modal-assess-reflection-improve': ''
};
```

Note: `modal-home`, `modal-away`, `modal-goals`, `modal-assist` are `textContent` display elements — they are NOT included here because `openEditModal()` always overwrites them before the modal is visible.

- [ ] **Step 2: Replace `closeModal()`**

Replace the entire `closeModal` function (lines 47–62) with:

```js
export function closeModal() {
  resetAssessmentState();
  document.getElementById('modal-backdrop').classList.remove('open');
  document.getElementById('modal-sheet').classList.remove('open');
  document.body.style.overflow = '';
  modalMatchId = null;
  mMatchType = MODAL_DEFAULTS.mMatchType;
  mHome = MODAL_DEFAULTS.mHome; mAway = MODAL_DEFAULTS.mAway;
  mGoals = MODAL_DEFAULTS.mGoals; mAssists = MODAL_DEFAULTS.mAssists;
  ['modal-dato', 'modal-motstander', 'modal-assess-reflection-good', 'modal-assess-reflection-improve'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.value = MODAL_DEFAULTS[id];
  });
  ['modal-team-dropdown', 'modal-tournament-dropdown'].forEach(function(id) {
    var dd = document.getElementById(id); if (dd) dd.classList.remove('open');
  });
}
```

- [ ] **Step 3: Open app in browser, test modal reset**

Verify:
- Open edit modal on any match → edit the opponent name and reflection fields → close without saving → open a *different* match → fields show the new match's data (not the previously edited values)
- Open edit modal → save → modal closes cleanly
- Open edit modal → delete → confirm → modal closes cleanly
- No console errors

- [ ] **Step 4: Commit**

```bash
git add js/modal.js
git commit -m "refactor: closeModal uses MODAL_DEFAULTS for extensible field reset"
```

---

## Task 4 — Update `CLAUDE.md`

**Files:**
- Modify: `CLAUDE.md`

- [ ] **Step 1: Add `auth-ui.js` and `text-refresh.js` to the filstruktur table**

In the `## Filstruktur` section, add these two lines (after `i18n.js` and before `profile.js`):

```
  auth-ui.js            – auth overlay (open/close/toggle view), login/signup handlers, demo banner
  text-refresh.js       – DOM text and flag updates: setLang(), updateFlags(), updateAllText()
```

- [ ] **Step 2: Update the avhengighetsgraf**

Add `auth-ui.js` as a node between `auth.js` and `profile.js`/`navigation.js`:
```
auth-ui.js  ←  auth.js, profile.js, navigation.js, i18n.js, config.js
    ↓
  main.js
```

Add `text-refresh.js` as:
```
text-refresh.js  ←  i18n.js, settings.js
    ↓
  main.js
```

- [ ] **Step 3: Mark resolved gjeld items**

In the `### i18n.js` gjeldstabell, mark the dobbeltansvar item:
```
| `i18n.js` har vokst fra oversettelsesordbok til global tekst-refresh-kontroller | ✅ Løst | Tekst-refresh ekstrahert til text-refresh.js |
```

In the `### main.js / app.html` gjeldstabell:
```
| `main.js` er blitt et god-object | 🟡 Delvis løst | auth-ui.js ekstrahert; ACTIONS-map og bootstrap gjenstår |
```

- [ ] **Step 4: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md — filstruktur, avhengighetsgraf, gjeld for text-refresh.js and auth-ui.js"
```

---

## Final verification checklist

Before calling the work done, confirm all items from the spec:

- [ ] Login flow works end-to-end
- [ ] Signup flow works end-to-end
- [ ] Demo banner visible/hidden/dismissable correctly; reappears on refresh
- [ ] Language switch updates all text and flags; correct tab labels after switching
- [ ] Bootstrap: all labels and placeholders correct on first load
- [ ] `athlytics:updateAllText` event fires → `main.js` calls `renderLogSub()`, `updateResult()`, `updateLogBadge()`
- [ ] Edit modal: open → edit reflections → close without saving → reopen any match → reflection textareas show new match's data
- [ ] Edit modal: open → edit → save → all fields reset on close
- [ ] No console errors on any tab (Logg, Statistikk, Profil, Innstillinger)
