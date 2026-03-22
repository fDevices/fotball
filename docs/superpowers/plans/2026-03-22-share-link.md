# Share Link Feature — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow a player to generate shareable links that coaches, parents, or scouts can open to view stats and profile — no account required, assessments never exposed.

**Architecture:** A new `share_tokens` table holds per-user codes with expiry. Two Supabase `SECURITY DEFINER` RPC functions serve data to unauthenticated callers after validating the code. A standalone `share.html` + `share-viewer.js` renders the read-only view; `share-manage.js` provides a settings-panel UI for creating and revoking codes.

**Tech Stack:** Vanilla JS ES modules, Supabase REST API (anon key + RPC), Chart.js 4, Vercel rewrites, Web Crypto API.

**Spec:** `docs/superpowers/specs/2026-03-22-share-link-design.md`

**No automated test framework exists** — verification steps are manual browser checks and Supabase SQL editor checks.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| Supabase dashboard (SQL editor) | Manual | Create table, RLS, RPC functions |
| `js/i18n.js` | Modify | Add `initViewerLang()`, update `t()`, add share i18n strings |
| `js/supabase.js` | Modify | Add `fetchShareTokens()`, `insertShareToken()`, `deleteShareToken()` |
| `js/share-manage.js` | Create | Management panel: generate codes, CRUD, render, focus trap |
| `app.html` | Modify | Add "Del statistikk" section HTML to settings tab + share panel markup |
| `js/settings-render.js` | Modify | Add `renderShareSection()` call |
| `js/main.js` | Modify | Wire share panel actions into ACTIONS map |
| `vercel.json` | Modify | Add two rewrites: `/share` and `/share/` → `share.html` |
| `share.html` | Create | Standalone viewer page shell |
| `js/share-viewer.js` | Create | Viewer: load RPC data, render profile card + stats, local event delegation |
| `style.css` | Modify | Management panel styles + viewer page styles |
| `CLAUDE.md` | Modify | Update roadmap |
| `CHANGELOG.md` | Modify | Release entry |

---

## Task 1: Supabase — Table, RLS, and RPC Functions

**Files:** Supabase dashboard → SQL Editor

This is manual setup — run each SQL block in the Supabase SQL editor for the project at `https://gjxsebeajcrmseraypyw.supabase.co`.

- [ ] **Step 1.1: Create the `share_tokens` table**

```sql
CREATE TABLE share_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  code        text NOT NULL UNIQUE,
  label       text NOT NULL,
  expires_at  timestamptz NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);
```

- [ ] **Step 1.2: Enable RLS and create policies**

```sql
ALTER TABLE share_tokens ENABLE ROW LEVEL SECURITY;

-- Owner can read their own tokens
CREATE POLICY "owner_select" ON share_tokens
  FOR SELECT USING (auth.uid() = user_id);

-- Owner can insert, but only for themselves
CREATE POLICY "owner_insert" ON share_tokens
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Owner can delete their own tokens
CREATE POLICY "owner_delete" ON share_tokens
  FOR DELETE USING (auth.uid() = user_id);

-- Anon has no direct access (reads only via RPC)
```

- [ ] **Step 1.3: Create `get_shared_profile` RPC function**

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

- [ ] **Step 1.4: Create `get_shared_matches` RPC function**

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

- [ ] **Step 1.5: Grant anon execute on both functions**

```sql
GRANT EXECUTE ON FUNCTION get_shared_profile(text) TO anon;
GRANT EXECUTE ON FUNCTION get_shared_matches(text) TO anon;
```

- [ ] **Step 1.6: Verify in SQL editor**

Run these checks — both should return results without error:

```sql
-- Should return empty array (no valid code)
SELECT get_shared_matches('TESTCODE1');

-- Should return NULL (no valid code)
SELECT get_shared_profile('TESTCODE1');
```

Expected output: `get_shared_matches` returns `[]`, `get_shared_profile` returns `null`.

- [ ] **Step 1.7: Commit**

```bash
git add -p  # nothing to stage — Supabase changes are remote
git commit --allow-empty -m "feat(db): add share_tokens table, RLS policies, and RPC functions"
```

---

## Task 2: `i18n.js` — Add `initViewerLang` and Share Strings

**Files:**
- Modify: `js/i18n.js`

- [ ] **Step 2.1: Add `_viewerLang` override variable and `initViewerLang` export**

In `js/i18n.js`, add before the `TEKST` constant:

```javascript
// Note: named _viewerLang (not _activeLang as the spec draft shows) to avoid
// naming collision with the _activeLang variable used in share-viewer.js.
// Null means "use getSettings().lang" — normal app behaviour is unchanged.
var _viewerLang = null;

export function initViewerLang(lang) {
  if (lang === 'en' || lang === 'no') _viewerLang = lang;
}
```

Then update the `t()` function to use `_viewerLang` when set:

```javascript
export function t(key) {
  var lang = _viewerLang || getSettings().lang || 'no';
  return (TEKST[lang] || TEKST.no)[key] || TEKST.no[key] || key;
}
```

- [ ] **Step 2.2: Add Norwegian share strings to `TEKST.no`**

Add these entries to the `no` object inside `TEKST` (before the closing `}`):

```javascript
    share_panel_title:'Del statistikk',
    share_manage_btn:'Administrer delingslenker',
    share_create_title:'Opprett ny lenke',
    share_label_input:'Etikett (f.eks. Trener Hansen)',
    share_expiry_label:'Utløper',
    share_expiry_30:'30 dager',
    share_expiry_90:'90 dager',
    share_expiry_season:'Slutten av aktiv sesong',
    share_expiry_permanent:'Permanent',
    share_create_btn:'Opprett lenke',
    share_active_links:'Aktive lenker',
    share_expired_links:'Utløpte lenker',
    share_section_desc:'Del statistikken din med trener, foreldre eller speider via en lenke.',
    share_no_links:'Ingen delingslenker ennå',
    share_copy_btn:'Kopier',
    share_revoke_btn:'Slett',
    share_badge_expired:'Utløpt',
    share_badge_permanent:'Permanent',
    share_days_left:'dager igjen',
    share_close:'Lukk',
    toast_share_copied:'✓ Lenke kopiert',
    toast_share_created:'✓ Delingslenke opprettet',
    toast_share_deleted:'✓ Delingslenke slettet',
    toast_share_error:'Noe gikk galt. Prøv igjen.',
    toast_share_expiry_fallback:'Ugyldig sesongformat – lenken utløper om 90 dager',
    share_viewer_invalid:'Denne lenken er ikke lenger gyldig eller har utløpt.',
    share_viewer_no_code:'Ingen delingskode funnet i denne lenken.',
    share_viewer_network_error:'Kunne ikke laste data. Prøv igjen.',
    share_viewer_title:'Statistikk',
```

