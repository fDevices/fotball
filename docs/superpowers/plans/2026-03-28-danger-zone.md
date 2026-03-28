# Danger Zone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two destructive actions to the Settings tab — "Delete match history" and "Delete account" — each behind an inline-expand typed confirmation gate.

**Architecture:** Static HTML in `app.html` (always in DOM, panels hidden by `hidden` attribute), a new `js/danger.js` module owns all UI state and execution logic, wired into the existing `actions.js`/`main.js` delegation system. Account deletion uses a Supabase Edge Function for server-side auth user removal.

**Tech Stack:** Vanilla JS (ES modules), Supabase REST API, Supabase Edge Functions (Deno), existing `t()` i18n system, existing `showToast()` system.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `js/i18n.js` | Modify | Add 13 new keys to both `no` and `en` |
| `js/supabase.js` | Modify | Add `deleteAllMatches()`, `deleteAllShareTokens()`, `deleteProfile()` |
| `supabase/functions/delete-account/index.ts` | Create | Edge Function: verify JWT, delete auth user via admin API |
| `js/danger.js` | Create | All danger zone logic: text, panel state, deletion flows |
| `app.html` | Modify | Add static danger zone HTML between share section and logout button |
| `style.css` | Modify | Add danger zone CSS |
| `js/actions.js` | Modify | Import `danger.js`, add to WRITE_ACTIONS + ACTIONS map |
| `js/main.js` | Modify | Handle `dangerInput` in the existing `input` event listener |
| `js/settings-render.js` | Modify | Call `initDangerZone()` at end of `renderSettings()` |

---

## Task 1: Add i18n keys

**Files:**
- Modify: `js/i18n.js`

- [ ] **Step 1: Add Norwegian keys to the `no` object**

In `js/i18n.js`, find the last line of the `no` object (currently ends with `rating_trend_title:'Egenvurdering over tid',`). Add after it, before the closing `},`:

```javascript
    danger_section_title:'Faresone',
    danger_delete_matches_btn:'Slett kamphistorikk',
    danger_delete_matches_warn:'Dette vil permanent slette all kampdata din.',
    danger_phrase_matches:'slett kamper',
    danger_phrase_matches_placeholder:'skriv \u201eslett kamper\u201f for \u00e5 bekrefte',
    danger_delete_account_btn:'Slett konto',
    danger_delete_account_warn:'Dette vil permanent slette all data og kontoen din. Dette kan ikke angres.',
    danger_phrase_account:'slett kontoen min',
    danger_phrase_account_placeholder:'skriv \u201eslett kontoen min\u201f for \u00e5 bekrefte',
    danger_toast_matches_deleted:'\u2713 Kamphistorikk slettet',
    danger_toast_account_deleted:'\u2713 Konto slettet',
    danger_cancel:'Avbryt',
    danger_confirm:'Bekreft',
```

- [ ] **Step 2: Add English keys to the `en` object**

In `js/i18n.js`, find the last line of the `en` object (currently ends with `rating_trend_title:'Performance over time',`). Add after it, before the closing `}`:

```javascript
    danger_section_title:'Danger zone',
    danger_delete_matches_btn:'Delete match history',
    danger_delete_matches_warn:'This will permanently delete all your match data.',
    danger_phrase_matches:'delete matches',
    danger_phrase_matches_placeholder:'type \u201cdelete matches\u201d to confirm',
    danger_delete_account_btn:'Delete account',
    danger_delete_account_warn:'This will permanently delete all your data and your account. This cannot be undone.',
    danger_phrase_account:'delete my account',
    danger_phrase_account_placeholder:'type \u201cdelete my account\u201d to confirm',
    danger_toast_matches_deleted:'\u2713 Match history deleted',
    danger_toast_account_deleted:'\u2713 Account deleted',
    danger_cancel:'Cancel',
    danger_confirm:'Confirm',
```

- [ ] **Step 3: Verify**

Open `js/i18n.js`. Confirm both `no` and `en` objects have all 13 new keys and no trailing comma errors (the last key in each object must not have an extra `,` after closing `}`).

- [ ] **Step 4: Commit**

```bash
git add js/i18n.js
git commit -m "feat(i18n): add danger zone keys (no + en)"
```

---

## Task 2: Add Supabase REST functions

**Files:**
- Modify: `js/supabase.js`

- [ ] **Step 1: Add `deleteAllMatches()` after the existing `deleteMatch()` function**

