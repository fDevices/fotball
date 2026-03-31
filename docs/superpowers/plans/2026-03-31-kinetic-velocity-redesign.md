# Kinetic Velocity Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate `app.html`, `landing.html`, and `style.css` from the dark-green "Pitch" aesthetic to the "Kinetic Velocity" design system (dark navy + cyan, Space Grotesk + Inter, Tailwind CDN).

**Architecture:** Big-bang rewrite in an isolated git worktree so `main` stays live throughout. All JS modules are unchanged except `stats-analyse.js` (chart hex colors only). Tailwind CDN replaces the current hand-written `style.css`; a minimal `style.css` (~150 lines) handles animations, SVG icon masking, and JS-toggled state classes.

**Tech Stack:** Tailwind CSS CDN (`cdn.tailwindcss.com`), Space Grotesk + Inter (Google Fonts), Chart.js 4 (unchanged CDN)

**Spec:** `docs/superpowers/specs/2026-03-31-kinetic-velocity-redesign.md`

---

## File Map

| File | Action | Notes |
|---|---|---|
| `app.html` | Full rewrite | Tailwind classes, global nav, per-screen title blocks |
| `landing.html` | Full rewrite | Cyan theme, glassmorphic nav |
| `style.css` | Gut to ~150 lines | Animations, mask-image, JS state classes |
| `js/stats-analyse.js` | Minor edit | 5–6 hex color values only |

All other files in `js/`, `icons/`, `supabase/`, `vercel.json` — **no changes**.

---

## Task 1: Create git worktree

**Files:** none (git only)

- [ ] **Create isolated branch and worktree**

```bash
git worktree add ../fotball-redesign -b redesign/kinetic-velocity
cd ../fotball-redesign
```

- [ ] **Verify worktree is clean**

```bash
git status
# Expected: nothing to commit, working tree clean
```

---

## Task 2: Replace `<head>` in `app.html`

**Files:** Modify `app.html` lines 1–16

- [ ] **Replace the entire `<head>` block** with:

```html
<!DOCTYPE html>
<html lang="no" class="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Athlytics">
<meta name="screen-orientation" content="portrait">
<title>Athlytics Sport</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<script>
  tailwind.config = {
    darkMode: "class",
    theme: {
      extend: {
        colors: {
          "surface":                   "#10141a",
          "surface-container-lowest":  "#0a0e14",
          "surface-container-low":     "#181c22",
          "surface-container":         "#1c2026",
          "surface-container-high":    "#262a31",
          "surface-container-highest": "#31353c",
          "surface-bright":            "#353940",
          "primary":                   "#e1fdff",
          "primary-container":         "#00f2ff",
          "primary-fixed-dim":         "#00dbe7",
          "on-primary":                "#00363a",
          "on-surface":                "#dfe2eb",
          "on-surface-variant":        "#b9cacb",
          "outline-variant":           "#3a494b",
          "tertiary-fixed":            "#ffe173",
          "error":                     "#ffb4ab",
        },
        fontFamily: {
          "headline": ["Space Grotesk", "sans-serif"],
          "body":     ["Inter", "sans-serif"],
        },
        borderRadius: {
          DEFAULT: "0.5rem",
          lg:      "0.5rem",
          xl:      "0.75rem",
          full:    "9999px",
        },
      },
    },
  }
</script>
<script src="https://cdn.tailwindcss.com"></script>
<script src="https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js" defer></script>
<link rel="stylesheet" href="style.css">
</head>
```

- [ ] **Verify in browser** — open `app.html`. Space Grotesk font should load. Background will still be green (style.css not updated yet).

---

## Task 3: Rewrite `style.css`

**Files:** Replace entire `style.css`

- [ ] **Replace `style.css` with:**

```css
/* ── RESET & BASE ── */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
html, body { height: 100%; }
body { font-family: 'Inter', sans-serif; background: #10141a; color: #dfe2eb; overflow-x: hidden; }

/* ── GRID TEXTURE ── */
body::before {
  content: '';
  position: fixed;
  inset: 0;
  background-image: radial-gradient(#1c2026 1px, transparent 1px);
  background-size: 40px 40px;
  pointer-events: none;
  z-index: 0;
}

/* ── UTILITY ── */
.hidden { display: none !important; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }

/* ── LANDSCAPE BLOCK ── */
.landscape-block { display: none; position: fixed; inset: 0; z-index: 9999; background: #10141a; align-items: center; justify-content: center; flex-direction: column; gap: 16px; text-align: center; }
@media (orientation: landscape) and (max-height: 600px) { .landscape-block { display: flex; } }

/* ── SCREEN TRANSITIONS ── */
.screen { display: none; position: relative; z-index: 1; max-width: 480px; margin: 0 auto; padding: 0 0 calc(56px + 8px); min-height: 100vh; pointer-events: none; }
.screen.active { display: block; pointer-events: all; animation: fadeIn 0.2s ease; }
@keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }

/* ── SVG ICON MASKING ── */
.tab-svg-icon {
  display: inline-block; width: 22px; height: 22px;
  background-color: #b9cacb;
  -webkit-mask-size: contain; mask-size: contain;
  -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
  -webkit-mask-position: center; mask-position: center;
  transition: background-color 0.15s;
}
.tab-icon-log      { -webkit-mask-image: url('/icons/tab-log.svg');      mask-image: url('/icons/tab-log.svg'); }
.tab-icon-stats    { -webkit-mask-image: url('/icons/tab-stats.svg');    mask-image: url('/icons/tab-stats.svg'); }
.tab-icon-profile  { -webkit-mask-image: url('/icons/tab-profile.svg');  mask-image: url('/icons/tab-profile.svg'); }
.tab-icon-settings { -webkit-mask-image: url('/icons/tab-settings.svg'); mask-image: url('/icons/tab-settings.svg'); }
.tab-btn.active .tab-svg-icon { background-color: #00f2ff; }

.match-svg-icon {
  display: inline-block; width: 16px; height: 16px;
  background-color: currentColor;
  -webkit-mask-size: contain; mask-size: contain;
  -webkit-mask-repeat: no-repeat; mask-repeat: no-repeat;
  -webkit-mask-position: center; mask-position: center;
  vertical-align: middle;
}
.match-icon-home { -webkit-mask-image: url('/icons/match-home.svg'); mask-image: url('/icons/match-home.svg'); }
.match-icon-away { -webkit-mask-image: url('/icons/match-away.svg'); mask-image: url('/icons/match-away.svg'); }
.match-icon-date { -webkit-mask-image: url('/icons/date-toggle.svg'); mask-image: url('/icons/date-toggle.svg'); }

/* ── JS-TOGGLED STATE CLASSES ── */
/* Result indicator */
.wins { color: #00f2ff; background: rgba(0,242,255,0.1); border-color: #00f2ff; }
.draw { color: #ffe173; background: rgba(255,225,115,0.1); border-color: #ffe173; }
.loss { color: #ffb4ab; background: rgba(255,180,171,0.1); border-color: #ffb4ab; }

/* Match type toggle active state */
.match-type-mini-btn.active { background: rgba(0,242,255,0.1); border-color: #00f2ff; color: #00f2ff; }
.match-type-mini-btn.active .match-svg-icon { background-color: #00f2ff; }
.toggle-btn.active { background: rgba(0,242,255,0.1); border-color: #00f2ff; color: #00f2ff; }
.toggle-btn.active .match-svg-icon { background-color: #00f2ff; }

/* Dropdowns */
.team-dropdown { display: none; }
.team-dropdown.open { display: block; animation: dropDown 0.15s ease; }
.team-selected.open { border-color: #00f2ff; }
.team-chevron.open { transform: translateY(-50%) rotate(180deg); color: #00f2ff; }

/* Stats view toggle */
.stats-view-btn.active { background: rgba(0,242,255,0.1); color: #00f2ff; }

/* Season/team filter pills */
.season-pill.active { background: #00f2ff; color: #00363a; border-color: #00f2ff; }

/* Modal / sheet */
.modal-backdrop { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 100; }
.modal-backdrop.open { display: block; }
.modal-sheet { position: fixed; bottom: 0; left: 50%; transform: translate(-50%, 100%); width: 100%; max-width: 480px; max-height: 90vh; overflow-y: auto; background: #1c2026; border-radius: 12px 12px 0 0; z-index: 101; transition: transform 0.3s cubic-bezier(0.32,0.72,0,1); }
.modal-sheet.open { transform: translate(-50%, 0); }

/* Auth overlay */
.auth-overlay { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.75); z-index: 200; align-items: center; justify-content: center; }
.auth-overlay.open { display: flex; }
.auth-view { display: none; }
.auth-view.active { display: block; }

/* Delete confirm dialog */
.delete-confirm-backdrop { display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 200; }
.delete-confirm-backdrop.open { display: block; }
.delete-confirm-dialog { display: none; position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #1c2026; border-radius: 12px; padding: 24px; width: calc(100% - 48px); max-width: 320px; z-index: 201; text-align: center; }
.delete-confirm-dialog.open { display: block; }

/* Demo banner */
.demo-banner { display: none; }
.demo-banner.visible { display: flex; }

/* Danger zone panel */
.danger-panel { display: none; }
.danger-panel.open { display: block; }

/* Loading spinner */
@keyframes spin { to { transform: rotate(360deg); } }
.spinner { width: 24px; height: 24px; border: 2px solid rgba(58,73,75,0.4); border-top-color: #00f2ff; border-radius: 50%; animation: spin 0.8s linear infinite; display: inline-block; }

/* Animations */
@keyframes modalSlideUp { from { transform: translate(-50%, 100%); } to { transform: translate(-50%, 0); } }
@keyframes dropDown { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
@keyframes toastIn { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }

/* Toast */
.toast { position: fixed; bottom: calc(56px + 16px); left: 50%; transform: translateX(-50%); min-width: 240px; max-width: calc(100% - 48px); background: #262a31; border-radius: 10px; padding: 14px 20px; font-family: 'Inter', sans-serif; font-size: 14px; color: #dfe2eb; z-index: 300; display: none; animation: toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1); }
.toast.show { display: block; }
.toast.success { border: 1px solid #00f2ff; }
.toast.error   { border: 1px solid #ffb4ab; }

/* Date input (hidden, triggered by JS) */
.date-input-hidden { position: absolute; opacity: 0; pointer-events: none; width: 1px; height: 1px; }

/* Flag icon */
.flag-svg-icon { width: 22px; height: 16px; border-radius: 2px; vertical-align: middle; }

/* Profile badge on tab */
.tab-profile-badge { position: absolute; top: -2px; right: -4px; width: 8px; height: 8px; background: #00f2ff; border-radius: 50%; display: none; }
.tab-profile-badge.show { display: block; }

/* Chart canvas */
canvas { max-width: 100%; }

/* Desktop stats two-column */
@media (min-width: 900px) {
  .screen { max-width: 1080px; }
  #stats-desktop-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
  .stats-view-toggle { display: none; }
  #stats-content, #stats-content-analyse { display: block !important; }
}
```

- [ ] **Verify in browser** — page background should now be `#10141a` (dark navy). Fonts will be Inter/Space Grotesk. The tab bar icons will still work (mask-image).

- [ ] **Commit**

```bash
git add app.html style.css
git commit -m "refactor: replace head + style.css with Tailwind CDN + Kinetic Velocity tokens"
```

---

## Task 4: Global top nav + app shell