- [ ] **Step 2.3: Add English share strings to `TEKST.en`**

Add matching entries to the `en` object:

```javascript
    share_panel_title:'Share statistics',
    share_manage_btn:'Manage share links',
    share_create_title:'Create new link',
    share_label_input:'Label (e.g. Coach Hansen)',
    share_expiry_label:'Expires',
    share_expiry_30:'30 days',
    share_expiry_90:'90 days',
    share_expiry_season:'End of active season',
    share_expiry_permanent:'Permanent',
    share_create_btn:'Create link',
    share_active_links:'Active links',
    share_expired_links:'Expired links',
    share_section_desc:'Share your statistics with coaches, parents, or scouts via a link.',
    share_no_links:'No share links yet',
    share_copy_btn:'Copy',
    share_revoke_btn:'Delete',
    share_badge_expired:'Expired',
    share_badge_permanent:'Permanent',
    share_days_left:'days left',
    share_close:'Close',
    toast_share_copied:'✓ Link copied',
    toast_share_created:'✓ Share link created',
    toast_share_deleted:'✓ Share link deleted',
    toast_share_error:'Something went wrong. Try again.',
    toast_share_expiry_fallback:'Invalid season format – link expires in 90 days',
    share_viewer_invalid:'This link is no longer valid or has expired.',
    share_viewer_no_code:'No share code found in this link.',
    share_viewer_network_error:'Could not load data. Please try again.',
    share_viewer_title:'Statistics',
```

- [ ] **Step 2.4: Verify existing app still works**

Open `app.html` locally. Switch language between Norwegian and English. Confirm all existing text still appears correctly (the `t()` change is backwards-compatible — `_viewerLang` is `null` by default).

- [ ] **Step 2.5: Commit**

```bash
git add js/i18n.js
git commit -m "feat(i18n): add initViewerLang and share feature strings"
```

---

## Task 3: `supabase.js` — Share Token CRUD Functions

**Files:**
- Modify: `js/supabase.js`

- [ ] **Step 3.1: Add three functions to `supabase.js`**

Add after the `// ── Settings` section:

```javascript
// ── Share tokens ─────────────────────────────────────────────────────────────

export async function fetchShareTokens() {
  var res = await fetch(
    SUPABASE_URL + '/rest/v1/share_tokens?select=id,code,label,expires_at,created_at&order=created_at.desc',
    { headers: headers() }
  );
  if (!res.ok) throw new Error('fetchShareTokens failed: ' + res.status);
  return res.json();
}

export async function insertShareToken(body) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/share_tokens', {
    method: 'POST',
    headers: headers({ 'Content-Type': 'application/json', 'Prefer': 'return=representation' }),
    body: JSON.stringify(body)
  });
  return res;
}

export async function deleteShareToken(id) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/share_tokens?id=eq.' + id, {
    method: 'DELETE',
    headers: headers()
  });
  return res;
}
```

- [ ] **Step 3.2: Verify (browser console)**

Open the app while logged in. In the console:

```javascript
import('/js/supabase.js').then(m => m.fetchShareTokens().then(console.log));
```

Expected: an empty array `[]` (no tokens created yet), no errors.

- [ ] **Step 3.3: Commit**

```bash
git add js/supabase.js
git commit -m "feat(supabase): add share token CRUD functions"
```

---

## Task 4: `share-manage.js` — Management Panel

**Files:**
- Create: `js/share-manage.js`

- [ ] **Step 4.1: Create `js/share-manage.js` with code generation and expiry helpers**

```javascript
import { fetchShareTokens, insertShareToken, deleteShareToken as deleteShareTokenApi } from './supabase.js';
import { getSettings } from './settings.js';
import { getUserId } from './auth.js';
import { t } from './i18n.js';
import { esc, getFocusableElements, trapFocus } from './utils.js';

var _tokens = [];
var _focusSrc = null;
var _trapHandler = null;

// ── Code generation ──────────────────────────────────────────────────────────

function generateCode() {
  var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(function(b) { return chars[b % chars.length]; })
    .join('');
}

// ── Expiry calculation ───────────────────────────────────────────────────────

export function calcExpiresAt(option) {
  var now = Date.now();
  if (option === '30')       return new Date(now + 30 * 864e5).toISOString();
  if (option === '90')       return new Date(now + 90 * 864e5).toISOString();
  if (option === 'permanent') return null;
  if (option === 'season') {
    var activeSeason = getSettings().activeSeason || '';
    if (/^\d{4}$/.test(activeSeason.trim())) {
      // Year format e.g. "2025"
      return new Date(activeSeason.trim() + '-12-31T23:59:59+01:00').toISOString();
    }
    // Sesong format e.g. "2024–2025" or "2024/25"
    var parts = activeSeason.split(/[–\-\/]/);
    var lastPart = parts[parts.length - 1].trim();
    var endYear = parseInt(lastPart.slice(-4), 10);
    if (!isNaN(endYear) && endYear > 2000) {
      return new Date(endYear + '-06-30T23:59:59+02:00').toISOString();
    }
    // Fallback: 90 days, fire toast from caller
    return null; // signal to caller: use fallback
  }
  return new Date(now + 90 * 864e5).toISOString();
}
```

- [ ] **Step 4.2: Add open/close panel functions**

Append to `js/share-manage.js`:

```javascript
// ── Panel open/close ─────────────────────────────────────────────────────────

export function openSharePanel() {
  var panel = document.getElementById('share-panel');
  var backdrop = document.getElementById('share-panel-backdrop');
  if (!panel || !backdrop) return;
  _focusSrc = document.activeElement;
  _loadAndRender();
  panel.classList.add('open');
  backdrop.classList.add('open');
  document.body.style.overflow = 'hidden';
  _trapHandler = function(e) { trapFocus(panel, e); };
  panel.addEventListener('keydown', _trapHandler);
  setTimeout(function() {
    var first = getFocusableElements(panel)[0];
    if (first) first.focus();
  }, 50);
}

export function closeSharePanel() {
  var panel = document.getElementById('share-panel');
  var backdrop = document.getElementById('share-panel-backdrop');
  if (panel) {
    panel.classList.remove('open');
    if (_trapHandler) panel.removeEventListener('keydown', _trapHandler);
    _trapHandler = null;
  }
  if (backdrop) backdrop.classList.remove('open');
  document.body.style.overflow = '';
  if (_focusSrc) { _focusSrc.focus(); _focusSrc = null; }
}
```

- [ ] **Step 4.3: Add render function**

Append to `js/share-manage.js`:

```javascript
// ── Render ───────────────────────────────────────────────────────────────────

function _daysLeft(expiresAt) {
  if (!expiresAt) return null;
  var ms = new Date(expiresAt).getTime() - Date.now();
  return Math.ceil(ms / 864e5);
}

function _isExpired(token) {
  if (!token.expires_at) return false;
  return new Date(token.expires_at).getTime() <= Date.now();
}

function _tokenHTML(token) {
  var expired = _isExpired(token);
  var url = 'https://athlyticsport.app/share?code=' + esc(token.code);
  var expiryText = !token.expires_at
    ? t('share_badge_permanent')
    : expired
      ? '<span class="share-badge-expired">' + t('share_badge_expired') + '</span>'
      : _daysLeft(token.expires_at) + ' ' + t('share_days_left');

  return '<div class="share-token-row' + (expired ? ' share-token-expired' : '') + '">' +
    '<div class="share-token-info">' +
      '<span class="share-token-label">' + esc(token.label) + '</span>' +
      '<span class="share-token-expiry">' + expiryText + '</span>' +
    '</div>' +
    (!expired
      ? '<div class="share-token-url">' + esc(url) + '</div>' +
        '<div class="share-token-actions">' +
          '<button class="share-btn-copy" data-action="copyShareLink" data-url="' + esc(url) + '">' + t('share_copy_btn') + '</button>' +
          '<button class="share-btn-delete" data-action="deleteShareToken" data-id="' + esc(token.id) + '">' + t('share_revoke_btn') + '</button>' +
        '</div>'
      : '<div class="share-token-actions">' +
          '<button class="share-btn-delete" data-action="deleteShareToken" data-id="' + esc(token.id) + '">' + t('share_revoke_btn') + '</button>' +
        '</div>') +
  '</div>';
}

function _renderPanel() {
  var container = document.getElementById('share-panel-list');
  if (!container) return;

  var active  = _tokens.filter(function(t) { return !_isExpired(t); });
  var expired = _tokens.filter(function(t) { return  _isExpired(t); });

  var html = '';

  if (_tokens.length === 0) {
    html = '<p class="share-no-links">' + t('share_no_links') + '</p>';
  } else {
    if (active.length > 0) {
      html += '<div class="share-section-label">' + t('share_active_links') + '</div>';
      html += active.map(_tokenHTML).join('');
    }
    if (expired.length > 0) {
      html += '<div class="share-section-label share-section-expired">' + t('share_expired_links') + '</div>';
      html += expired.map(_tokenHTML).join('');
    }
  }

  container.innerHTML = html;
}

async function _loadAndRender() {
  var container = document.getElementById('share-panel-list');
  if (container) container.innerHTML = '<div class="loading"><div class="spinner"></div></div>';
  try {
    _tokens = await fetchShareTokens();
    _renderPanel();
  } catch(e) {
    if (container) container.innerHTML = '<p class="share-no-links">' + t('load_error') + '</p>';
  }
}
```

- [ ] **Step 4.4: Add create and delete actions**

Append to `js/share-manage.js`:

```javascript
// ── Actions ──────────────────────────────────────────────────────────────────

export async function createShareToken() {
  var labelEl  = document.getElementById('share-new-label');
  var expiryEl = document.getElementById('share-new-expiry');
  if (!labelEl || !expiryEl) return;

  var label  = labelEl.value.trim();
  var option = expiryEl.value;
  if (!label) { labelEl.focus(); return; }

  var expiresAt = calcExpiresAt(option);
  var usedFallback = (option === 'season' && expiresAt === null);
  if (usedFallback) {
    expiresAt = new Date(Date.now() + 90 * 864e5).toISOString();
    document.dispatchEvent(new CustomEvent('athlytics:toast', { detail: { msg: t('toast_share_expiry_fallback'), type: 'warn' } }));
  }

  var code = generateCode();
  var userId = getUserId(); // from auth.js — returns DEMO_USER_ID if not authenticated
  if (!userId) return;

  var body = { user_id: userId, code: code, label: label, expires_at: expiresAt };

  async function tryInsert(attempt) {
    var res = await insertShareToken(body);
    if (res.status === 409 || res.status === 422) {
      var data = await res.json().catch(function() { return {}; });
      var isCollision = (data.code === '23505') || res.status === 409;
      if (isCollision && attempt < 2) {
        body.code = generateCode();
        return tryInsert(attempt + 1);
      }
      document.dispatchEvent(new CustomEvent('athlytics:toast', { detail: { msg: t('toast_share_error'), type: 'error' } }));
      return;
    }
    if (!res.ok) {
      document.dispatchEvent(new CustomEvent('athlytics:toast', { detail: { msg: t('toast_share_error'), type: 'error' } }));
      return;
    }
    labelEl.value = '';
    document.dispatchEvent(new CustomEvent('athlytics:toast', { detail: { msg: t('toast_share_created'), type: 'success' } }));
    _loadAndRender();
  }

  await tryInsert(1);
}

export async function removeShareToken(id) {
  try {
    var res = await deleteShareTokenApi(id);
    if (!res.ok) throw new Error('delete failed');
    _tokens = _tokens.filter(function(t) { return t.id !== id; });
    _renderPanel();
    document.dispatchEvent(new CustomEvent('athlytics:toast', { detail: { msg: t('toast_share_deleted'), type: 'success' } }));
  } catch(e) {
    document.dispatchEvent(new CustomEvent('athlytics:toast', { detail: { msg: t('toast_share_error'), type: 'error' } }));
  }
}

export function copyShareLink(url) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(function() {
      document.dispatchEvent(new CustomEvent('athlytics:toast', { detail: { msg: t('toast_share_copied'), type: 'success' } }));
    });
  } else {
    // Fallback for older browsers
    var ta = document.createElement('textarea');
    ta.value = url;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    document.dispatchEvent(new CustomEvent('athlytics:toast', { detail: { msg: t('toast_share_copied'), type: 'success' } }));
  }
}
```

