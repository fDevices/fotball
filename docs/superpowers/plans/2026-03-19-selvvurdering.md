# Selvvurdering etter kamp — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Add optional post-match self-assessment (5 rating categories + 2 reflection fields) accessible from the Log tab sheet and inline in the edit modal.

**Architecture:** New `js/assessment.js` module manages all shared state (`_matchId`, `_ratings`) and renders into two separate DOM containers. The sheet context (`#assessment-body`) is triggered by a custom event after `saveMatch()` succeeds; the modal context (`#modal-assessment-body`) is rendered inline when `openEditModal()` runs. `getAssessmentPayload()` exposes ratings+reflections for `saveEditedMatch()` to merge into the PATCH body.

**Tech Stack:** Vanilla ES modules, Supabase REST API, event delegation via ACTIONS map, `t()` i18n, `isPremium()` premium gate.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `js/assessment.js` | Create | All assessment state + rendering logic |
| `js/i18n.js` | Modify | 17 new TEKST keys (NO + EN) |
| `app.html` | Modify | Assessment sheet HTML + inline modal div |
| `style.css` | Modify | Assessment UI styles |
| `js/log.js` | Modify | Dispatch `athlytics:showAssessment` after save |
| `js/navigation.js` | Modify | Call `closeAssessmentSheet()` on tab switch |
| `js/main.js` | Modify | Import assessment functions, 3 ACTIONS, event listener |
| `js/modal.js` | Modify | Call `loadMatchIntoAssessment` + `renderModalAssessmentSection` in `openEditModal`; merge `getAssessmentPayload()` in `saveEditedMatch` |
| `CLAUDE.md` | Modify | Add 7 new nullable columns to matches data contract |

---

### Task 1: Add 17 i18n keys

**Files:**
- Modify: `js/i18n.js`

Add all 17 keys to **both** `no` and `en` branches of `TEKST`. Insert them after `saved:` (last entry in each branch).

- [x] **Step 1: Add keys to `no` branch**

Open `js/i18n.js`. Find the line `saved:'✓ Lagret',` in the `no` branch and add the following after it (before the closing `},`):

```js
    cat_effort:'Innsats', cat_focus:'Fokus', cat_technique:'Teknikk', cat_team_play:'Lagspill', cat_impact:'Påvirkning',
    rating_1:'Veldig dårlig', rating_2:'Under mitt nivå', rating_3:'Greit', rating_4:'Bra', rating_5:'Veldig bra',
    assess_heading:'Hvordan vurderer du deg selv i dag?', assess_btn:'⭐ Vurder deg selv',
    assess_save:'Lagre vurdering', assess_skip:'Hopp over',
    assess_good:'Hva gikk bra?', assess_improve:'Hva vil jeg forbedre?',
    assess_saved:'✓ Vurdering lagret',
```

- [x] **Step 2: Add keys to `en` branch**

Find the line `saved:'✓ Saved',` (or equivalent) in the `en` branch and add:

```js
    cat_effort:'Effort', cat_focus:'Focus', cat_technique:'Technique', cat_team_play:'Teamwork', cat_impact:'Impact',
    rating_1:'Very poor', rating_2:'Below my level', rating_3:'Okay', rating_4:'Good', rating_5:'Very good',
    assess_heading:'How do you rate yourself today?', assess_btn:'⭐ Rate yourself',
    assess_save:'Save assessment', assess_skip:'Skip',
    assess_good:'What went well?', assess_improve:'What do I want to improve?',
    assess_saved:'✓ Assessment saved',
```

- [x] **Step 3: Verify keys load**