**Files:** Modify `app.html` — landscape blocker, demo banner, auth overlay, add `<header>`

- [ ] **Replace landscape blocker** (lines 65–70):

```html
<div class="landscape-block">
  <div class="text-4xl mb-3">📱</div>
  <p class="font-headline font-semibold text-on-surface-variant text-sm uppercase tracking-widest" data-i18n="landscape_rotate">Rotate to portrait</p>
</div>
```

- [ ] **Replace demo banner** (lines 21–25):

```html
<div class="demo-banner fixed top-0 inset-x-0 z-50 items-center justify-between gap-2 px-4 py-2 bg-surface-container-high border-b border-outline-variant/40 text-sm" id="demo-banner">
  <span class="text-on-surface-variant" data-i18n="demo_banner_text">You're viewing demo data — create a free account to track your own</span>
  <div class="flex items-center gap-2 shrink-0">
    <button class="px-3 py-1 rounded-full bg-primary-container text-on-primary text-xs font-headline font-semibold" data-action="openAuthOverlay" data-i18n="demo_banner_signup">Sign up free</button>
    <button class="text-on-surface-variant hover:text-on-surface" data-action="dismissDemoBanner" aria-label="Dismiss">✕</button>
  </div>
</div>
```

- [ ] **Replace auth overlay** (lines 28–63):

```html
<div class="auth-overlay" id="auth-overlay">
  <div class="bg-surface-container rounded-xl w-full max-w-sm mx-4 p-6 border border-outline-variant/40" id="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-dialog-title">
    <h2 id="auth-dialog-title" class="sr-only"></h2>

    <!-- Login view -->
    <div class="auth-view" id="auth-login-view">
      <h2 class="font-headline font-semibold text-2xl text-on-surface mb-5" data-i18n="auth_login_title">Log in</h2>
      <div class="hidden text-error text-sm mb-3 p-3 bg-error/10 rounded-lg" id="auth-login-error"></div>
      <form novalidate class="flex flex-col gap-3">
        <input type="email" id="auth-login-email"
               class="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-4 py-3 text-on-surface font-body text-sm outline-none focus:border-primary-container placeholder:text-on-surface-variant"
               placeholder="Email" autocomplete="email">
        <input type="password" id="auth-login-password"
               class="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-4 py-3 text-on-surface font-body text-sm outline-none focus:border-primary-container placeholder:text-on-surface-variant"
               placeholder="Password" autocomplete="current-password">
        <button class="w-full py-3 bg-primary-container text-on-primary font-headline font-semibold rounded-lg mt-1" data-action="authLogin" data-i18n="auth_login_btn">Log in</button>
      </form>
      <button class="w-full mt-3 text-on-surface-variant text-sm hover:text-primary-container" data-action="authToggleView" data-i18n="auth_to_signup">Don't have an account? Sign up</button>
    </div>

    <!-- Signup view -->
    <div class="auth-view hidden" id="auth-signup-view">
      <h2 class="font-headline font-semibold text-2xl text-on-surface mb-5" data-i18n="auth_signup_title">Create account</h2>
      <div class="hidden text-error text-sm mb-3 p-3 bg-error/10 rounded-lg" id="auth-signup-error"></div>
      <form novalidate class="flex flex-col gap-3">
        <input type="email" id="auth-signup-email"
               class="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-4 py-3 text-on-surface font-body text-sm outline-none focus:border-primary-container placeholder:text-on-surface-variant"
               placeholder="Email" autocomplete="email">
        <input type="password" id="auth-signup-password"
               class="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-4 py-3 text-on-surface font-body text-sm outline-none focus:border-primary-container placeholder:text-on-surface-variant"
               placeholder="Password" autocomplete="new-password">
        <input type="password" id="auth-signup-confirm"
               class="w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-4 py-3 text-on-surface font-body text-sm outline-none focus:border-primary-container placeholder:text-on-surface-variant"
               placeholder="Confirm password" autocomplete="new-password">
        <button class="w-full py-3 bg-primary-container text-on-primary font-headline font-semibold rounded-lg mt-1" data-action="authSignup" data-i18n="auth_signup_btn">Create account</button>
      </form>
      <button class="w-full mt-3 text-on-surface-variant text-sm hover:text-primary-container" data-action="authToggleView" data-i18n="auth_to_login">Already have an account? Log in</button>
    </div>
  </div>
</div>
```

- [ ] **Add global `<header>` directly after `<body>` opening** (before landscape block):

```html
<header class="fixed top-0 inset-x-0 z-50 bg-surface-container-highest/60 backdrop-blur-xl border-b border-outline-variant/30" style="backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);">
  <div class="flex items-center justify-between px-4 h-[52px] max-w-[480px] mx-auto">
    <!-- Logo -->
    <div class="flex items-center gap-2">
      <span class="w-2 h-2 bg-primary-container rounded-sm inline-block"></span>
      <span class="font-headline font-bold text-xs tracking-[0.2em] text-on-surface uppercase">Athlytics</span>
    </div>
    <!-- Right: lang picker + avatar -->
    <div class="flex items-center gap-3">
      <div class="lang-picker-wrap relative">
        <button class="lang-flag-btn text-xl p-1 rounded" id="lang-flag-btn-global" data-action="toggleLangPicker" title="Change language"></button>
        <div class="lang-picker-dropdown hidden absolute right-0 top-9 bg-surface-container border border-outline-variant/40 rounded-xl overflow-hidden z-50 shadow-lg min-w-[140px]" id="lang-picker-dropdown-global">
          <button class="flex items-center gap-2 w-full px-4 py-3 text-on-surface font-body text-sm hover:bg-primary-container/10 text-left" data-action="setLang" data-lang="no"><img src="/icons/flag-no.svg" alt="" class="flag-svg-icon"> Norsk</button>
          <button class="flex items-center gap-2 w-full px-4 py-3 text-on-surface font-body text-sm hover:bg-primary-container/10 text-left" data-action="setLang" data-lang="en"><img src="/icons/flag-en.svg" alt="" class="flag-svg-icon"> English</button>
        </div>
      </div>
      <button class="w-8 h-8 rounded-full bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-sm" data-action="switchTab" data-tab="profil" aria-label="Profile">
        <span id="nav-avatar-emoji">👤</span>
      </button>
    </div>
  </div>
</header>
```

- [ ] **Remove all 4 per-screen lang picker blocks** — search for each `<div class="lang-picker-wrap">` inside `.header` divs and delete them (they are now in the global nav).

- [ ] **Add top padding to `<main>`** so content clears the fixed header. Replace the `<main>` opening tag:

```html
<main class="pt-[52px]">
```

- [ ] **Verify in browser** — glassmorphic top nav appears. Profile avatar button visible. No duplicate lang pickers.

- [ ] **Commit**

```bash
git add app.html
git commit -m "feat: add global glassmorphic top nav, restyle auth overlay + demo banner"
```

---

## Task 5: Bottom tab bar

**Files:** Modify `app.html` — `<nav>` block (lines ~445–462)

- [ ] **Replace the `<nav>` block:**

```html
<nav class="fixed bottom-0 inset-x-0 z-50 bg-surface-container-low border-t border-outline-variant/40" aria-label="Main navigation">
  <div class="flex max-w-[480px] mx-auto">
    <button class="tab-btn active flex-1 flex flex-col items-center gap-1 py-2 px-1" id="tab-log" role="tab" aria-selected="true" data-action="switchTab" data-tab="log">
      <span class="tab-icon relative"><span class="tab-svg-icon tab-icon-log"></span></span>
      <span class="tab-label text-[10px] font-headline font-semibold uppercase tracking-wider text-primary-container" data-i18n="tab_log">Log</span>
    </button>
    <button class="tab-btn flex-1 flex flex-col items-center gap-1 py-2 px-1" id="tab-stats" role="tab" aria-selected="false" data-action="switchTab" data-tab="stats">
      <span class="tab-icon"><span class="tab-svg-icon tab-icon-stats"></span></span>
      <span class="tab-label text-[10px] font-headline font-semibold uppercase tracking-wider text-on-surface-variant" data-i18n="tab_stats">Stats</span>
    </button>
    <button class="tab-btn flex-1 flex flex-col items-center gap-1 py-2 px-1" id="tab-profil" role="tab" aria-selected="false" data-action="switchTab" data-tab="profil">
      <span class="tab-icon relative"><span class="tab-svg-icon tab-icon-profile"></span><span class="tab-profile-badge" id="tab-profile-badge"></span></span>
      <span class="tab-label text-[10px] font-headline font-semibold uppercase tracking-wider text-on-surface-variant" data-i18n="tab_profile">Profile</span>
    </button>
    <button class="tab-btn flex-1 flex flex-col items-center gap-1 py-2 px-1" id="tab-settings" role="tab" aria-selected="false" data-action="switchTab" data-tab="settings">
      <span class="tab-icon"><span class="tab-svg-icon tab-icon-settings"></span></span>
      <span class="tab-label text-[10px] font-headline font-semibold uppercase tracking-wider text-on-surface-variant" data-i18n="tab_settings">Settings</span>
    </button>
  </div>
</nav>
```

- [ ] Also add to `style.css` — tab active label color rule (tab JS toggles `.active` on the button, but label color is static in Tailwind; fix with CSS):

```css
/* Tab label color — active state (JS adds .active to .tab-btn) */
.tab-btn.active .tab-label { color: #00f2ff; }
.tab-btn .tab-label { color: #b9cacb; }
```

- [ ] **Verify in browser** — tap each tab, active tab icon + label turn cyan.

---

## Task 6: Log tab

**Files:** Modify `app.html` — `#screen-log` section

- [ ] **Replace the entire `#screen-log` section** (from `<section class="screen active" id="screen-log"` to its closing `</section>`):

