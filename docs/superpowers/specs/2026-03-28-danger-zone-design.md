# Danger Zone — Delete Matches & Delete Account

**Date:** 2026-03-28
**Status:** Approved

---

## Overview

Two destructive actions added to the Settings tab, each behind a typed confirmation gate:

1. **Delete match history** — purges all rows in `matches` for the current user
2. **Delete account** — purges all user data (`matches`, `profiles`, `share_tokens`) and deletes the auth account via a Supabase Edge Function

---

## UI

### Placement
A new "Danger zone" section at the bottom of the Settings tab, below the share section and above the logout button. Hidden for unauthenticated/demo users (`isAuthenticated()` guard).

### Inline-expand pattern
Each action has a trigger button. On click, a panel expands below it with:
- A warning message
- A text input with a placeholder showing the required phrase
- A confirm button (disabled until input matches exactly, case-insensitive)
- A cancel link that collapses the panel

Only one panel can be open at a time. Opening one closes the other.

### Delete match history
- Trigger button: red outlined, label from i18n `danger_delete_matches_btn`
- Warning: i18n `danger_delete_matches_warn`
- Confirmation phrase: `delete matches` (i18n key `danger_phrase_matches`)
- Input placeholder: i18n `danger_phrase_matches_placeholder`

### Delete account
- Trigger button: solid red, label from i18n `danger_delete_account_btn`
- Warning: i18n `danger_delete_account_warn`
- Confirmation phrase: `delete my account` (i18n key `danger_phrase_account`)
- Input placeholder: i18n `danger_phrase_account_placeholder`

---

## Backend

### New Supabase REST functions (`supabase.js`)

```
deleteAllMatches()
  DELETE /rest/v1/matches
  No filter — RLS scopes to current user automatically

deleteAllShareTokens()
  DELETE /rest/v1/share_tokens
  No filter — RLS scopes to current user automatically

deleteProfile(userId)
  DELETE /rest/v1/profiles?id=eq.<userId>
```

### Edge Function (`supabase/functions/delete-account/index.ts`)
- Reads JWT from `Authorization` header to verify identity
- Uses `SUPABASE_SERVICE_ROLE_KEY` env var (never in client code) to call `auth.admin.deleteUser(userId)`
- Returns `200` on success, `401` if unauthenticated, `500` on failure
- Called from client via `POST /functions/v1/delete-account` with bearer token

---

## Client-side flows

### Delete matches
1. `deleteAllMatches()`
2. `invalidateMatchCache()`
3. Success toast (`danger_toast_matches_deleted`)
4. Close panel

If step 1 fails: error toast, abort.

### Delete account
1. `deleteAllMatches()`
2. `deleteAllShareTokens()`
3. `deleteProfile(userId)`
4. POST to `delete-account` Edge Function
5. `logout()` → redirect to auth screen

If any step fails: error toast, abort. No rollback (data already deleted stays deleted — user confirmed the action).

---

## JS Architecture

### New file: `js/danger.js`
Exports:
- `initDangerZone()` — called from `renderSettings()`, sets up panel state
- `toggleDangerPanel(type)` — opens/closes `'matches'` or `'account'` panel, closes the other
- `onDangerInput(type)` — enables/disables confirm button based on input match
- `confirmDeleteMatches()` — executes matches deletion flow
- `confirmDeleteAccount()` — executes account deletion flow

Dependencies: `supabase.js`, `auth.js`, `state.js`, `toast.js`, `i18n.js`

### `main.js` ACTIONS map — four new entries
- `toggleDangerPanel` — `data-type="matches"` or `data-type="account"`
- `dangerInput` — delegated `input` event on confirmation text fields
- `confirmDeleteMatches`
- `confirmDeleteAccount`

### `settings-render.js`
Calls `initDangerZone()` at end of `renderSettings()`.

### `app.html`
Danger zone HTML is static in the DOM. Expand panels hidden via CSS class. No dynamic injection.

---

## i18n keys (both `no` and `en`)

| Key | no | en |
|-----|----|----|
| `danger_section_title` | Faresone | Danger zone |
| `danger_delete_matches_btn` | Slett kamphistorikk | Delete match history |
| `danger_delete_matches_warn` | Dette vil permanent slette all kampdata din. | This will permanently delete all your match data. |
| `danger_phrase_matches` | slett kamper | delete matches |
| `danger_phrase_matches_placeholder` | skriv "slett kamper" for å bekrefte | type "delete matches" to confirm |
| `danger_delete_account_btn` | Slett konto | Delete account |
| `danger_delete_account_warn` | Dette vil permanent slette all data og kontoen din. Dette kan ikke angres. | This will permanently delete all your data and your account. This cannot be undone. |
| `danger_phrase_account` | slett kontoen min | delete my account |
| `danger_phrase_account_placeholder` | skriv "slett kontoen min" for å bekrefte | type "delete my account" to confirm |
| `danger_toast_matches_deleted` | Kamphistorikk slettet | Match history deleted |
| `danger_toast_account_deleted` | Konto slettet | Account deleted |
| `danger_cancel` | Avbryt | Cancel |
| `danger_confirm` | Bekreft | Confirm |

---

## Out of scope
- Stripe subscription cancellation (no payment system yet)
- Email confirmation of deletion
- Grace period / undo window
