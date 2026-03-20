# Auth Design — Fase 4

**Date:** 2026-03-20
**Status:** Approved
**Scope:** Supabase Auth (email/password), strict per-user data isolation, demo mode for unauthenticated visitors

---

## Context

The app currently stores all data under a single hardcoded `id='default'` profile row with no authentication or RLS. Before opening to real users, we need:
- Real user accounts with isolated data
- Proper RLS policies on Supabase
- A read-only demo mode for unauthenticated visitors

**Target:** B (10–100 players, small public release) with intent to scale to C (open/public).

---

## Approach

Use Supabase Auth REST API directly via `fetch()` — no SDK. Consistent with the existing codebase pattern (raw REST calls, no bundler, native ES modules). Zero new dependencies.

`auth.js` uses raw `fetch()` for all Supabase Auth REST calls (`/auth/v1/*`) and **never imports `supabase.js`**, avoiding circular dependencies. The dependency direction is: `supabase.js` imports `auth.js` (to read the session token); `auth.js` imports nothing from the project except `config.js`.

---

## Pre-implementation infrastructure step

Before writing any code:
1. Create a Supabase auth user `demo@athlyticsport.app` in the Supabase dashboard
2. Copy the resulting UUID
3. Paste it as `DEMO_USER_ID` in `config.js`
4. Migrate the existing `profiles` row (`id='default'`) to use this UUID
5. Assign all existing `matches` rows to this UUID

This UUID must be known before the module can be tested.

---

## Section 1: Database Schema

### `profiles` table
- Change `id` from `text` to `uuid` — foreign key to `auth.users(id)`
- The existing `'default'` row becomes the demo user row (see pre-implementation step above)

### `matches` table
- Add column: `user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE`
- Using `DEFAULT auth.uid()` means INSERT payloads do not need to include `user_id` — Supabase injects the authenticated user's ID automatically. `insertKamp()` in `supabase.js` requires no payload change.
- Assign all existing rows to the demo user's UUID during migration

### RLS policies (both tables)

| Role | Policy |
|------|--------|
| `authenticated` | Full CRUD where `user_id = auth.uid()` (or `id = auth.uid()` for profiles) |
| `anon` | SELECT only where `user_id = DEMO_USER_ID` (or `id = DEMO_USER_ID` for profiles) |

Demo data is publicly readable but only writable by the demo auth user (never from the client).

---

## Section 2: `auth.js` Module

New module at `js/auth.js`. Owns the full auth lifecycle. Imports only `config.js`.

### Exported API

```js
getSession()        // returns { accessToken, refreshToken, userId, email, expiresAt } or null
isAuthenticated()   // boolean
getUserId()         // returns userId string or DEMO_USER_ID if unauthenticated

signup(email, password)   // POST /auth/v1/signup → stores session, returns { user, error }
login(email, password)    // POST /auth/v1/token?grant_type=password → stores session, returns { user, error }
logout()                  // POST /auth/v1/logout → cancels refresh interval, clears session + all caches, then window.location.reload()
restoreSession()          // called at bootstrap — reads session from localStorage, refreshes if near expiry
```

### Internal functions (not exported)

```js
_refreshSession()    // POST /auth/v1/token?grant_type=refresh_token → updates stored session
_scheduleRefresh()   // setInterval every 50 min; stores interval ID in module-scope var _refreshTimer
_cancelRefresh()     // clearInterval(_refreshTimer); _refreshTimer = null
_clearSession()      // cancels refresh interval via _cancelRefresh(), removes athlytics_session from localStorage,
                     // clears PROFIL_KEY, SETTINGS_KEY, and sessionStorage CACHE_KEY (uses imported constants — never hardcoded strings)
```

### Session storage
localStorage key `athlytics_session`:
```json
{ "accessToken": "...", "refreshToken": "...", "userId": "uuid", "email": "...", "expiresAt": 1234567890000 }
```
`expiresAt` is epoch milliseconds, computed as `Date.now() + (expires_in * 1000)` from the Supabase auth response.

