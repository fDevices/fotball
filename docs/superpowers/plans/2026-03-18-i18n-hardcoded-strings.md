# i18n Hardcoded Strings — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all hardcoded UI strings in `profile.js` and `settings-render.js` with `t()` calls, adding 6 new keys to the `TEKST` object in `i18n.js`.

**Architecture:** Two sequential tasks. Task 1 adds the new keys to `i18n.js` (both `no` and `en` branches). Task 2 updates the call sites in `profile.js` and `settings-render.js` to use `t()` — Task 2 depends on Task 1 being committed first. No logic changes; only string sourcing changes.

**Tech Stack:** Vanilla ES modules — no test framework. Verification is manual in-browser, switching between Norwegian and English.

---

## File Map

| File | Change |
|---|---|
| `js/i18n.js` | Add 6 new keys to both `no` and `en` branches of `TEKST` |
| `js/profile.js` | Replace 7 hardcoded strings with `t()` calls |
| `js/settings-render.js` | Replace 1 hardcoded `'ingen'` fallback with `t('none')` |

---

### Task 1: Add 6 new keys to TEKST in `i18n.js`

**Files:**
- Modify: `js/i18n.js`

The `TEKST` object has two branches: `no` (Norwegian) and `en` (English). Add the following 6 keys to **both** branches. Add them at the end of each branch, just before the closing `}` of that branch.

- [ ] **Step 1: Add keys to the `no` branch**

  In the `no: { ... }` block, before the final `},` of that block, add:

  ```javascript
  avatar_change:'Trykk for å bytte bilde',
  log_greeting:'Hei',
  log_ready:'Klar til å logge kamp 🟢',
  no_teams_yet:'Ingen lag lagt til ennå',
  no_tournaments_yet:'Ingen turneringer enda',
  none:'ingen',
  ```

- [ ] **Step 2: Add keys to the `en` branch**

  In the `en: { ... }` block, before the final `},` of that block, add:

  ```javascript
  avatar_change:'Tap to change photo',
  log_greeting:'Hi',
  log_ready:'Ready to log match 🟢',
  no_teams_yet:'No teams added yet',
  no_tournaments_yet:'No tournaments yet',
  none:'none',
  ```

- [ ] **Step 3: Verify both branches have the keys**

  Confirm the file has no syntax errors by checking that both branches now end with the 6 new keys followed by the closing `},`.

- [ ] **Step 4: Commit**

  ```bash
  git add js/i18n.js
  git commit -m "feat: add avatar_change, log_greeting, log_ready, no_teams_yet, no_tournaments_yet, none keys to TEKST"
  ```

---

### Task 2: Replace hardcoded strings with `t()` in `profile.js` and `settings-render.js`

**Files:**
- Modify: `js/profile.js`
- Modify: `js/settings-render.js`

**Prerequisite:** Task 1 must be committed before starting this task.

#### profile.js changes

- [ ] **Step 1: Fix `showAvatarImage()` — avatar hint texts**

  Current code (around line 166–170):
  ```javascript
  if (src) {
    img.src = src;
    img.style.display = 'block';
    emoji.style.display = 'none';
    hint.textContent = 'Trykk for å bytte bilde';
  } else {
    img.style.display = 'none';
    emoji.style.display = '';
    hint.textContent = 'Trykk for å laste opp bilde';
  }
  ```

  Replace with:
  ```javascript
  if (src) {
    img.src = src;
    img.style.display = 'block';
    emoji.style.display = 'none';
    hint.textContent = t('avatar_change');
  } else {
    img.style.display = 'none';
    emoji.style.display = '';
    hint.textContent = t('avatar_upload');
  }
  ```

  > `avatar_upload` already exists in TEKST (`'Trykk for å laste opp bilde'` / `'Tap to upload photo'`). `avatar_change` was added in Task 1.

- [ ] **Step 2: Fix `renderLogSub()` — greeting and ready text**

  Current code (around line 176–180):
  ```javascript
  var s = getSettings();
  var isEn = s.lang === 'en';
  var greeting = isEn ? 'Hi' : 'Hei';
  var ready = isEn ? 'Ready to log match 🟢' : 'Klar til å logge kamp 🟢';
  var sub = profil.name ? (greeting + ', ' + profil.name.split(' ')[0] + '! 🟢') : ready;
  ```

  Replace those five lines with:
  ```javascript
  var sub = profil.name ? (t('log_greeting') + ', ' + profil.name.split(' ')[0] + '! 🟢') : t('log_ready');
  ```

  > `var s`, `var isEn`, `var greeting`, and `var ready` are all dead code after this change and must all be removed. `getSettings` is still imported at the module level and used elsewhere in `profile.js` — do not touch the import.