```html
<section class="screen active" id="screen-log" aria-label="Match log">
  <!-- Screen title -->
  <div class="px-6 pt-5 pb-3">
    <p class="text-[10px] font-headline font-semibold uppercase tracking-[0.15em] text-on-surface-variant mb-1" data-i18n="log_screen_label">Performance Data Entry</p>
    <h1 class="font-headline font-bold text-2xl text-on-surface" id="log-heading">Match <span class="text-primary-container" data-i18n="tab_log">Log</span></h1>
    <p class="text-xs text-on-surface-variant mt-1" id="log-sub"></p>
  </div>

  <form class="px-6 pb-6 flex flex-col gap-3" id="log-form" novalidate>

    <!-- Date + match type row -->
    <div class="date-compact-section">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <span class="font-headline font-semibold text-on-surface text-base" id="date-display-label">Today</span>
          <button type="button" class="text-on-surface-variant p-1 rounded" id="date-toggle-btn" title="Change date"><span class="match-svg-icon match-icon-date"></span></button>
        </div>
        <div class="flex gap-2 match-type-mini-toggle">
          <button type="button" class="match-type-mini-btn active flex items-center gap-1.5 px-3 h-9 rounded-lg border border-outline-variant/40 bg-surface-container text-on-surface-variant font-headline font-semibold text-sm" id="btn-home-toggle" data-action="setMatchType" data-match-type="home">
            <span class="match-svg-icon match-icon-home"></span> <span data-i18n="home_match">Home</span>
          </button>
          <button type="button" class="match-type-mini-btn flex items-center gap-1.5 px-3 h-9 rounded-lg border border-outline-variant/40 bg-surface-container text-on-surface-variant font-headline font-semibold text-sm" id="btn-away-toggle" data-action="setMatchType" data-match-type="away">
            <span class="match-svg-icon match-icon-away"></span> <span data-i18n="away_match">Away</span>
          </button>
        </div>
      </div>
      <input type="date" id="date" class="date-input-hidden">
    </div>

    <!-- Opponent + Team (2-col) -->
    <div class="grid grid-cols-2 gap-3">
      <div>
        <label class="block text-[10px] font-headline font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5" id="label-opponent" for="opponent" data-i18n="label_opponent">Opponent</label>
        <input type="text" id="opponent"
               class="w-full bg-surface-container border border-outline-variant/40 rounded-lg px-4 py-2.5 text-on-surface font-body text-sm outline-none focus:border-primary-container placeholder:text-on-surface-variant"
               placeholder="e.g. Brann IL" autocomplete="off">
      </div>
      <div>
        <label class="block text-[10px] font-headline font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5" id="label-egetlag" data-i18n="label_own_team">Own team</label>
        <div class="team-selector-wrap relative">
          <div class="team-selected flex items-center justify-between bg-surface-container border border-outline-variant/40 rounded-lg px-4 py-2.5 cursor-pointer"
               id="team-selected" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="team-dropdown" data-action="toggleTeamDropdown">
            <span class="team-selected-text text-on-surface-variant font-body text-sm" id="team-selected-text" data-i18n="placeholder_select_team">Select team...</span>
            <span class="team-chevron absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs transition-transform">▼</span>
          </div>
          <div class="team-dropdown absolute top-full left-0 right-0 mt-1 bg-surface-container-low border border-primary-container rounded-lg z-50 overflow-hidden shadow-lg" id="team-dropdown" role="listbox">
            <div id="team-options-list"></div>
            <div class="flex gap-2 p-2 border-t border-outline-variant/40" id="team-new-row">
              <input class="flex-1 bg-surface-container border border-outline-variant/40 rounded px-3 py-2 text-on-surface font-body text-sm outline-none focus:border-primary-container placeholder:text-on-surface-variant" id="team-new-input" placeholder="New team name...">
              <button type="button" class="shrink-0 bg-primary-container text-on-primary font-headline font-semibold text-xs px-3 py-2 rounded" id="team-new-save-btn" data-action="saveNewTeamFromDropdown" data-i18n="btn_add">Add</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Tournament -->
    <div>
      <label class="block text-[10px] font-headline font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5" id="label-turnering" data-i18n="label_tournament">Tournament / League</label>
      <div class="team-selector-wrap relative" id="tournament-selector-wrap">
        <div class="team-selected flex items-center justify-between bg-surface-container border border-outline-variant/40 rounded-lg px-4 py-2.5 cursor-pointer"
             id="tournament-trigger" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="tournament-dropdown" data-action="toggleTournamentDropdown">
          <span class="team-selected-text text-on-surface-variant font-body text-sm" id="tournament-selected-text" data-i18n="placeholder_select_tournament">— Select tournament —</span>
          <span class="team-chevron absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs transition-transform" id="tournament-chevron">▼</span>
        </div>
        <div class="team-dropdown absolute top-full left-0 right-0 mt-1 bg-surface-container-low border border-primary-container rounded-lg z-50 overflow-hidden shadow-lg" id="tournament-dropdown" role="listbox">
          <div id="tournament-options-list"></div>
          <div class="flex gap-2 p-2 border-t border-outline-variant/40" id="tournament-new-row">
            <input class="flex-1 bg-surface-container border border-outline-variant/40 rounded px-3 py-2 text-on-surface font-body text-sm outline-none focus:border-primary-container placeholder:text-on-surface-variant" id="tournament-new-input" placeholder="Tournament name...">
            <button type="button" class="shrink-0 bg-primary-container text-on-primary font-headline font-semibold text-xs px-3 py-2 rounded" id="tournament-new-save-btn" data-action="saveNewTournamentFromDropdown" data-i18n="btn_add">Add</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Score row -->
    <div class="bg-surface-container rounded-xl p-4">
      <p class="text-[10px] font-headline font-semibold uppercase tracking-wider text-on-surface-variant text-center mb-3" data-i18n="label_score">Score</p>
      <div class="flex items-center justify-center gap-4">
        <div>
          <p class="score-team-label highlight text-[9px] font-headline font-bold uppercase tracking-wider text-primary-container text-center mb-1" id="label-home" data-i18n="home_team">Home</p>
          <div class="number-control flex items-center bg-surface-container-high rounded-lg overflow-hidden border border-outline-variant/40" role="group" aria-labelledby="label-home">
            <button type="button" class="num-btn w-10 h-10 text-primary-container text-xl flex items-center justify-center" data-action="adjust" data-type="home" data-delta="-1">−</button>
            <span class="num-display w-10 text-center font-headline font-bold text-2xl text-on-surface" id="home-display" aria-live="polite">0</span>
            <button type="button" class="num-btn w-10 h-10 text-primary-container text-xl flex items-center justify-center" data-action="adjust" data-type="home" data-delta="1">+</button>
          </div>
        </div>
        <span class="font-headline font-bold text-2xl text-on-surface-variant">–</span>
        <div>
          <p class="score-team-label text-[9px] font-headline font-bold uppercase tracking-wider text-on-surface-variant text-center mb-1" id="label-away" data-i18n="away_team">Away</p>
          <div class="number-control flex items-center bg-surface-container-high rounded-lg overflow-hidden border border-outline-variant/40">
            <button type="button" class="num-btn w-10 h-10 text-primary-container text-xl flex items-center justify-center" data-action="adjust" data-type="away" data-delta="-1">−</button>
            <span class="num-display w-10 text-center font-headline font-bold text-2xl text-on-surface" id="away-display" aria-live="polite">0</span>
            <button type="button" class="num-btn w-10 h-10 text-primary-container text-xl flex items-center justify-center" data-action="adjust" data-type="away" data-delta="1">+</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Goals + Assists -->
    <div class="grid grid-cols-2 gap-3">
      <div>
        <span class="num-label block text-[10px] font-headline font-semibold uppercase tracking-wider text-on-surface-variant text-center mb-1.5" id="label-goals" data-i18n="label_goals">Goals</span>
        <div class="number-control flex items-center bg-surface-container border border-outline-variant/40 rounded-lg overflow-hidden">
          <button type="button" class="num-btn w-10 h-10 text-primary-container text-xl flex items-center justify-center" data-action="adjust" data-type="goals" data-delta="-1">−</button>
          <span class="num-display flex-1 text-center font-headline font-bold text-xl text-on-surface" id="goals-display" aria-live="polite">0</span>
          <button type="button" class="num-btn w-10 h-10 text-primary-container text-xl flex items-center justify-center" data-action="adjust" data-type="goals" data-delta="1">+</button>
        </div>
      </div>
      <div>
        <span class="num-label block text-[10px] font-headline font-semibold uppercase tracking-wider text-on-surface-variant text-center mb-1.5" id="label-assist" data-i18n="label_assist">Assists</span>
        <div class="number-control flex items-center bg-surface-container border border-outline-variant/40 rounded-lg overflow-hidden">
          <button type="button" class="num-btn w-10 h-10 text-primary-container text-xl flex items-center justify-center" data-action="adjust" data-type="assist" data-delta="-1">−</button>
          <span class="num-display flex-1 text-center font-headline font-bold text-xl text-on-surface" id="assist-display" aria-live="polite">0</span>
          <button type="button" class="num-btn w-10 h-10 text-primary-container text-xl flex items-center justify-center" data-action="adjust" data-type="assist" data-delta="1">+</button>
        </div>
      </div>
    </div>

    <!-- Result -->
    <div>
      <label class="block text-[10px] font-headline font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5" id="label-result" data-i18n="label_result">Result</label>
      <div id="result-display" class="result-auto text-center font-headline font-bold text-lg py-3 rounded-lg border border-outline-variant/40 bg-surface-container text-on-surface-variant">–</div>
    </div>

    <!-- Submit -->
    <button class="submit-btn w-full py-4 bg-primary-container text-on-primary font-headline font-bold text-base uppercase tracking-wider rounded-lg mt-1 active:scale-[0.98] transition-transform" id="submit-btn" type="submit" data-action="saveMatch" data-i18n="btn_save_match">Save Match</button>
    <div class="hidden-badge" id="log-badge" style="display:none"></div>
  </form>
</section>
```

- [ ] **Verify in browser** — Log tab renders with cyan accents, dark navy cards, Space Grotesk font. Tap +/− buttons: scores increment. Home/Away toggle activates. Submit shows toast.

- [ ] **Commit**

```bash
git add app.html
git commit -m "feat: restyle log tab with Kinetic Velocity design"
```

---

## Task 7: Stats tab

**Files:** Modify `app.html` — `#screen-stats` section

- [ ] **Replace the `#screen-stats` section:**

```html
<section class="screen" id="screen-stats" aria-label="Statistics">
  <!-- Screen title -->
  <div class="px-6 pt-5 pb-3">
    <p class="text-[10px] font-headline font-semibold uppercase tracking-[0.15em] text-on-surface-variant mb-1" data-i18n="stats_screen_label">Performance Analytics</p>
    <h1 class="font-headline font-bold text-2xl text-on-surface" id="stats-heading">My <span class="text-primary-container" data-i18n="tab_stats">Stats</span></h1>
    <p class="text-xs text-on-surface-variant mt-1" id="stats-sub"></p>
  </div>

  <div class="stats-body px-6 pb-6">
    <!-- View toggle -->
    <div class="form-section mb-3">
      <div class="stats-view-toggle flex bg-surface-container-low rounded-lg p-1 gap-1" id="stats-view-toggle">
        <button class="stats-view-btn active flex-1 py-2 rounded font-headline font-semibold text-sm text-on-surface-variant transition-colors" id="stats-view-btn-overview" data-action="switchStatsView" data-view="overview" data-i18n="stats_overview">Overview</button>
        <button class="stats-view-btn flex-1 py-2 rounded font-headline font-semibold text-sm text-on-surface-variant transition-colors" id="stats-view-btn-analyse" data-action="switchStatsView" data-view="analyse"><span id="stats-analyse-text" data-i18n="stats_analyse">Analyse</span> <span class="premium-star text-tertiary-fixed">⭐</span></button>
      </div>
    </div>

    <!-- Filters -->
    <div id="stats-filters">
      <div class="mb-2">
        <div class="season-selector flex gap-2 overflow-x-auto pb-1" id="season-selector"></div>
      </div>
      <div class="mb-2 team-filter-row">
        <div class="season-selector flex gap-2 overflow-x-auto pb-1" id="team-filter-selector"></div>
      </div>
      <div class="mb-3 tournament-filter-row">
        <div class="season-selector flex gap-2 overflow-x-auto pb-1" id="tournament-filter-selector"></div>
      </div>
    </div>

    <!-- Content areas -->
    <div id="stats-desktop-grid">
      <div id="stats-content">
        <div class="loading flex flex-col items-center gap-3 py-12 text-on-surface-variant">
          <div class="spinner"></div>
          <span class="text-sm font-body" data-i18n="loading_stats">Loading stats...</span>
        </div>
      </div>
      <div id="stats-content-analyse"></div>
    </div>
  </div>

  <!-- Hidden badge for JS -->
  <div id="stats-header-badge" style="display:none"></div>
</section>
```

- [ ] **Verify in browser** — Stats tab renders. Toggle Overview/Analyse works. Filter pills appear (rendered by JS into `#season-selector` etc.).

