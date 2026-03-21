# Accessibility Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add screen reader support (VoiceOver/TalkBack) to the Athlytics Sport SPA with zero visual change.

**Architecture:** Three layers of change — (1) semantic HTML and ARIA attributes in `app.html`, (2) focus management utilities in `utils.js` and focus trap/restore logic in modal JS files, (3) dynamic ARIA state (`aria-expanded`, `aria-selected`) maintained in `teams.js` and `navigation.js`.

**Tech Stack:** Vanilla JS ES modules, no test framework — verification is manual in-browser. No external dependencies added.

**Spec:** `docs/superpowers/specs/2026-03-21-accessibility-pass-design.md`

---

## File Map

| File | What changes |
|---|---|
| `app.html` | `<main>`, `<section>`, `<form novalidate>`, `role="group"`, `aria-live`, modal ARIA, dropdown trigger ARIA + new ids, tab ARIA, auth form cleanup |
| `style.css` | Add `.sr-only` utility class |
| `js/utils.js` | Add `getFocusableElements()`, `trapFocus()` |
| `js/modal.js` | Focus save/restore + trap for edit modal and delete confirm |
| `js/assessment.js` | Focus save/restore + trap for assessment sheet |
| `js/auth-ui.js` | Focus save/restore + trap for auth overlay; `showAuthView()` updates sr-only title |
| `js/navigation.js` | `aria-selected` toggling in `switchTab()` |
| `js/teams.js` | `role="option"` + `aria-selected` on options; `aria-expanded` on triggers |
| `js/main.js` | `submit` event handler for log form |

---

## Task 1: Semantic HTML Structure (`app.html`)

**Files:**
- Modify: `app.html`

- [ ] **Step 1: Wrap screens in `<main>` and convert to `<section>`**

  In `app.html`, just before the `<!-- LOGG -->` comment (line ~72), add `<main>`. Close `</main>` just before `<nav class="tab-bar">` (line ~386).

  Change all four `<div class="screen"` → `<section class="screen"` (and closing `</div>` → `</section>`). Add `aria-label` to each:

  ```html
  <section class="screen active" id="screen-log" aria-label="Match log">
  <section class="screen" id="screen-stats" aria-label="Statistics">
  <section class="screen" id="screen-profil" aria-label="Profile">
  <section class="screen" id="screen-settings" aria-label="Settings">
  ```

- [ ] **Step 2: Convert log form to `<form>` and clean up auth forms**

  Change `<div class="form-body">` (log tab, line ~87) → `<form class="form-body" novalidate>` and its closing `</div>` → `</form>`.

  Add `type="submit"` to `#submit-btn`:
  ```html
  <button class="submit-btn" id="submit-btn" type="submit" data-action="saveMatch">
  ```

  On the two auth `<form>` elements (lines ~35 and ~49), remove `onsubmit="return false"` — leave only `<form novalidate>`:
  ```html
  <form novalidate>
  ```

- [ ] **Step 3: Add `role="group"` to score and stats rows**

  Find the score row wrapper `<div class="score-row">` (line ~149) and the stats number row `<div class="number-row">` (line ~169). Add group role pointing at existing label ids:

  ```html
  <div class="score-row" role="group" aria-labelledby="label-home">
  <div class="number-row" role="group" aria-labelledby="label-goals">
  ```

- [ ] **Step 4: Add `aria-live` to display spans and toast**

  Add `aria-live="polite"` to the four log-form display spans:
  ```html
  <span class="num-display" id="home-display" aria-live="polite">0</span>
  <span class="num-display" id="away-display" aria-live="polite">0</span>
  <span class="num-display" id="goals-display" aria-live="polite">0</span>
  <span class="num-display" id="assist-display" aria-live="polite">0</span>
  ```

  Add `aria-live="polite"` to the four modal display spans:
  ```html
  <span class="num-display" id="modal-home" aria-live="polite">0</span>
  <span class="num-display" id="modal-away" aria-live="polite">0</span>
  <span class="num-display" id="modal-goals" aria-live="polite">0</span>
  <span class="num-display" id="modal-assist" aria-live="polite">0</span>
  ```

  Add `aria-live="polite" aria-atomic="true"` to `#toast`:
  ```html
  <div class="toast" id="toast" aria-live="polite" aria-atomic="true"></div>
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add app.html
  git commit -m "feat(a11y): semantic HTML — main, section, form, role=group, aria-live"
  ```

---

## Task 2: Modal ARIA Attributes + `.sr-only` (`app.html`, `style.css`)

