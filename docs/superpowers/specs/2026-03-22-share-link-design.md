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
- Authenticated owner (`auth.uid() = user_id`): SELECT, INSERT, DELETE
- Anon: no direct access — all reads go through RPC functions

**Index:** `CREATE UNIQUE INDEX ON share_tokens(code);`

---

## Supabase RPC Functions

Both functions use `SECURITY DEFINER` and are callable via the anon key.

### `get_shared_profile(share_code text)`

```sql
CREATE OR REPLACE FUNCTION get_shared_profile(share_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
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
           sport, active_season, season_format, lang
    FROM profiles
    WHERE id = v_user_id
  ) r;

  RETURN v_result;
END;
$$;
```

### `get_shared_matches(share_code text)`

```sql
CREATE OR REPLACE FUNCTION get_shared_matches(share_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
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
  ) r;

  RETURN COALESCE(v_result, '[]'::json);
END;
$$;
```

Both functions return `NULL` for invalid or expired codes. The viewer handles this with a friendly error screen.

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
| `vercel.json` | Add route `/share` → `share.html` |
| `js/supabase.js` | Add `fetchShareTokens()`, `insertShareToken()`, `deleteShareToken()` |
| `js/settings-render.js` | Add "Manage share links" button + panel trigger |
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

### Page structure

```
[ Player profile card ]
  Avatar | Name | Club | Favorite team

[ Season filter pills ]
[ Team filter pills ]
[ Tournament filter pills ]

[ Stats view — Overview / Analyse toggle ]
  (identical to main app stats, minus assessment data)

[ Match history list ]
```

### Load flow

1. Read `?code=` from `window.location.search`
2. If no code → show error screen immediately
3. Call `get_shared_profile(code)` and `get_shared_matches(code)` in parallel
4. If either returns `null` → show "This link is no longer valid" error screen
5. Initialise filters from profile settings (`active_season`, `season_format`)
6. Render profile card + stats

### Error states

- Missing code: "No share code found in this link."
- Invalid/expired code: "This link is no longer valid or has expired."
- Network error: "Could not load data. Please try again."

### Reused modules

`share-viewer.js` imports directly from existing modules:
- `utils.js` — `esc()`, `getResult()`, `clampStats()`
- `i18n.js` — `t()` for UI strings (defaults to `no`, respects profile `lang`)
- Stats rendering logic is **duplicated** from `stats-overview.js` and `stats-analyse.js` rather than imported, to keep the viewer self-contained and avoid pulling in write-path dependencies

> **Note:** If stats rendering logic grows complex, consider extracting a shared `stats-render-core.js` in a future refactor. For now, duplication is acceptable.

---

## Share Management Panel (`share-manage.js`)

### Access point

Settings tab → "Del statistikk" (Share statistics) section → taps button → slides up a panel (same pattern as assessment sheet).

### Panel contents

```
[ Share links ]                          [ × close ]

  ┌─────────────────────────────────────┐
  │ + Create new link                   │
  └─────────────────────────────────────┘

  Active links:
  ┌─────────────────────────────────────┐
  │ Coach Hansen          90 days left  │
  │ athlyticsport.app/share?code=…  [Copy] [Revoke] │
  └─────────────────────────────────────┘
  ┌─────────────────────────────────────┐
  │ Mamma                 Permanent     │
  │ athlyticsport.app/share?code=…  [Copy] [Revoke] │
  └─────────────────────────────────────┘

  Expired links:
  ┌─────────────────────────────────────┐
  │ Old scout             Expired       │
  │                                [Delete]         │
  └─────────────────────────────────────┘
```

### Create new link form

- Label input (required, max 40 chars)
- Expiry selector: 30 days / 90 days / End of active season / Permanent
- "Create link" button → generates 8-char alphanumeric code client-side → inserts into `share_tokens` → refreshes list

### Code generation

```javascript
function generateCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no ambiguous chars (0/O, 1/I)
  return Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => chars[b % chars.length])
    .join('');
}
```

Uses `crypto.getRandomValues` (Web Crypto API, available in all modern browsers). Excludes ambiguous characters to reduce transcription errors if a user ever reads the code aloud.

### Supabase operations

- `fetchShareTokens()` — `GET /rest/v1/share_tokens?user_id=eq.{uid}&order=created_at.desc` (authenticated)
- `insertShareToken(body)` — `POST /rest/v1/share_tokens` (authenticated)
- `deleteShareToken(id)` — `DELETE /rest/v1/share_tokens?id=eq.{id}` (authenticated)

Revoke = delete the row. No soft-delete needed — the viewer will see "invalid link" immediately.

---

## Security Summary

| Concern | Mitigation |
|---|---|
| Assessment data leakage | Never returned by RPC functions — excluded at DB layer |
| Unauthorized match access | RPC validates code + expiry before returning any data |
| Code brute-force | 8-char from 32-char alphabet = 32^8 ≈ 1 trillion combinations. Rate limiting via Supabase anon key limits. |
| Code in server logs | Query param approach; Vercel strips query strings from access logs by default |
| Referrer leakage | Query params stripped from Referer header by browser default policy |
| Share token table exposed | RLS: anon has no direct SELECT on `share_tokens`; only RPC path works |

---

## Routing

Add to `vercel.json`:
```json
{ "source": "/share", "destination": "/share.html" }
```

---

## Future: Coach Dashboard (Fase 4)

The share link is the foundation. When building dashboard accounts:
- A coach creates an account and enters a share code to "claim" a player link
- Their account stores the `share_token.code` as the connection
- Supabase Edge Functions are recommended for the multi-user/coach layer (validation, notifications, access management) — more suitable than PostgreSQL RPC at that complexity level

---

## Open Questions (deferred)

- Should expired codes auto-delete after N days, or stay visible indefinitely until manually deleted?
- Should the viewer page support Norwegian and English (using the player's `lang` setting), or always use the player's language?
- Should the share panel require the player to be authenticated (yes, obviously), or show a prompt to log in first?