- [ ] **Step 4.5: Commit**

```bash
git add js/share-manage.js
git commit -m "feat(share): add share-manage.js — panel open/close, code gen, CRUD"
```

---

## Task 5: Wire Share Panel into `app.html`, `settings-render.js`, and `main.js`

**Files:**
- Modify: `app.html`
- Modify: `js/settings-render.js`
- Modify: `js/main.js`

- [ ] **Step 5.1: Add share panel markup to `app.html`**

Find the assessment panel in `app.html` (the `#assessment-backdrop` and `#assessment-sheet` elements) and add the share panel markup just after it, before `</body>`:

```html
<!-- Share panel -->
<div id="share-panel-backdrop" class="modal-backdrop"></div>
<div id="share-panel" class="bottom-sheet" role="dialog" aria-modal="true" aria-label="Del statistikk">
  <div class="sheet-header">
    <span class="sheet-title" id="share-panel-title">Del statistikk</span>
    <button class="sheet-close" data-action="closeSharePanel" aria-label="Lukk">×</button>
  </div>
  <div class="sheet-body">
    <!-- Create new link form -->
    <div class="share-create-form">
      <input
        type="text"
        id="share-new-label"
        class="settings-input"
        maxlength="40"
        placeholder="F.eks. Trener Hansen"
        aria-label="Etikett"
      />
      <select id="share-new-expiry" class="settings-select">
        <option value="30">30 dager</option>
        <option value="90" selected>90 dager</option>
        <option value="season">Slutten av aktiv sesong</option>
        <option value="permanent">Permanent</option>
      </select>
      <button class="btn-primary" data-action="createShareToken">Opprett lenke</button>
    </div>
    <!-- Token list -->
    <div id="share-panel-list"></div>
  </div>
</div>
```

- [ ] **Step 5.2: Add "Del statistikk" section to settings tab in `app.html`**

In the settings screen (`#screen-settings`), add this section after the export section:

```html
<!-- Share statistics section -->
<div class="settings-section">
  <div class="settings-section-title" id="st-share-title">Del statistikk</div>
  <div class="settings-section-desc" id="st-share-desc">Del statistikken din med trener, foreldre eller speider via en lenke.</div>
  <button class="settings-action-btn" data-action="openSharePanel" id="share-manage-btn">
    Administrer delingslenker
  </button>
</div>
```

- [ ] **Step 5.3: Update `renderSettings()` in `js/settings-render.js`**

Add these lines inside `renderSettings()`, after the existing text updates:

```javascript
  var stShareTitle = document.getElementById('st-share-title');
  if (stShareTitle) stShareTitle.textContent = t('share_panel_title');
  var stShareDesc = document.getElementById('st-share-desc');
  if (stShareDesc) stShareDesc.textContent = t('share_section_desc');
  var shareManageBtn = document.getElementById('share-manage-btn');
  if (shareManageBtn) shareManageBtn.textContent = t('share_manage_btn');
  var sharePanelTitle = document.getElementById('share-panel-title');
  if (sharePanelTitle) sharePanelTitle.textContent = t('share_panel_title');
```

- [ ] **Step 5.4: Wire actions into `main.js` ACTIONS map**

Add these imports at the top of `main.js`:

```javascript
import { openSharePanel, closeSharePanel, createShareToken, removeShareToken, copyShareLink } from './share-manage.js';
```

Add these entries to the `ACTIONS` map:

```javascript
openSharePanel:   function(el) {
  if (!isAuthenticated()) {
    document.dispatchEvent(new CustomEvent('athlytics:requireAuth'));
    return;
  }
  openSharePanel();
},
closeSharePanel:  function() { closeSharePanel(); },
createShareToken: function() { createShareToken(); },
deleteShareToken: function(el) { removeShareToken(el.dataset.id); },
copyShareLink:    function(el) { copyShareLink(el.dataset.url); },
```

- [ ] **Step 5.5: Verify in browser**

1. Open the app → Settings tab → scroll to "Del statistikk" section — verify it renders
2. Tap "Administrer delingslenker" while logged in → panel slides up
3. Tap "Administrer delingslenker" while logged out → auth overlay appears (not share panel)
4. In panel: enter a label → select expiry → tap "Opprett lenke" → new token appears in list
5. Tap "Kopier" → confirm toast "✓ Lenke kopiert" and clipboard contains `https://athlyticsport.app/share?code=XXXXXXXX`
6. Tap "Slett" → token disappears, toast "✓ Delingslenke slettet"
7. Close panel → focus returns to "Administrer delingslenker" button

- [ ] **Step 5.6: Commit**

```bash
git add app.html js/settings-render.js js/main.js
git commit -m "feat(share): wire share panel into settings tab and ACTIONS map"
```

---

## Task 6: Routing and `share.html` Shell

**Files:**
- Modify: `vercel.json`
- Create: `share.html`

- [ ] **Step 6.1: Add rewrites to `vercel.json`**

Current `vercel.json`:
```json
{
  "rewrites": [
    { "source": "/app", "destination": "/app.html" },
    { "source": "/", "destination": "/landing.html" }
  ]
}
```

Add two new rewrites:
```json
{
  "rewrites": [
    { "source": "/app",    "destination": "/app.html" },
    { "source": "/share",  "destination": "/share.html" },
    { "source": "/share/", "destination": "/share.html" },
    { "source": "/",       "destination": "/landing.html" }
  ]
}
```

- [ ] **Step 6.2: Create `share.html`**

