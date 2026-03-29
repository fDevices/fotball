# Landing Auth Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "Logg inn" button to the landing page nav that opens a split-card login/signup modal, and auto-redirect logged-in users from `/` to `/app`.

**Architecture:** All changes live in `landing.html` and `landing.css`. The landing page is a standalone file with inline JS — no ES modules, no build system. The modal uses the same Supabase auth REST endpoints as `js/auth.js` and writes to the same `athlytics_session` localStorage key, so `app.html` picks it up on load with no changes.

**Tech Stack:** Vanilla JS, HTML, CSS. Supabase Auth REST API. No build step — changes are live on save.

---

## Files

| File | Change |
|---|---|
| `landing.html` | Add redirect `<script>` in `<head>`, "Logg inn" nav button, modal HTML, modal JS in existing `<script>` block |
| `landing.css` | Add `.hidden`, `.btn-nav-login`, and all `.landing-auth-*` modal styles at the end |

---

## Task 1: Auto-redirect for logged-in users

**Files:**
- Modify: `landing.html` (inside `<head>`, after `<meta>` tags)

- [ ] **Step 1: Insert redirect script in `<head>`**

In `landing.html`, add this as the **last child of `<head>`** (after line 11, before `</head>`):

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

- [ ] **Step 2: Verify redirect works**

Open browser DevTools → Application → Local Storage. If `athlytics_session` is present with a valid `expiresAt`, navigate to `https://athlyticsport.app` — you should land directly on `/app` with no flash of the landing page.

To test the negative case: clear `athlytics_session` from localStorage, reload — landing page should display normally.

- [ ] **Step 3: Commit**

```bash
git add landing.html
git commit -m "feat(landing): auto-redirect authenticated users to /app"
```

---

## Task 2: "Logg inn" nav button — HTML

**Files:**
- Modify: `landing.html` (inside `.nav-actions`, line ~23)

- [ ] **Step 1: Add the button to the nav**

In `landing.html`, find the `.nav-actions` div:

```html
<div class="nav-actions">
  <button class="nav-lang" id="nav-lang-toggle" aria-label="Bytt språk">
    <span id="nav-lang-label">EN</span>
  </button>
  <a href="/app" class="btn-nav-cta" data-i18n="nav_cta">Åpne appen</a>
</div>
```

Replace with:

```html
<div class="nav-actions">
  <button class="nav-lang" id="nav-lang-toggle" aria-label="Bytt språk">
    <span id="nav-lang-label">EN</span>
  </button>
  <button class="btn-nav-login" id="nav-login-btn">Logg inn</button>
  <a href="/app" class="btn-nav-cta" data-i18n="nav_cta">Åpne appen</a>
</div>
```

- [ ] **Step 2: Verify it appears in the DOM**

Open `landing.html` in a browser. The nav should now show: `EN | Logg inn | Åpne appen`. The button will be unstyled at this point — that's expected.

---

## Task 3: "Logg inn" nav button — CSS

**Files:**
- Modify: `landing.css` (append at the end)

- [ ] **Step 1: Add button styles**

Append to the end of `landing.css`:

```css
/* ── Auth modal utilities ── */
.hidden { display: none; }

/* ── Nav: Logg inn button ── */
.btn-nav-login {
  background: transparent;
  border: 1.5px solid var(--lime);
  color: var(--lime);
  border-radius: 8px;
  padding: 7px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: background 0.15s, color 0.15s;
}
.btn-nav-login:hover {
  background: var(--lime-dim);
}
```

- [ ] **Step 2: Verify in browser**

Reload the landing page. The nav should show a lime-outlined "Logg inn" button to the left of "Åpne appen". Hover should add a subtle lime background tint.

- [ ] **Step 3: Commit**

```bash
git add landing.html landing.css
git commit -m "feat(landing): add Logg inn nav button"
```

---

## Task 4: Login modal — HTML

**Files:**
- Modify: `landing.html` (before `</body>`)

- [ ] **Step 1: Add modal markup**

In `landing.html`, insert the following immediately before `</body>` (after the closing `</footer>` tag):