In `js/supabase.js`, find the `deleteMatch` function (ends around line 47). Add directly after it:

```javascript
export async function deleteAllMatches() {
  var res = await fetch(SUPABASE_URL + '/rest/v1/matches', {
    method: 'DELETE',
    headers: headers()
  });
  if (!res.ok) throw new Error('deleteAllMatches failed: ' + res.status);
}
```

- [ ] **Step 2: Add `deleteAllShareTokens()` after the existing `deleteShareToken()` function**

In `js/supabase.js`, find `deleteShareToken(id)` (ends around line 117). Add directly after it:

```javascript
export async function deleteAllShareTokens() {
  var res = await fetch(SUPABASE_URL + '/rest/v1/share_tokens', {
    method: 'DELETE',
    headers: headers()
  });
  if (!res.ok) throw new Error('deleteAllShareTokens failed: ' + res.status);
}
```

- [ ] **Step 3: Add `deleteProfile()` after the existing profile functions**

In `js/supabase.js`, find the profile section. After the last profile function (look for `upsertProfileSettings`), add:

```javascript
export async function deleteProfile(userId) {
  var res = await fetch(SUPABASE_URL + '/rest/v1/profiles?id=eq.' + userId, {
    method: 'DELETE',
    headers: headers()
  });
  if (!res.ok) throw new Error('deleteProfile failed: ' + res.status);
}
```

- [ ] **Step 4: Commit**

```bash
git add js/supabase.js
git commit -m "feat(supabase): add deleteAllMatches, deleteAllShareTokens, deleteProfile"
```

---

## Task 3: Create the Edge Function

**Files:**
- Create: `supabase/functions/delete-account/index.ts`

- [ ] **Step 1: Create the directory structure**

```bash
mkdir -p supabase/functions/delete-account
```

- [ ] **Step 2: Create the Edge Function**

Create `supabase/functions/delete-account/index.ts` with this content:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

  // Verify caller identity via their JWT
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } }
  })
  const { data: { user }, error: userError } = await userClient.auth.getUser()
  if (userError || !user) {
    return new Response('Unauthorized', { status: 401, headers: corsHeaders })
  }

  // Delete the auth user with the admin client
  const adminClient = createClient(supabaseUrl, serviceRoleKey)
  const { error } = await adminClient.auth.admin.deleteUser(user.id)
  if (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  return new Response(
    JSON.stringify({ success: true }),
    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
})
```

- [ ] **Step 3: Deploy the Edge Function**

You need the Supabase CLI installed. If not installed: `brew install supabase/tap/supabase`

```bash
supabase login
supabase link --project-ref gjxsebeajcrmseraypyw
supabase functions deploy delete-account
```

Expected output: `Deployed Functions delete-account`

- [ ] **Step 4: Commit**

```bash
git add supabase/
git commit -m "feat(edge-fn): add delete-account Edge Function"
```

---

## Task 4: Create `js/danger.js`

**Files:**
- Create: `js/danger.js`

- [ ] **Step 1: Create `js/danger.js`**

```javascript
import { deleteAllMatches, deleteAllShareTokens, deleteProfile } from './supabase.js';
import { getSession, clearSession, isAuthenticated, getUserId } from './auth.js';
import { invalidateMatchCache } from './state.js';
import { t } from './i18n.js';
import { SUPABASE_URL, SUPABASE_KEY } from './config.js';

// ── Text refresh ──────────────────────────────────────────────────────────────

function _refreshText() {
  var title = document.getElementById('st-danger-title');
  if (title) title.textContent = t('danger_section_title');

  var warnMatches = document.getElementById('danger-warn-matches');
  if (warnMatches) warnMatches.textContent = t('danger_delete_matches_warn');

  var btnMatches = document.getElementById('danger-btn-matches');
  if (btnMatches) btnMatches.textContent = t('danger_delete_matches_btn');

  var inputMatches = document.getElementById('danger-input-matches');
  if (inputMatches) inputMatches.placeholder = t('danger_phrase_matches_placeholder');

  var cancelMatches = document.getElementById('danger-cancel-matches');
  if (cancelMatches) cancelMatches.textContent = t('danger_cancel');

  var confirmMatches = document.getElementById('danger-confirm-matches');
  if (confirmMatches) confirmMatches.textContent = t('danger_confirm');

  var warnAccount = document.getElementById('danger-warn-account');
  if (warnAccount) warnAccount.textContent = t('danger_delete_account_warn');

  var btnAccount = document.getElementById('danger-btn-account');
  if (btnAccount) btnAccount.textContent = t('danger_delete_account_btn');

  var inputAccount = document.getElementById('danger-input-account');
  if (inputAccount) inputAccount.placeholder = t('danger_phrase_account_placeholder');

  var cancelAccount = document.getElementById('danger-cancel-account');
  if (cancelAccount) cancelAccount.textContent = t('danger_cancel');

  var confirmAccount = document.getElementById('danger-confirm-account');
  if (confirmAccount) confirmAccount.textContent = t('danger_confirm');
}