```html
<!DOCTYPE html>
<html lang="no">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Athlytics Sport – Statistikkdeling</title>
  <meta property="og:title" content="Athlytics Sport – Statistikkdeling">
  <meta property="og:description" content="Se spillerstatistikk delt via Athlytics Sport.">
  <meta property="og:site_name" content="Athlytics Sport">
  <link rel="stylesheet" href="/style.css">
  <script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js" defer></script>
</head>
<body class="share-viewer-body">
  <div id="share-root"></div>
  <script type="module" src="/js/share-viewer.js"></script>
</body>
</html>
```

- [ ] **Step 6.3: Verify routing (local or after deploy)**

Navigate to `/share` — the page should load without a 404 (it will show a blank page or error state, since no code is in the URL — that is expected at this point).

Navigate to `/share?code=TESTCODE` — same result (code is invalid, but page loads).

- [ ] **Step 6.4: Commit**

```bash
git add vercel.json share.html
git commit -m "feat(share): add share.html viewer shell and vercel rewrites"
```

---

## Task 7: `share-viewer.js` — Viewer Page Logic

**Files:**
- Create: `js/share-viewer.js`

- [ ] **Step 7.1: Create `js/share-viewer.js` with data loading and error states**

```javascript
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';
import { esc, getResult } from './utils.js';
import { t, initViewerLang } from './i18n.js';

// ── RPC calls (anon key, no auth header) ─────────────────────────────────────

async function fetchSharedProfile(code) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/rpc/get_shared_profile', {
    method: 'POST',
    headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ share_code: code })
  });
  if (!res.ok) return null;
  return res.json();
}

async function fetchSharedMatches(code) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/rpc/get_shared_matches', {
    method: 'POST',
    headers: { 'apikey': SUPABASE_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ share_code: code })
  });
  if (!res.ok) return null;
  return res.json();
}

// ── Error screen ─────────────────────────────────────────────────────────────

function showError(msg) {
  var root = document.getElementById('share-root');
  if (root) root.innerHTML =
    '<div class="share-error-screen">' +
      '<div class="share-error-icon">🔒</div>' +
      '<div class="share-error-msg">' + esc(msg) + '</div>' +
      '<a href="/" class="share-error-link">Athlytics Sport</a>' +
    '</div>';
}
```

- [ ] **Step 7.2: Add filter state and helper functions (adapted from stats-overview.js)**

Append to `js/share-viewer.js`:

```javascript
// ── Filter state ─────────────────────────────────────────────────────────────

var _matches   = [];
var _settings  = {};  // shape: { activeSeason, seasonFormat, sport }
var _activeSeason     = '';
var _activeLag        = 'all';
var _activeTournament = 'all';
var _matchPage        = 0;
var _activeView       = 'overview';

// ── Helpers (mirrors stats-overview.js) ──────────────────────────────────────

function matchesSeason(k, season) {
  var base = parseInt(season.split(/[–\-]/)[0].trim(), 10);
  var year = parseInt((k.date || '').slice(0, 4), 10);
  if (/[–\-]/.test(season)) return year === base || year === base + 1;
  return (k.date || '').startsWith(season);
}

function matchesTeamFilter(k, lag) {
  if (lag === 'all') return true;
  var stored = (k.own_team || '').toLowerCase();
  var filter = lag.toLowerCase();
  return stored === filter || stored.endsWith(' ' + filter);
}

function getAllSeasons(matches) {
  var years = {};
  matches.forEach(function(k) {
    var y = (k.date || '').slice(0, 4);
    if (y) years[y] = true;
  });
  return Object.keys(years).sort(function(a, b) { return b - a; });
}

function calcWDL(arr) {
  var w = 0, d = 0, l = 0, g = 0, a = 0;
  arr.forEach(function(k) {
    var r = getResult(k);
    if (r === 'wins') w++; else if (r === 'draw') d++; else l++;
    g += k.goals || 0; a += k.assists || 0;
  });
  return { w: w, d: d, l: l, g: g, a: a, n: arr.length };
}

var PAGE_SIZE = 20;

function renderMatchList(matches, page) {
  var start = page * PAGE_SIZE;
  var slice = matches.slice(start, start + PAGE_SIZE);
  var total = matches.length;
  var pageCount = Math.ceil(total / PAGE_SIZE);

  if (slice.length === 0) return '<div class="loading">' + t('no_matches_yet') + '</div>';

  var rows = slice.map(function(k) {
    var r = getResult(k);
    return '<div class="match-row">' +
      '<div class="match-row-date">' + esc(k.date || '') + '</div>' +
      '<div class="match-row-opponent">' + esc(k.opponent || '') + '</div>' +
      '<div class="match-row-score">' + k.home_score + '–' + k.away_score + '</div>' +
      '<div class="result-auto ' + r + '">' +
        (r === 'wins' ? t('win_short') : r === 'draw' ? t('draw_short') : t('loss_short')) +
      '</div>' +
    '</div>';
  }).join('');

  var pagination = pageCount > 1
    ? '<div class="pagination">' +
        (page > 0 ? '<button data-action="shareSetPage" data-page="' + (page - 1) + '">' + t('page_prev') + '</button>' : '') +
        '<span>' + (page + 1) + ' ' + t('page_of') + ' ' + pageCount + '</span>' +
        (page < pageCount - 1 ? '<button data-action="shareSetPage" data-page="' + (page + 1) + '">' + t('page_next') + '</button>' : '') +
      '</div>'
    : '';

  return rows + pagination;
}
```

- [ ] **Step 7.3: Add `renderStats` and profile card functions**

Append to `js/share-viewer.js`:

```javascript
// ── Profile card ─────────────────────────────────────────────────────────────

function renderProfileCard(profile) {
  var avatarHtml = profile.avatar_url
    ? '<img src="' + esc(profile.avatar_url) + '" class="share-avatar" alt="avatar">'
    : '<div class="share-avatar share-avatar-placeholder"></div>';

  var favoriteTeam = (profile.favorite_team || '').trim();

  return '<div class="share-profile-card">' +
    avatarHtml +
    '<div class="share-profile-info">' +
      '<div class="share-profile-name">' + esc(profile.name || '') + '</div>' +
      '<div class="share-profile-club">' + esc(profile.club || '') + '</div>' +
      (favoriteTeam ? '<div class="share-profile-team">' + esc(favoriteTeam) + '</div>' : '') +
    '</div>' +
  '</div>';
}

// ── Stats rendering (adapted from stats-overview.js) ─────────────────────────

function renderStats() {
  var seasons = getAllSeasons(_matches);
  if (!seasons.length) seasons = [String(new Date().getFullYear())];
  if (!seasons.includes(_activeSeason)) _activeSeason = seasons[0];

  var seasonMatches = _matches.filter(function(k) { return matchesSeason(k, _activeSeason); });

  // Team pills (from match data)
  var teamValues = [];
  seasonMatches.forEach(function(k) {
    var v = k.own_team || '';
    if (v && !teamValues.includes(v)) teamValues.push(v);
  });

  // Tournament pills (from match data)
  var tournamentValues = [];
  seasonMatches.forEach(function(k) {
    var v = k.tournament || '';
    if (!tournamentValues.includes(v)) tournamentValues.push(v);
  });
  tournamentValues.sort(function(a, b) { if (!a) return 1; if (!b) return -1; return a.localeCompare(b); });

  var teamMatches = seasonMatches.filter(function(k) { return matchesTeamFilter(k, _activeLag); });
  var filtered = _activeTournament === 'all'
    ? teamMatches
    : teamMatches.filter(function(k) { return (k.tournament || '') === _activeTournament; });

  var n = filtered.length;
  var s = calcWDL(filtered);

  var root = document.getElementById('share-root');
  if (!root) return;

  // Season pills
  var seasonPills = seasons.map(function(season) {
    return '<button class="season-pill' + (season === _activeSeason ? ' active' : '') +
      '" data-action="shareSetSeason" data-season="' + esc(season) + '">' + esc(season) + '</button>';
  }).join('');

  // Team pills
  var teamPills = [{ key: 'all', label: t('alle_lag') }]
    .concat(teamValues.map(function(v) { return { key: v, label: v }; }))
    .map(function(p) {
      return '<button class="season-pill' + (_activeLag === p.key ? ' active' : '') +
        '" data-action="shareSetTeam" data-team="' + esc(p.key) + '">' + esc(p.label) + '</button>';
    }).join('');

  // Tournament pills (only if >1)
  var tournamentPillsHtml = '';
  if (tournamentValues.length > 1) {
    var tournamentPills = [{ key: 'all', label: t('tournament_filter_all') }]
      .concat(tournamentValues.map(function(v) {
        return { key: v, label: v === '' ? t('no_tournament') : v };
      }))
      .map(function(p) {
        return '<button class="season-pill' + (_activeTournament === p.key ? ' active' : '') +
          '" data-action="shareSetTournament" data-tournament="' + esc(p.key) + '">' + esc(p.label) + '</button>';
      }).join('');
    tournamentPillsHtml = '<div class="stats-filters-row">' + tournamentPills + '</div>';
  }

  // View toggle
  var toggle = '<div class="stats-view-toggle">' +
    '<button id="share-view-btn-overview" class="view-toggle-btn' + (_activeView === 'overview' ? ' active' : '') +
      '" data-action="shareSetView" data-view="overview">' + t('stats_overview') + '</button>' +
    '<button id="share-view-btn-analyse" class="view-toggle-btn' + (_activeView === 'analyse' ? ' active' : '') +
      '" data-action="shareSetView" data-view="analyse">' + t('stats_analyse') + '</button>' +
  '</div>';

  var statsContent = '';
  if (_activeView === 'overview' && n === 0) {
    statsContent = '<div class="loading">' + t('no_matches_season') + '</div>';
  } else if (_activeView === 'overview') {
    var pct = function(v) { return Math.round((v / n) * 100); };
    statsContent =
      '<div class="stat-grid">' +
        '<div class="stat-card"><div class="stat-num lime">' + s.w + '</div><div class="stat-lbl">' + t('stat_wins') + '</div></div>' +
        '<div class="stat-card"><div class="stat-num gold">' + s.d + '</div><div class="stat-lbl">' + t('stat_draws') + '</div></div>' +
        '<div class="stat-card"><div class="stat-num danger">' + s.l + '</div><div class="stat-lbl">' + t('stat_losses') + '</div></div>' +
      '</div>' +
      '<div class="stat-row-card">' +
        '<div class="stat-row-title">' + t('match_dist') + ' – ' + n + ' ' + t('matches_short') + '</div>' +
        '<div class="wdl-bar">' +
          '<div class="wdl-seg w" style="width:' + pct(s.w) + '%"></div>' +
          '<div class="wdl-seg d" style="width:' + pct(s.d) + '%"></div>' +
          '<div class="wdl-seg l" style="width:' + pct(s.l) + '%"></div>' +
        '</div>' +
        '<div class="wdl-labels">' +
          '<span class="wdl-label" style="color:var(--lime)">' + pct(s.w) + '% ' + t('win_short') + '</span>' +
          '<span class="wdl-label" style="color:var(--gold)">' + pct(s.d) + '% ' + t('draw_short') + '</span>' +
          '<span class="wdl-label" style="color:var(--danger)">' + pct(s.l) + '% ' + t('loss_short') + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="stat-grid">' +
        '<div class="stat-card"><div class="stat-num lime">' + s.g + '</div><div class="stat-lbl">' + t('stat_goals') + '</div></div>' +
        '<div class="stat-card"><div class="stat-num gold">' + s.a + '</div><div class="stat-lbl">' + t('stat_assists') + '</div></div>' +
        '<div class="stat-card"><div class="stat-num">' + (s.g + s.a) + '</div><div class="stat-lbl">G+A</div></div>' +
      '</div>' +
      '<div class="match-list-header">' + t('match_history') + '</div>' +
      renderMatchList(filtered, _matchPage);
  } else {
    // Analyse view — Chart.js charts
    statsContent = _renderAnalyse(filtered);
  }

  root.innerHTML =
    renderProfileCard(_profileCache) +
    '<div class="share-viewer-content">' +
      toggle +
      '<div class="stats-filters" id="share-filters">' +
        '<div class="stats-filters-row" id="share-season-selector">' + seasonPills + '</div>' +
        (teamValues.length > 0 ? '<div class="stats-filters-row">' + teamPills + '</div>' : '') +
        tournamentPillsHtml +
      '</div>' +
      '<div id="share-stats-content">' + statsContent + '</div>' +
    '</div>';
}
```