- [ ] **Commit**

```bash
git add app.html
git commit -m "feat: restyle stats tab shell with Kinetic Velocity design"
```

---

## Task 8: Profile tab

**Files:** Modify `app.html` — `#screen-profil` section

- [ ] **Replace the `#screen-profil` section:**

```html
<section class="screen" id="screen-profil" aria-label="Profile">
  <!-- Screen title -->
  <div class="px-6 pt-5 pb-3">
    <p class="text-[10px] font-headline font-semibold uppercase tracking-[0.15em] text-on-surface-variant mb-1" data-i18n="profile_screen_label">Player Identity</p>
    <h1 class="font-headline font-bold text-2xl text-on-surface" id="profil-title">My <span class="text-primary-container" data-i18n="tab_profile">Profile</span></h1>
  </div>

  <!-- Soft prompt banner -->
  <div class="hidden mx-6 mb-4 bg-surface-container border border-outline-variant/40 rounded-xl p-4" id="profile-prompt">
    <div class="flex items-start gap-3 mb-3">
      <div class="text-2xl" id="profile-prompt-icon">👋</div>
      <div>
        <h3 class="font-headline font-semibold text-on-surface text-sm mb-1" id="profile-prompt-title"></h3>
        <p class="text-on-surface-variant text-xs font-body" id="profile-prompt-desc"></p>
      </div>
    </div>
    <button class="text-on-surface-variant text-xs underline" data-action="dismissProfilePrompt" id="profile-prompt-skip"></button>
  </div>

  <div class="profil-body px-6 pb-6 flex flex-col gap-4">

    <!-- Avatar -->
    <div class="flex items-center gap-4">
      <div class="avatar-circle relative w-16 h-16 rounded-full bg-surface-container-high border-2 border-primary-container/40 flex items-center justify-center text-2xl cursor-pointer shrink-0"
           id="avatar-icon" data-action="triggerAvatarUpload" title="Change photo">
        <img id="avatar-img" src="" alt="" style="display:none;width:100%;height:100%;object-fit:cover;border-radius:50%;">
        <span id="avatar-emoji">⚽</span>
      </div>
      <input type="file" id="avatar-upload" accept="image/*" style="display:none" data-action="uploadImage">
      <div>
        <div class="font-headline font-semibold text-on-surface text-base" id="avatar-name"></div>
        <div class="text-on-surface-variant text-sm font-body" id="avatar-club"></div>
        <div class="text-primary-container text-xs mt-1 cursor-pointer" id="avatar-upload-hint" data-i18n="avatar_upload_hint">Tap to upload photo</div>
      </div>
    </div>

    <!-- Player info -->
    <div class="bg-surface-container rounded-xl p-4">
      <h3 class="profil-card-title font-headline font-semibold text-xs uppercase tracking-wider text-primary-container mb-3" id="profil-card-spillerinfo" data-i18n="profile_player_info">Player Info</h3>
      <div class="flex flex-col gap-3">
        <div class="profil-field">
          <label class="block text-[10px] font-headline font-semibold uppercase tracking-wider text-on-surface-variant mb-1" id="profil-label-name" for="profil-name" data-i18n="label_name">Name</label>
          <input class="profil-field-input w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-4 py-2.5 text-on-surface font-body text-sm outline-none focus:border-primary-container placeholder:text-on-surface-variant"
                 id="profil-name" type="text" placeholder="Full name" autocomplete="off" data-action="updateAvatar">
        </div>
        <div class="profil-field">
          <label class="block text-[10px] font-headline font-semibold uppercase tracking-wider text-on-surface-variant mb-1" id="profil-label-club" for="profil-club" data-i18n="label_club">Club</label>
          <input class="profil-field-input w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-4 py-2.5 text-on-surface font-body text-sm outline-none focus:border-primary-container placeholder:text-on-surface-variant"
                 id="profil-club" type="text" placeholder="e.g. Stabæk" autocomplete="off" data-action="updateAvatar">
        </div>
      </div>
    </div>

    <!-- Tournaments -->
    <div class="bg-surface-container rounded-xl p-4">
      <h3 class="profil-card-title font-headline font-semibold text-xs uppercase tracking-wider text-primary-container mb-3" id="profil-card-tournaments" data-i18n="profile_tournaments">🏆 My Tournaments</h3>
      <div class="team-list mb-3" id="profile-tournament-list"></div>
      <div class="add-team-row flex gap-2">
        <input class="add-team-input flex-1 bg-surface-container-low border border-outline-variant/40 rounded-lg px-3 py-2 text-on-surface font-body text-sm outline-none focus:border-primary-container placeholder:text-on-surface-variant"
               id="profile-new-tournament" placeholder="Add tournament..." autocomplete="off">
        <button class="add-team-btn shrink-0 w-9 h-9 bg-primary-container text-on-primary rounded-lg font-headline font-bold text-lg flex items-center justify-center" data-action="addTournament">＋</button>
      </div>
    </div>

    <!-- Teams -->
    <div class="bg-surface-container rounded-xl p-4">
      <h3 class="profil-card-title font-headline font-semibold text-xs uppercase tracking-wider text-primary-container mb-3" id="profil-card-teams" data-i18n="profile_teams">My Teams</h3>
      <div class="team-list mb-3" id="profile-team-list"></div>
      <div class="add-team-row flex gap-2">
        <input class="add-team-input flex-1 bg-surface-container-low border border-outline-variant/40 rounded-lg px-3 py-2 text-on-surface font-body text-sm outline-none focus:border-primary-container placeholder:text-on-surface-variant"
               id="profile-team-input" placeholder="Add team...">
        <button class="add-team-btn shrink-0 w-9 h-9 bg-primary-container text-on-primary rounded-lg font-headline font-bold text-lg flex items-center justify-center" data-action="addTeamFromProfile">＋</button>
      </div>
    </div>

    <button class="profil-save-btn w-full py-3.5 bg-primary-container text-on-primary font-headline font-bold text-sm uppercase tracking-wider rounded-lg" id="btn-save-profil" data-action="saveProfile" data-i18n="btn_save_profile">Save Profile</button>
    <div class="profil-saved hidden text-center text-primary-container text-sm font-headline font-semibold" id="profil-saved">✓ Saved</div>
  </div>
</section>
```

- [ ] **Verify in browser** — Profile tab renders. Avatar circle shows. Inputs accept text. Save button visible.

- [ ] **Commit**

```bash
git add app.html
git commit -m "feat: restyle profile tab with Kinetic Velocity design"
```

---

## Task 9: Settings tab

**Files:** Modify `app.html` — `#screen-settings` section

- [ ] **Replace the `#screen-settings` section:**