Open `app.html` in browser, open browser console, run:
```js
// In the module scope — check via:
document.dispatchEvent(new CustomEvent('athlytics:toast', { detail: { msg: 'i18n OK', type: 'success' } }));
```
Then switch language toggle and confirm no console errors. (Keys won't be used until later tasks.)

- [x] **Step 4: Commit**

```bash
git add js/i18n.js
git commit -m "feat: add 17 i18n keys for self-assessment (selvvurdering)"
```

---

### Task 2: Create `js/assessment.js`

**Files:**
- Create: `js/assessment.js`

This module owns all assessment state and rendering for both contexts.

- [x] **Step 1: Create the file**

```js
import { updateKamp } from './supabase.js';
import { t } from './i18n.js';
import { showToast } from './toast.js';
import { isPremium } from './utils.js';

var _matchId = null;
var _ratings = { effort: 0, focus: 0, technique: 0, team_play: 0, impact: 0 };
var _activeContext = null; // 'sheet' | 'modal'

var CATEGORIES = ['effort', 'focus', 'technique', 'team_play', 'impact'];
var CAT_KEYS   = { effort: 'cat_effort', focus: 'cat_focus', technique: 'cat_technique', team_play: 'cat_team_play', impact: 'cat_impact' };

function resetState() {
  _matchId = null;
  _ratings = { effort: 0, focus: 0, technique: 0, team_play: 0, impact: 0 };
  _activeContext = null;
}

// ── Sheet (Log tab) ──────────────────────────────────────────────────────────

export function openAssessmentSheet(matchId) {
  resetState();
  _matchId = matchId;
  _activeContext = 'sheet';
  renderAssessmentSheet();
  document.getElementById('assessment-backdrop').classList.add('open');
  document.getElementById('assessment-sheet').classList.add('open');
  document.body.style.overflow = 'hidden';
}

export function closeAssessmentSheet() {
  var backdrop = document.getElementById('assessment-backdrop');
  var sheet    = document.getElementById('assessment-sheet');
  if (backdrop) backdrop.classList.remove('open');
  if (sheet)    sheet.classList.remove('open');
  document.body.style.overflow = '';
  resetState();
}

export function renderAssessmentSheet() {
  var el = document.getElementById('assessment-body');
  if (!el) return;
  var title = document.getElementById('assess-title');
  if (title) title.textContent = t('assess_heading');
  var skipBtn = document.getElementById('assess-skip-btn');
  if (skipBtn) skipBtn.textContent = t('assess_skip');
  var saveBtn = document.getElementById('assess-save-btn');
  if (saveBtn) saveBtn.textContent = t('assess_save');
  el.innerHTML = '';
  el.appendChild(buildAssessmentRows('sheet'));
}

// ── Modal (edit context) ─────────────────────────────────────────────────────

export function loadMatchIntoAssessment(match) {
  _ratings = {
    effort:    match.rating_effort    || 0,
    focus:     match.rating_focus     || 0,
    technique: match.rating_technique || 0,
    team_play: match.rating_team_play || 0,
    impact:    match.rating_impact    || 0
  };
  _activeContext = 'modal';
}

export function renderModalAssessmentSection() {
  var el = document.getElementById('modal-assessment-body');
  if (!el) return;
  el.innerHTML = '';
  el.appendChild(buildAssessmentRows('modal'));
}

// ── Shared rendering ─────────────────────────────────────────────────────────

function buildAssessmentRows(context) {
  var wrap = document.createElement('div');
  wrap.className = 'assessment-rows';

  var heading = document.createElement('div');
  heading.className = 'assessment-heading';
  heading.textContent = t('assess_heading');
  wrap.appendChild(heading);

  CATEGORIES.forEach(function(cat) {
    var row = document.createElement('div');
    row.className = 'assessment-row';

    var label = document.createElement('div');
    label.className = 'assessment-cat-label';
    label.textContent = t(CAT_KEYS[cat]);
    row.appendChild(label);

    var btns = document.createElement('div');
    btns.className = 'assessment-num-btns';

    for (var v = 1; v <= 5; v++) {
      var btn = document.createElement('button');
      btn.className = 'assessment-num-btn' + (_ratings[cat] === v ? ' active' : '');
      btn.textContent = String(v);
      btn.dataset.action   = 'setRating';
      btn.dataset.category = cat;
      btn.dataset.value    = String(v);
      btn.dataset.context  = context;
      btns.appendChild(btn);
    }
    row.appendChild(btns);

    var hint = document.createElement('div');
    hint.className = 'assessment-rating-hint';
    hint.id = 'rating-hint-' + context + '-' + cat;
    hint.textContent = _ratings[cat] ? t('rating_' + _ratings[cat]) : '';
    row.appendChild(hint);

    wrap.appendChild(row);
  });

  // Reflection fields
  var divider = document.createElement('div');
  divider.className = 'modal-divider';
  wrap.appendChild(divider);

  var goodId    = context === 'sheet' ? 'assess-reflection-good'    : 'modal-assess-reflection-good';
  var improveId = context === 'sheet' ? 'assess-reflection-improve' : 'modal-assess-reflection-improve';

  wrap.appendChild(buildTextarea(goodId, t('assess_good')));
  wrap.appendChild(buildTextarea(improveId, t('assess_improve')));

  // Premium gate (sheet context only — modal always shows, save handles it)
  if (context === 'sheet' && !isPremium()) {
    var overlay = document.createElement('div');
    overlay.className = 'assessment-lock-overlay';
    var lockTitle = document.createElement('div');
    lockTitle.className = 'pro-lock-title';
    lockTitle.textContent = t('pro_feature');
    var lockDesc = document.createElement('div');
    lockDesc.className = 'pro-lock-desc';
    lockDesc.textContent = t('pro_upgrade_text');
    var lockBtn = document.createElement('button');
    lockBtn.className = 'pro-lock-btn';
    lockBtn.dataset.action = 'showProToast';
    lockBtn.textContent = t('pro_unlock_btn');
    overlay.appendChild(lockTitle);
    overlay.appendChild(lockDesc);
    overlay.appendChild(lockBtn);
    wrap.appendChild(overlay);
  }

  return wrap;
}

function buildTextarea(id, placeholder) {
  var label = document.createElement('label');
  label.className = 'assessment-textarea-label';
  label.textContent = placeholder;
  var ta = document.createElement('textarea');
  ta.id          = id;
  ta.className   = 'assessment-textarea';
  ta.placeholder = placeholder;
  ta.maxLength   = 500;
  var wrap = document.createElement('div');
  wrap.className = 'assessment-textarea-wrap';
  wrap.appendChild(label);
  wrap.appendChild(ta);
  return wrap;
}

// ── Rating interaction ───────────────────────────────────────────────────────

export function setRating(category, value, context) {
  if (!CATEGORIES.includes(category)) return;
  // Toggle: tapping active button deselects
  _ratings[category] = (_ratings[category] === value) ? 0 : value;
  // Re-render the buttons for this category in the right container
  var ctx = context || _activeContext || 'sheet';
  var containerId = ctx === 'modal' ? 'modal-assessment-body' : 'assessment-body';
  var container = document.getElementById(containerId);
  if (!container) return;
  var allBtns = container.querySelectorAll('[data-action="setRating"][data-category="' + category + '"]');
  allBtns.forEach(function(btn) {
    btn.classList.toggle('active', Number(btn.dataset.value) === _ratings[category]);
  });
  var hint = document.getElementById('rating-hint-' + ctx + '-' + category);
  if (hint) hint.textContent = _ratings[category] ? t('rating_' + _ratings[category]) : '';
}

// ── Save (sheet context) ─────────────────────────────────────────────────────

export async function saveAssessment() {
  if (!_matchId) return;
  var payload = {
    rating_effort:    _ratings.effort    || null,
    rating_focus:     _ratings.focus     || null,
    rating_technique: _ratings.technique || null,
    rating_team_play: _ratings.team_play || null,
    rating_impact:    _ratings.impact    || null,
    reflection_good:    (document.getElementById('assess-reflection-good')?.value    || '').trim() || null,
    reflection_improve: (document.getElementById('assess-reflection-improve')?.value || '').trim() || null
  };
  var saveBtn = document.getElementById('assess-save-btn');
  if (saveBtn) { saveBtn.disabled = true; saveBtn.textContent = t('saving'); }
  try {
    var res = await updateKamp(_matchId, payload);
    if (res.ok) {
      closeAssessmentSheet();
      showToast(t('assess_saved'), 'success');
    } else {
      showToast(t('toast_nettverksfeil_kort'), 'error');
    }
  } catch(e) {
    showToast(t('toast_nettverksfeil_kort'), 'error');
  }
  if (saveBtn) { saveBtn.disabled = false; saveBtn.textContent = t('assess_save'); }
}

// ── Payload getter (modal context) ───────────────────────────────────────────

export function getAssessmentPayload() {
  return {
    rating_effort:    _ratings.effort    || null,
    rating_focus:     _ratings.focus     || null,
    rating_technique: _ratings.technique || null,
    rating_team_play: _ratings.team_play || null,
    rating_impact:    _ratings.impact    || null,
    reflection_good:    (document.getElementById('modal-assess-reflection-good')?.value    || '').trim() || null,
    reflection_improve: (document.getElementById('modal-assess-reflection-improve')?.value || '').trim() || null
  };
}
```

- [x] **Step 2: Verify file saved**

```bash
wc -l js/assessment.js
# Expected: ~170 lines
```

- [x] **Step 3: Commit**

```bash
git add js/assessment.js
git commit -m "feat: add assessment.js — self-assessment state and rendering module"
```

---

### Task 3: Add CSS for assessment UI

**Files:**
- Modify: `style.css`

- [x] **Step 1: Append assessment styles to style.css**

Find the end of `style.css` and add:

```css
/* ── Assessment sheet & inline modal ──────────────────────────────────── */
.assessment-rows { padding: 0; position: relative; }
.assessment-heading {
  font-family: var(--font-condensed);
  font-size: 15px;
  font-weight: 700;
  color: var(--lime);
  margin-bottom: 14px;
  letter-spacing: 0.04em;
}
.assessment-row {
  margin-bottom: 12px;
}
.assessment-cat-label {
  font-family: var(--font-condensed);
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 4px;
}
.assessment-num-btns {
  display: flex;
  gap: 6px;
}
.assessment-num-btn {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--card);
  border: 1px solid rgba(168,224,99,0.15);
  color: var(--muted);
  font-family: var(--font-condensed);
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}
.assessment-num-btn.active {
  background: var(--lime);
  color: var(--grass);
  border-color: var(--lime);
}
.assessment-rating-hint {
  font-size: 11px;
  color: var(--muted);
  margin-top: 3px;
  min-height: 14px;
}
.assessment-textarea-wrap { margin-bottom: 10px; }
.assessment-textarea-label {
  display: block;
  font-family: var(--font-condensed);
  font-size: 12px;
  font-weight: 700;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: 4px;
}
.assessment-textarea {
  width: 100%;
  background: var(--card);
  border: 1px solid rgba(168,224,99,0.15);
  border-radius: 8px;
  padding: 10px 12px;
  color: var(--text);
  font-family: var(--font-body);
  font-size: 14px;
  resize: none;
  min-height: 72px;
  box-sizing: border-box;
}
.assessment-textarea:focus {
  outline: none;
  border-color: rgba(168,224,99,0.4);
}
.assessment-lock-overlay {
  position: absolute;
  inset: 0;
  background: rgba(26,58,31,0.85);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  gap: 10px;
  backdrop-filter: blur(4px);
}
/* Assessment sheet uses same modal-sheet / modal-backdrop pattern */
#assessment-body { padding: 16px 16px 0; overflow-y: auto; }
```

- [x] **Step 2: Verify no CSS parse errors**

Open `app.html` in browser. Check browser console for any CSS errors. (Sheet won't appear until wired in later tasks.)

- [x] **Step 3: Commit**

```bash
git add style.css
git commit -m "feat: add CSS for assessment rating UI and sheet"
```

---

### Task 4: Add HTML structure to `app.html`

**Files:**
- Modify: `app.html`

Two additions: (1) assessment sheet+backdrop before the `<script>` tag, (2) inline div inside `#modal-sheet` after goals/assist.

- [x] **Step 1: Add assessment sheet before `<script type="module">`**

Find the line `<script type="module" src="js/main.js"></script>` near the end of `app.html`. Insert this block directly before it:

```html
<!-- Assessment sheet (slide-up, Log tab context) -->
<div class="modal-backdrop" id="assessment-backdrop" data-action="closeAssessmentSheet"></div>
<div class="modal-sheet" id="assessment-sheet">
  <div class="modal-handle"></div>
  <div class="modal-header">
    <div class="modal-title" id="assess-title"></div>
    <button class="modal-close-btn" data-action="closeAssessmentSheet">&times;</button>
  </div>
  <div class="assessment-body" id="assessment-body"></div>
  <div class="modal-actions">
    <button class="modal-del-btn" data-action="closeAssessmentSheet" id="assess-skip-btn"></button>
    <button class="modal-save-btn" data-action="saveAssessment" id="assess-save-btn"></button>
  </div>
</div>
```

- [x] **Step 2: Add inline assessment section in edit modal**

Find this exact block in `app.html` (end of `#modal-sheet`):

```html
  <div class="modal-actions">
    <button class="modal-del-btn" data-action="deleteMatch">🗑 Slett</button>
    <button class="modal-save-btn" data-action="saveEditedMatch">Lagre endringer</button>
  </div>
</div>
```

Replace it with:

```html
  <div class="modal-divider"></div>
  <div id="modal-assessment-body"></div>
  <div class="modal-actions">
    <button class="modal-del-btn" data-action="deleteMatch">🗑 Slett</button>
    <button class="modal-save-btn" data-action="saveEditedMatch">Lagre endringer</button>
  </div>
</div>
```

- [x] **Step 3: Verify HTML parses correctly**

Open `app.html` in browser. Verify no console errors and the existing edit modal still opens and closes correctly.

- [x] **Step 4: Commit**

```bash
git add app.html
git commit -m "feat: add assessment sheet HTML and modal-assessment-body div to app.html"
```

---

### Task 5: Wire `js/log.js` — dispatch event after save

**Files:**
- Modify: `js/log.js`

After `resetForm()` is called on a successful save, dispatch `athlytics:showAssessment` with the new match ID.

- [x] **Step 1: Add event dispatch in `saveMatch()`**

Find this block in `js/log.js`:

```js
      showToast(t('toast_match_saved'), 'success');
      resetForm();
```

Replace with:

```js
      showToast(t('toast_match_saved'), 'success');
      resetForm();
      if (newMatches && newMatches[0] && newMatches[0].id) {
        document.dispatchEvent(new CustomEvent('athlytics:showAssessment', { detail: { matchId: newMatches[0].id } }));
      }
```

- [x] **Step 2: Verify log.js still saves correctly**

Open `app.html`, fill in a match (date, opponent, team), save. The toast should fire and the form should reset. The sheet won't appear until `main.js` is wired in Task 7, but no errors should appear in the console.

- [x] **Step 3: Commit**

```bash
git add js/log.js
git commit -m "feat: dispatch athlytics:showAssessment after successful match save"
```

---

### Task 6: Wire `js/navigation.js` — close sheet on tab switch

**Files:**
- Modify: `js/navigation.js`

Import `closeAssessmentSheet` and call it at the top of `switchTab()`.

- [x] **Step 1: Add import**

At the top of `js/navigation.js`, add:

```js
import { closeAssessmentSheet } from './assessment.js';
```

- [x] **Step 2: Call closeAssessmentSheet in switchTab**

Find:

```js
export function switchTab(tab) {
  var screen = document.getElementById('screen-' + tab);
  var tabBtn = document.getElementById('tab-' + tab);
  if (!screen || !tabBtn) return;
  document.dispatchEvent(new CustomEvent('athlytics:destroyCharts'));
```

Replace with:

```js
export function switchTab(tab) {
  var screen = document.getElementById('screen-' + tab);
  var tabBtn = document.getElementById('tab-' + tab);
  if (!screen || !tabBtn) return;
  closeAssessmentSheet();
  document.dispatchEvent(new CustomEvent('athlytics:destroyCharts'));
```

- [x] **Step 3: Commit**

```bash
git add js/navigation.js
git commit -m "feat: close assessment sheet on tab switch"
```

---

### Task 7: Wire `js/main.js` — import, ACTIONS, event listener

**Files:**
- Modify: `js/main.js`

Three changes: (1) add import, (2) add 3 ACTIONS entries, (3) add event listener for `athlytics:showAssessment`.

- [x] **Step 1: Add import**

Find the line:

```js
import { openEditModal, closeModal, setModalMatchType, modalAdjust, saveEditedMatch, deleteMatch, cancelDeleteMatch, confirmDeleteMatch } from './modal.js';
```

Add a new import line directly after it:

```js
import { openAssessmentSheet, closeAssessmentSheet, saveAssessment, setRating } from './assessment.js';
```

- [x] **Step 2: Add ACTIONS entries**

Find the `showProToast` line in the ACTIONS map:

```js
  showProToast:                  () => showToast('Coming soon \u2013 Stripe i Fase 4 \u{1F680}', 'success'),
```

Add these three entries after it (before the closing `};`):

```js
  closeAssessmentSheet:          () => closeAssessmentSheet(),
  saveAssessment:                () => saveAssessment(),
  setRating:                     (e) => { var el = e.target.closest('[data-category]'); if (!el) return; setRating(el.dataset.category, Number(el.dataset.value), el.dataset.context); },
```

- [x] **Step 3: Add event listener**

Find the block:

```js
document.addEventListener('athlytics:renderProfileLists', function() {
  renderProfileTeamList();
  renderProfileTournamentList();
});
```

Add directly after it:

```js
document.addEventListener('athlytics:showAssessment', function(e) {
  if (e.detail && e.detail.matchId) openAssessmentSheet(e.detail.matchId);
});
```

- [x] **Step 4: Verify sheet works end-to-end**

1. Open `app.html` in browser
2. Fill in a match (date, opponent, select team) and tap "Lagre kamp"
3. Sheet should slide up with heading "Hvordan vurderer du deg selv i dag?", 5 category rows with 1–5 buttons, 2 textarea fields, "Hopp over" and "Lagre vurdering" buttons
4. Tap a rating button — it should highlight green, hint text should appear below
5. Tap same button again — it should deselect (0 = unset)
6. Tap "Hopp over" — sheet should close, no save
7. Repeat steps 2–5, tap "Lagre vurdering" — should show toast "✓ Vurdering lagret" (if Supabase is reachable) or network error toast (if not), sheet closes on success

- [x] **Step 5: Commit**

```bash
git add js/main.js
git commit -m "feat: wire assessment module into main.js — import, ACTIONS, event listener"
```

---

### Task 8: Wire `js/modal.js` — assessment in edit modal

**Files:**
- Modify: `js/modal.js`

Two changes: (1) call `loadMatchIntoAssessment(k)` + `renderModalAssessmentSection()` at the end of `openEditModal()`; (2) merge `getAssessmentPayload()` into the PATCH body in `saveEditedMatch()`.

- [x] **Step 1: Add import to modal.js**

Add to the imports at the top of `js/modal.js`:

```js
import { loadMatchIntoAssessment, renderModalAssessmentSection, getAssessmentPayload } from './assessment.js';
```

- [x] **Step 2: Call assessment functions in openEditModal**

Find the last two lines of `openEditModal()`:

```js
  document.getElementById('modal-backdrop').classList.add('open');
  document.getElementById('modal-sheet').classList.add('open');
  document.body.style.overflow = 'hidden';
}
```

Replace with:

```js
  loadMatchIntoAssessment(k);
  renderModalAssessmentSection();
  // Pre-fill reflection textareas from saved match data
  var taGood    = document.getElementById('modal-assess-reflection-good');
  var taImprove = document.getElementById('modal-assess-reflection-improve');
  if (taGood)    taGood.value    = k.reflection_good    || '';
  if (taImprove) taImprove.value = k.reflection_improve || '';
  document.getElementById('modal-backdrop').classList.add('open');
  document.getElementById('modal-sheet').classList.add('open');
  document.body.style.overflow = 'hidden';
}
```

- [x] **Step 3: Merge assessment payload in saveEditedMatch**

Find in `saveEditedMatch()`:

```js
  var body = {
    date:       document.getElementById('modal-dato').value,
    opponent:   document.getElementById('modal-motstander').value.trim(),
    own_team:   document.getElementById('modal-own-team').value.trim(),
    tournament: document.getElementById('modal-tournament').value.trim(),
    home_score: mHome,
    away_score: mAway,
    goals:      mGoals,
    assists:    mAssists,
    match_type: mMatchType
  };
```

Replace with:

```js
  var body = Object.assign({
    date:       document.getElementById('modal-dato').value,
    opponent:   document.getElementById('modal-motstander').value.trim(),
    own_team:   document.getElementById('modal-own-team').value.trim(),
    tournament: document.getElementById('modal-tournament').value.trim(),
    home_score: mHome,
    away_score: mAway,
    goals:      mGoals,
    assists:    mAssists,
    match_type: mMatchType
  }, getAssessmentPayload());
```

- [x] **Step 4: Verify edit modal assessment section**

1. Open `app.html`, navigate to Stats tab, open any existing match in edit modal
2. Edit modal should show assessment section below the goals/assist divider
3. If match has no prior ratings, all buttons should be unselected; textareas empty
4. Select some ratings and add reflection text; tap "Lagre endringer"
5. Re-open the same match — ratings and text should be pre-populated
6. Verify existing save (date, opponent, scores) still works correctly

- [x] **Step 5: Commit**

```bash
git add js/modal.js
git commit -m "feat: integrate assessment section into edit modal — pre-populate and save"
```

---

### Task 9: Update CLAUDE.md — data contract

**Files:**
- Modify: `CLAUDE.md`

- [x] **Step 1: Update matches table in CLAUDE.md**

Find the `matches` table in the `## Datakontrakter` section:

```
result -- calculated client-side, not stored in DB
```

Add these 7 lines after it:

```
rating_effort      SMALLINT (1–5, nullable)
rating_focus       SMALLINT (1–5, nullable)
rating_technique   SMALLINT (1–5, nullable)
rating_team_play   SMALLINT (1–5, nullable)
rating_impact      SMALLINT (1–5, nullable)
reflection_good    TEXT (nullable)
reflection_improve TEXT (nullable)
```

- [x] **Step 2: Add assessment.js to filstruktur and funksjoner sections**

Find the `filstruktur` section code block. Add after `modal.js`:

```
  assessment.js       – self-assessment state, rendering, save/payload functions
```

Find the `## Kodenavn-konvensjoner` / `### Viktige funksjoner per modul` section. Add entry:

```
**assessment.js** – `openAssessmentSheet(matchId)`, `closeAssessmentSheet()`, `loadMatchIntoAssessment(match)`, `renderAssessmentSheet()`, `renderModalAssessmentSection()`, `setRating(category, value, context)`, `saveAssessment()`, `getAssessmentPayload()`
```

- [x] **Step 3: Commit with CHANGELOG update**

First add a line to `CHANGELOG.md`:

```md
## Økt 15 – 2026-03-19: Selvvurdering etter kamp
- Ny `assessment.js`-modul med selvvurdering etter kamp (5 kategorier, 1–5 tall-knapper, 2 fritekstfelter)
- Sheet-kontekst (Log-tab) og inline modal-seksjon (rediger kamp)
- 17 nye i18n-nøkler (NO + EN)
- 7 nye nullable kolonner dokumentert i datakontrakt (matches-tabell)
- Premium-gate implementert (blokket overlay hvis `!isPremium()`)
```

```bash
git add CLAUDE.md CHANGELOG.md
git commit -m "docs: add assessment.js to CLAUDE.md contract and filstruktur; log økt 15 in CHANGELOG"
```

---

### Task 10: Supabase migration (manual step)

**Note:** The 7 new columns must be added to the `matches` table in Supabase before ratings can be saved. This is a manual step outside the codebase.

- [x] **Step 1: Run migration in Supabase SQL editor**

In the Supabase dashboard SQL editor, run:

```sql
ALTER TABLE matches
  ADD COLUMN IF NOT EXISTS rating_effort      SMALLINT CHECK (rating_effort BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_focus       SMALLINT CHECK (rating_focus BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_technique   SMALLINT CHECK (rating_technique BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_team_play   SMALLINT CHECK (rating_team_play BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS rating_impact      SMALLINT CHECK (rating_impact BETWEEN 1 AND 5),
  ADD COLUMN IF NOT EXISTS reflection_good    TEXT,
  ADD COLUMN IF NOT EXISTS reflection_improve TEXT;
```

- [x] **Step 2: Verify columns exist**

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'matches'
  AND (column_name LIKE 'rating_%' OR column_name LIKE 'reflection_%')
ORDER BY column_name;
```

Expected: 7 rows, all `is_nullable = YES`.

- [x] **Step 3: End-to-end test with real Supabase**

1. Save a match → assessment sheet opens → rate all 5 categories → add reflection text → "Lagre vurdering"
2. Toast "✓ Vurdering lagret" fires, sheet closes
3. Open that match in edit modal → ratings pre-populated, text pre-filled
4. Change a rating → save → re-open → verify updated value persists

---

### Task 11: Final push

- [x] **Step 1: Verify all changes are committed**

```bash
git status
# Expected: clean working tree (or only .DS_Store untracked)
git log --oneline -8
```

- [x] **Step 2: Push to main**

```bash
git push origin main
```

- [x] **Step 3: Verify Vercel deploy**

Check Vercel dashboard or run `gh run list` if CI is configured. Verify no build errors.
