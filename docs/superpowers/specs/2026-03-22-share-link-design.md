# Share Link Feature — Design Spec

**Date:** 2026-03-22
**Status:** Approved

---

## Overview

A player can generate one or more shareable links and send them to coaches, parents, or scouts. The recipient opens the link in any browser — no account required — and sees a read-only view of the player's stats and profile. Self-assessment data (ratings and reflections) is never exposed. This feature is the foundation for a future coach/dashboard account system (Fase 4).

---

## Goals

- Allow a player to share their stats with third parties via a URL
- Third party requires no account or login
- Assessment data (`rating_*`, `reflection_*`) is never visible to the third party
- Player controls all codes: create, label, set expiry, revoke
- Multiple active codes supported simultaneously

---

## Out of Scope (this iteration)

- Coach/parent dashboard accounts (Fase 4)
- Notifications to the viewer when new matches are logged
- Granular per-season or per-tournament share scoping
- Analytics on how often a share link is viewed

---

## Data Model

### New table: `share_tokens`

```sql
CREATE TABLE share_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code        text NOT NULL UNIQUE,
  label       text NOT NULL,
  expires_at  timestamptz NULL,  -- NULL = permanent
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

**RLS policies:**
- Authenticated owner: SELECT, DELETE where `auth.uid() = user_id`
- Authenticated INSERT: `WITH CHECK (user_id = auth.uid())` — enforces the inserted row's `user_id` must equal the session user; prevents a tampered payload from inserting a token under another user's ID
- Anon: no direct SELECT, INSERT, UPDATE, or DELETE — all reads go through RPC functions

**Note:** The `code` column's `UNIQUE` constraint automatically creates a unique index in PostgreSQL. No separate `CREATE UNIQUE INDEX` statement is needed.

---

## Supabase RPC Functions

Both functions use `SECURITY DEFINER SET search_path = public` and are callable via the anon key. The `SET search_path = public` prevents search path injection attacks on `SECURITY DEFINER` functions (Supabase best practice).

### `get_shared_profile(share_code text)`

```sql
CREATE OR REPLACE FUNCTION get_shared_profile(share_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_result  json;
BEGIN
  SELECT user_id INTO v_user_id
  FROM share_tokens
  WHERE code = share_code
    AND (expires_at IS NULL OR expires_at > now());

  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT row_to_json(r) INTO v_result
  FROM (
    SELECT name, club, avatar_url, team, favorite_team,
           tournaments, favorite_tournament,
           sport, active_season, season_format, lang
    FROM profiles
    WHERE id = v_user_id
  ) r;

  RETURN v_result;
END;
$$;
```

> `tournaments` and `favorite_tournament` are included for the profile card display. Tournament filter pills are built from match data, not these fields.

### `get_shared_matches(share_code text)`

```sql
CREATE OR REPLACE FUNCTION get_shared_matches(share_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_result  json;
BEGIN
  SELECT user_id INTO v_user_id
  FROM share_tokens
  WHERE code = share_code
    AND (expires_at IS NULL OR expires_at > now());

  IF v_user_id IS NULL THEN
    RETURN NULL;
  END IF;

  SELECT json_agg(r) INTO v_result
  FROM (
    SELECT id, date, opponent, own_team, tournament,
           home_score, away_score, goals, assists,
           match_type, created_at
    FROM matches
    WHERE user_id = v_user_id
    ORDER BY date DESC
    LIMIT 1000
  ) r;

  RETURN COALESCE(v_result, '[]'::json);
END;
$$;
```

Assessment columns (`rating_*`, `reflection_*`) are deliberately excluded.

**Row limit:** `LIMIT 1000` caps the response size. This is sufficient for any realistic player in the current MVP phase. Remove or raise the limit when pagination is added to the viewer.

Both functions return `NULL` for invalid or expired codes.

**Grant execute to anon:**
```sql
GRANT EXECUTE ON FUNCTION get_shared_profile(text) TO anon;
GRANT EXECUTE ON FUNCTION get_shared_matches(text) TO anon;
```

---

## Frontend Architecture

### New files

| File | Purpose |
|---|---|
| `share.html` | Standalone viewer page shell |
| `js/share-viewer.js` | Loads RPC data, renders profile card + stats |
| `js/share-manage.js` | Settings panel: create/copy/revoke share codes |

### Changed files

| File | Change |
|---|---|
| `vercel.json` | Add two rewrites: `/share` and `/share/` → `share.html` |
| `js/supabase.js` | Add `fetchShareTokens()`, `insertShareToken()`, `deleteShareToken()` |
| `js/settings-render.js` | Add "Del statistikk" section with "Manage share links" button |
| `js/i18n.js` | Add `initViewerLang(lang)` export (in-memory lang setter, no Supabase writes) |
| `style.css` | Share viewer styles + share management panel styles |
| `CLAUDE.md` | Update roadmap, mark feature complete when done |
| `CHANGELOG.md` | Release entry |

---

## Share Viewer Page (`share.html` + `share-viewer.js`)

### URL format

```
https://athlyticsport.app/share?code=ABC12345
```

Query param chosen over path segment: query params are stripped from the `Referer` header by default (browser `Referrer-Policy: strict-origin-when-cross-origin`), reducing credential leakage when navigating away.

### `share.html` structure

All asset paths must be **root-relative** (e.g. `/style.css`, `/js/share-viewer.js`) to ensure correct resolution regardless of trailing slashes or future route changes.

```html
<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Athlytics Sport – Statistikkdeling</title>
  <meta property="og:title" content="Athlytics Sport – Statistikkdeling">
  <meta property="og:description" content="Se spillerstatistikk delt via Athlytics Sport.">
  <link rel="stylesheet" href="/style.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js" defer></script>
</head>
<body>
  <div id="share-root"></div>
  <script type="module" src="/js/share-viewer.js"></script>
</body>
</html>
```

### Page structure (rendered by `share-viewer.js`)

```
[ Player profile card ]
  Avatar | Name | Club | Favorite team (omit if null)

[ Season filter pills ]
[ Team filter pills ]
[ Tournament filter pills ]

[ Stats view — Overview / Analyse toggle ]
  (identical to main app stats, minus assessment data)

[ Match history list ]
```

**Profile card fallbacks:**
- `favorite_team` is null/empty: omit the field entirely from the card
- `avatar_url` is null: show the default avatar placeholder (same CSS as the main app profile tab)

### Load flow

1. Read `?code=` from `window.location.search`
2. If no code → show error screen immediately
3. Call `get_shared_profile(code)` and `get_shared_matches(code)` in parallel (anon key, no Authorization header needed)
4. If either returns `null` → show "This link is no longer valid" error screen
5. Call `i18n.initViewerLang(profile.lang)` to set the active language in memory
6. Initialise filters from `active_season`, `season_format`
7. Render profile card + stats

### Error states

- Missing code: "Ingen delingskode funnet i denne lenken."
- Invalid/expired code: "Denne lenken er ikke lenger gyldig eller har utløpt."
- Network error: "Kunne ikke laste data. Prøv igjen."

### Module imports in `share-viewer.js`

`share-viewer.js` imports from:
- `config.js` — `SUPABASE_URL`, `SUPABASE_KEY`
- `utils.js` — `esc()`, `getResult()`
- `i18n.js` — `t()`, `initViewerLang()` (new export — see below)

**`initViewerLang(lang)` — new export to add to `i18n.js`:**
A minimal setter that stores the active language in a module-level variable, used by `t()` for subsequent calls. It must NOT call `saveSettings()`, `saveSettingsToSupabase()`, or any write function. It is purely in-memory:
```javascript
// In i18n.js
var _activeLang = 'no';
export function initViewerLang(lang) {
  if (lang === 'en' || lang === 'no') _activeLang = lang;
}
export function t(key) {
  return (TEKST[_activeLang] || TEKST['no'])[key] || key;
}
```

**Why not call `setLang()` from `text-refresh.js`?** `setLang()` calls `saveSettings()` which calls `saveSettingsToSupabase()`. On the share page there is no authenticated session; `getUserId()` falls back to `DEMO_USER_ID` and the write attempt is blocked by RLS (anon key cannot write to `profiles`). This is silent and harmless, but the intent is wrong — a viewer page should never attempt to write settings. `initViewerLang()` is explicit and safe.

**Note on transitive imports:** `i18n.js` imports `settings.js` → `auth.js`. These have no side effects on import. `text-refresh.js` is NOT imported on the share page.

### Stats rendering pattern

Stats rendering logic is **duplicated** from `stats-overview.js` and `stats-analyse.js` to avoid pulling in their dependencies (`state.js`, `settings.js`, the full ACTIONS map). All duplicated functions accept `(matches, settings)` as parameters:

```javascript
// In share-viewer.js — data flows in as parameters, not via module state
function renderStats(matches, settings) { ... }
function renderAnalyse(matches, settings) { ... }
```

The viewer calls `renderStats(sharedMatches, profileAsSettings)` where `profileAsSettings` maps the profile fields to the shape `getSettings()` returns (`activeSeason`, `seasonFormat`, `sport`, etc.).

> **Note:** If stats rendering logic grows complex, consider extracting `stats-render-core.js` in a future refactor. For now, duplication is acceptable.

### Tournament filter pills

Built from the `tournament` column on each match row — not from `profile.tournaments`. Tournament names are derived by scanning the match data, identical to how `stats-overview.js` does it today.

---

## Share Management Panel (`share-manage.js`)

### Access point

Settings tab → "Del statistikk" section → taps "Administrer delingslenker" button → panel slides up.

**Authentication gate:** If the user is not authenticated when tapping the button, dispatch `athlytics:requireAuth` (same pattern as `WRITE_ACTIONS` gate in `main.js`). The panel must never render for unauthenticated users.

### Accessibility

Uses the same **focus trap + save/restore focus** pattern as the assessment sheet and auth overlay. Uses `getFocusableElements()` and `trapFocus()` from `utils.js`.

### Panel contents

```
[ Del statistikk ]                       [ × lukk ]

  ┌─────────────────────────────────────┐
  │ + Opprett ny lenke                  │
  └─────────────────────────────────────┘

  Aktive lenker:
  ┌─────────────────────────────────────┐
  │ Trener Hansen         90 dager igjen│
  │ athlyticsport.app/share?code=…   [Kopier] [Slett] │
  └─────────────────────────────────────┘
  ┌─────────────────────────────────────┐
  │ Mamma                 Permanent     │
  │ athlyticsport.app/share?code=…   [Kopier] [Slett] │
  └─────────────────────────────────────┘

  Utløpte lenker:
  ┌─────────────────────────────────────┐
  │ Gammel speider   [UTLØPT-badge]     │
  │                                  [Slett]          │
  └─────────────────────────────────────┘
```

Active vs. expired distinction is determined client-side: compare `expires_at` (from the fetched row) against `Date.now()`. `expires_at === null` means permanent (always active). Expired rows are visually distinct (muted colour, "Utløpt" badge) and show only a Delete button — no Copy button, since the link no longer works.

### Create new link form

- Label input (required, max 40 chars)
- Expiry selector: 30 dager / 90 dager / Slutten av aktiv sesong / Permanent
- "Opprett lenke" button → generates code → inserts into `share_tokens` → refreshes list

### "End of active season" expiry calculation

Computed client-side when the player selects "Slutten av aktiv sesong". Use Norway's timezone offset to avoid the link expiring 1–2 hours early for Norwegian users:

- **Year format** (e.g. `"2025"`): `expires_at = new Date('2025-12-31T23:59:59+01:00')`
- **Sesong format** (e.g. `"2024–2025"` using en-dash, as produced by `buildSeasonLabel()`): split on `–` or `/` or `-`, take the last segment, parse as the end year integer. Example: `"2024–2025"` → end year `2025` → `expires_at = new Date('2025-06-30T23:59:59+02:00')`. Algorithm: `parseInt(activeSeason.split(/[–\-\/]/).pop().trim().slice(-4), 10)`.
- **Fallback** (unrecognised format or parse failure): 90 days from now, with a toast informing the user

### Code generation

```javascript
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0/O, 1/I)
  return Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => chars[b % chars.length])
    .join('');
}
```

Uses `crypto.getRandomValues` (Web Crypto API, all modern browsers). Excludes ambiguous characters to reduce transcription errors if a user reads the code aloud.

### Collision handling

On INSERT, if Supabase returns HTTP 409 or error code `23505` (unique violation):
1. Regenerate the code and retry once
2. If the second attempt also fails: show an error toast ("Noe gikk galt. Prøv igjen.") and abort — do not retry further

### Supabase operations

All three functions must include the authenticated user's JWT in the `Authorization` header (same pattern as `fetchKamper()` and all other authenticated calls):

- `fetchShareTokens()` — `GET /rest/v1/share_tokens?select=id,code,label,expires_at,created_at&order=created_at.desc`
  - RLS filters to `auth.uid() = user_id` automatically — no `user_id` filter needed in the query string
  - `select=` explicitly excludes `user_id` from the response (not needed client-side)
- `insertShareToken(body)` — `POST /rest/v1/share_tokens` with `{ user_id, code, label, expires_at }`. The copied share URL written to the clipboard is the **absolute URL**: `https://athlyticsport.app/share?code=<code>` — not a relative path.
- `deleteShareToken(id)` — `DELETE /rest/v1/share_tokens?id=eq.{id}` (same URL pattern as `deleteKamp(id)` in `supabase.js`)