```html
<section class="screen" id="screen-settings" aria-label="Settings">
  <!-- Screen title -->
  <div class="px-6 pt-5 pb-3">
    <p class="text-[10px] font-headline font-semibold uppercase tracking-[0.15em] text-on-surface-variant mb-1" data-i18n="settings_screen_label">Global Preferences</p>
    <h1 class="font-headline font-bold text-2xl text-on-surface">Set<span class="text-primary-container" data-i18n="tab_settings">tings</span></h1>
    <p class="text-xs text-on-surface-variant mt-1" id="settings-sub" data-i18n="settings_sub">Customise Athlytics Sport</p>
  </div>

  <div class="px-6 pb-6 flex flex-col gap-4">

    <!-- Language -->
    <div class="settings-section bg-surface-container rounded-xl p-4">
      <h3 class="font-headline font-semibold text-xs uppercase tracking-wider text-primary-container mb-2" id="st-lang-title" data-i18n="st_lang_title">🌍 Language</h3>
      <p class="text-on-surface-variant text-xs font-body mb-3" id="st-lang-desc" data-i18n="st_lang_desc">Choose app language.</p>
      <div class="settings-options flex flex-wrap gap-2" id="settings-lang-options"></div>
    </div>

    <!-- Sport -->
    <div class="settings-section bg-surface-container rounded-xl p-4">
      <h3 class="font-headline font-semibold text-xs uppercase tracking-wider text-primary-container mb-2" id="st-sport-title" data-i18n="st_sport_title">🏅 Sport</h3>
      <p class="text-on-surface-variant text-xs font-body mb-3" id="st-sport-desc" data-i18n="st_sport_desc">Choose your primary sport.</p>
      <div class="settings-options flex flex-wrap gap-2" id="settings-sport-options"></div>
    </div>

    <!-- Season format -->
    <div class="settings-section bg-surface-container rounded-xl p-4">
      <h3 class="font-headline font-semibold text-xs uppercase tracking-wider text-primary-container mb-2" id="st-sf-title" data-i18n="st_sf_title">📅 Season Format</h3>
      <p class="text-on-surface-variant text-xs font-body mb-3" id="st-sf-desc" data-i18n="st_sf_desc">Calendar year (2025) or season (2025–2026).</p>
      <div class="settings-options flex flex-wrap gap-2" id="settings-season-format-options"></div>
    </div>

    <!-- Date format -->
    <div class="settings-section bg-surface-container rounded-xl p-4">
      <h3 class="font-headline font-semibold text-xs uppercase tracking-wider text-primary-container mb-2" id="st-df-title" data-i18n="st_df_title">📅 Date Format</h3>
      <p class="text-on-surface-variant text-xs font-body mb-3" id="st-df-desc" data-i18n="st_df_desc">Choose how dates are displayed.</p>
      <div class="settings-options flex flex-wrap gap-2" id="settings-date-format-options"></div>
    </div>

    <!-- Active season -->
    <div class="settings-section bg-surface-container rounded-xl p-4">
      <h3 class="font-headline font-semibold text-xs uppercase tracking-wider text-primary-container mb-2" id="st-as-title" data-i18n="st_as_title">⭐ Active Season</h3>
      <p class="text-on-surface-variant text-xs font-body mb-3" id="st-as-desc" data-i18n="st_as_desc">Default season in Log and Stats.</p>
      <div class="settings-options flex flex-wrap gap-2 mb-3" id="settings-active-season-options"></div>
      <div class="flex gap-2">
        <input id="settings-new-season" type="text"
               class="settings-add-season-input flex-1 bg-surface-container-low border border-outline-variant/40 rounded-lg px-3 py-2 text-on-surface font-body text-sm outline-none focus:border-primary-container placeholder:text-on-surface-variant"
               placeholder="Add season (e.g. 2027)">
        <button data-action="addSeason" class="settings-add-season-btn shrink-0 px-3 py-2 bg-primary-container text-on-primary font-headline font-semibold text-xs rounded-lg" id="settings-add-season-btn" data-i18n="btn_add_season">+ Add</button>
      </div>
    </div>

    <!-- Self-assessment toggle -->
    <div class="settings-section bg-surface-container rounded-xl p-4">
      <div class="flex items-center justify-between mb-2">
        <h3 class="font-headline font-semibold text-xs uppercase tracking-wider text-primary-container" id="st-assess-title-text" data-i18n="st_assess_title">⭐ Self-assessment</h3>
        <span class="export-premium-badge text-[10px] font-headline font-bold px-2 py-0.5 rounded-full bg-tertiary-fixed/10 text-tertiary-fixed border border-tertiary-fixed/30">⭐ Premium</span>
      </div>
      <p class="text-on-surface-variant text-xs font-body mb-3" id="st-assess-desc" data-i18n="st_assess_desc">Show self-assessment form after each match.</p>
      <div class="settings-options flex flex-wrap gap-2" id="settings-assess-options"></div>
    </div>

    <!-- Export -->
    <div class="export-section bg-surface-container rounded-xl p-4">
      <div class="flex items-center justify-between mb-1">
        <h3 class="export-title font-headline font-semibold text-sm text-on-surface" data-i18n="export_title">📤 Export Data</h3>
        <span class="text-[10px] font-headline font-bold px-2 py-0.5 rounded-full bg-tertiary-fixed/10 text-tertiary-fixed border border-tertiary-fixed/30">⭐ Premium</span>
      </div>
      <p class="export-desc text-on-surface-variant text-xs font-body mb-3" data-i18n="export_desc">Download your match history as CSV or PDF.</p>
      <div class="export-btns flex gap-2">
        <button class="export-btn flex-1 py-2.5 bg-surface-container-high border border-outline-variant/40 rounded-lg text-on-surface font-headline font-semibold text-sm" data-action="exportCSV" data-i18n="export_csv">📊 CSV</button>
        <button class="export-btn pdf-btn flex-1 py-2.5 bg-surface-container-high border border-outline-variant/40 rounded-lg text-on-surface font-headline font-semibold text-sm" data-action="exportPDF" data-i18n="export_pdf">📄 PDF</button>
      </div>
    </div>

    <!-- Share -->
    <div class="export-section bg-surface-container rounded-xl p-4">
      <div class="flex items-center justify-between mb-1">
        <h3 class="export-title font-headline font-semibold text-sm text-on-surface" id="st-share-title" data-i18n="st_share_title">🔗 Share Stats</h3>
        <span class="text-[10px] font-headline font-bold px-2 py-0.5 rounded-full bg-tertiary-fixed/10 text-tertiary-fixed border border-tertiary-fixed/30">⭐ Premium</span>
      </div>
      <p class="export-desc text-on-surface-variant text-xs font-body mb-3" id="st-share-desc" data-i18n="st_share_desc">Share your stats with others.</p>
      <button class="export-btn w-full py-2.5 bg-surface-container-high border border-outline-variant/40 rounded-lg text-on-surface font-headline font-semibold text-sm" data-action="openSharePanel" id="share-manage-btn" data-i18n="share_manage">Manage share links</button>
    </div>

    <!-- Danger zone -->
    <div class="danger-zone bg-surface-container rounded-xl p-4" id="st-danger-zone" hidden>
      <h3 class="export-title font-headline font-semibold text-sm text-error mb-3" id="st-danger-title">Danger Zone</h3>

      <div class="danger-item mb-3">
        <button type="button" class="danger-btn danger-btn--outline w-full py-2.5 border border-error/40 text-error font-headline font-semibold text-sm rounded-lg" data-action="toggleDangerPanel" data-type="matches" id="danger-btn-matches">Delete match history</button>
        <div class="danger-panel mt-3" id="danger-panel-matches" hidden>
          <p class="danger-warn text-on-surface-variant text-xs font-body mb-3" id="danger-warn-matches">This will permanently delete all your match data.</p>
          <input type="text" class="danger-input w-full bg-surface-container-low border border-error/40 rounded-lg px-3 py-2 text-on-surface font-body text-sm outline-none mb-3 placeholder:text-on-surface-variant/60"
                 id="danger-input-matches" data-action="dangerInput" data-danger-type="matches" placeholder='type "delete matches" to confirm' autocomplete="off" aria-label="Confirmation phrase">
          <div class="danger-panel-actions flex gap-2">
            <button type="button" class="danger-confirm-btn flex-1 py-2 bg-error text-[#690005] font-headline font-bold text-sm rounded-lg disabled:opacity-40" id="danger-confirm-matches" data-action="confirmDeleteMatches" disabled>Confirm</button>
            <button type="button" class="danger-cancel-link flex-1 py-2 text-on-surface-variant text-sm font-headline" data-action="toggleDangerPanel" data-type="matches" id="danger-cancel-matches">Cancel</button>
          </div>
        </div>
      </div>

      <div class="danger-item">
        <button type="button" class="danger-btn danger-btn--solid w-full py-2.5 bg-error text-[#690005] font-headline font-bold text-sm rounded-lg" data-action="toggleDangerPanel" data-type="account" id="danger-btn-account">Delete account</button>
        <div class="danger-panel mt-3" id="danger-panel-account" hidden>
          <p class="danger-warn text-on-surface-variant text-xs font-body mb-3" id="danger-warn-account">This will permanently delete all your data and account.</p>
          <input type="text" class="danger-input w-full bg-surface-container-low border border-error/40 rounded-lg px-3 py-2 text-on-surface font-body text-sm outline-none mb-3 placeholder:text-on-surface-variant/60"
                 id="danger-input-account" data-action="dangerInput" data-danger-type="account" placeholder='type "delete my account" to confirm' autocomplete="off" aria-label="Confirmation phrase">
          <div class="danger-panel-actions flex gap-2">
            <button type="button" class="danger-confirm-btn flex-1 py-2 bg-error text-[#690005] font-headline font-bold text-sm rounded-lg disabled:opacity-40" id="danger-confirm-account" data-action="confirmDeleteAccount" disabled>Confirm</button>
            <button type="button" class="danger-cancel-link flex-1 py-2 text-on-surface-variant text-sm font-headline" data-action="toggleDangerPanel" data-type="account" id="danger-cancel-account">Cancel</button>
          </div>
        </div>
      </div>
    </div>

    <button class="settings-logout-btn w-full py-3 border border-outline-variant/40 rounded-lg text-on-surface-variant font-headline font-semibold text-sm hover:border-error hover:text-error transition-colors" data-action="logout" data-i18n="auth_logout">Log out</button>
    <p class="text-center text-[10px] text-on-surface-variant/50 mt-2">Athlytics Sport v0.1 · football</p>
  </div>
</section>
```

- [ ] **Verify in browser** — Settings tab renders all sections. Danger zone hidden by default (JS shows it when authenticated).

- [ ] **Commit**

```bash
git add app.html
git commit -m "feat: restyle settings tab with Kinetic Velocity design"
```

---

## Task 10: Modals and overlays

**Files:** Modify `app.html` — edit modal, assessment sheet, share panel, delete confirm dialog, toast

- [ ] **Replace delete confirm dialog** (after `</nav>`):

```html
<div class="delete-confirm-backdrop" id="delete-confirm-backdrop" data-action="cancelDeleteMatch"></div>
<div class="delete-confirm-dialog" id="delete-confirm-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-confirm-title">
  <div class="text-3xl mb-3">🗑</div>
  <div class="font-headline font-bold text-on-surface text-lg mb-1" id="delete-confirm-title">Delete match?</div>
  <div class="text-on-surface-variant text-sm font-body mb-5">Match against <strong id="delete-confirm-name" class="text-on-surface"></strong> will be permanently deleted.</div>
  <div class="delete-confirm-actions flex gap-3">
    <button class="delete-confirm-cancel flex-1 py-2.5 border border-outline-variant/40 rounded-lg text-on-surface-variant font-headline font-semibold text-sm" data-action="cancelDeleteMatch" data-i18n="btn_cancel">Cancel</button>
    <button class="delete-confirm-ok flex-1 py-2.5 bg-error text-[#690005] rounded-lg font-headline font-bold text-sm" data-action="confirmDeleteMatch" data-i18n="btn_delete">Delete</button>
  </div>
</div>
```

- [ ] **Replace edit modal:**