```html
  <!-- Auth modal -->
  <div id="landing-auth-overlay" class="landing-auth-overlay hidden"
       role="dialog" aria-modal="true" aria-labelledby="landing-auth-title">
    <div class="landing-auth-modal">

      <div class="landing-auth-brand">
        <span class="landing-auth-icon">⚽</span>
        <span class="landing-auth-logo">ATHLYTICS<span>SPORT</span></span>
        <span class="landing-auth-tagline" id="landing-auth-tagline">Fotballstatistikk<br>for alle nivåer</span>
      </div>

      <div class="landing-auth-form">
        <h2 id="landing-auth-title">Logg inn</h2>

        <div class="landing-auth-tabs" role="tablist">
          <button class="landing-auth-tab active" data-tab="login" role="tab">Logg inn</button>
          <button class="landing-auth-tab" data-tab="signup" role="tab">Registrer</button>
        </div>

        <div id="landing-login-view">
          <input id="landing-login-email" type="email" autocomplete="email" placeholder="E-post">
          <input id="landing-login-password" type="password" autocomplete="current-password" placeholder="Passord">
          <div id="landing-login-error" class="landing-auth-error hidden"></div>
          <button id="landing-login-submit">LOGG INN →</button>
        </div>

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

- [ ] **Step 2: Verify in DOM**

Open DevTools → Elements. Confirm `#landing-auth-overlay` exists in the DOM and has class `hidden`. The page should look unchanged (modal is hidden).

---

## Task 5: Login modal — CSS

**Files:**
- Modify: `landing.css` (append after the `.btn-nav-login` styles added in Task 3)

- [ ] **Step 1: Add modal styles**

Append to the end of `landing.css` (after the Task 3 additions):

```css
/* ── Landing auth modal ── */
.landing-auth-overlay {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.landing-auth-overlay.hidden { display: none; }

.landing-auth-modal {
  display: flex;
  background: var(--grass-mid);
  border: 1px solid var(--border-mid);
  border-radius: var(--radius-md);
  overflow: hidden;
  width: min(380px, 100%);
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.6);
}

.landing-auth-brand {
  background: linear-gradient(160deg, #1e3a22, #0d2a10);
  padding: 28px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-width: 110px;
  border-right: 1px solid var(--border);
}
.landing-auth-icon { font-size: 32px; }
.landing-auth-logo {
  font-family: 'Barlow Condensed', sans-serif;
  font-weight: 800;
  font-size: 11px;
  letter-spacing: 1.5px;
  color: var(--white);
  text-align: center;
  line-height: 1.3;
}
.landing-auth-logo span { color: var(--lime); }
.landing-auth-tagline {
  font-size: 11px;
  color: var(--muted);
  text-align: center;
  line-height: 1.4;
}

.landing-auth-form {
  flex: 1;
  padding: 24px 20px;
}
.landing-auth-form h2 {
  color: var(--white);
  font-size: 18px;
  font-weight: 700;
  margin: 0 0 16px;
  font-family: 'Barlow Condensed', sans-serif;
  letter-spacing: 0.3px;
}

.landing-auth-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 14px;
}
.landing-auth-tab {
  flex: 1;
  padding: 6px;
  font-size: 12px;
  font-weight: 600;
  border: none;
  border-radius: 7px;
  cursor: pointer;
  background: var(--grass);
  color: var(--muted);
  font-family: inherit;
}
.landing-auth-tab.active {
  background: var(--lime);
  color: var(--grass);
}

.landing-auth-form input {
  width: 100%;
  background: var(--grass);
  border: 1px solid var(--border-mid);
  border-radius: 8px;
  padding: 10px 12px;
  color: var(--white);
  font-size: 13px;
  margin-bottom: 8px;
  font-family: inherit;
  display: block;
}
.landing-auth-form input:focus {
  outline: none;
  border-color: var(--lime);
}

.landing-auth-form button[id$="-submit"] {
  width: 100%;
  background: var(--lime);
  color: var(--grass);
  border: none;
  border-radius: 8px;
  padding: 11px;
  font-weight: 700;
  font-size: 14px;
  font-family: 'Barlow Condensed', sans-serif;
  cursor: pointer;
  margin-top: 4px;
  letter-spacing: 0.3px;
}
.landing-auth-form button[id$="-submit"]:hover {
  background: var(--lime-bright);
}

.landing-auth-error {
  color: var(--danger);
  font-size: 12px;
  margin-bottom: 8px;
  line-height: 1.4;
}
```