- [ ] **Step 7.4: Add analyse view and Chart.js integration**

Append to `js/share-viewer.js`:

```javascript
// ── Analyse view (adapted from stats-analyse.js) ──────────────────────────────

var _chartInstances = {};

function _destroyCharts() {
  Object.values(_chartInstances).forEach(function(c) { if (c) c.destroy(); });
  _chartInstances = {};
}

function _renderAnalyse(matches) {
  _destroyCharts();
  if (typeof Chart === 'undefined') return '<div class="loading">' + t('loading_charts') + '</div>';
  if (matches.length === 0) return '<div class="loading">' + t('no_matches_season') + '</div>';

  Chart.defaults.color = '#8a9a80';
  Chart.defaults.borderColor = 'rgba(168,224,99,0.08)';
  Chart.defaults.font.family = 'Barlow Condensed';

  return '<div id="share-chart-winpct-wrap" class="chart-wrap"><canvas id="share-chart-winpct"></canvas></div>' +
         '<div id="share-chart-ga-wrap" class="chart-wrap"><canvas id="share-chart-ga"></canvas></div>';
}

function _initCharts(matches) {
  if (typeof Chart === 'undefined' || _activeView !== 'analyse') return;
  var sorted = matches.slice().sort(function(a, b) { return a.date < b.date ? -1 : 1; });

  // Cumulative win %
  var canvasWin = document.getElementById('share-chart-winpct');
  if (canvasWin && !_chartInstances.winpct) {
    var wins = 0;
    var labels = [], data = [];
    sorted.forEach(function(k, i) {
      if (getResult(k) === 'wins') wins++;
      labels.push(k.date || '');
      data.push(Math.round((wins / (i + 1)) * 100));
    });
    _chartInstances.winpct = new Chart(canvasWin, {
      type: 'line',
      data: { labels: labels, datasets: [{ label: t('chart_win_pct'), data: data, borderColor: '#a8e063', tension: 0.3 }] },
      options: { responsive: true, plugins: { legend: { display: false } } }
    });
  }

  // Goals + assists per match
  var canvasGA = document.getElementById('share-chart-ga');
  if (canvasGA && !_chartInstances.ga) {
    _chartInstances.ga = new Chart(canvasGA, {
      type: 'bar',
      data: {
        labels: sorted.map(function(k) { return k.date || ''; }),
        datasets: [
          { label: t('stat_goals'), data: sorted.map(function(k) { return k.goals || 0; }), backgroundColor: '#a8e063' },
          { label: t('stat_assists'), data: sorted.map(function(k) { return k.assists || 0; }), backgroundColor: '#f0c050' }
        ]
      },
      options: { responsive: true, scales: { x: { stacked: false }, y: { stacked: false, beginAtZero: true } } }
    });
  }
}
```

- [ ] **Step 7.5: Add bootstrap and event delegation**

Append to `js/share-viewer.js`:

```javascript
// ── Bootstrap ────────────────────────────────────────────────────────────────

var _profileCache = null;

async function init() {
  var params = new URLSearchParams(window.location.search);
  var code   = params.get('code');

  if (!code) { showError(t('share_viewer_no_code')); return; }

  var root = document.getElementById('share-root');
  if (root) root.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  var profileData, matchData;
  try {
    var results = await Promise.all([fetchSharedProfile(code), fetchSharedMatches(code)]);
    profileData = results[0];
    matchData   = results[1];
  } catch(e) {
    showError(t('share_viewer_network_error'));
    return;
  }

  if (!profileData || matchData === null) {
    showError(t('share_viewer_invalid'));
    return;
  }

  initViewerLang(profileData.lang);

  _profileCache = profileData;
  _matches = matchData || [];
  _settings = {
    activeSeason:  profileData.active_season || String(new Date().getFullYear()),
    seasonFormat:  profileData.season_format || 'aar',
    sport:         profileData.sport || 'fotball'
  };
  _activeSeason = _settings.activeSeason;

  renderStats();
}

// ── Event delegation (local to share viewer) ─────────────────────────────────

document.addEventListener('click', function(e) {
  var el = e.target.closest('[data-action]');
  if (!el) return;
  var action = el.dataset.action;

  if (action === 'shareSetSeason') {
    _activeSeason = el.dataset.season;
    _activeLag = 'all'; _activeTournament = 'all'; _matchPage = 0;
    _destroyCharts(); renderStats();
  } else if (action === 'shareSetTeam') {
    _activeLag = el.dataset.team;
    _activeTournament = 'all'; _matchPage = 0;
    _destroyCharts(); renderStats();
  } else if (action === 'shareSetTournament') {
    _activeTournament = el.dataset.tournament;
    _matchPage = 0;
    _destroyCharts(); renderStats();
  } else if (action === 'shareSetView') {
    _activeView = el.dataset.view;
    _matchPage = 0;
    _destroyCharts(); renderStats();
    // Init charts after DOM update
    if (_activeView === 'analyse') {
      var seasonMatches = _matches.filter(function(k) { return matchesSeason(k, _activeSeason); });
      var teamMatches = seasonMatches.filter(function(k) { return matchesTeamFilter(k, _activeLag); });
      var filtered = _activeTournament === 'all' ? teamMatches : teamMatches.filter(function(k) { return (k.tournament||'') === _activeTournament; });
      setTimeout(function() { _initCharts(filtered); }, 50);
    }
  } else if (action === 'shareSetPage') {
    _matchPage = parseInt(el.dataset.page, 10) || 0;
    renderStats();
  }
});

init();
```

- [ ] **Step 7.6: Verify viewer page in browser**

1. Copy a valid share code from the management panel (or query `share_tokens` in Supabase SQL editor)
2. Open `http://localhost/share?code=<your_code>` (or deploy to Vercel)
3. Verify: profile card shows (name, club, avatar), stats render
4. Switch seasons — stats update
5. Switch to Analyse — charts render
6. Open `http://localhost/share?code=INVALID` — shows error screen
7. Open `http://localhost/share` (no code) — shows "no code" error