```html
<div class="modal-backdrop" id="modal-backdrop" data-action="closeModal"></div>
<div class="modal-sheet" id="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="modal-title">
  <div class="modal-handle w-9 h-1 bg-outline-variant/60 rounded-full mx-auto mt-3 mb-4"></div>
  <div class="modal-header flex items-center justify-between px-5 pb-3 border-b border-outline-variant/40">
    <div class="modal-title font-headline font-bold text-on-surface text-lg" id="modal-title" data-i18n="modal_edit_title">Edit Match</div>
    <button class="modal-close-btn w-8 h-8 flex items-center justify-center text-on-surface-variant rounded-full bg-surface-container-high text-xl leading-none" data-action="closeModal" aria-label="Close">&times;</button>
  </div>
  <div class="modal-body px-5 py-4 flex flex-col gap-4">
    <div class="modal-field">
      <label class="block text-[10px] font-headline font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5" for="modal-dato" data-i18n="label_date">Date</label>
      <input class="modal-input w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-4 py-2.5 text-on-surface font-body text-sm outline-none focus:border-primary-container" type="date" id="modal-dato">
    </div>
    <div class="modal-field">
      <label class="block text-[10px] font-headline font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5" data-i18n="label_match_type">Home / Away</label>
      <div class="toggle-row grid grid-cols-2 gap-2">
        <button class="toggle-btn flex items-center justify-center gap-2 py-2.5 border border-outline-variant/40 bg-surface-container rounded-lg text-on-surface-variant font-headline font-semibold text-sm" id="modal-btn-home" data-action="setModalMatchType" data-match-type="home"><span class="match-svg-icon match-icon-home"></span> <span data-i18n="home_match">Home</span></button>
        <button class="toggle-btn flex items-center justify-center gap-2 py-2.5 border border-outline-variant/40 bg-surface-container rounded-lg text-on-surface-variant font-headline font-semibold text-sm" id="modal-btn-away" data-action="setModalMatchType" data-match-type="away"><span class="match-svg-icon match-icon-away"></span> <span data-i18n="away_match">Away</span></button>
      </div>
    </div>
    <div class="modal-field">
      <label class="block text-[10px] font-headline font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5" for="modal-motstander" data-i18n="label_opponent">Opponent</label>
      <input class="modal-input w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-4 py-2.5 text-on-surface font-body text-sm outline-none focus:border-primary-container" type="text" id="modal-motstander" autocomplete="off">
    </div>
    <div class="modal-field">
      <label class="block text-[10px] font-headline font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5" data-i18n="label_own_team">Own team</label>
      <div class="team-selector-wrap relative">
        <div class="team-selected flex items-center justify-between bg-surface-container-low border border-outline-variant/40 rounded-lg px-4 py-2.5 cursor-pointer"
             id="modal-team-trigger" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="modal-team-dropdown" data-action="toggleModalTeamDropdown">
          <span class="team-selected-text text-on-surface-variant font-body text-sm" id="modal-own-team-text" data-i18n="placeholder_select_team">Select team...</span>
          <span class="team-chevron absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs transition-transform" id="modal-team-chevron">▼</span>
        </div>
        <div class="team-dropdown absolute top-full left-0 right-0 mt-1 bg-surface-container-low border border-primary-container rounded-lg z-50 shadow-lg overflow-hidden" id="modal-team-dropdown" role="listbox">
          <div id="modal-team-options-list"></div>
        </div>
      </div>
      <input type="hidden" id="modal-own-team">
    </div>
    <div class="modal-field">
      <label class="block text-[10px] font-headline font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5" data-i18n="label_tournament">Tournament</label>
      <div class="team-selector-wrap relative">
        <div class="team-selected flex items-center justify-between bg-surface-container-low border border-outline-variant/40 rounded-lg px-4 py-2.5 cursor-pointer"
             id="modal-tournament-trigger" role="combobox" aria-haspopup="listbox" aria-expanded="false" aria-controls="modal-tournament-dropdown" data-action="toggleModalTournamentDropdown">
          <span class="team-selected-text text-on-surface-variant font-body text-sm" id="modal-tournament-text" data-i18n="placeholder_select_tournament">Select tournament...</span>
          <span class="team-chevron absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-xs transition-transform" id="modal-tournament-chevron">▼</span>
        </div>
        <div class="team-dropdown absolute top-full left-0 right-0 mt-1 bg-surface-container-low border border-primary-container rounded-lg z-50 shadow-lg overflow-hidden" id="modal-tournament-dropdown" role="listbox">
          <div id="modal-tournament-options-list"></div>
        </div>
      </div>
      <input type="hidden" id="modal-tournament">
    </div>
    <div class="modal-field">
      <label class="block text-[10px] font-headline font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5" data-i18n="label_score">Score</label>
      <div class="modal-score-row flex items-center gap-3 justify-center">
        <div class="number-control flex items-center bg-surface-container-high border border-outline-variant/40 rounded-lg overflow-hidden">
          <button class="num-btn w-10 h-10 text-primary-container text-xl flex items-center justify-center" data-action="modalAdjust" data-type="home" data-delta="-1">−</button>
          <span class="num-display w-10 text-center font-headline font-bold text-2xl text-on-surface" id="modal-home" aria-live="polite">0</span>
          <button class="num-btn w-10 h-10 text-primary-container text-xl flex items-center justify-center" data-action="modalAdjust" data-type="home" data-delta="1">+</button>
        </div>
        <span class="font-headline font-bold text-2xl text-on-surface-variant">–</span>
        <div class="number-control flex items-center bg-surface-container-high border border-outline-variant/40 rounded-lg overflow-hidden">
          <button class="num-btn w-10 h-10 text-primary-container text-xl flex items-center justify-center" data-action="modalAdjust" data-type="away" data-delta="-1">−</button>
          <span class="num-display w-10 text-center font-headline font-bold text-2xl text-on-surface" id="modal-away" aria-live="polite">0</span>
          <button class="num-btn w-10 h-10 text-primary-container text-xl flex items-center justify-center" data-action="modalAdjust" data-type="away" data-delta="1">+</button>
        </div>
      </div>
    </div>
    <div class="modal-field">
      <div class="modal-stats-grid grid grid-cols-2 gap-3">
        <div>
          <label class="block text-[10px] font-headline font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5" data-i18n="label_goals">Goals</label>
          <div class="number-control flex items-center bg-surface-container border border-outline-variant/40 rounded-lg overflow-hidden">
            <button class="num-btn w-10 h-10 text-primary-container text-xl flex items-center justify-center" data-action="modalAdjust" data-type="goals" data-delta="-1">−</button>
            <span class="num-display flex-1 text-center font-headline font-bold text-xl text-on-surface" id="modal-goals" aria-live="polite">0</span>
            <button class="num-btn w-10 h-10 text-primary-container text-xl flex items-center justify-center" data-action="modalAdjust" data-type="goals" data-delta="1">+</button>
          </div>
        </div>
        <div>
          <label class="block text-[10px] font-headline font-semibold uppercase tracking-wider text-on-surface-variant mb-1.5" data-i18n="label_assist">Assists</label>
          <div class="number-control flex items-center bg-surface-container border border-outline-variant/40 rounded-lg overflow-hidden">
            <button class="num-btn w-10 h-10 text-primary-container text-xl flex items-center justify-center" data-action="modalAdjust" data-type="assist" data-delta="-1">−</button>
            <span class="num-display flex-1 text-center font-headline font-bold text-xl text-on-surface" id="modal-assist" aria-live="polite">0</span>
            <button class="num-btn w-10 h-10 text-primary-container text-xl flex items-center justify-center" data-action="modalAdjust" data-type="assist" data-delta="1">+</button>
          </div>
        </div>
      </div>
    </div>
  </div>
  <div class="modal-divider h-px bg-outline-variant/40 mx-5"></div>
  <div id="modal-assessment-body"></div>
  <div class="modal-actions flex gap-3 px-5 py-4">
    <button class="modal-del-btn flex-1 py-2.5 border border-error/40 text-error font-headline font-semibold text-sm rounded-lg" data-action="deleteMatch" data-i18n="btn_delete_match">🗑 Delete</button>
    <button class="modal-save-btn flex-2 py-2.5 bg-primary-container text-on-primary font-headline font-bold text-sm rounded-lg px-6" data-action="saveEditedMatch" data-i18n="btn_save_changes">Save Changes</button>
  </div>
</div>
```

- [ ] **Replace assessment sheet:**

```html
<div class="modal-backdrop" id="assessment-backdrop" data-action="closeAssessmentSheet"></div>
<div class="modal-sheet" id="assessment-sheet" role="dialog" aria-modal="true" aria-labelledby="assess-title">
  <div class="modal-handle w-9 h-1 bg-outline-variant/60 rounded-full mx-auto mt-3 mb-4"></div>
  <div class="modal-header flex items-center justify-between px-5 pb-3 border-b border-outline-variant/40">
    <div class="modal-title font-headline font-bold text-on-surface text-lg" id="assess-title"></div>
    <button class="modal-close-btn w-8 h-8 flex items-center justify-center text-on-surface-variant rounded-full bg-surface-container-high text-xl leading-none" data-action="closeAssessmentSheet">&times;</button>
  </div>
  <div class="assessment-body px-5 py-4" id="assessment-body"></div>
  <div class="modal-actions flex gap-3 px-5 py-4">
    <button class="modal-del-btn flex-1 py-2.5 border border-outline-variant/40 text-on-surface-variant font-headline font-semibold text-sm rounded-lg" data-action="closeAssessmentSheet" id="assess-skip-btn"></button>
    <button class="modal-save-btn flex-1 py-2.5 bg-primary-container text-on-primary font-headline font-bold text-sm rounded-lg" data-action="saveAssessment" id="assess-save-btn"></button>
  </div>
</div>
```

- [ ] **Replace share panel:**

```html
<div id="share-panel-backdrop" class="modal-backdrop"></div>
<div id="share-panel" class="modal-sheet" role="dialog" aria-modal="true" aria-label="Share stats">
  <div class="modal-handle w-9 h-1 bg-outline-variant/60 rounded-full mx-auto mt-3 mb-4"></div>
  <div class="modal-header flex items-center justify-between px-5 pb-3 border-b border-outline-variant/40">
    <span class="modal-title font-headline font-bold text-on-surface text-lg" id="share-panel-title" data-i18n="share_title">Share Stats</span>
    <button class="modal-close-btn w-8 h-8 flex items-center justify-center text-on-surface-variant rounded-full bg-surface-container-high text-xl leading-none" data-action="closeSharePanel" aria-label="Close">×</button>
  </div>
  <div class="px-5 pb-8 overflow-y-auto">
    <div class="share-create-form flex flex-col gap-3 py-4">
      <input type="text" id="share-new-label"
             class="settings-input w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-4 py-2.5 text-on-surface font-body text-sm outline-none focus:border-primary-container placeholder:text-on-surface-variant"
             maxlength="40" placeholder="e.g. Coach Hansen" aria-label="Label">
      <select id="share-new-expiry"
              class="settings-select w-full bg-surface-container-low border border-outline-variant/40 rounded-lg px-4 py-2.5 text-on-surface font-body text-sm outline-none focus:border-primary-container">
        <option value="30">30 days</option>
        <option value="90" selected>90 days</option>
        <option value="season">End of active season</option>
        <option value="permanent">Permanent</option>
      </select>
      <button class="modal-save-btn w-full py-3 bg-primary-container text-on-primary font-headline font-bold text-sm rounded-lg" data-action="createShareToken" data-i18n="share_create">Create link</button>
    </div>
    <div id="share-panel-list"></div>
  </div>
</div>
```

- [ ] **Replace toast:**

```html
<div class="toast" id="toast" aria-live="polite" aria-atomic="true"></div>
```

(Already styled in `style.css` — no Tailwind classes needed on the element itself since JS adds `.show`, `.success`, `.error`.)

- [ ] **Verify in browser** — open a match from stats list, edit modal slides up with new design. Close button works. Delete confirm dialog opens.

- [ ] **Commit**

```bash
git add app.html
git commit -m "feat: restyle modals, assessment sheet, share panel, toast"
```

---

## Task 11: Update chart colors in `stats-analyse.js`

**Files:** Modify `js/stats-analyse.js`

- [ ] **Search for all hardcoded hex colors** and replace:

```bash
grep -n "#a8e063\|rgba(168,224,99\|#f0c050\|rgba(240,192,80\|#e05555\|rgba(224,85,85" js/stats-analyse.js
```

- [ ] **Replace each occurrence:**

| Find | Replace |
|---|---|
| `#a8e063` | `#00f2ff` |
| `rgba(168,224,99,` | `rgba(0,242,255,` |
| `rgba(168, 224, 99,` | `rgba(0, 242, 255,` |
| `#f0c050` | `#ffe173` |
| `rgba(240,192,80,` | `rgba(255,225,115,` |
| `#e05555` | `#ffb4ab` |
| `rgba(224,85,85,` | `rgba(255,180,171,` |

- [ ] **Also update `initChartDefaults()`** — find where `Chart.defaults` grid/tick colors are set and update to `#3a494b` (outline-variant) and `#b9cacb` (on-surface-variant):

```js
Chart.defaults.color = '#b9cacb';
Chart.defaults.borderColor = 'rgba(58,73,75,0.4)';
```

- [ ] **Verify in browser** — navigate to Stats → Analyse. Charts render with cyan lines/bars, gold secondary, proper dark grid.

- [ ] **Commit**

```bash
git add js/stats-analyse.js
git commit -m "feat: update chart colors to Kinetic Velocity palette"
```

---

## Task 12: JS-rendered HTML components

Several JS modules render HTML strings with hardcoded CSS class names or inline styles using the old green colors. These need targeted updates.

**Files:** Check and update `js/stats-overview.js`, `js/stats-search.js`, `js/profile.js`, `js/settings-render.js`

- [ ] **Find all hardcoded color references in JS-rendered HTML:**

```bash
grep -n "var(--lime)\|var(--grass)\|var(--card)\|var(--gold)\|#a8e063\|#1a3a1f\|#162b1a\|#f0c050\|t-badge\|stat-card\|stat-num\|wdl-bar\|match-row" js/stats-overview.js js/stats-search.js js/profile.js js/settings-render.js | head -60
```

- [ ] **In `js/stats-overview.js`** — find `renderStats()` and update any inline CSS color values. The stat-grid, WDL bar, and match-row cards use CSS classes (`stat-card`, `t-badge`, `wdl-bar`) which were in `style.css`. Add these to `style.css`:

```css
/* ── JS-RENDERED COMPONENTS (stats-overview, stats-search, profile, settings-render) ── */
/* Stat grid */
.stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 12px; }
.stat-card { background: #1c2026; border-radius: 8px; padding: 14px 10px; text-align: center; border: 1px solid rgba(58,73,75,0.4); }
.stat-num { font-family: 'Space Grotesk', sans-serif; font-size: 32px; font-weight: 700; line-height: 1; }
.stat-lbl { font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #b9cacb; margin-top: 4px; display: block; }
.stat-num.cyan  { color: #00f2ff; }
.stat-num.gold  { color: #ffe173; }
.stat-num.white { color: #dfe2eb; }
.stat-num.red   { color: #ffb4ab; }

/* WDL bar */
.wdl-bar { display: flex; gap: 2px; height: 6px; border-radius: 3px; overflow: hidden; margin-bottom: 6px; }
.wdl-bar-w { background: #00f2ff; }
.wdl-bar-d { background: #ffe173; }
.wdl-bar-l { background: #ffb4ab; }
.wdl-labels { display: flex; gap: 2px; font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
.wdl-label-w { color: #00f2ff; }
.wdl-label-d { color: #ffe173; }
.wdl-label-l { color: #ffb4ab; }

/* Match list rows */
.match-row { background: #1c2026; border: 1px solid rgba(58,73,75,0.4); border-radius: 8px; padding: 10px 12px; margin-bottom: 6px; display: flex; align-items: center; gap: 10px; cursor: pointer; transition: border-color 0.15s; }
.match-row:hover { border-color: rgba(0,242,255,0.3); }
.match-chip { width: 28px; height: 28px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700; flex-shrink: 0; }
.match-chip.win  { background: rgba(0,242,255,0.15); color: #00f2ff; }
.match-chip.draw { background: rgba(255,225,115,0.15); color: #ffe173; }
.match-chip.loss { background: rgba(255,180,171,0.15); color: #ffb4ab; }

/* T-badges (match list inline) */
.t-badge { font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700; padding: 2px 0; border-radius: 4px; letter-spacing: 0.04em; width: 40px; text-align: center; display: inline-block; }
.t-badge.win   { background: rgba(0,242,255,0.1); color: #00f2ff; }
.t-badge.draw  { background: rgba(255,225,115,0.1); color: #ffe173; }
.t-badge.loss  { background: rgba(255,180,171,0.1); color: #ffb4ab; }
.t-badge.goal  { background: rgba(0,242,255,0.1); color: #00f2ff; }
.t-badge.assist{ background: rgba(0,242,255,0.06); color: #b9cacb; }

/* Season/team filter pills (rendered by JS into #season-selector etc.) */
.season-pill { font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 0.04em; padding: 5px 14px; border-radius: 9999px; border: 1.5px solid rgba(58,73,75,0.5); background: transparent; color: #b9cacb; cursor: pointer; transition: all 0.15s; white-space: nowrap; }
.season-pill:hover { border-color: #00f2ff; color: #00f2ff; }
.season-pill.active { background: #00f2ff; color: #00363a; border-color: #00f2ff; }

/* Settings pills (rendered by settings-render.js) */
.settings-pill { font-family: 'Space Grotesk', sans-serif; font-size: 13px; font-weight: 600; letter-spacing: 0.04em; padding: 6px 16px; border-radius: 9999px; border: 1.5px solid rgba(58,73,75,0.5); background: transparent; color: #b9cacb; cursor: pointer; transition: all 0.15s; }
.settings-pill:hover { border-color: #00f2ff; color: #00f2ff; }
.settings-pill.active { background: #00f2ff; color: #00363a; border-color: #00f2ff; }

/* Profile team/tournament list items (rendered by profile.js) */
.team-item { display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: #181c22; border-radius: 8px; margin-bottom: 6px; font-family: 'Inter', sans-serif; font-size: 14px; color: #dfe2eb; }
.team-item-remove { background: none; border: none; color: #b9cacb; cursor: pointer; font-size: 16px; padding: 2px 4px; border-radius: 4px; transition: color 0.15s; }
.team-item-remove:hover { color: #ffb4ab; }
.team-item.favorite { border-left: 2px solid #00f2ff; }

/* Form streak (stats-analyse.js) */
.form-streak { display: flex; gap: 4px; flex-wrap: wrap; }
.streak-dot { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Space Grotesk', sans-serif; font-size: 10px; font-weight: 700; }
.streak-dot.w { background: rgba(0,242,255,0.2); color: #00f2ff; }
.streak-dot.d { background: rgba(255,225,115,0.2); color: #ffe173; }
.streak-dot.l { background: rgba(255,180,171,0.2); color: #ffb4ab; }

/* Pro-gated overlay */
.pro-gate { position: relative; overflow: hidden; }
.pro-gate-blur { filter: blur(4px); pointer-events: none; user-select: none; }
.pro-gate-overlay { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: rgba(16,20,26,0.7); }
.pro-badge { font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 9999px; background: rgba(255,225,115,0.1); color: #ffe173; border: 1px solid rgba(255,225,115,0.3); letter-spacing: 0.08em; }

/* Loading */
.loading { display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 48px 0; color: #b9cacb; font-family: 'Space Grotesk', sans-serif; font-size: 13px; }

/* Home/away split cards */
.split-card { background: #1c2026; border-radius: 8px; padding: 14px; border: 1px solid rgba(58,73,75,0.4); }
.split-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 12px; }

/* Pagination */
.pagination { display: flex; gap: 8px; justify-content: center; margin-top: 12px; }
.page-btn { font-family: 'Space Grotesk', sans-serif; font-size: 12px; font-weight: 600; padding: 6px 12px; border-radius: 8px; border: 1px solid rgba(58,73,75,0.4); background: #1c2026; color: #b9cacb; cursor: pointer; transition: all 0.15s; }
.page-btn.active, .page-btn:hover { background: rgba(0,242,255,0.1); border-color: #00f2ff; color: #00f2ff; }

/* Opponent search input (stats-overview) */
.opponent-search { width: 100%; background: #1c2026; border: 1px solid rgba(58,73,75,0.4); border-radius: 8px; padding: 10px 14px; color: #dfe2eb; font-family: 'Inter', sans-serif; font-size: 14px; outline: none; margin-bottom: 8px; }
.opponent-search:focus { border-color: #00f2ff; }
.opponent-search::placeholder { color: #b9cacb; }

/* Section headers inside stat views */
.stats-section-title { font-family: 'Space Grotesk', sans-serif; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.1em; color: #b9cacb; margin-bottom: 8px; margin-top: 16px; }
```

- [ ] **Verify in browser** — go to Stats, load some matches. Stat grid renders with cyan numbers. WDL bar shows correct colors. Match list items render with new styling.

- [ ] **Commit**

```bash
git add style.css js/stats-analyse.js
git commit -m "feat: add JS-rendered component styles for Kinetic Velocity"
```

---

## Task 13: Rewrite `landing.html`

**Files:** Full rewrite of `landing.html`

- [ ] **Replace entire `landing.html`:**

