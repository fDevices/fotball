# Spec: Self-Assessment Toggle Setting

**Date:** 2026-03-23
**Status:** Approved

---

## Overview

Add a toggle in the Settings tab that lets users enable or disable the post-match self-assessment sheet. Off by default, gated as a premium feature.

---

## Data

- Add `assessmentEnabled: false` to `defaultSettings()` in `settings.js`
- Validate in `saveSettings()` with: `if (typeof safe.assessmentEnabled !== 'boolean') safe.assessmentEnabled = false;`
- Stored in localStorage only (no Supabase sync — same tier as `dateFormat` and `extraSeasons`)

---

## Gate in `log.js`

In `saveMatch()`, wrap the `athlytics:showAssessment` dispatch:

```js
if (getSettings().assessmentEnabled) {
  document.dispatchEvent(new CustomEvent('athlytics:showAssessment', { detail: { matchId: newMatches[0].id } }));
}
```

---

## Settings UI

New `settings-section` in `app.html` settings tab. Uses the same structure as other settings sections. The `export-premium-badge` class is reused for the premium badge (already styled, acceptable reuse within a `settings-section`):

```html
<div class="settings-section">
  <div class="settings-section-title" id="st-assess-title">
    <span id="st-assess-title-text">⭐ Selvvurdering</span>
    <span class="export-premium-badge">⭐ Premium</span>
  </div>
  <div class="settings-desc" id="st-assess-desc">Vis selvvurderingsskjema etter hver kamp.</div>
  <div class="settings-options" id="settings-assess-options"></div>
</div>
```

Pills rendered by `renderSettings()` using the same On/Off pattern as EU/US date format pills:
- `data-action="setAssessmentEnabled"` with `data-value="true"` / `data-value="false"`
- If `!isDevPremium()`: pills rendered with `disabled` attribute and `opacity: 0.4` inline style (non-interactive, grayed out) — no click handler attached

---

## `settings-render.js`

**Import addition** — add `isDevPremium` to the existing `utils.js` import:
```js
import { isDevPremium } from './utils.js';
```

**New function:**
```js
export function setAssessmentEnabled(val) {
  if (!isDevPremium()) return; // premium gate
  var s = getSettings();
  s.assessmentEnabled = val;
  saveSettings(s);
  renderSettings();
  showToast(val ? t('toast_assess_on') : t('toast_assess_off'), 'success');
}
```

**In `renderSettings()`** — add a block to render the On/Off pills in `#settings-assess-options`, after the existing `dfEl` date-format block:
```js
var assessEl = document.getElementById('settings-assess-options');
if (assessEl) {
  assessEl.innerHTML = '';
  [{ val: true, label: t('on') }, { val: false, label: t('off') }].forEach(function(opt) {
    var btn = document.createElement('button');
    btn.className = 'settings-pill' + (s.assessmentEnabled === opt.val ? ' active' : '');
    btn.textContent = opt.label;
    if (isDevPremium()) {
      btn.dataset.action = 'setAssessmentEnabled';
      btn.dataset.value = String(opt.val);
    } else {
      btn.disabled = true;
      btn.style.opacity = '0.4';
    }
    assessEl.appendChild(btn);
  });
}
```

Also add i18n text refresh in `renderSettings()` (alongside existing `st-*` title/desc updates):
```js
var stAssessTitle = document.getElementById('st-assess-title-text');
if (stAssessTitle) stAssessTitle.textContent = '⭐ ' + t('assess_toggle_title');
var stAssessDesc = document.getElementById('st-assess-desc');
if (stAssessDesc) stAssessDesc.textContent = t('assess_toggle_desc');
```

---

## `actions.js`

**Import addition** — add `setAssessmentEnabled` to the existing `settings-render.js` import line:
```js
import { setSport, setSeasonFormat, setDateFormat, setActiveSeason, addSeason, setAssessmentEnabled } from './settings-render.js';
```

**WRITE_ACTIONS** — add `'setAssessmentEnabled'` to the set.

**ACTIONS map** — add:
```js
setAssessmentEnabled: (e) => { var el = e.target.closest('[data-value]'); if (!el) return; setAssessmentEnabled(el.dataset.value === 'true'); },
```

---

## i18n (`i18n.js`)

New keys in both `no` and `en`:

| Key | no | en |
|-----|----|----|
| `assess_toggle_title` | `Selvvurdering` | `Self-assessment` |
| `assess_toggle_desc` | `Vis selvvurderingsskjema etter hver kamp.` | `Show self-assessment sheet after each match.` |
| `toast_assess_on` | `✓ Selvvurdering aktivert` | `✓ Self-assessment enabled` |
| `toast_assess_off` | `✓ Selvvurdering deaktivert` | `✓ Self-assessment disabled` |
| `on` | `På` | `On` |
| `off` | `Av` | `Off` |

> Note: check if `on`/`off` keys already exist in `i18n.js` before adding.

---

## Files Changed

| File | Change |
|------|--------|
| `js/settings.js` | Add `assessmentEnabled: false` to `defaultSettings()`, add boolean type-guard in `saveSettings()` |
| `js/settings-render.js` | Import `isDevPremium` from `utils.js`; add `setAssessmentEnabled()`; add section rendering in `renderSettings()` |
| `js/actions.js` | Import `setAssessmentEnabled` from `settings-render.js`; add to ACTIONS map and WRITE_ACTIONS |
| `js/log.js` | Gate `athlytics:showAssessment` dispatch behind `getSettings().assessmentEnabled` |
| `js/i18n.js` | Add up to 6 new keys in `no` and `en` (check for existing `on`/`off`) |
| `app.html` | New `settings-section` HTML for the toggle |

---

## Out of Scope

- No Supabase sync for this setting
- No changes to the assessment sheet itself
- No change to `isDevPremium()` — remains `true` in dev
