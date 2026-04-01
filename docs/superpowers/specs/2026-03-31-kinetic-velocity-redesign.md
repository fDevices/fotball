# Athlytics Sport — Kinetic Velocity Redesign Spec

**Date:** 2026-03-31
**Status:** Approved

---

## Overview

Full visual redesign of `app.html` and `landing.html` from the current dark-green "Pitch" aesthetic to the "Kinetic Velocity" design system. This is a visual-only migration — all JS logic, Supabase integration, and feature behaviour are unchanged.

**In scope:** `app.html`, `landing.html`, `style.css`, chart colors in `stats-analyse.js`
**Out of scope:** Multi-sport (Phase 3), new features, JS logic changes

---

## Implementation Strategy

**Big-bang rewrite in a git worktree.** `main` stays live and untouched throughout. The redesign lands as a single PR once all screens are complete and reviewed.

**CSS approach:** Tailwind CSS via CDN (same pattern as existing Chart.js CDN). No build step. A minimal `style.css` (~100 lines) remains for things Tailwind cannot express (see below).

---

## Design System: Kinetic Velocity

### Color Tokens

| Token | Value | Usage |
|---|---|---|
| `surface` / bg | `#10141a` | Page background |
| `surface-container` | `#1c2026` | Cards, inputs |
| `surface-container-low` | `#181c22` | Tab bar, sections |
| `surface-container-high` | `#262a31` | Elevated cards, hover states |
| `surface-container-highest` | `#31353c` | Glassmorphic nav base |
| `primary-container` | `#00f2ff` | CTA buttons, active states, links |
| `on-primary` | `#00363a` | Text on cyan buttons |
| `on-surface` | `#dfe2eb` | Primary body text |
| `on-surface-variant` | `#b9cacb` | Muted / secondary text |
| `outline-variant` | `#3a494b` | Borders, dividers (at 40% opacity) |
| `tertiary-fixed` | `#ffe173` | Gold — Pro/premium badges, draw result |
| `error` | `#ffb4ab` | Danger, loss result, delete |
| Glassmorphic nav | `#31353c` @ 60% opacity + `blur(20px)` | Fixed top nav |

### Typography

| Role | Font | Weight |
|---|---|---|
| Display / H1 / headings | Space Grotesk | 600–700 |
| Labels / badges / uppercase | Space Grotesk | 600, uppercase |
| Body text | Inter | 400–500 |
| Stat numbers | Space Grotesk | 700 |

Google Fonts import: `Space Grotesk:wght@300;400;500;600;700` + `Inter:wght@400;500;600`

### Border Radius

| Usage | Value |
|---|---|
| Inputs, cards | `8px` (Tailwind `rounded-lg`) |
| Modal top corners | `12px` |
| Pills / badges | `9999px` (Tailwind `rounded-full`) |

### Background Texture

Grid pattern via `body::before`: `radial-gradient(#1c2026 1px, transparent 1px)` at `40px 40px`. Lighter than current app — dots instead of lines.

---

## File Changes

### `app.html` — full rewrite

Structure changes:
- **Remove** 4 per-screen `.header` divs
- **Add** single `<header>` fixed top nav (glassmorphic, contains logo + lang picker + avatar icon)
- **Each screen** gets its own title block inside its content area (screen label + h1, matching mockup pattern: small uppercase subtitle + large title)
- All existing `data-action`, `data-tab`, `data-id` attributes preserved exactly — JS event delegation is unchanged
- Tailwind utility classes replace all `class="..."` CSS class references in layout/style
- JS-toggled classes (`.active`, `.open`, `.wins`, `.draw`, `.loss`, `.selected`) retained as plain class names, styled via `style.css` `@apply` rules

### `landing.html` — full rewrite

- Cyan/Dark Tech theme (consistent with app — no green)
- Glassmorphic sticky nav
- Hero: `LOG. ANALYSE. WIN.` with cyan accent, same 3-line stacked layout
- Features, pricing, and CTA sections restyled with Kinetic Velocity tokens
- Same structure as current: sticky nav → hero → features → pricing → CTA → footer

### `style.css` — gutted to ~100 lines

Retained custom CSS (not expressible in Tailwind):
```css
/* 1. SVG icon coloring via mask-image */
.tab-svg-icon { -webkit-mask-image: ...; background-color: ... }

/* 2. Keyframe animations */
@keyframes fadeIn { ... }       /* screen transitions */
@keyframes modalSlideUp { ... } /* modal open */
@keyframes dropDown { ... }     /* dropdown open */
@keyframes spin { ... }         /* loading spinner */
@keyframes toastIn { ... }      /* toast notification */

/* 3. Body grid texture */
body::before { background-image: radial-gradient(...); }

/* 4. JS-toggled state classes (plain CSS — @apply not available in CDN mode) */
.active { ... }
.open { ... }
.wins { color: #00f2ff; background: rgba(0,242,255,0.1); border-color: #00f2ff; }
.draw { color: #ffe173; background: rgba(255,225,115,0.1); border-color: #ffe173; }
.loss { color: #ffb4ab; background: rgba(255,180,171,0.1); border-color: #ffb4ab; }

/* 5. Chart.js canvas sizing */
/* 6. Landscape orientation blocker */
```

