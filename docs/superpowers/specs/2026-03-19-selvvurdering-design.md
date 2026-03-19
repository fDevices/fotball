# Selvvurdering etter kamp — Design Spec

**Date:** 2026-03-19
**Status:** Approved (v3 — post second spec-review)

---

## Overview

After saving a match, the player can optionally rate their own performance across 5 categories using a 1–5 number-button scale, plus two free-text reflection fields. Premium-gated, optional. Available in two contexts:

1. **Log tab** — slide-up sheet (`#assessment-sheet`) after saving a match
2. **Edit modal** — inline section rendered inside `#modal-body`

These are separate DOM containers. `assessment.js` manages shared state (`_ratings`, `_matchId`) and rendering logic for both contexts.

---

## Architecture

### New file

**`js/assessment.js`**:

| Function | Purpose |
|---|---|
| `openAssessmentSheet(matchId)` | Resets state, sets `_matchId`, renders into `#assessment-body`, opens `#assessment-sheet` |
| `closeAssessmentSheet()` | Closes sheet, fully resets `_matchId` + `_ratings` |
| `loadMatchIntoAssessment(match)` | Pre-populates `_ratings` from `match.rating_*` fields; called by `modal.js` before rendering |
| `renderAssessmentSheet()` | Renders 5 category rows + 2 textareas into `#assessment-body` (sheet context) |
| `renderModalAssessmentSection()` | Renders 5 category rows + 2 textareas into `#modal-assessment-body` (modal inline context) |
| `setRating(category, value)` | Toggles `_ratings[category]`; 0 = unset; re-renders the relevant row in whichever container called it |
| `saveAssessment()` | Reads `_ratings` + sheet textarea values → `updateKamp()` → success toast + `closeAssessmentSheet()`; on failure: error toast, sheet stays open |
| `getAssessmentPayload()` | Returns `{ rating_effort, rating_focus, rating_technique, rating_team_play, rating_impact, reflection_good, reflection_improve }` with `0 → null`; reads reflection from modal textareas. Called by `saveEditedMatch()`. |

### Modified files

| File | Change |
|---|---|
| `app.html` | New `#assessment-backdrop` + `#assessment-sheet` (slide-up, mirrors edit modal); new `#modal-assessment-body` div inside `#modal-body` after goals/assist divider |
| `js/log.js` | After successful `saveMatch()` → dispatch `athlytics:showAssessment` with `{ matchId: newMatches[0].id }` |
| `js/modal.js` | `openEditModal(id)`: calls `loadMatchIntoAssessment(match)` then `renderModalAssessmentSection()`; `saveEditedMatch()`: calls `getAssessmentPayload()` and merges into PATCH body |
| `js/navigation.js` | `switchTab()` calls `closeAssessmentSheet()` |
| `js/i18n.js` | 17 new TEKST keys |
| `js/main.js` | Wire `athlytics:showAssessment` listener; add 3 ACTIONS entries; import from `assessment.js` |
| `CLAUDE.md` | Update matches data contract with 7 new nullable columns |

`js/supabase.js` — confirmed: `insertKamp` uses `Prefer: return=representation` and `log.js` already reads `newMatches[0]` (line 96–98 of log.js). `newMatches[0].id` is available immediately after save.

---

## Data Model

7 new nullable columns on `matches` (all `NULL` for existing rows). To be added in Fase 1.7 migration:

```
rating_effort      SMALLINT (1–5)
rating_focus       SMALLINT (1–5)
rating_technique   SMALLINT (1–5)
rating_team_play   SMALLINT (1–5)
rating_impact      SMALLINT (1–5)
reflection_good    TEXT
reflection_improve TEXT
```

### In-memory state (`assessment.js`)

```js
var _matchId = null;
var _ratings = { effort: 0, focus: 0, technique: 0, team_play: 0, impact: 0 };
```

`0` = unset. `closeAssessmentSheet()` always resets both `_matchId` and `_ratings` to initial values regardless of context. Reflection text is never mirrored to state — always read from textarea DOM at save time.

---

## UI Flow

### Log tab — after saving

1. `saveMatch()` succeeds → `insertKamp()` returns inserted row with `id` (`Prefer: return=representation`)
2. Toast "⚽ Kamp lagret!" fires; form resets — both happen as now
3. `athlytics:showAssessment` dispatched: `{ detail: { matchId: newMatches[0].id } }`
4. `main.js` listener calls `openAssessmentSheet(matchId)` — empty state, renders sheet
5. If `!isPremium()` → sheet opens with ratings blurred/disabled + premium lock overlay (same pattern as locked analyse-grafer). "Hopp over" still works.
6. "Lagre vurdering" → `saveAssessment()`: reads `_ratings` + `#assess-reflection-good` / `#assess-reflection-improve` textarea values → `updateKamp()` → on success: toast `assess_saved` + close; on failure: toast `toast_nettverksfeil_kort`, sheet stays open
7. "Hopp over" or backdrop tap → `closeAssessmentSheet()`, no save

