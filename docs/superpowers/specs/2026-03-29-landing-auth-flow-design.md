# Landing page auth flow redesign

**Date:** 2026-03-29
**Status:** Approved

---

## Problem

Two concrete pain points with the current auth/login experience:

1. **Login is buried** — no "Logg inn" entry point on the landing page. Returning users must click "Åpne appen", land in demo mode, then figure out how to log in.
2. **Logged-in users see the marketing page** — visiting `/` always shows `landing.html` even if you already have a valid session. Daily users are forced through the hero page every time.

---

## Scope

All changes are contained in `landing.html`. No changes to `app.html`, `style.css`, or any `js/` module.

---

## Design decisions

| Decision | Choice | Reason |
|---|---|---|
| Nav button style | Lime outlined (`border: 1.5px solid #a8e063`) | Matches brand palette, clearly tappable without competing with "Åpne appen" |
| Modal position | Centered overlay with backdrop | Split card (C) chosen for premium feel and desktop readability |
| Modal layout | Split: brand panel left, form panel right | Logo/tagline on left reinforces brand trust at the auth moment |
| Login/signup | Tabbed within same modal (Logg inn / Registrer) | Keeps modal single and re-openable |
| After auth success | Redirect to `/app` | User came to log in — take them straight to the app |
| Demo mode | Unchanged | Demo mode in `/app` stays as-is; in-app auth overlay unchanged |

---

## Changes to `landing.html`

### 1. Auto-redirect for logged-in users

Added as a **separate `<script>` in `<head>`**, before any CSS or content loads. This prevents the landing page from rendering at all before the redirect fires:

```html
<script>
  (function() {
    try {
      var s = JSON.parse(localStorage.getItem('athlytics_session'));
      if (s && s.accessToken && s.expiresAt > Date.now()) {
        window.location.replace('/app');
      }
    } catch(e) {}
  })();
</script>
```

Uses `SESSION_KEY = 'athlytics_session'` and checks `expiresAt` to avoid redirecting on an expired/stale token. Uses `replace()` so the landing page is not in the back-stack. Placed in `<head>` so no flash occurs.

### 2. Nav — add "Logg inn" button

```html
<!-- Between lang toggle and existing "Åpne appen" CTA -->
<button class="btn-nav-login" id="nav-login-btn" aria-label="Logg inn" data-i18n-login="Logg inn" data-i18n-login-en="Log in">
  Logg inn
</button>
```

CSS (added to `landing.css` or inline `<style>` block):

```css
.btn-nav-login {
  background: transparent;
  border: 1.5px solid #a8e063;
  color: #a8e063;
  border-radius: 8px;
  padding: 7px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
}
```

i18n: `applyLang()` already iterates `[data-i18n]` elements. The login button uses a custom `data-i18n-login` attribute handled by the existing `applyLang` function (extend it to cover this button).

### 3. Login modal HTML

Appended before `</body>`:

```html
<div id="landing-auth-overlay" class="landing-auth-overlay hidden" role="dialog" aria-modal="true" aria-labelledby="landing-auth-title">
  <div class="landing-auth-modal">
    <!-- Brand panel -->
    <div class="landing-auth-brand">
      <span class="landing-auth-icon">⚽</span>
      <span class="landing-auth-logo">ATHLYTICS<span>SPORT</span></span>
      <span class="landing-auth-tagline" data-i18n="hero_eyebrow"></span>
    </div>
    <!-- Form panel -->
    <div class="landing-auth-form">
      <h2 id="landing-auth-title">Logg inn</h2>
      <!-- Tabs -->
      <div class="landing-auth-tabs" role="tablist">
        <button class="landing-auth-tab active" data-tab="login" role="tab">Logg inn</button>
        <button class="landing-auth-tab" data-tab="signup" role="tab">Registrer</button>
      </div>
      <!-- Login view -->
      <div id="landing-login-view">
        <input id="landing-login-email" type="email" autocomplete="email" placeholder="E-post">
        <input id="landing-login-password" type="password" autocomplete="current-password" placeholder="Passord">
        <div id="landing-login-error" class="landing-auth-error hidden"></div>
        <button id="landing-login-submit">LOGG INN →</button>
      </div>
      <!-- Signup view -->
      <div id="landing-signup-view" class="hidden">
        <input id="landing-signup-email" type="email" autocomplete="email" placeholder="E-post">
        <input id="landing-signup-password" type="password" autocomplete="new-password" placeholder="Passord">
        <input id="landing-signup-confirm" type="password" autocomplete="new-password" placeholder="Bekreft passord">
        <div id="landing-signup-error" class="landing-auth-error hidden"></div>
        <button id="landing-signup-submit">OPPRETT KONTO →</button>
      </div>
    </div>
  </div>
</div>
```