**Files:**
- Modify: `app.html`, `style.css`

- [ ] **Step 1: Add ARIA to modals**

  On `#modal-sheet` (line ~421): add `role="dialog" aria-modal="true" aria-labelledby="modal-title"`.

  On `#assessment-sheet` (line ~516): add `role="dialog" aria-modal="true" aria-labelledby="assess-title"`.

  On `#delete-confirm-dialog` (line ~409): add `role="alertdialog" aria-modal="true" aria-labelledby="delete-confirm-title"`.

  On `<div class="delete-confirm-title">` (line ~411): add `id="delete-confirm-title"`.

- [ ] **Step 2: Set up auth modal ARIA with sr-only title**

  On the inner `<div class="auth-modal">` (line ~29): add `id="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-dialog-title"`.

  Add a visually-hidden title element as the first child of `#auth-modal` (above `<!-- Login view -->`):
  ```html
  <h2 id="auth-dialog-title" class="sr-only"></h2>
  ```

- [ ] **Step 3: Add `.sr-only` to `style.css`**

  Append to the end of `style.css` (before the final closing if any):
  ```css
  /* Screen-reader only — visually hidden but announced by AT */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  ```

- [ ] **Step 4: Verify visually**

  Open `app.html` in a browser. The page should look completely unchanged — the `.sr-only` element is invisible and the ARIA attributes have no visual effect.

- [ ] **Step 5: Commit**

  ```bash
  git add app.html style.css
  git commit -m "feat(a11y): modal ARIA roles and sr-only utility"
  ```

---

## Task 3: Tab Bar + Dropdown ARIA (`app.html`)

**Files:**
- Modify: `app.html`

- [ ] **Step 1: Add ARIA to tab bar**

  On `<nav class="tab-bar">` (line ~386): add `aria-label="Main navigation"`.

  Add `role="tab"` and initial `aria-selected` to each tab button:
  ```html
  <button class="tab-btn active" id="tab-log" role="tab" aria-selected="true" data-action="switchTab" data-tab="log">
  <button class="tab-btn" id="tab-stats" role="tab" aria-selected="false" data-action="switchTab" data-tab="stats">
  <button class="tab-btn" id="tab-profil" role="tab" aria-selected="false" data-action="switchTab" data-tab="profil">
  <button class="tab-btn" id="tab-settings" role="tab" aria-selected="false" data-action="switchTab" data-tab="settings">
  ```

- [ ] **Step 2: Add ARIA to log-screen team trigger**

  Find `<div class="team-selected" id="team-selected"` (line ~111). Add:
  ```html
  <div class="team-selected" id="team-selected"
    role="combobox" aria-haspopup="listbox"
    aria-expanded="false" aria-controls="team-dropdown"
    data-action="toggleTeamDropdown">
  ```

  Add `role="listbox"` to `#team-dropdown`:
  ```html
  <div class="team-dropdown" id="team-dropdown" role="listbox">
  ```

- [ ] **Step 3: Add ARIA to log-screen tournament trigger**

  Find the tournament trigger div (the `.team-selected` inside `#tournament-selector-wrap`, line ~129). Add `id` and ARIA:
  ```html
  <div class="team-selected" id="tournament-trigger"
    role="combobox" aria-haspopup="listbox"
    aria-expanded="false" aria-controls="tournament-dropdown"
    data-action="toggleTournamentDropdown">
  ```

  Add `role="listbox"` to `#tournament-dropdown`:
  ```html
  <div class="team-dropdown" id="tournament-dropdown" role="listbox">
  ```

- [ ] **Step 4: Add ARIA to modal team trigger**

  Find the modal team trigger div (`.team-selected` inside `#modal-sheet`, line ~446). Add `id` and ARIA:
  ```html
  <div class="team-selected" id="modal-team-trigger"
    role="combobox" aria-haspopup="listbox"
    aria-expanded="false" aria-controls="modal-team-dropdown"
    data-action="toggleModalTeamDropdown">
  ```

  Add `role="listbox"` to `#modal-team-dropdown`:
  ```html
  <div class="team-dropdown" id="modal-team-dropdown" role="listbox">
  ```

- [ ] **Step 5: Add ARIA to modal tournament trigger**

  Find the modal tournament trigger div (`.team-selected` inside `#modal-sheet`, line ~459). Add `id` and ARIA:
  ```html
  <div class="team-selected" id="modal-tournament-trigger"
    role="combobox" aria-haspopup="listbox"
    aria-expanded="false" aria-controls="modal-tournament-dropdown"
    data-action="toggleModalTournamentDropdown">
  ```

  Add `role="listbox"` to `#modal-tournament-dropdown`:
  ```html
  <div class="team-dropdown" id="modal-tournament-dropdown" role="listbox">
  ```

