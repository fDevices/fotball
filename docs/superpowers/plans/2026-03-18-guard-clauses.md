# Guard Clauses — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add null-check guard clauses to `switchTab()`, `setMatchType()`, and `updateResult()` so they fail silently instead of throwing when a DOM element is missing.

**Architecture:** Each function gets an early-return guard at the top (or before first use) that checks all required DOM elements. Pattern mirrors the existing `if (!badge) return` in `updateLogBadge()` in the same codebase. No behaviour change when the DOM is intact — only prevents cascading `TypeError` crashes when elements are absent.

**Tech Stack:** Vanilla ES modules — no test framework. Verification is manual in-browser.

---

## File Map

| File | Change |
|---|---|
| `js/navigation.js` | Guard `switchTab()` against missing `screen-*` and `tab-*` elements |
| `js/log.js` | Guard `setMatchType()` against missing toggle/label elements; guard `updateResult()` against missing `result-display` |

---

### Task 1: Guard `switchTab()` in `navigation.js`

**Files:**
- Modify: `js/navigation.js:15-23`

- [ ] **Step 1: Locate the function**

  Current `switchTab()` (lines 15–23):
  ```javascript
  export function switchTab(tab) {
    document.dispatchEvent(new CustomEvent('athlytics:destroyCharts'));
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
    document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    document.getElementById('screen-' + tab).classList.add('active');
    document.getElementById('tab-' + tab).classList.add('active');
    if (tab === 'stats') document.dispatchEvent(new CustomEvent('athlytics:loadStats'));
    if (tab === 'settings') document.dispatchEvent(new CustomEvent('athlytics:renderSettings'));
  }
  ```

- [ ] **Step 2: Add guard clause**

  Replace the function body with:
  ```javascript
  export function switchTab(tab) {
    var screen = document.getElementById('screen-' + tab);
    var tabBtn = document.getElementById('tab-' + tab);
    if (!screen || !tabBtn) return;
    document.dispatchEvent(new CustomEvent('athlytics:destroyCharts'));
    document.querySelectorAll('.screen').forEach(function(s) { s.classList.remove('active'); });
    document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
    screen.classList.add('active');
    tabBtn.classList.add('active');
    if (tab === 'stats') document.dispatchEvent(new CustomEvent('athlytics:loadStats'));
    if (tab === 'settings') document.dispatchEvent(new CustomEvent('athlytics:renderSettings'));
  }
  ```

  > The elements are looked up once and reused — avoids double `getElementById` call and makes the guard clean.

- [ ] **Step 3: Manual verification**

  Open the app. Click each tab (Logg, Statistikk, Profil, Innstillinger) and confirm:
  - Each tab switches normally
  - No console errors

- [ ] **Step 4: Commit**

  ```bash
  git add js/navigation.js
  git commit -m "fix: guard switchTab() against missing screen/tab elements"
  ```

---

### Task 2: Guard `setMatchType()` and `updateResult()` in `log.js`

**Files:**
- Modify: `js/log.js:11-28`

- [ ] **Step 1: Locate `setMatchType()`**

  Current (lines 11–18):
  ```javascript
  export function setMatchType(type) {
    matchType = type;
    document.getElementById('btn-home-toggle').classList.toggle('active', type === 'home');
    document.getElementById('btn-away-toggle').classList.toggle('active', type === 'away');
    document.getElementById('label-home').classList.toggle('highlight', type === 'home');
    document.getElementById('label-away').classList.toggle('highlight', type === 'away');
    updateResult();
  }
  ```

- [ ] **Step 2: Add guard clause to `setMatchType()`**

  Replace with:
  ```javascript
  export function setMatchType(type) {
    matchType = type;
    var btnHome = document.getElementById('btn-home-toggle');
    var btnAway = document.getElementById('btn-away-toggle');
    var lblHome = document.getElementById('label-home');
    var lblAway = document.getElementById('label-away');
    if (!btnHome || !btnAway || !lblHome || !lblAway) return;
    btnHome.classList.toggle('active', type === 'home');
    btnAway.classList.toggle('active', type === 'away');
    lblHome.classList.toggle('highlight', type === 'home');
    lblAway.classList.toggle('highlight', type === 'away');
    updateResult();
  }
  ```

  > Note: the guard returns before `updateResult()`. This is correct — if the log screen elements are missing, there is nothing to update.

- [ ] **Step 3: Locate `updateResult()`**

  Current (lines 20–28):
  ```javascript
  export function updateResult() {
    var el = document.getElementById('result-display');
    var r = matchType === 'home'
      ? (home > away ? 'wins' : home < away ? 'loss' : 'draw')
      : (away > home ? 'wins' : away < home ? 'loss' : 'draw');
    var labels = { wins: t('res_win'), draw: t('res_uavgjort'), loss: t('res_tap') };
    el.textContent = labels[r];
    el.className = 'result-auto ' + r;
  }
  ```

- [ ] **Step 4: Add guard clause to `updateResult()`**

  Replace with:
  ```javascript
  export function updateResult() {
    var el = document.getElementById('result-display');
    if (!el) return;
    var r = matchType === 'home'
      ? (home > away ? 'wins' : home < away ? 'loss' : 'draw')
      : (away > home ? 'wins' : away < home ? 'loss' : 'draw');
    var labels = { wins: t('res_win'), draw: t('res_uavgjort'), loss: t('res_tap') };
    el.textContent = labels[r];
    el.className = 'result-auto ' + r;
  }
  ```

- [ ] **Step 5: Manual verification**

  Open the app on the Log tab. Confirm:
  - Home/Away toggle buttons highlight correctly when clicked
  - Result badge (Seier / Uavgjort / Tap) updates correctly when score changes
  - No console errors

- [ ] **Step 6: Commit**

  ```bash
  git add js/log.js
  git commit -m "fix: guard setMatchType() and updateResult() against missing DOM elements"
  ```
