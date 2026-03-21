# Accessibility Pass — Design Spec
**Date:** 2026-03-21
**Scope:** Screen reader support + focus management. No keyboard nav for dropdowns (deferred to Fase 3/4 desktop pass).

---

## Goals

- Semantic HTML so screen readers can understand page structure
- ARIA roles/attributes on modals so VoiceOver/TalkBack announce and manage them correctly
- ARIA on custom dropdowns so their state is announced (expanded/collapsed, selected option)
- Focus trap in modals so keyboard and screen reader users cannot escape to background content
- `aria-live` on dynamic value displays and toast so changes are announced
- ARIA tab pattern on the tab bar
- Zero visual change — no CSS modifications

---

## Section 1 — Semantic HTML (`app.html`)

### `<main>` wrapper
Wrap all four `.screen` sections in a single `<main>` element. Tab-bar (`<nav>`), modals, auth overlay, and toast remain outside.

### Screens → `<section>`
Each `<div class="screen">` becomes `<section class="screen">` with an `aria-label`:

| ID | `aria-label` |
|---|---|
| `screen-log` | `"Match log"` |
| `screen-stats` | `"Statistics"` |
| `screen-profil` | `"Profile"` |
| `screen-settings` | `"Settings"` |

### Log form → `<form>`
Wrap the `<div class="form-body">` content in `<form class="form-body" novalidate>`. The save button gets `type="submit"`. **No `onsubmit` inline handler** — project convention requires event delegation. A `submit` event listener is added in `main.js` that calls `event.preventDefault()` and delegates to `saveMatch()`.

### Score and stats groups → `role="group"`
Add `role="group"` and `aria-labelledby` to the score and stats control wrappers instead of `<fieldset>` (avoids browser-default fieldset CSS). Point `aria-labelledby` at existing visible label elements:

- Score row div → `role="group" aria-labelledby="label-home"` (existing id on "Hjemmelag" label)
- Stats row div → `role="group" aria-labelledby="label-goals"` (existing id on "Mål" label)

### Score/stat display spans → `aria-live`
The six stepper display spans get `aria-live="polite"` so VoiceOver/TalkBack announce changes when +/− is pressed:
- `#home-display`, `#away-display`, `#goals-display`, `#assist-display` (log form)
- `#modal-home`, `#modal-away`, `#modal-goals`, `#modal-assist` (edit modal)

### Toast → `aria-live`
Add `aria-live="polite"` and `aria-atomic="true"` to `#toast` so transient feedback is announced by screen readers.

---

## Section 2 — Modal ARIA + Focus Management

### ARIA attributes (`app.html`)

The auth modal ARIA goes on the inner content box (`.auth-modal`), not on `#auth-overlay` (which is the full-screen backdrop). Add `id="auth-modal"` to the inner `<div class="auth-modal">`.

| Element | Attributes to add |
|---|---|
| `#modal-sheet` | `role="dialog"` `aria-modal="true"` `aria-labelledby="modal-title"` |
| `#assessment-sheet` | `role="dialog"` `aria-modal="true"` `aria-labelledby="assess-title"` |
| `#delete-confirm-dialog` | `role="alertdialog"` `aria-modal="true"` `aria-labelledby="delete-confirm-title"` |
| `#auth-modal` (inner div) | `role="dialog"` `aria-modal="true"` `aria-labelledby="auth-dialog-title"` |

`alertdialog` on delete-confirm signals to screen readers that this requires an immediate response.

The delete confirm title (`<div class="delete-confirm-title">`) gets `id="delete-confirm-title"` added.

### Auth dialog label
Add a single visually-hidden `<h2 id="auth-dialog-title">` inside the auth modal (above the two view divs). `showAuthView()` in `auth-ui.js` updates its `textContent` when switching between login and signup views — this avoids fragility with `aria-labelledby` pointing at a conditionally-hidden element.

```css
/* Add to style.css — visually hidden but readable by screen readers */
.sr-only { position:absolute; width:1px; height:1px; padding:0; margin:-1px; overflow:hidden; clip:rect(0,0,0,0); white-space:nowrap; border:0; }
```

### Focus utility (`utils.js`)

Add two exported functions:

**`getFocusableElements(container)`** — returns all focusable children as an array:
`button:not([disabled]), input:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])`

**`trapFocus(container, event)`** — called on `keydown` inside an open modal. Intercepts Tab/Shift+Tab and cycles focus within `getFocusableElements(container)`.

### Focus management per modal

**Pattern (same for all four modals):**
1. **On open:** save `document.activeElement` to a module-level variable; call `setTimeout(() => getFocusableElements(container)[0]?.focus(), 50)`
2. **On close:** call `savedEl?.focus()` to restore focus
3. **Trap:** add a named `keydown` handler on the container that calls `trapFocus(container, e)`; add it on open, remove it on close