- [ ] **Step 6: Commit**

  ```bash
  git add app.html
  git commit -m "feat(a11y): tab bar and dropdown ARIA roles and attributes"
  ```

---

## Task 4: Focus Utilities (`js/utils.js`)

**Files:**
- Modify: `js/utils.js`

- [ ] **Step 1: Add `getFocusableElements` and `trapFocus`**

  Append to the end of `js/utils.js`:

  ```js
  export function getFocusableElements(container) {
    return Array.from(container.querySelectorAll(
      'button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    ));
  }

  export function trapFocus(container, event) {
    if (event.key !== 'Tab') return;
    var focusable = getFocusableElements(container);
    if (!focusable.length) { event.preventDefault(); return; }
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey) {
      if (document.activeElement === first) { event.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }
  ```

- [ ] **Step 2: Verify no syntax errors**

  Open the app in a browser DevTools console. Run:
  ```js
  import('./js/utils.js').then(m => console.log(Object.keys(m)));
  ```
  Expected output includes: `["esc", "isDevPremium", "clampStats", "getResult", "getFocusableElements", "trapFocus"]`

- [ ] **Step 3: Commit**

  ```bash
  git add js/utils.js
  git commit -m "feat(a11y): add getFocusableElements and trapFocus to utils"
  ```

---

## Task 5: Edit Modal + Delete Confirm Focus Management (`js/modal.js`)

**Files:**
- Modify: `js/modal.js`

- [ ] **Step 1: Import focus utilities**

  Update the import from `./utils.js`:
  ```js
  import { clampStats, getFocusableElements, trapFocus } from './utils.js';
  ```

- [ ] **Step 2: Add module-level focus state variables**

  After the existing `var mState = ...` line, add:
  ```js
  var _savedFocus = null;
  var _savedDeleteFocus = null;
  var _trapHandlerEdit = null;
  var _trapHandlerDelete = null;
  ```

- [ ] **Step 3: Add focus management to `openEditModal`**

  At the start of `openEditModal`, before `var k = getAllMatches()...`, add:
  ```js
  _savedFocus = document.activeElement;
  ```

  At the end of `openEditModal`, just before the closing `}`, after `document.body.style.overflow = 'hidden';`, add:
  ```js
  var _sheet = document.getElementById('modal-sheet');
  _trapHandlerEdit = function(e) { trapFocus(_sheet, e); };
  _sheet.addEventListener('keydown', _trapHandlerEdit);
  setTimeout(function() {
    var f = getFocusableElements(_sheet);
    if (f[0]) f[0].focus();
  }, 50);
  ```

- [ ] **Step 4: Add focus restore to `closeModal`**

  At the end of `closeModal`, just before the closing `}`, add:
  ```js
  var _sheet = document.getElementById('modal-sheet');
  if (_trapHandlerEdit && _sheet) { _sheet.removeEventListener('keydown', _trapHandlerEdit); _trapHandlerEdit = null; }
  if (_savedFocus) { _savedFocus.focus(); _savedFocus = null; }
  ```

- [ ] **Step 5: Add focus management to `deleteMatch`**

  At the start of `deleteMatch`, after the `if (!modalMatchId) return;` guard, add:
  ```js
  _savedDeleteFocus = document.querySelector('[data-action="deleteMatch"]');
  ```

  At the end of `deleteMatch`, after the dialog `classList.add('open')` calls, add:
  ```js
  var _dialog = document.getElementById('delete-confirm-dialog');
  _trapHandlerDelete = function(e) { trapFocus(_dialog, e); };
  _dialog.addEventListener('keydown', _trapHandlerDelete);
  setTimeout(function() {
    var cancelBtn = document.querySelector('.delete-confirm-cancel');
    if (cancelBtn) cancelBtn.focus();
  }, 50);
  ```

