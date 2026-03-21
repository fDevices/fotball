# Accessibility Pass — Design Spec
**Date:** 2026-03-21
**Scope:** Screen reader support + focus management. No keyboard nav for dropdowns (deferred to Fase 3/4 desktop pass).

---

## Goals

- Semantic HTML so screen readers can understand page structure
- ARIA roles/attributes on modals so VoiceOver/TalkBack announce and manage them correctly
- ARIA on custom dropdowns so their state is announced (expanded/collapsed, selected option)
- Focus trap in modals so keyboard and screen reader users cannot escape to background content
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
Wrap the `<div class="form-body">` content in `<form class="form-body" novalidate onsubmit="return false">`. The save button gets `type="submit"`. Same pattern as the existing auth forms.

### Score and stats groups → `role="group"`
Add `role="group"` and `aria-label` to the score and stats control wrappers instead of `<fieldset>` (avoids browser-default fieldset CSS):

- Score row div → `role="group" aria-label="Score"`
- Stats row div → `role="group" aria-label="Mål og assist"`

---

## Section 2 — Modal ARIA + Focus Management

### ARIA attributes (`app.html`)

| Element | Attributes to add |
|---|---|
| `#modal-sheet` | `role="dialog"` `aria-modal="true"` `aria-labelledby="modal-title"` |
| `#assessment-sheet` | `role="dialog"` `aria-modal="true"` `aria-labelledby="assess-title"` |
| `#delete-confirm-dialog` | `role="alertdialog"` `aria-modal="true"` `aria-labelledby="delete-confirm-title"` |
| `#auth-modal` | `role="dialog"` `aria-modal="true"` `aria-labelledby="auth-dialog-title"` |

`alertdialog` on delete-confirm signals to screen readers that this requires an immediate response.

The delete confirm title (`<div class="delete-confirm-title">`) needs `id="delete-confirm-title"` added.
The auth modal needs a visually-hidden `<h2 id="auth-dialog-title">` that reflects the active view (login vs signup) — or `aria-labelledby` can point at the active view's existing `h2`.

### Focus utility (`utils.js`)

Add `getFocusableElements(container)` — returns all focusable children (`button:not([disabled])`, `input:not([disabled])`, `a[href]`, `[tabindex]:not([tabindex="-1"])`).

Add `trapFocus(container, event)` — called on `keydown` inside an open modal. Intercepts Tab/Shift+Tab and cycles focus within `getFocusableElements(container)`.

### Focus management per modal (`modal.js`, `auth-ui.js`)

**On open:**
1. Save `document.activeElement` to a module-level variable
2. `setTimeout(() => firstFocusable.focus(), 50)` — small delay lets the modal finish animating into view

**On close:**
1. Restore focus to saved element (if it still exists in the DOM)

**Trap:**
Add a `keydown` listener on each modal container that calls `trapFocus()` while the modal is open. Listener is added on open and removed on close to avoid memory leaks.

### Affected files
- `app.html` — ARIA attributes
- `utils.js` — `getFocusableElements`, `trapFocus`
- `modal.js` — `openEditModal`, `closeModal` (edit modal + assessment sheet share same backdrop/open pattern, but assessment is managed in `assessment.js`)
- `auth-ui.js` — auth overlay open/close

---

## Section 3 — Dropdown ARIA

Four custom dropdowns: log team, log tournament, modal team, modal tournament.

### Trigger elements (`.team-selected` divs) — `app.html`

Add to each trigger:
- `role="combobox"`
- `aria-haspopup="listbox"`
- `aria-expanded="false"` (initial)
- `aria-controls="<dropdown-id>"` pointing at the matching `.team-dropdown`

### Dropdown containers (`.team-dropdown` divs) — `app.html`

Add `role="listbox"` to each.

### Rendered options — `teams.js`

In the option-rendering functions, add to each option element:
- `role="option"`
- `aria-selected="true"` on the currently selected item, `aria-selected="false"` on others

### `aria-expanded` toggling — `teams.js`

In `toggleTeamDropdown()`, `toggleTournamentDropdown()`, `toggleModalTeamDropdown()`, `toggleModalTournamentDropdown()`: set `aria-expanded="true"` on open, `"false"` on close.

The "add new" input rows inside dropdowns require no changes — they are standard inputs.

---

## Files Changed

| File | Changes |
|---|---|
| `app.html` | `<main>`, `<section>`, `<form>`, `role="group"`, modal ARIA attrs, dropdown trigger ARIA attrs |
| `utils.js` | Add `getFocusableElements()`, `trapFocus()` |
| `modal.js` | Focus save/restore on open/close, attach/detach trap listener |
| `assessment.js` | Focus save/restore on assessment sheet open/close |
| `auth-ui.js` | Focus save/restore on auth overlay open/close |
| `teams.js` | `role="option"`, `aria-selected` on rendered options; `aria-expanded` toggling |

---

## Out of Scope

- Keyboard navigation (arrow keys) in dropdowns — deferred to Fase 3/4 desktop pass
- `<fieldset>` / `<dialog>` element migration — deferred
- Settings options (radio-button-style divs) — deferred
- Landing page (`landing.html`) — separate concern
