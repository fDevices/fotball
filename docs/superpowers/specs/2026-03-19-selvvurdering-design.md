# Selvvurdering etter kamp — Design Spec

**Date:** 2026-03-19
**Status:** Approved

---

## Overview

After saving a match, the player can optionally rate their own performance across 5 categories using a 1–5 number-button scale, plus two free-text reflection fields. The feature is Premium-gated, optional, and available in both the Log tab (via slide-up sheet after saving) and the Stats edit modal (as a bottom section).

---

## Architecture

### New file

**`js/assessment.js`** — owns all assessment state and rendering:
- `openAssessmentSheet(matchId, existingRatings?)` — sets state, renders, opens sheet
- `closeAssessmentSheet()` — closes sheet, resets state
- `setRating(category, value)` — toggles: tapping the active value deselects (sets to 0)
- `saveAssessment()` — calls `updateKamp()`, invalidates cache, closes sheet
- `renderAssessmentSheet()` — renders 5 category rows + 2 text fields into sheet body

### Modified files

| File | Change |
|---|---|
| `app.html` | New assessment sheet element: backdrop + slide-up panel (mirrors edit modal pattern) |
| `js/log.js` | After successful `saveMatch()` — dispatch `athlytics:showAssessment` with `{ matchId }` |
| `js/modal.js` | Assessment section at bottom of edit modal; pre-populate from match object; include rating fields in `saveEditedMatch()` PATCH |
| `js/i18n.js` | 17 new TEKST keys (see i18n section below) |
| `js/main.js` | Wire `athlytics:showAssessment` listener; add assessment actions to ACTIONS map |
| `CLAUDE.md` | Update matches data contract with 7 new nullable columns |

`js/supabase.js` — no change. `updateKamp(id, body)` already handles arbitrary fields.

---

## Data Model

7 new nullable columns on the `matches` Supabase table (all `NULL` for existing rows):

```
rating_effort      SMALLINT (1–5)
rating_focus       SMALLINT (1–5)
rating_technique   SMALLINT (1–5)
rating_team_play   SMALLINT (1–5)
rating_impact      SMALLINT (1–5)
reflection_good    TEXT
reflection_improve TEXT
```

To be added as part of the Fase 1.7 migration.

### In-memory state (`assessment.js`)

```js
var _matchId = null;
var _ratings = { effort: 0, focus: 0, technique: 0, team_play: 0, impact: 0 };
var _reflectionGood = '';
var _reflectionImprove = '';
```

Value `0` means unset. All fields optional. "Lagre vurdering" saves whatever is set, including a fully empty assessment.

---

## UI Flow

### Log tab — after saving

1. `saveMatch()` succeeds → toast "⚽ Kamp lagret!" fires as normal
2. Form resets as normal
3. `athlytics:showAssessment` event dispatched with `{ matchId }`
4. `main.js` listener calls `openAssessmentSheet(matchId)`
5. If `!isPremium()` → sheet opens with blurred ratings + "Lås opp Pro ⭐" (same pattern as analyse-grafer)
6. Sheet slides up over the log form
7. "Lagre vurdering" → saves + closes; "Hopp over →" → closes without saving

### Edit modal — stats tab

- Assessment section at the bottom of the existing edit modal, below goals/assist, separated by a divider
- If ratings already exist → number buttons pre-highlighted, text fields pre-filled
- If no ratings yet → empty state with `assess_heading`
- `saveEditedMatch()` always includes all rating fields in the PATCH (`null` for unset)

### Assessment sheet HTML structure

```
#assessment-backdrop      ← dimmed overlay, tap to dismiss
#assessment-sheet         ← slide-up panel (same CSS as #modal-sheet)
  .modal-handle
  .modal-header           ← t('assess_btn') + close ×
  .assessment-body
    p.assess-framing      ← t('assess_heading')
    [5 category rows]     ← label + 5 number buttons (1–5)
    [selected label]      ← muted text below row, e.g. "Bra" when 4 is active
    textarea              ← t('assess_good') placeholder
    textarea              ← t('assess_improve') placeholder
  .modal-actions
    button.skip           ← t('assess_skip')
    button.save           ← t('assess_save')
```

---

## Rating UI

**Number buttons (1–5)** — one row per category. Each button is a fixed-width tap target. Tapping the active value deselects it (back to 0). A muted label below the row shows the text for the currently selected value (e.g. tapping 4 shows "Bra").

Categories and JS identifiers:

| JS field | Key | NO | EN |
|---|---|---|---|
| `rating_effort` | `cat_effort` | Innsats | Effort |
| `rating_focus` | `cat_focus` | Fokus | Focus |
| `rating_technique` | `cat_technique` | Teknikk | Technique |
| `rating_team_play` | `cat_team_play` | Lagspill | Teamwork |
| `rating_impact` | `cat_impact` | Påvirkning | Impact |

---

## i18n Keys

17 new keys added to both `no` and `en` branches in `i18n.js`:

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

If `!isPremium()`:
- Assessment sheet opens but ratings are blurred/disabled
- Shows `pro_feature` label + `pro_upgrade_text` + `pro_unlock_btn` (existing keys)
- Same visual treatment as the locked analyse-grafer section
- "Hopp over" still dismisses normally

---

## Event Contract

New cross-module event (breaks `log.js` → `assessment.js` dependency):

```
athlytics:showAssessment  — { detail: { matchId: string } }
```

Dispatched by `log.js` after `saveMatch()` succeeds. Handled by `main.js`, which calls `openAssessmentSheet(matchId)`.

---

## ACTIONS map entries (main.js)

```js
closeAssessmentSheet:  () => closeAssessmentSheet(),
saveAssessment:        () => saveAssessment(),
setRating:             (e) => { var el = e.target.closest('[data-category]'); if (!el) return; setRating(el.dataset.category, Number(el.dataset.value)); },
```

---

## Out of Scope (Fase 3)

- Trend visualisation per category in Stats tab
- Average per season, correlation with W/D/L
- These use the same DB columns — no schema changes needed in Fase 3
