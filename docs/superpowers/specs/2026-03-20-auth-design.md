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

---

## Section 1: Database Schema

### `profiles` table
- Change `id` from `text` to `uuid` — foreign key to `auth.users(id)`
- Create a real Supabase auth user (`demo@athlyticsport.app`) and migrate the existing `'default'` row to that user's UUID
- Store the demo UUID as `DEMO_USER_ID` in `config.js`

### `matches` table
- Add column: `user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE`
- Assign all existing rows to the demo user's UUID during migration

### RLS policies (both tables)

| Role | Policy |
|------|--------|
| `authenticated` | Full CRUD where `user_id = auth.uid()` |
| `anon` | SELECT only where `user_id = DEMO_USER_ID` |

Demo data is publicly readable but only writable by the demo auth user (never from the client).

---

## Section 2: `auth.js` Module

New module at `js/auth.js`. Owns the full auth lifecycle.

### Exported API

```js
getSession()        // returns { accessToken, refreshToken, userId, email } or null
isAuthenticated()   // boolean
getUserId()         // returns userId or DEMO_USER_ID if unauthenticated

signup(email, password)   // POST /auth/v1/signup → stores session
login(email, password)    // POST /auth/v1/token?grant_type=password → stores session
logout()                  // POST /auth/v1/logout → clears session + all caches
```

### Internal functions (not exported)

```js
_refreshSession()    // POST /auth/v1/token?grant_type=refresh_token
_scheduleRefresh()   // setInterval every 50 min
_clearSession()      // removes session from localStorage, clears profile/settings/match caches
```

### Session storage
localStorage key `athlytics_session`:
```json
{ "accessToken": "...", "refreshToken": "...", "userId": "uuid", "email": "..." }
```

### Token refresh
- Supabase access tokens expire after 1 hour
- `_scheduleRefresh()` runs every 50 minutes
- On app load: if session exists and token expires within 10 minutes, refresh immediately before bootstrapping

### `getUserId()` contract
Returns the authenticated user's UUID, or `DEMO_USER_ID` if unauthenticated. All callers in `profile.js` and `settings.js` use this — no special-casing needed per call site.

---

## Section 3: Demo Mode & Auth Overlay UI

### Demo mode behaviour
When `isAuthenticated()` is false:
- App loads normally; anon key + RLS returns only the demo user's rows
- Write actions (`saveMatch`, `saveProfile`, `saveEditedMatch`, `confirmDeleteMatch`, etc.) are intercepted in `main.js` before calling their handler — dispatch `athlytics:requireAuth` instead, which opens the auth overlay
- A persistent **demo banner** sits above the tab bar: *"You're viewing demo data — create a free account to track your own"* with a "Sign up" button. Dismissible for the session only (not persisted to localStorage).

### Auth overlay
Full-screen overlay in `app.html` (hidden by default). Two views toggled in-place (no navigation):

**Login view:**
- Email input, password input
- "Log in" button
- "Don't have an account? Sign up" toggle link
- Inline error message area

**Signup view:**
- Email input, password input, confirm password (client-side match check only)
- "Create account" button
- "Already have an account? Log in" toggle link
- Inline error message area

### Post-signup (first login) flow
1. Clear demo caches (profile, settings, matches)
2. Bootstrap fresh empty profile
3. `switchTab('profile')`
4. Existing `profile-prompt` banner activates with welcome message
5. Incomplete-profile badge on Profile tab icon shown until name is entered

### Post-login flow
1. Clear demo caches
2. `fetchProfileFromSupabase()` — load user's own data
3. `switchTab('log')`

### Logout flow
1. POST `/auth/v1/logout`
2. `_clearSession()` — clears `athlytics_session`, `athlytics_profil`, `athlytics_settings`, sessionStorage match cache
3. Reload app — lands in demo mode

---

## Section 4: Changes to Existing Modules

### `config.js`
- Add `DEMO_USER_ID` constant (UUID of demo Supabase auth user)

### `supabase.js`
- `headers()` uses `getSession().accessToken` as Bearer when authenticated, falls back to anon key when not:
  ```js
  function headers(extra) {
    var session = getSession();
    var bearer = session ? session.accessToken : SUPABASE_KEY;
    return Object.assign({ 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + bearer }, extra);
  }
  ```
- No other changes — all fetch calls automatically scope to the authenticated user via RLS

### `profile.js`
- Replace 2× hardcoded `id: 'default'` with `getUserId()` (imported from `auth.js`)

### `settings.js`
- Replace 1× hardcoded `id: 'default'` with `getUserId()`

### `main.js`
1. Import `auth.js`; call session-restore + `_scheduleRefresh()` at bootstrap
2. Add `athlytics:requireAuth` event listener → opens auth overlay
3. Add `WRITE_ACTIONS` set; guard write actions in demo mode — if `!isAuthenticated()` and action is in `WRITE_ACTIONS`, dispatch `athlytics:requireAuth` instead of executing

### Untouched modules
`state.js`, `teams.js`, `navigation.js`, `log.js`, `modal.js`, `stats-overview.js`, `stats-analyse.js`, `stats-search.js`, `assessment.js`, `export.js`, `toast.js`, `i18n.js`, `settings-render.js`, `utils.js` — no changes needed.

---

## Out of Scope

- OAuth / social login (Fase 4+ if needed)
- Password reset / forgot password flow (add in follow-up)
- Email verification enforcement at signup (Supabase can send verification email; app does not gate access on it for MVP)
- Avatar migration to Supabase Storage (remains base64 in localStorage for now)
- Stripe / premium gating (separate Fase 4 task)