- [ ] **Step 6: Add focus restore to `confirmDeleteMatch` and `cancelDeleteMatch`**

  Add a helper closure at module level (after the trap handler vars):
  ```js
  function _closeDeleteConfirm() {
    var _dialog = document.getElementById('delete-confirm-dialog');
    if (_trapHandlerDelete && _dialog) { _dialog.removeEventListener('keydown', _trapHandlerDelete); _trapHandlerDelete = null; }
    if (_savedDeleteFocus) { _savedDeleteFocus.focus(); _savedDeleteFocus = null; }
  }
  ```

  In `confirmDeleteMatch`, after the two `classList.remove('open')` calls at the top:
  ```js
  _closeDeleteConfirm();
  ```

  In `cancelDeleteMatch`, after the two `classList.remove('open')` calls:
  ```js
  _closeDeleteConfirm();
  ```

- [ ] **Step 7: Verify in browser**

  1. Open app, click any match row to open the edit modal.
  2. Press Tab — focus should cycle within the modal only (not escape to background).
  3. Press Shift+Tab from the first element — focus should jump to the last element.
  4. Click the ✕ close button — focus should return to the match row that was clicked.
  5. Click 🗑 Delete → confirm dialog opens, focus moves to "Avbryt" button.
  6. Press Tab — only the two dialog buttons are reachable.
  7. Click Avbryt — focus returns to the 🗑 button in the modal.

- [ ] **Step 8: Commit**

  ```bash
  git add js/modal.js
  git commit -m "feat(a11y): focus trap and restore for edit modal and delete confirm"
  ```

---

## Task 6: Assessment + Auth Focus Management (`js/assessment.js`, `js/auth-ui.js`)

**Files:**
- Modify: `js/assessment.js`, `js/auth-ui.js`

### `assessment.js`

- [ ] **Step 1: Import focus utilities**

  Add to the existing import from `./utils.js`:
  ```js
  import { isDevPremium, getFocusableElements, trapFocus } from './utils.js';
  ```

- [ ] **Step 2: Add module-level focus state**

  After the existing `var _activeContext = null;` line, add:
  ```js
  var _savedAssessFocus = null;
  var _trapHandlerAssess = null;
  ```

- [ ] **Step 3: Add focus management to `openAssessmentSheet`**

  At the start of `openAssessmentSheet`, before `resetState();`, add:
  ```js
  _savedAssessFocus = document.getElementById('submit-btn') || document.activeElement;
  ```

  At the end of `openAssessmentSheet`, after `document.body.style.overflow = 'hidden';`, add:
  ```js
  var _asheet = document.getElementById('assessment-sheet');
  _trapHandlerAssess = function(e) { trapFocus(_asheet, e); };
  _asheet.addEventListener('keydown', _trapHandlerAssess);
  setTimeout(function() {
    var f = getFocusableElements(_asheet);
    if (f[0]) f[0].focus();
  }, 50);
  ```

- [ ] **Step 4: Add focus restore to `closeAssessmentSheet`**

  At the end of `closeAssessmentSheet`, after `resetState();`, add:
  ```js
  var _asheet = document.getElementById('assessment-sheet');
  if (_trapHandlerAssess && _asheet) { _asheet.removeEventListener('keydown', _trapHandlerAssess); _trapHandlerAssess = null; }
  if (_savedAssessFocus) { _savedAssessFocus.focus(); _savedAssessFocus = null; }
  ```

### `auth-ui.js`

- [ ] **Step 5: Import focus utilities**

  Add to the existing imports at the top of `auth-ui.js`:
  ```js
  import { getFocusableElements, trapFocus } from './utils.js';
  ```

- [ ] **Step 6: Add module-level focus state**

  After `var _demoBannerDismissed = false;`, add:
  ```js
  var _savedAuthFocus = null;
  var _trapHandlerAuth = null;
  ```

- [ ] **Step 7: Update `openAuthOverlay` with focus management**

  At the start of `openAuthOverlay`, before `var overlay = ...`, add:
  ```js
  _savedAuthFocus = document.activeElement;
  ```

  At the end of `openAuthOverlay`, after `showAuthView(view || 'login');`, add:
  ```js
  var _modal = document.getElementById('auth-modal');
  if (_modal) {
    _trapHandlerAuth = function(e) { trapFocus(_modal, e); };
    _modal.addEventListener('keydown', _trapHandlerAuth);
    setTimeout(function() {
      var inputId = (view === 'signup') ? 'auth-signup-email' : 'auth-login-email';
      var input = document.getElementById(inputId);
      if (input) input.focus();
    }, 50);
  }
  ```