- [ ] **Step 2: Verify styles load without breaking existing page**

Reload the landing page. Everything should look identical — modal is still hidden. Check DevTools → Console for CSS errors.

- [ ] **Step 3: Temporarily unhide to preview modal**

In DevTools console run: `document.getElementById('landing-auth-overlay').classList.remove('hidden')`

The split-card modal should appear centered over the page with a blurred backdrop. The brand panel (logo on left) and form panel (inputs on right) should be visible. Close the preview by running: `document.getElementById('landing-auth-overlay').classList.add('hidden')`

---

## Task 6: Login modal — JavaScript

**Files:**
- Modify: `landing.html` (existing `<script>` block, before the closing `</script>` tag)

- [ ] **Step 1: Add modal JS at the end of the existing `<script>` block**

Find the closing `</script>` tag in `landing.html` (currently the last line before `</body>`). Insert the following immediately before it:

```js
    // ── Landing auth modal ──────────────────────────────────────────────────
    var SUPA_URL = 'https://gjxsebeajcrmseraypyw.supabase.co';
    var SUPA_KEY = 'sb_publishable_gkIN7XSAzQVKS9lpqj6LYQ_vV8G3VRe';
    var LAND_SESSION_KEY = 'athlytics_session';

    function openLandingAuth(tab) {
      var overlay = document.getElementById('landing-auth-overlay');
      overlay.classList.remove('hidden');
      showLandingTab(tab || 'login');
      setTimeout(function() {
        var first = overlay.querySelector('input');
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
      var tagline    = document.getElementById('landing-auth-tagline');
      loginView.classList.toggle('hidden', tab !== 'login');
      signupView.classList.toggle('hidden', tab !== 'signup');
      title.textContent = tab === 'login'
        ? (activeLang === 'no' ? 'Logg inn' : 'Log in')
        : (activeLang === 'no' ? 'Registrer deg' : 'Create account');
      tagline.innerHTML = activeLang === 'no'
        ? 'Fotballstatistikk<br>for alle nivåer'
        : 'Football stats<br>for every level';
      document.querySelectorAll('.landing-auth-tab').forEach(function(t) {
        t.classList.toggle('active', t.dataset.tab === tab);
        t.textContent = t.dataset.tab === 'login'
          ? (activeLang === 'no' ? 'Logg inn' : 'Log in')
          : (activeLang === 'no' ? 'Registrer' : 'Sign up');
      });
    }

    function clearLandingErrors() {
      ['landing-login-error', 'landing-signup-error'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) { el.textContent = ''; el.classList.add('hidden'); }
      });
    }

    function showLandingError(id, msg) {
      var el = document.getElementById(id);
      if (el) { el.textContent = msg; el.classList.remove('hidden'); }
    }

    function storeLandingSession(data) {
      localStorage.setItem(LAND_SESSION_KEY, JSON.stringify({
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
        if (!res.ok) {
          showLandingError('landing-login-error', data.error_description || data.message || (activeLang === 'no' ? 'Innlogging feilet' : 'Login failed'));
          return;
        }
        storeLandingSession(data);
        window.location.replace('/app');
      } catch(e) {
        showLandingError('landing-login-error', e.message);
      }
    }

    async function handleLandingSignup() {
      clearLandingErrors();
      var email    = document.getElementById('landing-signup-email').value.trim();
      var password = document.getElementById('landing-signup-password').value;
      var confirm  = document.getElementById('landing-signup-confirm').value;
      if (password !== confirm) {
        showLandingError('landing-signup-error', activeLang === 'no' ? 'Passordene stemmer ikke overens' : 'Passwords do not match');
        return;
      }
      try {
        var res = await fetch(SUPA_URL + '/auth/v1/signup', {
          method: 'POST',
          headers: { 'apikey': SUPA_KEY, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, password: password })
        });
        var data = await res.json();
        if (!res.ok) {
          showLandingError('landing-signup-error', data.error_description || data.message || (activeLang === 'no' ? 'Registrering feilet' : 'Signup failed'));
          return;
        }
        if (!data.access_token) {
          showLandingError('landing-signup-error', activeLang === 'no' ? 'Sjekk e-posten din for bekreftelse' : 'Check your email to confirm');
          return;
        }
        storeLandingSession(data);
        window.location.replace('/app');
      } catch(e) {
        showLandingError('landing-signup-error', e.message);
      }
    }

    // ── Wire modal events ──
    document.getElementById('nav-login-btn').addEventListener('click', function() {
      openLandingAuth('login');
    });

    document.getElementById('landing-auth-overlay').addEventListener('click', function(e) {
      if (e.target === this) closeLandingAuth();
    });

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        var overlay = document.getElementById('landing-auth-overlay');
        if (!overlay.classList.contains('hidden')) closeLandingAuth();
      }
    });

    document.querySelectorAll('.landing-auth-tab').forEach(function(btn) {
      btn.addEventListener('click', function() { showLandingTab(this.dataset.tab); });
    });

    document.getElementById('landing-login-submit').addEventListener('click', handleLandingLogin);
    document.getElementById('landing-signup-submit').addEventListener('click', handleLandingSignup);

    document.getElementById('landing-auth-overlay').addEventListener('keydown', function(e) {
      if (e.key !== 'Enter') return;
      var loginHidden = document.getElementById('landing-login-view').classList.contains('hidden');
      if (!loginHidden) handleLandingLogin();
      else handleLandingSignup();
    });
```