- [ ] **Step 3: Fix `renderProfileTeamList()` — empty state and standard badge**

  Current code (around line 188–200):
  ```javascript
  if (!profil.team.length) {
    list.innerHTML = '<div class="team-list-empty">Ingen team lagt til ennå</div>';
    return;
  }
  ```
  and (around line 197):
  ```javascript
  (isFav ? ' <span class="team-fav-badge">standard</span>' : '')
  ```

  Replace empty state with:
  ```javascript
  if (!profil.team.length) {
    list.innerHTML = '<div class="team-list-empty">' + t('no_teams_yet') + '</div>';
    return;
  }
  ```

  Replace badge text with:
  ```javascript
  (isFav ? ' <span class="team-fav-badge">' + t('standard_badge') + '</span>' : '')
  ```

  > `standard_badge` already exists in TEKST (`'standard'` / `'default'`).
  > **Intentional rewording:** The source has `'Ingen team lagt til ennå'` — the new key uses `'Ingen lag lagt til ennå'` (Norwegian "lag" instead of English loanword "team"). This is a deliberate correction requested by the project owner.

- [ ] **Step 4: Fix `renderProfileTournamentList()` — empty state and standard badge**

  Current code (around line 207–209):
  ```javascript
  if (!profil.tournaments || !profil.tournaments.length) {
    list.innerHTML = '<div class="team-list-empty">Ingen tournaments enda</div>';
    return;
  }
  ```
  and (around line 228):
  ```javascript
  badge.textContent = 'standard';
  ```

  Replace empty state with:
  ```javascript
  if (!profil.tournaments || !profil.tournaments.length) {
    list.innerHTML = '<div class="team-list-empty">' + t('no_tournaments_yet') + '</div>';
    return;
  }
  ```

  Replace badge text with:
  ```javascript
  badge.textContent = t('standard_badge');
  ```

  > **Intentional rewording:** The source has `'Ingen tournaments enda'` (English "tournaments" in Norwegian). The new key uses `'Ingen turneringer enda'` (correct Norwegian). This is a deliberate correction.

#### settings-render.js change

- [ ] **Step 5: Fix `setActiveSeason()` — `'ingen'` fallback**

  Current code (line 131):
  ```javascript
  showToast(t('toast_active_season') + (s.activeSeason || 'ingen'), 'success');
  ```

  Replace with:
  ```javascript
  showToast(t('toast_active_season') + (s.activeSeason || t('none')), 'success');
  ```

- [ ] **Step 6: Manual verification**

  Open the app in a browser. Test with **Norwegian** language active (🇳🇴):
  - Go to Profile tab with no avatar → hint reads **"Trykk for å laste opp bilde"**
  - Upload an avatar → hint changes to **"Trykk for å bytte bilde"**
  - Log sub with no profile name → reads **"Klar til å logge kamp 🟢"**
  - Log sub with a name → reads **"Hei, [Firstname]! 🟢"**
  - Profile tab with no teams → reads **"Ingen lag lagt til ennå"**
  - Profile tab with no tournaments → reads **"Ingen turneringer enda"**
  - Settings: deselect active season → toast reads **"⭐ Aktiv sesong: ingen"**

  Switch to **English** (🇬🇧) and repeat:
  - No avatar hint → **"Tap to upload photo"**
  - With avatar → **"Tap to change photo"**
  - No name sub → **"Ready to log match 🟢"**
  - With name → **"Hi, [Firstname]! 🟢"**
  - No teams → **"No teams added yet"**
  - No tournaments → **"No tournaments yet"**
  - Deselect active season → toast reads **"⭐ Active season: none"**

- [ ] **Step 7: Commit**

  ```bash
  git add js/profile.js js/settings-render.js
  git commit -m "fix: replace hardcoded UI strings with t() in profile.js and settings-render.js"
  ```
