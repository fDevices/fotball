# Tech Debt Round 2 — Design Spec

**Date:** 2026-03-20
**Scope:** Code quality and maintainability — three targeted refactors
**Approach:** Isolated changes with clear seams, minimal cross-file blast radius

---

## Overview

Three independent changes executed in order of decreasing risk:

1. Split `main.js` → extract `auth-ui.js` (auth overlay + demo banner)
2. Split `i18n.js` → extract `text-refresh.js` (DOM update functions)
3. Fix `closeModal()` → `MODAL_DEFAULTS` object for extensible reset

---

## Change 1 — Extract `auth-ui.js` from `main.js`

### Problem
`main.js` owns routing, event delegation, bootstrap, AND auth overlay + demo banner logic. Auth UI is a cohesive unit with no business being in the orchestrator.

### What moves to `auth-ui.js`

| Function | Notes |
|---|---|
| `openAuthOverlay(view)` | Shows overlay, calls `showAuthView` |
| `closeAuthOverlay()` | Hides overlay |
| `showAuthView(view)` | Toggles login/signup panels |
| `toggleAuthView()` | Flips between login and signup |
| `showAuthError(viewId, msg)` | Displays error message in auth form |
| `clearAuthErrors()` | Clears both error elements |
| `handleAuthLogin()` | Reads form, calls auth, loads profile, switches tab |
| `handleAuthSignup()` | Reads form, calls auth, loads profile, switches tab |
| `updateDemoBanner()` | Shows/hides demo banner based on auth + dismiss state |
| `_demoBannerDismissed` (var) | Module-private state |
| `_clearCaches()` (helper) | Clears localStorage/sessionStorage caches on auth change |

### Exports from `auth-ui.js`
```js
export { openAuthOverlay, closeAuthOverlay, updateDemoBanner, dismissDemoBanner }
```
`handleAuthLogin`, `handleAuthSignup`, `toggleAuthView` are module-private — called only from `main.js` ACTIONS map via imported wrappers.

`dismissDemoBanner()` must be exported because `_demoBannerDismissed` is private to `auth-ui.js`. The ACTIONS entry in `main.js` becomes `dismissDemoBanner: () => dismissDemoBanner()`.

> **Note on `_clearCaches()`:** This helper removes `PROFIL_KEY`, `SETTINGS_KEY`, and `CACHE_KEY` on fresh login. Do NOT replace it with a call to `auth.js:clearSession()` — `clearSession()` also removes the session token that was just created by a successful login/signup.

### Imports for `auth-ui.js`
- `./auth.js` — `isAuthenticated`, dynamic `login`, `signup`
- `./profile.js` — `fetchProfileFromSupabase`, `loadProfileData`, `getProfile`, `isProfileComplete`
- `./navigation.js` — `switchTab`
- `./i18n.js` — `t`
- `./config.js` — `PROFIL_KEY`, `SETTINGS_KEY`, `CACHE_KEY`

### `main.js` after split
- Removes all auth-overlay and demo banner functions
- Imports `openAuthOverlay`, `closeAuthOverlay`, `updateDemoBanner` from `./auth-ui.js`
- ACTIONS map entries for `openAuthOverlay`, `authToggleView`, `authLogin`, `authSignup`, `dismissDemoBanner` stay in `main.js` but delegate to imported functions
- Size: ~250 lines (down from 370)

---

## Change 2 — Extract `text-refresh.js` from `i18n.js`

### Problem
`i18n.js` has two distinct responsibilities: being a translation dictionary (`TEKST` + `t()`) and being a DOM refresh controller (`updateAllText()`, `updateFlags()`, `setLang()`). These belong in separate modules.

### Split

**`i18n.js` keeps:**
- `TEKST` dictionary
- `export function t(key)` — pure lookup
- `export function toggleLangPicker(btn)` — picker open/close UI, no text refresh

**`text-refresh.js` gets:**
- `export function updateAllText()` — updates all DOM text nodes on lang change or bootstrap
- `export function updateFlags()` — updates flag buttons
- `export function setLang(lang)` — saves lang setting, closes picker, calls `updateFlags()` + `updateAllText()`, dispatches toast

### Dependency direction
```
text-refresh.js → i18n.js (imports t())
text-refresh.js → settings.js (imports getSettings, saveSettings)
i18n.js → settings.js (imports getSettings for t())
```
No circular dependencies. `i18n.js` does NOT import from `text-refresh.js`.

