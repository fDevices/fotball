# Export Season Selector — Design Spec

**Date:** 2026-04-13
**Status:** Approved

---

## Problem

`exportCSV()` and `exportPDF()` always export the active season from settings. There is no way to export a different season or all seasons without changing the active season in settings first.

## Solution

Add an inline season dropdown to the export card in the settings tab, above the CSV/PDF buttons. The dropdown lets users pick any season — or "All seasons" — before exporting.

---

## UI

The export card gains one new row between the description text and the CSV/PDF buttons:

```
📤 Export Data                              ⭐ Premium
Download your match history as CSV or PDF.

Season  [ 2025                           ▾ ]

[ 📊 CSV ]  [ 📄 PDF ]
```

- The row is a label ("Season") + a `<select>` element with `id="export-season-select"`
- Styled to match the existing card surface tokens (`#262a31` bg, `rgba(255,255,255,.12)` border, `#dfe2eb` text)
- No Tailwind classes — uses plain CSS in `style.css` under `.export-season-row`

---

## Dropdown options

Options are built in `renderSettings()` inside `settings-render.js`:

1. "All seasons" (`value="all"`) — always first
2. One option per season from `getAllSeasons(getAllMatches())`, sorted ascending

If `getAllMatches()` returns an empty array (matches not yet cached), the list falls back to `extraSeasons` from settings — acceptable degradation.

**Default selection:** the current `activeSeason` from settings (or current year if `activeSeason` is empty). Set on every render of the settings tab. The value is **not persisted** — it resets to the active season each time the tab is opened.

---

## Export behaviour

Both `exportCSV()` and `exportPDF()` read the selected value from `#export-season-select` at call time.

### Season selected (e.g. "2025")
- Filter matches with existing `matchesSeason(k, season)` — no change to that function
- PDF subheading: `Season 2025`
- CSV filename: `athlytics-2025.csv`

### "All seasons" selected (`value="all"`)
- Skip the season filter — export all matches
- PDF subheading: year range derived from matches, e.g. `2024 – 2026` (min and max of `parseInt(k.date.slice(0,4))` across all matches). If all matches share one year, show just that year.
- CSV filename: `athlytics-all.csv`

---

## Code changes

### `app.html`
Add the season row inside `.export-btns`'s parent div, between the description `<p>` and `.export-btns`:

```html
<div class="export-season-row">
  <span data-i18n="export_season_label">Season</span>
  <select id="export-season-select"></select>
</div>
```

### `style.css`
Add `.export-season-row` styles:
- `display: flex; align-items: center; gap: 10px; margin-bottom: 10px`
- `select` styled to match surface tokens (background, border, text colour, border-radius)

### `settings-render.js`
In `renderSettings()`, after the function renders the settings card, populate `#export-season-select`:
- Build options: "All seasons" + seasons from `getAllSeasons(getAllMatches())`
- Set selected value to `activeSeason || String(new Date().getFullYear())`

### `export.js`
- Replace `getActiveSeasonMatches(all, s)` with a new helper `resolveExportScope(all)` that reads `#export-season-select`:
  - `value === 'all'` → return `{ matches: all, season: 'all', label: buildYearRange(all) }`
  - otherwise → return `{ matches: all.filter(...), season: value, label: value }`
- `buildYearRange(matches)` — derives `min–max` year string; falls back to current year if no matches
- Update `exportCSV` and `exportPDF` to use `resolveExportScope`
- PDF subheading uses `result.label` instead of hardcoded `season`
- CSV filename uses `result.season` (already `'all'` or `'2025'`)

### `i18n.js`
Add key `export_season_label`:
- `no`: `'Sesong'`
- `en`: `'Season'`

(Key `export_season` already exists for the PDF subheading prefix — reuse it there.)

---

## What is NOT changing

- `activeSeason` in settings is not touched — the dropdown is purely ephemeral UI state
- `matchesSeason()` logic is unchanged
- The existing `export_season` i18n key (used in PDF header prefix) is reused as-is
- No new Supabase queries — export still uses `getMatchesForExport()` which pulls from cache or fetches once