- [ ] **Step 7.7: Commit**

```bash
git add js/share-viewer.js
git commit -m "feat(share): add share-viewer.js — viewer page logic and stats rendering"
```

---

## Task 8: CSS — Management Panel and Viewer Page Styles

**Files:**
- Modify: `style.css`

- [ ] **Step 8.1: Add share management panel styles**

Add to `style.css` (in the bottom sheet / panel section, near the assessment sheet styles):

```css
/* ── Share management panel ─────────────────────────────────────── */

.share-create-form {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 0 16px;
  border-bottom: 1px solid var(--border);
  margin-bottom: 16px;
}

.settings-select {
  background: var(--card);
  color: var(--white);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  font-family: Barlow, sans-serif;
  width: 100%;
}

.share-section-label {
  font-family: Barlow Condensed, sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  margin: 12px 0 6px;
}

.share-section-expired { color: var(--danger); }

.share-no-links {
  color: var(--muted);
  font-size: 14px;
  text-align: center;
  padding: 20px 0;
}

.share-token-row {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 12px;
  margin-bottom: 8px;
}

.share-token-expired { opacity: 0.55; }

.share-token-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.share-token-label {
  font-family: Barlow Condensed, sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--white);
}

.share-token-expiry {
  font-size: 12px;
  color: var(--muted);
}

.share-badge-expired {
  color: var(--danger);
  font-weight: 700;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.share-token-url {
  font-size: 11px;
  color: var(--muted);
  word-break: break-all;
  margin-bottom: 8px;
}

.share-token-actions {
  display: flex;
  gap: 8px;
}

.share-btn-copy {
  flex: 1;
  background: var(--lime);
  color: var(--grass);
  border: none;
  border-radius: 7px;
  padding: 7px 12px;
  font-family: Barlow Condensed, sans-serif;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.share-btn-delete {
  background: transparent;
  color: var(--danger);
  border: 1px solid var(--danger);
  border-radius: 7px;
  padding: 7px 12px;
  font-family: Barlow Condensed, sans-serif;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}
```

- [ ] **Step 8.2: Add share viewer page styles**

Add to `style.css`:

```css
/* ── Share viewer page ───────────────────────────────────────────── */

.share-viewer-body {
  min-height: 100vh;
  background: var(--grass);
}

.share-profile-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: var(--card);
  border-bottom: 1px solid var(--border);
  padding: 20px 16px;
  max-width: 480px;
  margin: 0 auto;
}

.share-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid var(--lime);
  flex-shrink: 0;
}

.share-avatar-placeholder {
  background: var(--border);
}

.share-profile-info { flex: 1; min-width: 0; }

.share-profile-name {
  font-family: Barlow Condensed, sans-serif;
  font-size: 22px;
  font-weight: 800;
  color: var(--white);
  line-height: 1.1;
}

.share-profile-club,
.share-profile-team {
  font-size: 13px;
  color: var(--muted);
  margin-top: 2px;
}

.share-viewer-content {
  max-width: 480px;
  margin: 0 auto;
  padding: 0 0 40px;
}

.share-error-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  padding: 40px 24px;
  text-align: center;
  gap: 16px;
}

.share-error-icon { font-size: 48px; }

.share-error-msg {
  font-size: 16px;
  color: var(--muted);
  max-width: 300px;
}

.share-error-link {
  color: var(--lime);
  font-family: Barlow Condensed, sans-serif;
  font-weight: 700;
  font-size: 15px;
  text-decoration: none;
}

.chart-wrap {
  background: var(--card);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 12px;
}
```

- [ ] **Step 8.3: Verify styling in browser**

1. Open the share viewer page with a valid code — profile card looks correct, stats render cleanly
2. Open the share management panel in app.html — panel looks consistent with the rest of the app
3. Check both on mobile viewport (max-width 480px)

- [ ] **Step 8.4: Commit**

```bash
git add style.css
git commit -m "feat(share): add share panel and viewer page CSS"
```

---

## Task 9: Docs and Final Commit

**Files:**
- Modify: `CLAUDE.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 9.1: Update `CLAUDE.md` roadmap**

In the Roadmap section, mark the share link feature as complete:

Under a new subsection before Fase 3:

```markdown
### Fase 2.5 – Deling
- [x] Share link — player generates shareable URL, third party views stats + profile (no assessments). Foundation for Fase 4 coach dashboard.
```

- [ ] **Step 9.2: Add `CHANGELOG.md` entry**

```markdown
## 2026-03-22 — Share Link Feature

- Players can now generate shareable links in Settings → Del statistikk
- Each link has a label and expiry (30 days, 90 days, end of season, or permanent)
- Third parties open the link in any browser — no account required
- Viewer sees: profile card (avatar, name, club) + full stats (season/team/tournament filters, overview and analyse)
- Self-assessment data (ratings and reflections) is never exposed
- Multiple active links supported; revoke any link instantly
- Foundation for Fase 4 coach/parent dashboard accounts
```

- [ ] **Step 9.3: Final commit**

```bash
git add CLAUDE.md CHANGELOG.md
git commit -m "docs: update CLAUDE.md and CHANGELOG for share link feature"
```

- [ ] **Step 9.4: Push to GitHub (deploys via Vercel)**

```bash
git push origin main
```

After deploy, do a final smoke test on the live URL:
1. Log in at `https://athlyticsport.app/app`
2. Settings → Del statistikk → create a link
3. Copy the link → open in incognito/private browser
4. Verify: profile card, stats, filters, analyse view all work
5. **Verify assessment data is absent:** Open browser DevTools → Network tab → find the `get_shared_matches` RPC response → inspect the JSON. Confirm none of the match objects contain keys `rating_overall`, `rating_effort`, `rating_focus`, `rating_technique`, `rating_team_play`, `rating_impact`, `reflection_good`, or `reflection_improve`. If any of these keys appear, the RPC function is incorrectly exposing assessment data.

> **Note:** The "no code" error screen (`share_viewer_no_code`) always renders in Norwegian, because the player's language preference is unknown before the profile is fetched. This is intentional and acceptable — there is no profile to get the lang from in this path.
