# Spec: Self-Assessment Toggle Setting

**Date:** 2026-03-23
**Status:** Approved

---

## Overview

Add a toggle in the Settings tab that lets users enable or disable the post-match self-assessment sheet. Off by default, gated as a premium feature.

---

## Data

- Add `assessmentEnabled: false` to `defaultSettings()` in `settings.js`
- Validate in `saveSettings()`: must be boolean, defaults to `false` if invalid
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

New section in `app.html` settings tab, following the existing section pattern:

```html
<div class="settings-section">
  <div class="settings-section-title" id="st-assess-title">
    ⭐ <span id="st-assess-title-text">Selvvurdering</span>
    <span class="export-premium-badge">⭐ Premium</span>
  </div>
  <div class="settings-desc" id="st-assess-desc">...</div>
  <div class="settings-options" id="settings-assess-options"></div>
</div>
```

- Pills rendered by `renderSettings()` using the same On/Off pattern as EU/US date format pills
- If `!isDevPremium()`: pills rendered with a disabled/lock state (non-interactive, grayed out) — same visual lock approach used in the assessment sheet overlay

---

## New function: `setAssessmentEnabled(val)`

In `settings-render.js`:

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

---

## Actions

In `actions.js`:

- Add `setAssessmentEnabled` to `WRITE_ACTIONS` set (consistent with other settings actions)
- Add to `ACTIONS` map:
  ```js
  setAssessmentEnabled: (e) => { var el = e.target.closest('[data-value]'); if (!el) return; setAssessmentEnabled(el.dataset.value === 'true'); }
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

---

## Files Changed

| File | Change |
|------|--------|
| `js/settings.js` | Add `assessmentEnabled: false` to `defaultSettings()`, validate in `saveSettings()` |
| `js/settings-render.js` | Add `setAssessmentEnabled()`, render new section in `renderSettings()` |
| `js/actions.js` | Add `setAssessmentEnabled` to ACTIONS and WRITE_ACTIONS |
| `js/log.js` | Gate `athlytics:showAssessment` dispatch behind `assessmentEnabled` |
| `js/i18n.js` | Add 4 new keys in `no` and `en` |
| `app.html` | New settings section HTML |

---

## Out of Scope

- No Supabase sync for this setting
- No changes to the assessment sheet itself
- No change to `isDevPremium()` — remains `true` in dev