Revoke = delete the row. No soft-delete needed — the viewer sees "invalid link" immediately.

---

## Security Summary

| Concern | Mitigation |
|---|---|
| Assessment data leakage | Never returned by RPC functions — excluded at DB layer |
| Unauthorized match access | RPC validates code + expiry before returning any data |
| Code brute-force | 8-char from 32-char alphabet = 32^8 ≈ 1 trillion combinations; Supabase anon key rate limits apply |
| Code in server logs | Query param approach; Vercel strips query strings from access logs by default |
| Referrer leakage | Query params stripped from Referer header by browser default policy |
| Share token table exposed | RLS: anon has no direct SELECT on `share_tokens`; only RPC path works |
| SECURITY DEFINER injection | Both functions use `SET search_path = public` |
| Unauthenticated panel access | `athlytics:requireAuth` dispatched if user not logged in |
| Large payload / DoS | `get_shared_matches` capped at 1000 rows |

---

## Routing

Add two rewrites to `vercel.json` to handle both `/share` and `/share/` (trailing slash):

```json
{ "source": "/share",  "destination": "/share.html" },
{ "source": "/share/", "destination": "/share.html" }
```

Both are **rewrites** (not redirects) — rewrites preserve query strings. Confirm these rules do not conflict with any existing redirect rules.