### `js/stats-analyse.js` — minor update

Update hardcoded chart colors:
- Primary line/bar: `#a8e063` → `#00f2ff`
- Secondary/comparison: `#f0c050` → `#ffe173` (unchanged effectively)
- Background fills: `rgba(168,224,99,0.15)` → `rgba(0,242,255,0.1)`
- Approximately 5–6 hex value changes, no logic changes

---

## Navigation Structure

### Global top nav (new — fixed, `z-50`)
```
[● ATHLYTICS]                    [🇳🇴] [avatar]
```
- Background: `#31353c` @ 60% opacity + `backdrop-filter: blur(20px)`
- Height: ~52px
- Contains: logo mark + wordmark (left), lang picker + avatar circle (right)
- Lang picker relocated here from per-screen headers

### Screen title block (inside each screen's content area)
```
PERFORMANCE DATA ENTRY          ← 9px Space Grotesk uppercase, muted
Match Log                       ← 24px Space Grotesk 700
```

### Bottom tab bar (unchanged structure, new styling)
- Background: `#181c22`
- Top border: `1px solid rgba(58,73,75,0.4)` (no lime tint)
- Active icon: `#00f2ff` (was `#a8e063`)
- Tab labels: Space Grotesk (was Barlow Condensed)

---

## Components: Coverage Map

### Covered by mockups (implement from code.html reference)
- Match log form (inputs, steppers, home/away toggle, result indicator, submit button)
- Stats overview (stat grid, WDL bar, match list, filters)
- Stats analyse (charts, form streak, pro-gated sections)
- Profile (avatar, fields, team/tournament lists)
- Settings (sport display, season format, export, danger zone)
- Landing page (nav, hero, features, pricing, CTA)

### Not in mockups (apply Kinetic Velocity tokens, keep current layout)
| Component | Changes |
|---|---|
| Edit match modal | Bg `#1c2026`, border `outline-variant`, 12px top radius, cyan accents |
| Auth overlay | Cyan border on card, Space Grotesk headline, same split-card layout |
| Toast notifications | Bg `#262a31`, cyan/error borders, unchanged animation |
| Dropdowns | Bg `#181c22`, `outline-variant` border (no cyan border on open state) |
| Assessment tab | Token swap only — layout unchanged |
| Landscape blocker | Bg `#10141a` |
| Loading spinner | Cyan `border-top-color` |
| Demo banner | Restyle with `surface-container-high` bg, cyan text |

---

## Tailwind CDN Configuration

```js
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "surface":                  "#10141a",
        "surface-container-lowest": "#0a0e14",
        "surface-container-low":    "#181c22",
        "surface-container":        "#1c2026",
        "surface-container-high":   "#262a31",
        "surface-container-highest":"#31353c",
        "surface-bright":           "#353940",
        "primary":                  "#e1fdff",
        "primary-container":        "#00f2ff",
        "primary-fixed-dim":        "#00dbe7",
        "on-primary":               "#00363a",
        "on-surface":               "#dfe2eb",
        "on-surface-variant":       "#b9cacb",
        "outline-variant":          "#3a494b",
        "tertiary-fixed":           "#ffe173",
        "error":                    "#ffb4ab",
        "secondary-container":      "#fe00fe",
      },
      fontFamily: {
        "headline": ["Space Grotesk", "sans-serif"],
        "body":     ["Inter", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "0.5rem",
        lg:      "0.5rem",
        xl:      "0.75rem",
        full:    "9999px",
      },
    },
  },
}
```

---

## What Does Not Change

- All JS modules in `js/` (zero functional changes)
- `icons/` SVG files
- `supabase/` edge functions
- `vercel.json` routing
- `js/config.js` Supabase keys
- All `data-action`, `data-tab`, `data-type`, `data-delta`, `data-id` HTML attributes
- i18n system (`i18n.js`, `TEKST` dictionary)
- ARIA attributes (`role="dialog"`, `aria-modal`, focus trap logic)
- localStorage key names and data contracts
- Supabase table schemas

---

## Success Criteria

1. All 4 app tabs and landing page render with Kinetic Velocity design
2. No JS errors in console
3. All existing functionality works: match logging, stats, profile, settings, auth, export
4. Assessment tab functional with new token colors
5. Chart.js charts render with cyan palette
6. Responsive: portrait mobile (≤480px) and desktop stats layout (≥900px) both correct
7. `style.css` is ≤150 lines