### Token refresh
- Supabase access tokens expire after 1 hour
- `_scheduleRefresh()` starts a `setInterval` every 50 minutes; interval ID stored as module-level `_refreshTimer`
- `_cancelRefresh()` calls `clearInterval(_refreshTimer)` — called by `_clearSession()` and therefore by `logout()`
- `login()` and `signup()` call `_scheduleRefresh()` immediately after storing a new session
- On `restoreSession()` at app load: if `session.expiresAt - Date.now() < 10 * 60 * 1000` (under 10 min), call `_refreshSession()` immediately before bootstrapping; then call `_scheduleRefresh()`

### `getUserId()` contract
Returns the authenticated user's UUID, or `DEMO_USER_ID` if no session. Imported by `profile.js` and `settings.js` to replace all hardcoded `id: 'default'` occurrences.

### Error handling
`signup()` and `login()` return `{ user, error }`. The `error` field is the `error_description` or `message` string from the Supabase API response body — never a hardcoded string. Callers display this directly in the inline error area of the auth overlay.

---

## Section 3: Demo Mode & Auth Overlay UI

### Demo mode behaviour
When `isAuthenticated()` is false:
- App loads normally; anon key + RLS returns only the demo user's rows
- Write actions are intercepted in `main.js` (see Section 4)
- A persistent **demo banner** sits above the tab bar: *"You're viewing demo data — create a free account to track your own"* with a "Sign up" button
- Banner dismissed state is a module-level boolean in `main.js` (mirrors the `_promptDismissed` pattern in `profile.js`) — session-only, not persisted to localStorage

### WRITE_ACTIONS intercept
`main.js` defines a `WRITE_ACTIONS` set. Before executing any action, if `!isAuthenticated()` and the action name is in `WRITE_ACTIONS`, dispatch `athlytics:requireAuth` instead:

```js
const WRITE_ACTIONS = new Set([
  'saveMatch', 'saveProfile', 'saveEditedMatch', 'confirmDeleteMatch',
  'addTeamFromProfile', 'addTournament', 'deleteTeam', 'deleteTournament',
  'setFavoriteTeam', 'setFavoriteTournament', 'saveNewTeamFromDropdown',
  'saveNewTournamentFromDropdown', 'addSeason', 'setSport', 'setSeasonFormat',
  'setDateFormat', 'setActiveSeason', 'saveAssessment', 'exportCSV', 'exportPDF'
]);
```

`openEditModal` is **not** in `WRITE_ACTIONS` — the edit modal opens in demo mode, but `saveEditedMatch` and `confirmDeleteMatch` are blocked. This is deliberate: letting users explore the edit UI demonstrates the feature before they sign up.

`uploadImage` is handled outside the ACTIONS map (via a `change` event). The `change` event handler in `setupEventDelegation()` must also check `isAuthenticated()` before calling `uploadImage()` — if not authenticated, dispatch `athlytics:requireAuth` instead.

### Auth overlay
Full-screen overlay in `app.html` (hidden by default via `class="hidden"`). Two views toggled in-place (no navigation):

**Login view:**
- Email input, password input
- "Log in" button
- "Don't have an account? Sign up" toggle link
- Inline error message area (populated from API error response)

**Signup view:**
- Email input, password input, confirm password (client-side match check only — Supabase enforces minimum length server-side; its error message is shown verbatim in the error area)
- "Create account" button
- "Already have an account? Log in" toggle link
- Inline error message area

### `_clearCaches()` helper
Both post-signup and post-login flows need to evict cached demo data without touching the session token (which was just written). A private `_clearCaches()` helper in `main.js` (not in `auth.js`) handles this:
```js
function _clearCaches() {
  localStorage.removeItem(PROFIL_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  sessionStorage.removeItem(CACHE_KEY);
}
```
`_clearSession()` in `auth.js` also calls the equivalent removals (plus `athlytics_session`), but is **only** called on logout — never on login or signup.

### Post-signup (first login) flow
The session has already been stored by `signup()` before this flow runs (ordering guarantee).
1. Call `_clearCaches()` — removes any demo data cached in localStorage/sessionStorage
2. Bootstrap fresh empty profile via `getProfile()` (returns empty default since `PROFIL_KEY` was cleared)
3. `switchTab('profile')`
4. Existing `profile-prompt` banner activates (profile is empty, so `isProfileComplete()` returns false)
5. Incomplete-profile badge on Profile tab icon shown until name is entered
6. **Note:** The new user has no `profiles` row in Supabase yet. The first `saveProfile()` call will upsert one via `upsertProfil()` — this works correctly since Supabase upsert with `resolution=merge-duplicates` creates a new row if none exists.
7. Demo banner is hidden (user is now authenticated; `isAuthenticated()` returns true)