**Edit modal** — `modal.js` (`openEditModal`, `closeModal`)

**Assessment sheet** — `assessment.js` (`openAssessmentSheet`, `closeAssessmentSheet`). Same save/restore/trap pattern as edit modal. The assessment sheet opens after a match is saved from the log form; focus should return to `#submit-btn` on close.

**Delete confirm dialog** — `modal.js` (`deleteMatch`, `confirmDeleteMatch` / `cancelDeleteMatch`). Focus moves to the cancel button on open; restores to the delete button in the modal (`[data-action="deleteMatch"]`) on close.

**Auth overlay** — `auth-ui.js` (`openAuthOverlay`, `closeAuthOverlay`). Focus moves to the email input of the active view on open; restores to the element that triggered the overlay on close.

### Affected files
- `app.html` — ARIA attributes, `id` additions, `aria-live` attributes
- `style.css` — `.sr-only` utility class
- `utils.js` — `getFocusableElements`, `trapFocus`
- `modal.js` — focus management for edit modal and delete confirm dialog
- `assessment.js` — focus management for assessment sheet
- `auth-ui.js` — focus management for auth overlay; update `showAuthView()` to update `#auth-dialog-title`
- `main.js` — add `submit` event handler for log form

---

## Section 3 — Dropdown ARIA

Four custom dropdowns: log team, log tournament, modal team, modal tournament.

### Trigger elements — `app.html`

The trigger divs that need ARIA, and the `id` values to add where missing:

| Trigger div | Existing id | Add `id` | Controls |
|---|---|---|---|
| Log team trigger (`.team-selected` in log) | `team-selected` | — | `team-dropdown` |
| Log tournament trigger | none | `tournament-trigger` | `tournament-dropdown` |
| Modal team trigger | none | `modal-team-trigger` | `modal-team-dropdown` |
| Modal tournament trigger | none | `modal-tournament-trigger` | `modal-tournament-dropdown` |

Add to each trigger:
- `role="combobox"`
- `aria-haspopup="listbox"`
- `aria-expanded="false"` (initial)
- `aria-controls="<dropdown-id>"`

### Dropdown containers — `app.html`

Add `role="listbox"` to: `#team-dropdown`, `#tournament-dropdown`, `#modal-team-dropdown`, `#modal-tournament-dropdown`.

### Rendered options — `teams.js`

In all option-rendering functions, add to each option element:
- `role="option"`
- `aria-selected="true"` on the currently selected item, `aria-selected="false"` on others

### `aria-expanded` toggling — `teams.js`

Each toggle function locates its trigger by id using `document.getElementById('<trigger-id>')` and flips `aria-expanded`:

| Function | Trigger id |
|---|---|
| `toggleTeamDropdown()` | `team-selected` |
| `toggleTournamentDropdown()` | `tournament-trigger` |
| `toggleModalTeamDropdown()` | `modal-team-trigger` |
| `toggleModalTournamentDropdown()` | `modal-tournament-trigger` |

The "add new" input rows inside dropdowns require no changes.

---

## Section 4 — Tab Bar ARIA

The `<nav class="tab-bar">` gets `aria-label="Main navigation"`.

Each `<button class="tab-btn">` gets:
- `role="tab"`
- `aria-selected="true"` on the active tab, `"false"` on others

`switchTab()` in `navigation.js` already sets `.active` class — add `aria-selected` toggling in the same place.

---

## Files Changed Summary

| File | Changes |
|---|---|
| `app.html` | `<main>`, `<section>`, `<form novalidate>`, `role="group"` + `aria-labelledby`, modal ARIA attrs, dropdown trigger ARIA attrs + new ids, `aria-live` on display spans and toast, tab `role`/`aria-selected`, `id="auth-modal"`, `id="delete-confirm-title"`, `.sr-only` auth title |
| `style.css` | `.sr-only` utility class |
| `utils.js` | `getFocusableElements()`, `trapFocus()` |
| `modal.js` | Focus save/restore + trap for edit modal and delete confirm |
| `assessment.js` | Focus save/restore + trap for assessment sheet |
| `auth-ui.js` | Focus save/restore + trap for auth overlay; update `showAuthView()` to set `#auth-dialog-title` text |
| `navigation.js` | `aria-selected` toggling in `switchTab()` |
| `teams.js` | `role="option"`, `aria-selected` on rendered options; `aria-expanded` toggling on triggers |
| `main.js` | `submit` event handler for log form |

---

## Out of Scope

- Keyboard navigation (arrow keys) in dropdowns — deferred to Fase 3/4 desktop pass
- `<fieldset>` / `<dialog>` element migration — deferred
- Settings options (radio-button-style divs) — deferred
- Landing page (`landing.html`) — separate concern
- `<h2>` for `#modal-title` — deferred (no visual change constraint; `aria-labelledby` works without heading)