- [ ] **Step 8: Update `closeAuthOverlay` with focus restore**

  Replace the existing `closeAuthOverlay` body:
  ```js
  function closeAuthOverlay() {
    var overlay = document.getElementById('auth-overlay');
    if (overlay) overlay.classList.add('hidden');
    var _modal = document.getElementById('auth-modal');
    if (_trapHandlerAuth && _modal) { _modal.removeEventListener('keydown', _trapHandlerAuth); _trapHandlerAuth = null; }
    if (_savedAuthFocus) { _savedAuthFocus.focus(); _savedAuthFocus = null; }
  }
  ```

- [ ] **Step 9: Update `showAuthView` to set sr-only title**

  Add import for `t` if not already imported (it's not — add it):
  ```js
  import { t } from './i18n.js';
  ```

  At the end of `showAuthView`, after the view toggle logic, add:
  ```js
  var titleEl = document.getElementById('auth-dialog-title');
  if (titleEl) titleEl.textContent = view === 'signup' ? t('auth_signup_title') : t('auth_login_title');
  ```

- [ ] **Step 10: Verify in browser**

  1. Save a match → assessment sheet opens, focus goes to first button.
  2. Tab cycles within the sheet only.
  3. Close the sheet → focus returns to the save button.
  4. Click "Sign up free" banner → auth overlay opens, focus on email input.
  5. Tab cycles within the auth modal only.
  6. Log in successfully → overlay closes, focus returns to the banner button.

- [ ] **Step 11: Commit**

  ```bash
  git add js/assessment.js js/auth-ui.js
  git commit -m "feat(a11y): focus trap and restore for assessment sheet and auth overlay"
  ```

---

## Task 7: Tab `aria-selected` + Dropdown ARIA State (`js/navigation.js`, `js/teams.js`)

**Files:**
- Modify: `js/navigation.js`, `js/teams.js`

### `navigation.js`

- [ ] **Step 1: Add `aria-selected` toggling to `switchTab`**

  In `switchTab`, after the two `querySelectorAll` loops that remove `active` classes, add:
  ```js
  document.querySelectorAll('.tab-btn').forEach(function(b) {
    b.setAttribute('aria-selected', b === tabBtn ? 'true' : 'false');
  });
  ```

### `teams.js`

- [ ] **Step 2: Add `role="option"` + `aria-selected` to `renderTeamDropdown`**

  In `renderTeamDropdown`, inside the `forEach` where each `div` is created, add after `div.dataset.name = name;`:
  ```js
  div.setAttribute('role', 'option');
  div.setAttribute('aria-selected', selectedTeam === name ? 'true' : 'false');
  ```

- [ ] **Step 3: Add `role="option"` + `aria-selected` to `renderTournamentDropdown`**

  In `renderTournamentDropdown`, inside the `tournamentList.forEach` where each `div` is created, add after `div.dataset.name = name;`:
  ```js
  div.setAttribute('role', 'option');
  div.setAttribute('aria-selected', selectedTournament === name ? 'true' : 'false');
  ```

- [ ] **Step 4: Add `role="option"` + `aria-selected` to `renderModalTeamDropdown`**

  In `renderModalTeamDropdown`, inside the `teamList.forEach`, after `div.dataset.name = name;`:
  ```js
  div.setAttribute('role', 'option');
  div.setAttribute('aria-selected', modalSelectedTeam === name ? 'true' : 'false');
  ```

- [ ] **Step 5: Add `role="option"` + `aria-selected` to `renderModalTournamentDropdown`**

  In `renderModalTournamentDropdown`, inside the `tournamentList.forEach`, after `div.dataset.name = name;`:
  ```js
  div.setAttribute('role', 'option');
  div.setAttribute('aria-selected', modalSelectedTournament === name ? 'true' : 'false');
  ```

- [ ] **Step 6: Add `aria-expanded` toggling to all four toggle functions**

  In `toggleTeamDropdown`, after the `if (teamDropdownOpen) renderTeamDropdown();` line:
  ```js
  var _trigger = document.getElementById('team-selected');
  if (_trigger) _trigger.setAttribute('aria-expanded', String(teamDropdownOpen));
  ```

  In `closeLagDropdown` (the internal close function), after `if (nr) nr.classList.remove('visible');`:
  ```js
  var _trigger = document.getElementById('team-selected');
  if (_trigger) _trigger.setAttribute('aria-expanded', 'false');
  ```

  In `toggleTournamentDropdown`, after `dd.classList.toggle('open', !isOpen)`:
  ```js
  var _trigger = document.getElementById('tournament-trigger');
  if (_trigger) _trigger.setAttribute('aria-expanded', String(!isOpen));
  ```

  In `selectTournament`, after `dd.classList.remove('open')` (where the dropdown is closed):
  ```js
  var _trigger = document.getElementById('tournament-trigger');
  if (_trigger) _trigger.setAttribute('aria-expanded', 'false');
  ```

  In `toggleModalTeamDropdown`, after `dd.classList.toggle('open')` (capture `isOpen` from toggle return):
  ```js
  // The existing line is: var isOpen = dd.classList.toggle('open'); if (chev) chev.classList.toggle('open', isOpen);
  // After that line, add:
  var _trigger = document.getElementById('modal-team-trigger');
  if (_trigger) _trigger.setAttribute('aria-expanded', String(isOpen));
  ```

  In `selectModalTeam`, after `dd.classList.remove('open')`:
  ```js
  var _trigger = document.getElementById('modal-team-trigger');
  if (_trigger) _trigger.setAttribute('aria-expanded', 'false');
  ```

  In `toggleModalTournamentDropdown`, after `dd.classList.toggle('open')`:
  ```js
  // The existing line is: var isOpen = dd.classList.toggle('open'); if (chev) chev.classList.toggle('open', isOpen);
  // After that line, add:
  var _trigger = document.getElementById('modal-tournament-trigger');
  if (_trigger) _trigger.setAttribute('aria-expanded', String(isOpen));
  ```

  In `selectModalTournament`, after `dd.classList.remove('open')`:
  ```js
  var _trigger = document.getElementById('modal-tournament-trigger');
  if (_trigger) _trigger.setAttribute('aria-expanded', 'false');
  ```

  In `closeAllDropdowns`, after removing all dropdown open classes, add:
  ```js
  ['tournament-trigger', 'modal-team-trigger', 'modal-tournament-trigger'].forEach(function(id) {
    var t = document.getElementById(id); if (t) t.setAttribute('aria-expanded', 'false');
  });
  var teamTrigger = document.getElementById('team-selected');
  if (teamTrigger) teamTrigger.setAttribute('aria-expanded', 'false');
  ```

- [ ] **Step 7: Verify in browser**

  Open DevTools. Switch tabs and confirm `aria-selected="true"` moves to the active tab button. Open a team dropdown and check `aria-expanded="true"` on the trigger, `role="listbox"` on the container, `role="option"` on each item. Close and confirm `aria-expanded="false"`.

- [ ] **Step 8: Commit**

  ```bash
  git add js/navigation.js js/teams.js
  git commit -m "feat(a11y): aria-selected on tabs, aria-expanded and role=option on dropdowns"
  ```

---

## Task 8: Log Form Submit Handler (`js/main.js`)

**Files:**
- Modify: `js/main.js`

- [ ] **Step 1: Add form submit event listener**

  In `setupEventDelegation` in `main.js`, after the `change` event listener block (around line ~56), add:

  ```js
  // Log form submit (Enter key or submit button via <form>)
  document.addEventListener('submit', function(e) {
    if (e.target.id === 'log-form' || e.target.classList.contains('form-body')) {
      e.preventDefault();
      if (!isAuthenticated()) {
        document.dispatchEvent(new CustomEvent('athlytics:requireAuth'));
        return;
      }
      ACTIONS['saveMatch'] && ACTIONS['saveMatch'](e);
    }
  });
  ```

  **Note:** The log form has `class="form-body"` but no `id`. To be precise, add `id="log-form"` to the form element in `app.html` as well. Update the form tag to:
  ```html
  <form id="log-form" class="form-body" novalidate>
  ```
  Then the submit listener can use `e.target.id === 'log-form'`.

- [ ] **Step 2: Verify in browser**

  Open the log tab, fill in required fields (opponent, team), press Enter in any text field. Confirm the match save flow triggers without page reload.

- [ ] **Step 3: Commit**

  ```bash
  git add js/main.js app.html
  git commit -m "feat(a11y): handle log form submit event for Enter-key submission"
  ```

---

## Task 9: Push and CLAUDE.md Update

- [ ] **Step 1: Update CLAUDE.md debt entry**

  In `CLAUDE.md`, find the three accessibility debt rows and mark them done:
  ```
  | Semantisk HTML mangler ... | ✅ Ferdig 2026-03-21 |
  | Modaler mangler ARIA ... | ✅ Ferdig 2026-03-21 |
  | Custom dropdowns mangler keyboard/ARIA-støtte | ✅ Delvis – ARIA done 2026-03-21; keyboard nav deferred to Fase 3 |
  ```

- [ ] **Step 2: Push**

  ```bash
  git push
  ```