- [ ] **Step 2: Verify modal opens**

Reload the page. Click the "Logg inn" button in the nav. The split-card modal should appear. The first email input should receive focus automatically.

- [ ] **Step 3: Verify tab switching**

Click the "Registrer" tab. The signup form (3 inputs) should appear and "Logg inn" form should hide. Click "Logg inn" tab — should switch back.

- [ ] **Step 4: Verify close behaviours**

- Click outside the modal card (on the dark backdrop) → modal closes
- Reopen modal → press Escape → modal closes
- Both should leave the page in its normal state

- [ ] **Step 5: Verify login with wrong credentials**

Enter a fake email + password, click LOGG INN. A red error message should appear below the inputs: "Innlogging feilet" (or the Supabase error description).

- [ ] **Step 6: Verify successful login**

Enter real credentials. On success, the page should redirect to `/app` and the user should be logged in (not in demo mode).

- [ ] **Step 7: Commit**

```bash
git add landing.html landing.css
git commit -m "feat(landing): add split-card login modal"
```

---

## Task 7: i18n — translate new elements

**Files:**
- Modify: `landing.html` (existing `applyLang` function in the `<script>` block)

- [ ] **Step 1: Extend `applyLang` to cover new elements**

Find the `applyLang` function in `landing.html`. It currently ends with:

```js
      document.getElementById('nav-lang-label').textContent = lang === 'no' ? 'EN' : 'NO';
      document.documentElement.lang = lang;
    }
```

Add two lines before those final two lines:

```js
      // Translate new auth elements
      var loginBtn = document.getElementById('nav-login-btn');
      if (loginBtn) loginBtn.textContent = lang === 'no' ? 'Logg inn' : 'Log in';

      // Re-render modal title/tabs if modal is currently open
      var overlay = document.getElementById('landing-auth-overlay');
      if (overlay && !overlay.classList.contains('hidden')) {
        var activeTab = document.querySelector('.landing-auth-tab.active');
        if (activeTab) showLandingTab(activeTab.dataset.tab);
      }
```

- [ ] **Step 2: Verify language toggle updates the nav button**

Toggle language to EN. The "Logg inn" button should change to "Log in". Toggle back to NO — should return to "Logg inn".

- [ ] **Step 3: Verify modal translates when open**

Open the modal, toggle language. Title and tab labels should update immediately.

- [ ] **Step 4: Commit**

```bash
git add landing.html
git commit -m "feat(landing): i18n support for auth modal and nav button"
```

---

## Done

All tasks complete. Verify the full flow end-to-end:
1. Clear `athlytics_session` from localStorage → visit `/` → landing page shows normally
2. Set a valid session in localStorage → visit `/` → redirected immediately to `/app`
3. Click "Logg inn" on landing page → split-card modal opens
4. Log in with real credentials → redirected to `/app`, logged in
5. Toggle language → "Logg inn" / "Log in" updates in nav and open modal
