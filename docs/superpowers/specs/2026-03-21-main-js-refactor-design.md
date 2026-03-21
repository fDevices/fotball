# Design: main.js god-object cleanup — ACTIONS extraction

**Date:** 2026-03-21
**Goal:** Reduce main.js size and improve navigability by extracting the ACTIONS routing table and date-toggle logic into purpose-appropriate modules.

---

## Problem

`main.js` contains two chunks of logic that don't belong to its orchestrator role:

1. **`ACTIONS` map + `WRITE_ACTIONS` set** (~65 lines) — a user-intent routing table that imports and dispatches to every other module. This makes main.js hard to scan: the bootstrap and event-wiring logic is buried after a wall of routing entries.

2. **`updateDateLabel` + `setupDateToggle`** (~34 lines) — date input logic for the log form, with no reason to live in the app orchestrator.

---

## Approach

Extract each chunk to its natural home:

- `ACTIONS` + `WRITE_ACTIONS` → new `js/actions.js`
- `updateDateLabel` + `setupDateToggle` → existing `js/log.js`

main.js imports both and shrinks from ~271 to ~165 lines.

---

## Files changed

### `js/actions.js` (new)

- Contains `WRITE_ACTIONS` (Set) and `ACTIONS` (map) verbatim from main.js
- Imports all modules required by action handlers
- Exports: `export { ACTIONS, WRITE_ACTIONS }`
- No side effects on import — the module is a routing table, not an initialiser
- **`WRITE_ACTIONS` gating logic stays in `main.js`** inside `setupEventDelegation`. Only the Set definition moves to `actions.js`; the auth-gate check (`if (WRITE_ACTIONS.has(action) && !isAuthenticated())`) remains in main.js where it belongs alongside `isAuthenticated`.

### `js/log.js` (modified)

- Receives `updateDateLabel(val)` and `setupDateToggle()`
- Both use `t()` from i18n.js and `getDateLocale()` from settings.js — add imports if not already present
- Exports both: `export { setupDateToggle, updateDateLabel }`
- main.js calls `setupDateToggle()` during bootstrap and `updateDateLabel(today)` immediately after setting the initial date value

### `js/main.js` (modified)

- Replaces inline `ACTIONS`/`WRITE_ACTIONS` with `import { ACTIONS, WRITE_ACTIONS } from './actions.js'`
- Adds `setupDateToggle` and `updateDateLabel` to the import from `./log.js`
- Removes all imports that are only used by ACTIONS handlers — they move to `actions.js`
- **Stays in main.js:** `updateAvatar` and `uploadImage` (used in `setupEventDelegation`'s `input`/`change` listeners, not in ACTIONS); `isAuthenticated` (used in WRITE_ACTIONS gate and `change` handler); `closeAllDropdowns` (used in click handler outside ACTIONS); `selectTeam` and `selectTournament` (used in bootstrap to restore favorites)
- Result: ~165 lines structured as: imports → event wiring → cross-module listeners → bootstrap

---

## Dependency check

No circular dependency risk — nothing in the codebase imports `main.js`.

`actions.js` sits at the same dependency level as all other modules it imports. Import graph is unchanged; only the file that owns the routing table changes.

---

## Out of scope

- `setupEventDelegation` stays in main.js
- No logic changes — pure move, no behavior modifications
- `resetForm()` in log.js does not call `updateDateLabel` after resetting the date field — this is a pre-existing inconsistency, not introduced by this refactor, and not addressed here

---

## Success criteria

- All existing `data-action` handlers behave identically after the refactor
- main.js contains no inline action handler logic and no direct references to action-specific modules (only what bootstrap and event wiring require)
- `actions.js` has no side effects on import
- No new imports are added to any module other than `actions.js` and `log.js`