### Edit modal — stats tab

1. `openEditModal(id)` fetches match from `allMatches`
2. Calls `loadMatchIntoAssessment(match)` — pre-populates `_ratings` from `match.rating_*`
3. Calls `renderModalAssessmentSection()` — renders into `#modal-assessment-body`, textareas pre-filled from `match.reflection_good` / `match.reflection_improve`
4. User edits match data and/or assessment ratings
5. `saveEditedMatch()` calls `getAssessmentPayload()` which reads `_ratings` (0→null) + `#modal-assess-reflection-good` / `#modal-assess-reflection-improve` values → merged into PATCH body
6. Pre-populated values are saved as-is if user doesn't touch the section — no data loss

### Tab switch

`switchTab()` calls `closeAssessmentSheet()` → full state reset, sheet closes if open.

---

## HTML Structure

### Standalone sheet (new in `app.html`)

```html
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

### Inline section in edit modal (new in `app.html`, inside `#modal-body`)

```html
<div class="modal-divider"></div>
<div id="modal-assessment-body"></div>
```

### DOM ID strategy — no collisions

Rating buttons carry only `data-category` + `data-value` (no IDs). Textarea IDs:

| Context | Reflection good | Reflection improve |
|---|---|---|
| Sheet | `assess-reflection-good` | `assess-reflection-improve` |
| Modal | `modal-assess-reflection-good` | `modal-assess-reflection-improve` |

Both textareas: `maxlength="500"`.

---

## Rating UI

Number buttons 1–5 per category row. `data-action="setRating"`, `data-category`, `data-value`. Tapping active button deselects (→ 0). Muted label below each row shows `t('rating_N')` for selected value; clears when deselected.

ACTIONS delegation (mirrors existing `adjust` pattern):
```js
setRating: (e) => {
  var el = e.target.closest('[data-category]');
  if (!el) return;
  setRating(el.dataset.category, Number(el.dataset.value));
}
```

---

## i18n Keys (17 new — full values)

### Category labels
| Key | NO | EN |
|---|---|---|
| `cat_effort` | Innsats | Effort |
| `cat_focus` | Fokus | Focus |
| `cat_technique` | Teknikk | Technique |
| `cat_team_play` | Lagspill | Teamwork |
| `cat_impact` | Påvirkning | Impact |

### Scale labels
| Key | NO | EN |
|---|---|---|
| `rating_1` | Veldig dårlig | Very poor |
| `rating_2` | Under mitt nivå | Below my level |
| `rating_3` | Greit | Okay |
| `rating_4` | Bra | Good |
| `rating_5` | Veldig bra | Very good |

### UI strings
| Key | NO | EN |
|---|---|---|
| `assess_heading` | Hvordan vurderer du deg selv i dag? | How do you rate yourself today? |
| `assess_btn` | ⭐ Vurder deg selv | ⭐ Rate yourself |
| `assess_save` | Lagre vurdering | Save assessment |
| `assess_skip` | Hopp over | Skip |
| `assess_good` | Hva gikk bra? | What went well? |
| `assess_improve` | Hva vil jeg forbedre? | What do I want to improve? |
| `assess_saved` | ✓ Vurdering lagret | ✓ Assessment saved |

---

## Premium Gate

If `!isPremium()`: sheet opens, ratings blurred/disabled, premium lock overlay shown (existing `pro_feature`, `pro_upgrade_text`, `pro_unlock_btn` keys). "Hopp over" dismisses normally. Note: `isPremium()` is currently hardcoded `true` — the locked path exists for Fase 4.

---

## ACTIONS map (`main.js`)

```js
closeAssessmentSheet: () => closeAssessmentSheet(),
saveAssessment:       () => saveAssessment(),
setRating:            (e) => { var el = e.target.closest('[data-category]'); if (!el) return; setRating(el.dataset.category, Number(el.dataset.value)); },
```

---

## Error Handling

| Scenario | Behaviour |
|---|---|
| `saveAssessment()` Supabase/network error | Toast `toast_nettverksfeil_kort`; sheet stays open for retry |
| `saveAssessment()` success | Toast `assess_saved`; sheet closes; state reset |
| Tab switch while sheet open | Sheet closes silently; state reset; no save |
| Edit modal save error | Existing `saveEditedMatch()` error handling applies |

---

## Out of Scope (Fase 3)

- Trend visualisation per category in Stats tab
- Average ratings per season
- Correlation with W/D/L
- No schema changes needed in Fase 3 — same 7 columns used