```html
<!DOCTYPE html>
<html lang="no" class="dark">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Athlytics Sport — Log. Analyse. Win.</title>
<meta name="description" content="Track football matches, analyse performance, and improve your game with Athlytics Sport.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700;900&family=Inter:wght@400;500&display=swap" rel="stylesheet">
<script>
  tailwind.config = {
    darkMode: "class",
    theme: {
      extend: {
        colors: {
          "surface":                   "#10141a",
          "surface-container-lowest":  "#0a0e14",
          "surface-container-low":     "#181c22",
          "surface-container":         "#1c2026",
          "surface-container-high":    "#262a31",
          "surface-container-highest": "#31353c",
          "primary-container":         "#00f2ff",
          "primary-fixed-dim":         "#00dbe7",
          "on-primary":                "#00363a",
          "on-surface":                "#dfe2eb",
          "on-surface-variant":        "#b9cacb",
          "outline-variant":           "#3a494b",
          "tertiary-fixed":            "#ffe173",
          "error":                     "#ffb4ab",
        },
        fontFamily: {
          "headline": ["Space Grotesk", "sans-serif"],
          "body":     ["Inter", "sans-serif"],
        },
      },
    },
  }
</script>
<script src="https://cdn.tailwindcss.com"></script>
<style>
  body {
    background-color: #10141a;
    background-image: radial-gradient(#1c2026 1px, transparent 1px);
    background-size: 40px 40px;
  }
  .glass-nav {
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    background: rgba(49,53,60,0.6);
  }
  @keyframes fadeUp { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
  .fade-up { animation: fadeUp 0.6s ease forwards; }
  .hero-glow {
    background: radial-gradient(ellipse 60% 40% at 50% 60%, rgba(0,242,255,0.08) 0%, transparent 70%);
    pointer-events: none;
  }
</style>
</head>
<body class="min-h-screen text-on-surface font-body">

  <!-- ── NAV ── -->
  <nav class="glass-nav fixed top-0 inset-x-0 z-50 border-b border-outline-variant/30">
    <div class="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 bg-primary-container rounded-sm"></span>
        <span class="font-headline font-bold text-xs tracking-[0.2em] text-on-surface uppercase">Athlytics</span>
      </div>
      <div class="flex items-center gap-3">
        <a href="#pricing" class="text-on-surface-variant text-sm hover:text-on-surface transition-colors hidden sm:block">Pricing</a>
        <a href="/app" class="text-on-surface-variant text-sm hover:text-on-surface transition-colors hidden sm:block" id="nav-login-btn">Log in</a>
        <a href="/app" class="px-4 py-2 bg-primary-container text-on-primary font-headline font-semibold text-sm rounded-lg hover:bg-primary-fixed-dim transition-colors">Get started</a>
      </div>
    </div>
  </nav>

  <!-- ── HERO ── -->
  <section class="relative pt-32 pb-20 px-6 overflow-hidden">
    <div class="hero-glow absolute inset-0"></div>
    <div class="max-w-2xl mx-auto text-center relative">
      <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-container/10 border border-primary-container/20 text-primary-container text-xs font-headline font-semibold mb-6 uppercase tracking-wider">
        <span class="w-1.5 h-1.5 bg-primary-container rounded-full"></span>
        Football performance tracking
      </div>
      <h1 class="font-headline font-bold text-5xl sm:text-7xl text-on-surface leading-[1.05] mb-6 fade-up">
        LOG.<br><span class="text-primary-container">ANALYSE.</span><br>WIN.
      </h1>
      <p class="text-on-surface-variant text-lg sm:text-xl font-body max-w-lg mx-auto mb-8">
        Track every match. Analyse your form. Understand your performance — for free.
      </p>
      <div class="flex flex-col sm:flex-row gap-3 justify-center mb-12">
        <a href="/app" class="px-8 py-3.5 bg-primary-container text-on-primary font-headline font-bold text-base rounded-lg hover:bg-primary-fixed-dim transition-colors">Start for free →</a>
        <a href="#features" class="px-8 py-3.5 border border-outline-variant/60 text-on-surface font-headline font-semibold text-base rounded-lg hover:border-primary-container/60 transition-colors">See features</a>
      </div>
      <!-- Social proof -->
      <div class="flex justify-center gap-8 text-center">
        <div>
          <div class="font-headline font-bold text-3xl text-primary-container">500+</div>
          <div class="text-on-surface-variant text-xs uppercase tracking-wider mt-1">Players</div>
        </div>
        <div class="w-px bg-outline-variant/40"></div>
        <div>
          <div class="font-headline font-bold text-3xl text-on-surface">1,200+</div>
          <div class="text-on-surface-variant text-xs uppercase tracking-wider mt-1">Matches logged</div>
        </div>
        <div class="w-px bg-outline-variant/40"></div>
        <div>
          <div class="font-headline font-bold text-3xl text-on-surface">98.2%</div>
          <div class="text-on-surface-variant text-xs uppercase tracking-wider mt-1">Satisfaction</div>
        </div>
      </div>
    </div>
  </section>

  <!-- ── FEATURES ── -->
  <section id="features" class="py-20 px-6">
    <div class="max-w-5xl mx-auto">
      <p class="text-center text-[10px] font-headline font-semibold uppercase tracking-[0.2em] text-primary-container mb-2">Features</p>
      <h2 class="text-center font-headline font-bold text-3xl sm:text-4xl text-on-surface mb-12">Elite capabilities</h2>
      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">

        <div class="bg-surface-container rounded-xl p-6 border border-outline-variant/40">
          <div class="text-2xl mb-3">📊</div>
          <h3 class="font-headline font-semibold text-on-surface text-lg mb-2">Match Logging</h3>
          <p class="text-on-surface-variant text-sm font-body leading-relaxed">Log every match in seconds — score, goals, assists, and match type. Date auto-fills to today.</p>
        </div>

        <div class="bg-surface-container rounded-xl p-6 border border-outline-variant/40">
          <div class="text-2xl mb-3">📈</div>
          <h3 class="font-headline font-semibold text-on-surface text-lg mb-2">Performance Analysis</h3>
          <p class="text-on-surface-variant text-sm font-body leading-relaxed">Win/draw/loss trends, form streaks, goals per game, home vs away breakdowns. Know your game.</p>
        </div>

        <div class="bg-surface-container rounded-xl p-6 border border-outline-variant/40">
          <div class="text-2xl mb-3">⭐</div>
          <h3 class="font-headline font-semibold text-on-surface text-lg mb-2">Self Assessment</h3>
          <p class="text-on-surface-variant text-sm font-body leading-relaxed">Rate your effort, focus, technique, and team play after each match. Track your growth over time.</p>
        </div>

        <div class="bg-surface-container rounded-xl p-6 border border-outline-variant/40">
          <div class="text-2xl mb-3">🏆</div>
          <h3 class="font-headline font-semibold text-on-surface text-lg mb-2">Multi-Season</h3>
          <p class="text-on-surface-variant text-sm font-body leading-relaxed">Organise data across seasons and teams. Filter stats by team, tournament, or season in seconds.</p>
        </div>

        <div class="bg-surface-container rounded-xl p-6 border border-outline-variant/40">
          <div class="text-2xl mb-3">📤</div>
          <h3 class="font-headline font-semibold text-on-surface text-lg mb-2 flex items-center gap-2">Export <span class="text-[10px] px-2 py-0.5 rounded-full bg-tertiary-fixed/10 text-tertiary-fixed border border-tertiary-fixed/30 font-semibold">Pro</span></h3>
          <p class="text-on-surface-variant text-sm font-body leading-relaxed">Download full match history as CSV or a formatted PDF report. Share with coaches or scouts.</p>
        </div>

        <div class="bg-surface-container rounded-xl p-6 border border-outline-variant/40">
          <div class="text-2xl mb-3">🔗</div>
          <h3 class="font-headline font-semibold text-on-surface text-lg mb-2 flex items-center gap-2">Share Stats <span class="text-[10px] px-2 py-0.5 rounded-full bg-tertiary-fixed/10 text-tertiary-fixed border border-tertiary-fixed/30 font-semibold">Pro</span></h3>
          <p class="text-on-surface-variant text-sm font-body leading-relaxed">Generate a shareable link for coaches, parents, or scouts. Control who sees your data.</p>
        </div>

      </div>
    </div>
  </section>

  <!-- ── PRICING ── -->
  <section id="pricing" class="py-20 px-6 bg-surface-container-lowest/50">
    <div class="max-w-3xl mx-auto">
      <p class="text-center text-[10px] font-headline font-semibold uppercase tracking-[0.2em] text-primary-container mb-2">Pricing</p>
      <h2 class="text-center font-headline font-bold text-3xl sm:text-4xl text-on-surface mb-12">Select your rank</h2>
      <div class="grid sm:grid-cols-3 gap-4">

        <!-- Free -->
        <div class="bg-surface-container rounded-xl p-6 border border-outline-variant/40 flex flex-col">
          <div class="font-headline font-bold text-xs uppercase tracking-wider text-on-surface-variant mb-3">Free</div>
          <div class="font-headline font-bold text-4xl text-on-surface mb-1">$0</div>
          <div class="text-on-surface-variant text-xs font-body mb-5">Forever free</div>
          <ul class="text-on-surface-variant text-sm font-body space-y-2 mb-6 flex-1">
            <li class="flex items-center gap-2"><span class="text-primary-container">✓</span> 1 team, 1 season</li>
            <li class="flex items-center gap-2"><span class="text-primary-container">✓</span> Full match logging</li>
            <li class="flex items-center gap-2"><span class="text-primary-container">✓</span> Basic stats overview</li>
            <li class="flex items-center gap-2"><span class="text-primary-container">✓</span> Form streak</li>
          </ul>
          <a href="/app" class="block text-center py-2.5 border border-outline-variant/60 rounded-lg text-on-surface font-headline font-semibold text-sm hover:border-primary-container/60 transition-colors">Get started</a>
        </div>

        <!-- Pro -->
        <div class="bg-surface-container rounded-xl p-6 border-2 border-primary-container flex flex-col relative">
          <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary-container text-on-primary font-headline font-bold text-xs rounded-full uppercase tracking-wider">Most popular</div>
          <div class="font-headline font-bold text-xs uppercase tracking-wider text-primary-container mb-3">Pro</div>
          <div class="font-headline font-bold text-4xl text-on-surface mb-1">$29</div>
          <div class="text-on-surface-variant text-xs font-body mb-5">per year</div>
          <ul class="text-on-surface-variant text-sm font-body space-y-2 mb-6 flex-1">
            <li class="flex items-center gap-2"><span class="text-primary-container">✓</span> Everything in Free</li>
            <li class="flex items-center gap-2"><span class="text-primary-container">✓</span> Unlimited teams + seasons</li>
            <li class="flex items-center gap-2"><span class="text-primary-container">✓</span> Advanced analytics</li>
            <li class="flex items-center gap-2"><span class="text-primary-container">✓</span> CSV + PDF export</li>
            <li class="flex items-center gap-2"><span class="text-primary-container">✓</span> Share links</li>
            <li class="flex items-center gap-2"><span class="text-primary-container">✓</span> Self-assessment</li>
          </ul>
          <a href="/app" class="block text-center py-2.5 bg-primary-container text-on-primary rounded-lg font-headline font-bold text-sm hover:bg-primary-fixed-dim transition-colors">Start Pro →</a>
        </div>

        <!-- Club -->
        <div class="bg-surface-container rounded-xl p-6 border border-outline-variant/40 flex flex-col">
          <div class="font-headline font-bold text-xs uppercase tracking-wider text-on-surface-variant mb-3">Club</div>
          <div class="font-headline font-bold text-4xl text-on-surface mb-1">$79</div>
          <div class="text-on-surface-variant text-xs font-body mb-5">per year</div>
          <ul class="text-on-surface-variant text-sm font-body space-y-2 mb-6 flex-1">
            <li class="flex items-center gap-2"><span class="text-primary-container">✓</span> Everything in Pro</li>
            <li class="flex items-center gap-2"><span class="text-primary-container">✓</span> Multiple players</li>
            <li class="flex items-center gap-2"><span class="text-primary-container">✓</span> Coach dashboard</li>
            <li class="flex items-center gap-2"><span class="text-primary-container">✓</span> Team admin</li>
          </ul>
          <a href="/app" class="block text-center py-2.5 border border-outline-variant/60 rounded-lg text-on-surface font-headline font-semibold text-sm hover:border-primary-container/60 transition-colors">Contact us</a>
        </div>

      </div>
    </div>
  </section>

  <!-- ── CTA ── -->
  <section class="py-24 px-6 text-center">
    <div class="max-w-xl mx-auto">
      <h2 class="font-headline font-bold text-4xl sm:text-5xl text-on-surface mb-4">Ready to dominate<br><span class="text-primary-container">the pitch?</span></h2>
      <p class="text-on-surface-variant text-lg font-body mb-8">Join hundreds of players tracking their performance with Athlytics Sport.</p>
      <a href="/app" class="inline-block px-10 py-4 bg-primary-container text-on-primary font-headline font-bold text-base rounded-lg hover:bg-primary-fixed-dim transition-colors">Start for free →</a>
    </div>
  </section>

  <!-- ── FOOTER ── -->
  <footer class="border-t border-outline-variant/30 py-8 px-6">
    <div class="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-2">
        <span class="w-1.5 h-1.5 bg-primary-container rounded-sm"></span>
        <span class="font-headline font-bold text-xs tracking-[0.2em] text-on-surface-variant uppercase">Athlytics Sport</span>
      </div>
      <p class="text-on-surface-variant text-xs font-body">© 2026 Athlytics Sport. Track. Analyse. Win.</p>
      <div class="flex gap-4">
        <a href="/app" class="text-on-surface-variant text-xs hover:text-on-surface transition-colors">App</a>
        <a href="#pricing" class="text-on-surface-variant text-xs hover:text-on-surface transition-colors">Pricing</a>
      </div>
    </div>
  </footer>

  <script>
    // Redirect to /app if already logged in
    if (sessionStorage.getItem('athlytics_session') || localStorage.getItem('athlytics_session')) {
      document.getElementById('nav-login-btn').textContent = 'Open app';
    }
  </script>
</body>
</html>
```

- [ ] **Verify in browser** — open `landing.html` directly. Glassmorphic nav, cyan hero text, grid texture visible. Pricing cards render. Links go to `/app`.

- [ ] **Commit**

```bash
git add landing.html
git commit -m "feat: rewrite landing.html with Kinetic Velocity cyan theme"
```

---

## Task 14: Final verification

**Files:** Read-only verification pass

- [ ] **Open `app.html` and check each tab:**
  - Log: form renders, +/− buttons work, submit logs match, result shows cyan/gold/red
  - Stats: season pills render, match list loads, clicking a match opens edit modal
  - Profile: avatar shows, save profile works
  - Settings: pills render, danger zone hidden until auth

- [ ] **Check console for errors** — open DevTools, reload. Zero JS errors expected.

- [ ] **Check global nav** — lang picker opens, avatar button switches to Profile tab.

- [ ] **Check modals** — edit modal slides up smoothly, close button works, assessment sheet appears after saving a match (if enabled in settings).

- [ ] **Check responsive** — resize browser to ≥900px. Stats tab should show 2-column layout. Tab bar full-width.

- [ ] **Check `landing.html`** — all sections visible, CTA links point to `/app`, no broken styles.

- [ ] **Final commit**

```bash
git add -A
git commit -m "feat: complete Kinetic Velocity redesign — all screens, landing page, chart colors"
```

- [ ] **Push branch and open PR**

```bash
git push -u origin redesign/kinetic-velocity
# Then open PR on GitHub: main ← redesign/kinetic-velocity
```

---

## Self-Review Notes

**Spec coverage check:**
- ✅ `app.html` full rewrite (Tasks 4–10)
- ✅ `landing.html` full rewrite (Task 13)
- ✅ `style.css` gutted to custom-only (Task 3)
- ✅ `stats-analyse.js` chart colors (Task 11)
- ✅ Global nav replacing per-screen headers (Task 4)
- ✅ JS-rendered components styled (Task 12)
- ✅ All modals restyled (Task 10)
- ✅ Auth overlay restyled (Task 4)
- ✅ Assessment sheet restyled (Task 10)
- ✅ Tailwind CDN config with full token set (Task 2)
- ✅ JS-toggled classes in `style.css` without `@apply` (Tasks 3, 5, 12)
- ✅ Desktop two-column stats layout preserved (Task 3 `style.css`)
- ✅ Git worktree isolation (Task 1)