// ── State reset ───────────────────────────────────────────────────────────────

function _resetPanel(type) {
  var panel = document.getElementById('danger-panel-' + type);
  var input = document.getElementById('danger-input-' + type);
  var confirm = document.getElementById('danger-confirm-' + type);
  if (panel) panel.hidden = true;
  if (input) input.value = '';
  if (confirm) confirm.disabled = true;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function initDangerZone() {
  var section = document.getElementById('st-danger-zone');
  if (!section) return;
  section.hidden = !isAuthenticated();
  _refreshText();
  _resetPanel('matches');
  _resetPanel('account');
}

export function toggleDangerPanel(type) {
  var panel = document.getElementById('danger-panel-' + type);
  if (!panel) return;
  var isOpen = !panel.hidden;
  // Close both panels
  _resetPanel('matches');
  _resetPanel('account');
  // If it was closed, open it
  if (!isOpen) {
    panel.hidden = false;
    var input = document.getElementById('danger-input-' + type);
    if (input) input.focus();
  }
}

export function onDangerInput(type) {
  var input = document.getElementById('danger-input-' + type);
  var confirm = document.getElementById('danger-confirm-' + type);
  if (!input || !confirm) return;
  var phrase = t('danger_phrase_' + type);
  confirm.disabled = input.value.trim().toLowerCase() !== phrase.toLowerCase();
}

export async function confirmDeleteMatches() {
  var btn = document.getElementById('danger-confirm-matches');
  if (btn) btn.disabled = true;
  try {
    await deleteAllMatches();
    invalidateMatchCache();
    document.dispatchEvent(new CustomEvent('athlytics:toast', {
      detail: { msg: t('danger_toast_matches_deleted'), type: 'success' }
    }));
    _resetPanel('matches');
  } catch(err) {
    document.dispatchEvent(new CustomEvent('athlytics:toast', {
      detail: { msg: t('toast_share_error'), type: 'error' }
    }));
    if (btn) btn.disabled = false;
  }
}

export async function confirmDeleteAccount() {
  var btn = document.getElementById('danger-confirm-account');
  if (btn) btn.disabled = true;
  try {
    await deleteAllMatches();
    await deleteAllShareTokens();
    await deleteProfile(getUserId());
    var session = getSession();
    var res = await fetch(SUPABASE_URL + '/functions/v1/delete-account', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + session.accessToken,
        'apikey': SUPABASE_KEY
      }
    });
    if (!res.ok) throw new Error('delete-account edge function failed: ' + res.status);
    clearSession();
    window.location.reload();
  } catch(err) {
    document.dispatchEvent(new CustomEvent('athlytics:toast', {
      detail: { msg: t('toast_share_error'), type: 'error' }
    }));
    if (btn) btn.disabled = false;
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add js/danger.js
git commit -m "feat(danger): add danger.js with delete matches and delete account logic"
```

---

## Task 5: Add danger zone HTML to `app.html`

**Files:**
- Modify: `app.html`

- [ ] **Step 1: Insert the danger zone section**

In `app.html`, find the share section closing tag and logout button (around line 403–405):

```html
    </div>

    <button class="settings-logout-btn" data-action="logout" data-i18n="auth_logout">Log out</button>
```

Replace it with:

```html
    </div>

    <div class="danger-zone" id="st-danger-zone" hidden>
      <div class="export-title" id="st-danger-title">Danger zone</div>

      <div class="danger-item">
        <button class="danger-btn danger-btn--outline" data-action="toggleDangerPanel" data-type="matches" id="danger-btn-matches">
          Delete match history
        </button>
        <div class="danger-panel" id="danger-panel-matches" hidden>
          <p class="danger-warn" id="danger-warn-matches">This will permanently delete all your match data.</p>
          <input type="text" class="danger-input" id="danger-input-matches" data-action="dangerInput" data-danger-type="matches" placeholder='type "delete matches" to confirm' autocomplete="off">
          <div class="danger-panel-actions">
            <button class="danger-confirm-btn" id="danger-confirm-matches" data-action="confirmDeleteMatches" disabled>Confirm</button>
            <button class="danger-cancel-link" data-action="toggleDangerPanel" data-type="matches" id="danger-cancel-matches">Cancel</button>
          </div>
        </div>
      </div>

      <div class="danger-item">
        <button class="danger-btn danger-btn--solid" data-action="toggleDangerPanel" data-type="account" id="danger-btn-account">
          Delete account
        </button>
        <div class="danger-panel" id="danger-panel-account" hidden>
          <p class="danger-warn" id="danger-warn-account">This will permanently delete all your data and your account. This cannot be undone.</p>
          <input type="text" class="danger-input" id="danger-input-account" data-action="dangerInput" data-danger-type="account" placeholder='type "delete my account" to confirm' autocomplete="off">
          <div class="danger-panel-actions">
            <button class="danger-confirm-btn" id="danger-confirm-account" data-action="confirmDeleteAccount" disabled>Confirm</button>
            <button class="danger-cancel-link" data-action="toggleDangerPanel" data-type="account" id="danger-cancel-account">Cancel</button>
          </div>
        </div>
      </div>
    </div>

    <button class="settings-logout-btn" data-action="logout" data-i18n="auth_logout">Log out</button>
```

- [ ] **Step 2: Commit**

```bash
git add app.html
git commit -m "feat(html): add static danger zone section to settings tab"
```

---

## Task 6: Add CSS for danger zone

**Files:**
- Modify: `style.css`

- [ ] **Step 1: Add danger zone styles**

In `style.css`, find the `/* ── Logout button (in Settings tab) */` comment (around line 667). Insert the following block directly before it:

```css
/* ── Danger zone (in Settings tab) ──────────────────────────────────── */
.danger-zone { margin-top: 32px; padding-top: 20px; border-top: 1px solid rgba(224,85,85,0.2); }
.danger-zone .export-title { color: var(--danger); margin-bottom: 16px; }
.danger-item { margin-bottom: 12px; }
.danger-btn {
  display: block;
  width: 100%;
  border-radius: 10px;
  padding: 12px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.15s;
}
.danger-btn--outline {
  background: none;
  border: 1px solid var(--danger);
  color: var(--danger);
}
.danger-btn--outline:hover { background: rgba(224,85,85,0.08); }
.danger-btn--solid {
  background: rgba(224,85,85,0.15);
  border: 1px solid var(--danger);
  color: var(--danger);
}
.danger-btn--solid:hover { background: rgba(224,85,85,0.25); }
.danger-panel {
  margin-top: 10px;
  padding: 14px;
  border-radius: 10px;
  background: rgba(224,85,85,0.06);
  border: 1px solid rgba(224,85,85,0.2);
}
.danger-warn {
  font-size: 13px;
  color: var(--danger);
  margin-bottom: 12px;
  line-height: 1.4;
}
.danger-input {
  width: 100%;
  background: rgba(0,0,0,0.2);
  border: 1px solid rgba(224,85,85,0.3);
  border-radius: 8px;
  padding: 10px 12px;
  color: var(--white);
  font-size: 13px;
  outline: none;
  margin-bottom: 12px;
}
.danger-input:focus { border-color: var(--danger); }
.danger-input::placeholder { color: var(--muted); }
.danger-panel-actions { display: flex; align-items: center; gap: 16px; }
.danger-confirm-btn {
  padding: 10px 20px;
  border-radius: 8px;
  background: var(--danger);
  border: none;
  color: #fff;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  transition: opacity 0.15s;
}
.danger-confirm-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.danger-confirm-btn:not(:disabled):hover { opacity: 0.85; }
.danger-cancel-link {
  background: none;
  border: none;
  color: var(--muted);
  font-size: 13px;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
}
.danger-cancel-link:hover { color: var(--white); }

```

- [ ] **Step 2: Commit**

```bash
git add style.css
git commit -m "feat(css): add danger zone styles"
```

---

## Task 7: Wire up actions and event handlers

**Files:**
- Modify: `js/actions.js`
- Modify: `js/main.js`
- Modify: `js/settings-render.js`

- [ ] **Step 1: Add import and entries to `actions.js`**

At the top of `js/actions.js`, add the import after the existing imports:

```javascript
import { toggleDangerPanel, onDangerInput, confirmDeleteMatches, confirmDeleteAccount } from './danger.js';
```

In the `WRITE_ACTIONS` Set, add `'confirmDeleteMatches'` and `'confirmDeleteAccount'`:

Find:
```javascript
  'createShareToken', 'deleteShareToken'
```
Replace with:
```javascript
  'createShareToken', 'deleteShareToken',
  'confirmDeleteMatches', 'confirmDeleteAccount'
```

In the `ACTIONS` map, add four entries. Find a convenient spot (e.g. after the `logout` entry):

```javascript
  toggleDangerPanel:   (e) => { var el = e.target.closest('[data-type]'); if (!el) return; toggleDangerPanel(el.dataset.type); },
  confirmDeleteMatches: () => confirmDeleteMatches(),
  confirmDeleteAccount: () => confirmDeleteAccount(),
```

Note: `dangerInput` is handled via the `input` event in `main.js`, not here.

- [ ] **Step 2: Handle `dangerInput` in `main.js` input listener**

In `js/main.js`, find the `input` event listener block:

```javascript
  document.addEventListener('input', function(e) {
    if (e.target.id === 'opponent-search-input') {
      setOpponentSearch(e.target.value);
    }
    if (e.target.id === 'h2h-search-input') {
      setH2hSearch(e.target.value);
    }
    if (e.target.dataset && e.target.dataset.action === 'updateAvatar') {
      updateAvatar();
    }
  });
```

Add the import at the top of `main.js`:

```javascript
import { initDangerZone, toggleDangerPanel, onDangerInput, confirmDeleteMatches, confirmDeleteAccount } from './danger.js';
```

Then add to the input listener after the `updateAvatar` block:

```javascript
    if (e.target.dataset && e.target.dataset.action === 'dangerInput') {
      onDangerInput(e.target.dataset.dangerType);
    }
```

- [ ] **Step 3: Call `initDangerZone()` from `renderSettings()`**

In `js/settings-render.js`, add the import at the top:

```javascript
import { initDangerZone } from './danger.js';
```

Find the last line of `renderSettings()` (the `renderActiveSeasonPills()` call):

```javascript
  renderActiveSeasonPills();
}
```

Add `initDangerZone()` after `renderActiveSeasonPills()`:

```javascript
  renderActiveSeasonPills();
  initDangerZone();
}
```

- [ ] **Step 4: Commit**

```bash
git add js/actions.js js/main.js js/settings-render.js
git commit -m "feat(wiring): connect danger zone to actions and renderSettings"
```

---

## Task 8: Manual verification

- [ ] **Step 1: Test as unauthenticated user**

Open the app. Without logging in (demo mode), go to Settings. Confirm the Danger zone section is **not visible**.

- [ ] **Step 2: Test as authenticated user — danger zone visible**

Log in with a real account. Go to Settings. Confirm the "Danger zone" section appears below the share section with both buttons.

- [ ] **Step 3: Test inline expand — only one panel at a time**

Click "Delete match history". Confirm the panel expands below it with a text input and disabled Confirm button.
Click "Delete account". Confirm the matches panel collapses and the account panel expands.
Click "Delete account" again — confirm the panel collapses.

- [ ] **Step 4: Test confirm button gating**

With the matches panel open, type `delete matches` (exact phrase, English) or `slett kamper` (if app is in Norwegian). Confirm the Confirm button enables. Clear the input — confirm it disables again. Type `DELETE MATCHES` — confirm it enables (case-insensitive).

- [ ] **Step 5: Test delete matches flow**

With some test match data, type the correct phrase and click Confirm. Expect:
- Success toast: "✓ Match history deleted"
- Panel closes
- Switching to Stats tab shows empty state

- [ ] **Step 6: Test delete account flow**

With a test account (create a throwaway), type `delete my account` and click Confirm. Expect:
- Page reloads
- Auth overlay appears (no session)
- Logging in with the deleted credentials fails (user gone)

- [ ] **Step 7: Test language toggle**

Switch the app to Norwegian. Open both panels and verify placeholder text and confirmation phrases are in Norwegian. Verify typing the Norwegian phrase (`slett kamper` / `slett kontoen min`) enables the button; typing the English phrase does not.

- [ ] **Step 8: Commit final state**

```bash
git add -A
git commit -m "feat: danger zone — delete match history and delete account"
```
