# Share Page Desktop Layout — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a responsive desktop layout to `share.html` that shows a sticky left sidebar (profile + filters) and a scrollable right content column at ≥900px, while leaving the mobile layout visually unchanged.

**Architecture:** Pure CSS media query drives the layout switch. `renderStats()` in `share-viewer.js` is restructured to always output a unified `share-desktop-layout` > `share-sidebar` + `share-main` DOM — on mobile these stack as blocks, on desktop the CSS grid kicks in. No logic changes for filtering or data fetching.

**Tech Stack:** Vanilla JS (ES modules), CSS custom properties, CSS grid.

---

## File map

| File | What changes |
|------|-------------|
| `style.css` | Add `.share-desktop-layout`, `.share-sidebar`, `.share-main`, sidebar profile/section styles, `@media (min-width: 900px)` grid block. Remove now-unused `.share-profile-card` and `.share-viewer-content` rules. |
| `js/share-viewer.js` | Restructure `renderStats()` root HTML: replace `renderProfileCard() + share-viewer-content > stats-body` with `share-desktop-layout > share-sidebar + share-main`. Remove `renderProfileCard()` function. |

No changes to `share.html`, `supabase.js`, or any app files.

---

### Task 1: Add CSS classes for the new layout

**Files:**
- Modify: `style.css` (share viewer section, lines ~814–900)

- [ ] **Step 1: Add mobile-default layout classes**

In `style.css`, find the `/* ── Share viewer page ── */` section and add after `.share-viewer-body`:

```css
.share-desktop-layout {
  display: flex;
  flex-direction: column;
  max-width: 480px;
  margin: 0 auto;
}

.share-sidebar {
  background: var(--card);
  border-bottom: 1px solid var(--border);
  padding: 20px 16px;
}

.share-sidebar-profile {
  display: flex;
  align-items: center;
  gap: 16px;
  position: relative;
  margin-bottom: 16px;
}

.share-main {
  padding: 0 0 40px;
}

.share-sidebar-section {
  margin-bottom: 12px;
}

.share-sidebar-section-label {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 6px;
}

.share-sidebar-divider {
  height: 1px;
  background: var(--border);
  margin: 14px 0;
}
```

- [ ] **Step 2: Add desktop media query**

Immediately after the mobile classes, add:

```css
@media (min-width: 900px) {
  .share-viewer-body { overflow: hidden; }

  .share-desktop-layout {
    display: grid;
    grid-template-columns: 260px 1fr;
    max-width: 1200px;
    height: 100vh;
    margin: 0 auto;
  }

  .share-sidebar {
    height: 100vh;
    overflow-y: auto;
    border-bottom: none;
    border-right: 1px solid var(--border);
    padding: 28px 18px;
  }

  .share-sidebar-profile {
    flex-direction: column;
    align-items: center;
    text-align: center;
    gap: 0;
  }

  .share-sidebar-profile .share-avatar {
    width: 72px;
    height: 72px;
    margin-bottom: 12px;
  }

  .share-sidebar-profile .share-profile-name {
    font-size: 20px;
  }

  .share-main {
    height: 100vh;
    overflow-y: auto;
    padding: 20px 24px;
  }
}
```

- [ ] **Step 3: Remove now-unused CSS rules**

Delete (or comment out) these rules that are replaced by the new structure:
- `.share-profile-card { ... }` (replaced by `.share-sidebar` + `.share-sidebar-profile`)
- `.share-viewer-content { ... }` (replaced by `.share-main`)

Keep `.share-avatar`, `.share-avatar-placeholder`, `.share-profile-info`, `.share-profile-name`, `.share-profile-club`, `.share-profile-team` — these are reused inside `.share-sidebar-profile`.

- [ ] **Step 4: Verify CSS visually on mobile**

Open `share.html?code=<any>` in a browser at <900px width. Confirm the sidebar (profile + flag + pills) appears as a card at the top, followed by the stats content — matching the previous layout.

- [ ] **Step 5: Commit**

```bash
git add style.css
git commit -m "feat(share): add desktop layout CSS classes and media query"
```

---

### Task 2: Restructure renderStats() HTML output

**Files:**
- Modify: `js/share-viewer.js`

The current `renderStats()` ends with:
```js
root.innerHTML =
  renderProfileCard(_profileCache) +
  '<div class="share-viewer-content">' +
    '<div class="stats-body">' +
      toggle +
      '<div id="share-filters">' + ... + '</div>' +
      '<div id="share-stats-content">' + statsContent + '</div>' +
    '</div>' +
  '</div>';
```

Replace the entire `root.innerHTML = ...` block and the `renderProfileCard()` function with the new sidebar/main structure.

- [ ] **Step 1: Build sidebar profile HTML helper**

Replace the existing `renderProfileCard(profile)` function with `renderSidebarProfile(profile)`:

```js
function renderSidebarProfile(profile) {
  var avatarHtml = profile.avatar_url
    ? '<img src="' + esc(profile.avatar_url) + '" class="share-avatar" alt="avatar">'
    : '<div class="share-avatar share-avatar-placeholder"></div>';
  var favoriteTeam = (profile.favorite_team || '').trim();
  return '<div class="share-sidebar-profile">' +
    avatarHtml +
    '<div class="share-profile-info">' +
      '<div class="share-profile-name">' + esc(profile.name || '') + '</div>' +
      '<div class="share-profile-club">' + esc(profile.club || '') + '</div>' +
      (favoriteTeam ? '<div class="share-profile-team">' + esc(favoriteTeam) + '</div>' : '') +
    '</div>' +
    '<div class="lang-picker-wrap">' +
      '<button class="lang-flag-btn" data-action="shareToggleLang" title="Change language">' + currentFlag() + '</button>' +
      '<div class="lang-picker-dropdown">' +
        '<button data-action="shareSetLang" data-lang="no"><img src="/icons/flag-no.svg" alt="" class="flag-svg-icon"> Norsk</button>' +
        '<button data-action="shareSetLang" data-lang="en"><img src="/icons/flag-en.svg" alt="" class="flag-svg-icon"> English</button>' +
      '</div>' +
    '</div>' +
  '</div>';
}
```

- [ ] **Step 2: Build sidebar filters HTML**

Inside `renderStats()`, replace the existing filter HTML variables with sidebar-wrapped versions. After the existing `tournamentPillsHtml` block, add:

```js
var sidebarFilters =
  '<div class="share-sidebar-divider"></div>' +
  '<div class="share-sidebar-section">' +
    '<div class="share-sidebar-section-label">' + t('stats_season_label') + '</div>' +
    '<div class="season-selector">' + seasonPills + '</div>' +
  '</div>' +
  (teamValues.length > 0
    ? '<div class="share-sidebar-section">' +
        '<div class="share-sidebar-section-label">' + t('alle_lag') + '</div>' +
        '<div class="season-selector">' + teamPills + '</div>' +
      '</div>'
    : '') +
  (tournamentValues.length > 1
    ? '<div class="share-sidebar-section">' +
        '<div class="share-sidebar-section-label">' + t('tournament_filter_all') + '</div>' +
        '<div class="season-selector" style="flex-wrap:wrap;overflow-x:visible">' +
          [{ key: 'all', label: t('tournament_filter_all') }]
            .concat(tournamentValues.map(function(v) { return { key: v, label: v === '' ? t('no_tournament') : v }; }))
            .map(function(p) {
              return '<button class="season-pill' + (_activeTournament === p.key ? ' active' : '') +
                '" data-action="shareSetTournament" data-tournament="' + esc(p.key) + '">' + esc(p.label) + '</button>';
            }).join('') +
        '</div>' +
      '</div>'
    : '');
```

- [ ] **Step 2b: Remove the now-unused tournament pills block**

Delete the entire old tournament pills block — both the outer `var tournamentPillsHtml` and the inner `var tournamentPills` it contains. This is the block starting with `var tournamentPillsHtml = '';` and ending with the closing `}` of the `if (tournamentValues.length > 1)` check (currently lines ~313–324). Tournament pills are now built inline inside `sidebarFilters`.

- [ ] **Step 3: Replace root.innerHTML with new structure**

Replace the entire `root.innerHTML = ...` block **and** the `toggle` variable declaration that sits just above it with the following (note: `toggle` is declared here, between `sidebarFilters` and `root.innerHTML`):

```js
  // View toggle
  var toggle =
    '<div class="form-section">' +
      '<div class="stats-view-toggle">' +
        '<button id="share-view-btn-overview" class="stats-view-btn' + (_activeView === 'overview' ? ' active' : '') +
          '" data-action="shareSetView" data-view="overview">' + t('stats_overview') + '</button>' +
        '<button id="share-view-btn-analyse" class="stats-view-btn' + (_activeView === 'analyse' ? ' active' : '') +
          '" data-action="shareSetView" data-view="analyse">' + t('stats_analyse') + '</button>' +
      '</div>' +
    '</div>';

  root.innerHTML =
    '<div class="share-desktop-layout">' +
      '<div class="share-sidebar">' +
        renderSidebarProfile(_profileCache) +
        sidebarFilters +
      '</div>' +
      '<div class="share-main">' +
        '<div class="stats-body">' +
          toggle +
          '<div id="share-stats-content">' + statsContent + '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
```

Note: The `id="share-filters"` wrapper is removed — filters now live in the sidebar. The `share-stats-content` id is kept for chart init targeting.

- [ ] **Step 4: Verify on mobile (< 900px)**

Open the share page at narrow width. Confirm:
- Profile + flag appears at top as a card
- Season / team / tournament pills appear below profile
- Stats content (form streak, WDL, match list) appears below filters
- Visually equivalent to before this change

- [ ] **Step 5: Verify on desktop (≥ 900px)**

Widen to 1000px+. Confirm:
- Left sidebar: avatar (larger), name, club, flag, section-labelled pill groups — stays fixed as right scrolls
- Right content: view toggle + all stats — scrolls independently
- Changing a season/team/tournament pill updates right content correctly
- Language flag still works

- [ ] **Step 6: Commit**

```bash
git add js/share-viewer.js
git commit -m "feat(share): restructure renderStats for desktop sidebar layout"
```

---

### Task 3: Push and verify on Vercel

- [ ] **Step 1: Push to main**

```bash
git push
```

- [ ] **Step 2: Verify on live URL**

Open `https://athlyticsport.app/share?code=<a real code>` on desktop. Confirm the two-column layout renders correctly with independent scrolling.