---

## Future: Coach Dashboard (Fase 4)

The share link is the foundation. When building dashboard accounts:
- A coach creates an account and enters a share code to "claim" a player link
- Their account stores the `share_token.code` as the connection
- Supabase Edge Functions are recommended for the multi-user/coach layer (validation, notifications, access management) — more suitable than PostgreSQL RPC at that complexity level

---

## Resolved Decisions

| Question | Decision |
|---|---|
| Viewer language | Respects player's `lang` setting. Viewer calls `initViewerLang(profile.lang)` — a new in-memory-only export on `i18n.js`. Does NOT call `setLang()` from `text-refresh.js` (which would write to Supabase). |
| Tournament filter source | Built from match data (`tournament` column), not `profile.tournaments`. |
| Expired codes | Stay visible in panel until manually deleted. No auto-cleanup. |
| Auth gate for panel | Unauthenticated users who tap the button get the auth overlay. |
| Stats render pattern | Duplicated functions accept `(matches, settings)` as parameters. No imports from `state.js` / `settings.js`. |
| Viewer page language | `text-refresh.js` is NOT imported. Viewer calls `setLang()` once, then renders with `t()` directly. |
| Asset path format | All `src`/`href` in `share.html` use root-relative paths (`/style.css`, `/js/…`). |
| Row limit | 1000 rows max from `get_shared_matches`. Revisit if/when viewer pagination is added. |
| Timezone for expiry | Year seasons: `+01:00` (CET). Sesong end dates: `+02:00` (CEST). Fallback: 90 days UTC. |