### Post-login flow
The session has already been stored by `login()` before this flow runs (ordering guarantee: `getUserId()` returns the real user's UUID when `fetchProfileFromSupabase()` is called).
1. Call `_clearCaches()` — removes cached demo profile/settings/matches
2. `fetchProfileFromSupabase()` — loads the user's own data (calls `fetchProfil(getUserId())`, which now uses the authenticated UUID)
3. `switchTab('log')`
4. Demo banner is hidden (user is now authenticated)

### Logout flow
1. `logout()` in `auth.js`: POST `/auth/v1/logout` with access token
2. `_clearSession()`: cancel refresh interval, remove `athlytics_session`, `PROFIL_KEY`, `SETTINGS_KEY`, `CACHE_KEY`
3. `window.location.reload()` — hard reload; app re-bootstraps in demo mode

---

## Section 4: Changes to Existing Modules

### `config.js`
- Add `DEMO_USER_ID` constant (UUID of demo Supabase auth user — see pre-implementation step)

### `supabase.js`
- `headers()` uses `getSession().accessToken` as Bearer when authenticated, falls back to anon key:
  ```js
  import { getSession } from './auth.js';
  function headers(extra) {
    var session = getSession();
    var bearer = session ? session.accessToken : SUPABASE_KEY;
    return Object.assign({ 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + bearer }, extra);
  }
  ```
- `fetchProfil(userId)` and `fetchSettings(userId)` accept a `userId` parameter; replace hardcoded `id=eq.default` with `id=eq.${userId}`. Callers pass `getUserId()`.
- `insertKamp()` — no payload change needed (`user_id` injected by DB default `auth.uid()`)
- All other fetch calls unchanged — RLS scopes them automatically

### `profile.js`
- Import `getUserId` from `auth.js`
- Replace 2× hardcoded `id: 'default'` with `getUserId()` in `saveProfileToSupabase()`
- Pass `getUserId()` to `fetchProfil()` call

### `settings.js`
- Import `getUserId` from `auth.js`
- Replace 1× hardcoded `id: 'default'` with `getUserId()` in `saveSettingsToSupabase()`
- Pass `getUserId()` to `fetchSettings()` call

### `main.js`
1. Import `restoreSession`, `isAuthenticated`, `logout` from `auth.js`; import `PROFIL_KEY`, `SETTINGS_KEY`, `CACHE_KEY` from `config.js`
2. At bootstrap (before `fetchProfileFromSupabase`): call `await restoreSession()` — restores or refreshes session
3. Add `WRITE_ACTIONS` set and intercept logic in the click event handler (before ACTIONS dispatch)
4. Add intercept to the **keydown Enter handler**: the five Enter-triggered write actions (`saveNewTeamFromDropdown`, `saveNewTournamentFromDropdown`, `addTeamFromProfile`, `addTournament`, `addSeason`) must also check `isAuthenticated()` and dispatch `athlytics:requireAuth` if not — otherwise the WRITE_ACTIONS gate is bypassable via keyboard
5. Add `athlytics:requireAuth` event listener → opens auth overlay, shows login view
6. Add `change` event guard for `uploadImage` action (check `isAuthenticated()`)
7. Add demo banner show/hide logic based on `isAuthenticated()`; dismissed state is a module-level boolean — reset is not needed since `window.location.reload()` resets all module state
8. Add `logout` action to ACTIONS map
9. Add `_clearCaches()` helper (see Section 3)

### Untouched modules
`state.js`, `teams.js`, `navigation.js`, `log.js`, `modal.js`, `stats-overview.js`, `stats-analyse.js`, `stats-search.js`, `assessment.js`, `export.js`, `toast.js`, `i18n.js`, `settings-render.js`, `utils.js` — no changes needed.

---

## Out of Scope

- OAuth / social login (Fase 4+ if needed)
- Password reset / forgot password flow (add in follow-up)
- Email verification enforcement at signup (Supabase can send verification email; app does not gate access on it for MVP)
- Avatar migration to Supabase Storage (remains base64 in localStorage for now)
- Stripe / premium gating (separate Fase 4 task)
