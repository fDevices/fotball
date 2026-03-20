# First Login Flow — Design Spec

**Date:** 2026-03-20
**Status:** Approved

---

## Summary

The profile incomplete-badge and soft prompt banner are already built. This spec covers the three remaining gaps that complete the first login flow.

---

## What already exists

- `profile-prompt` banner in `app.html` (profile tab, top) with skip button
- `tab-profile-badge` dot on the profile tab icon
- CSS for both elements
- `isProfileComplete()` — returns true if `profile.name` is non-empty
- `updateProfilePrompt()` — shows/hides banner + badge; respects `_promptDismissed` session flag
- `dismissProfilePrompt()` — sets `_promptDismissed = true`, hides both
- Signup flow already redirects to Profile tab (`handleAuthSignup()` → `switchTab('profile')`)
- `_promptDismissed` is session-only (resets on reload) — correct, intentional

---

## Changes

### 1. Auth-gate the prompt (`profile.js`)

`updateProfilePrompt()` currently shows the banner and badge for all users, including unauthenticated/demo users.

Add `isAuthenticated()` check at the top of `updateProfilePrompt()`. If not authenticated, hide both the banner and badge unconditionally and return early.

```
if (!isAuthenticated()) → hide banner, hide badge, return
```

This requires importing `isAuthenticated` from `auth.js` into `profile.js`. The dependency already flows this direction (profile.js already imports from auth.js).

### 2. Smart login redirect (`main.js`)

`handleAuthLogin()` currently always calls `switchTab('log')` after fetching the profile.

Change to: after `fetchProfileFromSupabase()` and `loadProfileData(p)`, check `isProfileComplete()`. If incomplete → `switchTab('profile')`. If complete → `switchTab('log')`.

```
var p = await fetchProfileFromSupabase();
loadProfileData(p);
switchTab(isProfileComplete() ? 'log' : 'profile');
```

### 3. i18n for prompt texts (`i18n.js`, `app.html`, `profile.js`)

Three strings in `app.html` are hardcoded English. Apply the standard i18n pattern:

| Element ID | Key | Norwegian | English |
|---|---|---|---|
| `profile-prompt-title` | `profile_prompt_title` | `Sett opp profilen din` | `Set up your profile` |
| `profile-prompt-desc` | `profile_prompt_desc` | `Legg til navn og klubb så statistikk og eksporter blir personlige. Tar 30 sekunder.` | `Add your name and club so your stats and exports are personalised. Takes 30 seconds.` |
| `profile-prompt-skip` | `profile_prompt_skip` | `Hopp over` | `Skip for now` |

- Add the three keys to both `no` and `en` branches of `TEKST` in `i18n.js`
- Replace hardcoded text in `app.html` with empty strings (text set by JS)
- Set all three in `updateAllText()` in `i18n.js` using `textContent` + `t(key)`

---

## Behaviour summary

| Scenario | Result |
|---|---|
| Demo/unauthenticated user | No badge, no prompt |
| Authenticated, name empty | Badge visible, prompt shown; login redirects to Profile tab |
| Authenticated, name filled | No badge, no prompt; login goes to Log tab |
| User clicks "Skip for now" | Prompt and badge hidden for rest of session; resets on next load |
| Signup (new user) | Goes to Profile tab (unchanged) |

---

## Files changed

| File | Change |
|---|---|
| `js/profile.js` | Add `isAuthenticated` import; add auth-gate to `updateProfilePrompt()` |
| `js/main.js` | Smart redirect in `handleAuthLogin()` |
| `js/i18n.js` | 3 new keys in `TEKST`; 3 `textContent` assignments in `updateAllText()` |
| `app.html` | Remove hardcoded text from 3 prompt elements |

No new files. No schema changes. No new state.