> **Important:** `updateAllText()` ends with `document.dispatchEvent(new CustomEvent('athlytics:updateAllText'))`. This dispatch MUST be preserved when moving the function — `main.js` listens for this event to call `renderLogSub()`, `updateResult()`, and `updateLogBadge()`.

### `main.js` import change
```js
// Before:
import { t, setLang, toggleLangPicker, updateFlags, updateAllText } from './i18n.js';

// After:
import { t, toggleLangPicker } from './i18n.js';
import { setLang, updateFlags, updateAllText } from './text-refresh.js';
```

Other files that import from `i18n.js` (`modal.js`, `log.js`, `assessment.js`, etc.) only use `t()` — no changes needed there.

---

## Change 3 — `MODAL_DEFAULTS` in `modal.js`

### Problem
`closeModal()` resets module vars and DOM fields manually. Adding a new modal input requires changes in two places: state declaration and `closeModal()`.

### Solution

Define a single `MODAL_DEFAULTS` object at the top of `modal.js`:

```js
const MODAL_DEFAULTS = {
  mHome: 0, mAway: 0, mGoals: 0, mAssists: 0, mMatchType: 'home',
  'modal-dato': '', 'modal-motstander': '',
  'modal-assess-reflection-good': '', 'modal-assess-reflection-improve': ''
};
```

`closeModal()` iterates over `MODAL_DEFAULTS` to:
1. Reset module vars (`mHome`, `mAway`, etc.)
2. Clear input values (`modal-dato`, `modal-motstander`)

New modal inputs require only one addition to `MODAL_DEFAULTS` — nothing else.

### Score/stat display elements
`modal-home`, `modal-away`, `modal-goals`, `modal-assist` are `textContent` displays, not inputs. They don't need resetting on close — `openEditModal()` always overwrites them before the modal is visible. They are NOT included in `MODAL_DEFAULTS`.

### Reflection textareas
`modal-assess-reflection-good` and `modal-assess-reflection-improve` ARE included in `MODAL_DEFAULTS` and cleared in `closeModal()`. `resetAssessmentState()` only resets module-level vars (`_matchId`, `_ratings`, `_activeContext`) — it does NOT clear the DOM textarea values.

### Resulting `closeModal()`
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
  ['modal-dato', 'modal-motstander'].forEach(function(id) {
    var el = document.getElementById(id); if (el) el.value = MODAL_DEFAULTS[id];
  });
  ['modal-team-dropdown', 'modal-tournament-dropdown'].forEach(function(id) {
    var dd = document.getElementById(id); if (dd) dd.classList.remove('open');
  });
}
```

---

## Files created / modified

| File | Change |
|---|---|
| `js/auth-ui.js` | **New** — extracted from `main.js` |
| `js/text-refresh.js` | **New** — extracted from `i18n.js` |
| `js/main.js` | Remove auth/banner functions, add imports |
| `js/i18n.js` | Remove `updateAllText`, `updateFlags`, `setLang` |
| `js/modal.js` | Add `MODAL_DEFAULTS`, refactor `closeModal()` |
| `app.html` | No changes needed |
| `CLAUDE.md` | 1) Add `auth-ui.js` and `text-refresh.js` to filstruktur-tabell; 2) Update avhengighetsgraf with new modules; 3) Mark `i18n.js` gjeld (dobbeltansvar) as ✅ resolved; 4) Mark `main.js` gjeld (god-object) as partially resolved (auth-ui extracted) |

---

## Testing checklist

- [ ] Login flow: open overlay → login → overlay closes → correct tab shown
- [ ] Signup flow: open overlay → signup → overlay closes → profile tab shown
- [ ] Demo banner: visible for unauthenticated users, hidden after login
- [ ] Demo banner: dismissable via "X" button (dismiss action works via exported `dismissDemoBanner`)
- [ ] Demo banner: after dismiss + page refresh → banner reappears (dismiss is in-memory only, not persisted)
- [ ] Language switch: `setLang()` updates all text and flags (imported from `text-refresh.js`)
- [ ] `updateAllText()` called on bootstrap — all labels correct; `athlytics:updateAllText` event fires and `main.js` calls `renderLogSub()`, `updateResult()`, `updateLogBadge()`
- [ ] Open edit modal → edit reflections → close without saving → reflection textareas empty on next open
- [ ] Open edit modal → edit → save → modal closes cleanly, all fields reset
- [ ] Open edit modal → close without saving → all fields reset (including `modal-dato`, `modal-motstander`)
- [ ] No console errors on any tab