### 4. Modal CSS

Added to `landing.css` (new section at the bottom):

```css
/* Utility — used by modal views and error messages */
.hidden { display: none; }

.landing-auth-overlay {
  position: fixed; inset: 0; z-index: 1000;
  background: rgba(0,0,0,0.65);
  backdrop-filter: blur(3px);
  display: flex; align-items: center; justify-content: center;
}
.landing-auth-overlay.hidden { display: none; }

.landing-auth-modal {
  display: flex;
  background: #162b1a;
  border: 1px solid #2a4a2e;
  border-radius: 16px;
  overflow: hidden;
  width: min(380px, calc(100vw - 32px));
  box-shadow: 0 24px 64px rgba(0,0,0,0.6);
}

.landing-auth-brand {
  background: linear-gradient(160deg, #1e3a22, #0d2a10);
  padding: 28px 16px;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 8px;
  min-width: 110px; border-right: 1px solid #2a4a2e;
}
.landing-auth-icon { font-size: 32px; }
.landing-auth-logo {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 800; font-size: 12px; letter-spacing: 1.5px;
  color: #fff; text-align: center; line-height: 1.3;
}
.landing-auth-logo span { color: #a8e063; }
.landing-auth-tagline { font-size: 11px; color: #666; text-align: center; line-height: 1.4; }

.landing-auth-form {
  flex: 1; padding: 24px 20px;
}
.landing-auth-form h2 {
  color: #fff; font-size: 18px; font-weight: 700; margin: 0 0 16px;
  font-family: 'Barlow Condensed', sans-serif;
}
.landing-auth-tabs { display: flex; gap: 4px; margin-bottom: 14px; }
.landing-auth-tab {
  flex: 1; padding: 6px; font-size: 12px; font-weight: 600;
  border: none; border-radius: 7px; cursor: pointer;
  background: #0d1f10; color: #888;
}
.landing-auth-tab.active { background: #a8e063; color: #0d1f10; }

.landing-auth-form input {
  width: 100%; box-sizing: border-box;
  background: #0d1f10; border: 1px solid #2a4a2e;
  border-radius: 8px; padding: 10px 12px;
  color: #fff; font-size: 13px; margin-bottom: 8px;
  font-family: inherit;
}
.landing-auth-form input:focus { outline: none; border-color: #a8e063; }

.landing-auth-form button[id$="-submit"] {
  width: 100%; background: #a8e063; color: #0d1f10;
  border: none; border-radius: 8px; padding: 11px;
  font-weight: 700; font-size: 14px;
  font-family: 'Barlow Condensed', sans-serif;
  cursor: pointer; margin-top: 4px; letter-spacing: 0.3px;
}
.landing-auth-error {
  color: #e05555; font-size: 12px; margin-bottom: 8px;
}
.landing-auth-error.hidden { display: none; }
```

### 5. Modal JavaScript

Added to the existing inline `<script>` block:

```js
// ── Landing auth modal ──────────────────────────────────────────────────
var SUPA_URL = 'https://gjxsebeajcrmseraypyw.supabase.co';
var SUPA_KEY = 'sb_publishable_gkIN7XSAzQVKS9lpqj6LYQ_vV8G3VRe';
var SESSION_KEY = 'athlytics_session';

function openLandingAuth(tab) {
  var overlay = document.getElementById('landing-auth-overlay');
  overlay.classList.remove('hidden');
  showLandingTab(tab || 'login');
  // Focus first input
  setTimeout(function() {
    var first = overlay.querySelector('input:not([type=hidden])');
    if (first) first.focus();
  }, 50);
}

function closeLandingAuth() {
  document.getElementById('landing-auth-overlay').classList.add('hidden');
  clearLandingErrors();
}

function showLandingTab(tab) {
  var loginView  = document.getElementById('landing-login-view');
  var signupView = document.getElementById('landing-signup-view');
  var title      = document.getElementById('landing-auth-title');
  var tabs       = document.querySelectorAll('.landing-auth-tab');
  loginView.classList.toggle('hidden', tab !== 'login');
  signupView.classList.toggle('hidden', tab !== 'signup');
  title.textContent = tab === 'login'
    ? (activeLang === 'no' ? 'Logg inn' : 'Log in')
    : (activeLang === 'no' ? 'Registrer deg' : 'Create account');
  tabs.forEach(function(t) { t.classList.toggle('active', t.dataset.tab === tab); });
}

function clearLandingErrors() {
  ['landing-login-error','landing-signup-error'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) { el.textContent = ''; el.classList.add('hidden'); }
  });
}

function showLandingError(id, msg) {
  var el = document.getElementById(id);
  if (el) { el.textContent = msg; el.classList.remove('hidden'); }
}

function storeLandingSession(data) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    accessToken:  data.access_token,
    refreshToken: data.refresh_token,
    userId:       data.user.id,
    email:        data.user.email,
    expiresAt:    Date.now() + (data.expires_in * 1000)
  }));
}

async function handleLandingLogin() {
  clearLandingErrors();
  var email    = document.getElementById('landing-login-email').value.trim();
  var password = document.getElementById('landing-login-password').value;
  try {
    var res = await fetch(SUPA_URL + '/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: { 'apikey': SUPA_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    });
    var data = await res.json();
    if (!res.ok) { showLandingError('landing-login-error', data.error_description || data.message || 'Innlogging feilet'); return; }
    storeLandingSession(data);
    window.location.replace('/app');
  } catch(e) { showLandingError('landing-login-error', e.message); }
}

async function handleLandingSignup() {
  clearLandingErrors();
  var email    = document.getElementById('landing-signup-email').value.trim();
  var password = document.getElementById('landing-signup-password').value;
  var confirm  = document.getElementById('landing-signup-confirm').value;
  if (password !== confirm) { showLandingError('landing-signup-error', activeLang === 'no' ? 'Passordene stemmer ikke overens' : 'Passwords do not match'); return; }
  try {
    var res = await fetch(SUPA_URL + '/auth/v1/signup', {
      method: 'POST',
      headers: { 'apikey': SUPA_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    });
    var data = await res.json();
    if (!res.ok) { showLandingError('landing-signup-error', data.error_description || data.message || 'Registrering feilet'); return; }
    if (!data.access_token) { showLandingError('landing-signup-error', activeLang === 'no' ? 'Sjekk e-posten din for bekreftelse' : 'Check your email to confirm'); return; }
    storeLandingSession(data);
    window.location.replace('/app');
  } catch(e) { showLandingError('landing-signup-error', e.message); }
}

// Wire events
document.getElementById('nav-login-btn').addEventListener('click', function() { openLandingAuth('login'); });

document.getElementById('landing-auth-overlay').addEventListener('click', function(e) {
  if (e.target === this) closeLandingAuth();
});

document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') closeLandingAuth();
});

document.querySelectorAll('.landing-auth-tab').forEach(function(btn) {
  btn.addEventListener('click', function() { showLandingTab(this.dataset.tab); });
});

document.getElementById('landing-login-submit').addEventListener('click', handleLandingLogin);
document.getElementById('landing-signup-submit').addEventListener('click', handleLandingSignup);

// Allow Enter key in inputs to submit
document.getElementById('landing-auth-overlay').addEventListener('keydown', function(e) {
  if (e.key !== 'Enter') return;
  var loginHidden = document.getElementById('landing-login-view').classList.contains('hidden');
  if (!loginHidden) handleLandingLogin();
  else handleLandingSignup();
});
```

### 6. i18n extension

Extend `applyLang()` to translate the "Logg inn" button:

```js
document.getElementById('nav-login-btn').textContent = lang === 'no' ? 'Logg inn' : 'Log in';
```

---

## What does NOT change

- `app.html` — no changes
- `js/auth-ui.js` — the in-app auth overlay is unchanged; it still fires on write actions in demo mode
- `style.css` — new modal CSS goes in `landing.css` only
- Demo banner — out of scope for this task

---

## Session token format

The landing page JS writes the same `athlytics_session` key and object shape as `auth.js`. When `/app` loads, `restoreSession()` reads this key as normal — no changes needed in app bootstrap.

---

## Files changed

| File | Change |
|---|---|
| `landing.html` | Auto-redirect, "Logg inn" nav button, modal HTML, modal CSS, modal JS, i18n extension |
| `landing.css` | Modal styles appended |
