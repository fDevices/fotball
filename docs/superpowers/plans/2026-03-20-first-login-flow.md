# First Login Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the first login flow so the profile incomplete-badge and soft prompt only show for authenticated users with empty profiles, and login redirects new users to the Profile tab.

**Architecture:** Two targeted changes to existing functions — no new files, no new state. The i18n work and banner HTML already exist; this plan adds an auth-gate to `updateProfilePrompt()` and a profile-check redirect to `handleAuthLogin()`. A default `hidden` class on the banner HTML prevents the demo-user flash.

**Tech Stack:** Vanilla JS ES modules, Supabase Auth, no build step.

---

## Files Changed

| File | Change |
|---|---|
| `app.html` | Add `hidden` class to `#profile-prompt` element |
| `js/profile.js` | Import `isAuthenticated`; add auth-gate to `updateProfilePrompt()` |
| `js/main.js` | Smart redirect in `handleAuthLogin()` |

---

## Task 1: Hide banner by default in HTML

Prevents demo/unauthenticated users from seeing a banner flash before JS runs.

**Files:**
- Modify: `app.html` (line ~240)

- [ ] **Step 1: Find the profile-prompt element**

Open `app.html` and find:
```html
<div class="profile-prompt" id="profile-prompt">
```

- [ ] **Step 2: Add `hidden` class**

Change it to:
```html
<div class="profile-prompt hidden" id="profile-prompt">
```

- [ ] **Step 3: Verify CSS**

Confirm `style.css` has `.profile-prompt.hidden { display: none; }` (it does, line ~297). No CSS change needed.

- [ ] **Step 4: Manual verify**

Open `app.html` in browser (file:// or local server) as a demo user. The profile tab should show no banner. No badge on the profile tab icon.

- [ ] **Step 5: Commit**

```bash
git add app.html
git commit -m "fix: hide profile-prompt banner by default to prevent unauthenticated flash"
```

---

## Task 2: Auth-gate `updateProfilePrompt()`

Even after the HTML default-hidden fix, `updateProfilePrompt()` currently removes the `hidden` class for unauthenticated users with empty profiles. Add an `isAuthenticated()` guard.

**Files:**
- Modify: `js/profile.js` (lines 1, 16–28)

- [ ] **Step 1: Add import**

In `js/profile.js`, the existing imports are:
```javascript
import { PROFIL_KEY } from './config.js';
import { getUserId } from './auth.js';
```

Add `isAuthenticated` to the `auth.js` import:
```javascript
import { getUserId, isAuthenticated } from './auth.js';
```

- [ ] **Step 2: Add auth-gate to `updateProfilePrompt()`**

Current function (lines 16–28):
```javascript
export function updateProfilePrompt() {
  var banner = document.getElementById('profile-prompt');
  var badge = document.getElementById('tab-profile-badge');
  var complete = isProfileComplete();
  if (banner) {
    if (complete || _promptDismissed) banner.classList.add('hidden');
    else banner.classList.remove('hidden');
  }
  if (badge) {
    if (complete || _promptDismissed) badge.classList.remove('visible');
    else badge.classList.add('visible');
  }
}
```

Replace with:
```javascript
export function updateProfilePrompt() {
  var banner = document.getElementById('profile-prompt');
  var badge = document.getElementById('tab-profile-badge');
  if (!isAuthenticated()) {
    if (banner) banner.classList.add('hidden');
    if (badge) badge.classList.remove('visible');
    return;
  }
  var complete = isProfileComplete();
  if (banner) {
    if (complete || _promptDismissed) banner.classList.add('hidden');
    else banner.classList.remove('hidden');
  }
  if (badge) {
    if (complete || _promptDismissed) badge.classList.remove('visible');
    else badge.classList.add('visible');
  }
}
```

- [ ] **Step 3: Manual verify — demo user**

Reload the app as a demo (unauthenticated) user. Profile tab icon should have no gold badge. Profile tab should show no banner.

- [ ] **Step 4: Manual verify — authenticated user with empty profile**

Log in with a test account that has no name set. Profile tab icon should show a gold dot badge. Profile tab should show the welcome banner with the correct language text and a "Skip for now" / "Hopp over" button.

- [ ] **Step 5: Manual verify — authenticated user with name set**

Log in with a test account that has a name set. No badge, no banner.

- [ ] **Step 6: Manual verify — skip button**

Log in with an empty-profile account. Click "Skip for now". Banner and badge should disappear. Reload the page — badge and banner should reappear (session-only dismissal).

- [ ] **Step 7: Commit**

```bash
git add js/profile.js
git commit -m "feat: auth-gate profile prompt — only show banner and badge for authenticated users"
```

---

## Task 3: Smart login redirect in `handleAuthLogin()`

After login, redirect to Profile tab if the profile is empty; Log tab if populated.

**Files:**
- Modify: `js/main.js` (lines 144–157)

- [ ] **Step 1: Add `isProfileComplete` to the `profile.js` import in `main.js`**

Line 1 of `js/main.js` currently imports from `profile.js`:
```javascript
import { fetchProfileFromSupabase, loadProfileData, renderLogSub, saveProfile, updateAvatar, uploadImage, dismissProfilePrompt, updateProfilePrompt, getProfile } from './profile.js';
```

Add `isProfileComplete` to the list:
```javascript
import { fetchProfileFromSupabase, loadProfileData, renderLogSub, saveProfile, updateAvatar, uploadImage, dismissProfilePrompt, updateProfilePrompt, getProfile, isProfileComplete } from './profile.js';
```

- [ ] **Step 2: Find `handleAuthLogin()`**

Current function in `js/main.js`:
```javascript
async function handleAuthLogin() {
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
  switchTab('log');
  updateDemoBanner();
}
```

- [ ] **Step 3: Replace the fixed `switchTab('log')` with a profile-aware redirect**

```javascript
async function handleAuthLogin() {
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
```

Note: `isProfileComplete` is now imported from `profile.js` (added in Step 1). The call is safe here because `fetchProfileFromSupabase()` calls `saveProfile_local(p)` internally, which sets `_profileCache` before returning — so `isProfileComplete()` reads the freshly-fetched data.

- [ ] **Step 4: Manual verify — first-time login (empty profile)**

Log in with a test account that has no name. App should land on the Profile tab with the welcome banner visible.

- [ ] **Step 5: Manual verify — returning login (profile has name)**

Log in with a test account that has a name set. App should land on the Log tab. No banner, no badge.

- [ ] **Step 6: Commit**

```bash
git add js/main.js
git commit -m "feat: redirect to profile tab on login if profile is incomplete"
```
