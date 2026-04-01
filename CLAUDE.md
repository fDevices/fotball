# Athlytics Sport – Prosjektdokumentasjon for Claude

> Denne filen gir Claude full kontekst om prosjektet ved oppstart av nye samtaler.

---

## Instruksjoner for Claude

- **Les alltid prosjektfilene ved oppstart** av nye samtaler før du gjør endringer.
- Prosjektet er splittet i moduler: `app.html`, `style.css`, og `js/`-mappen (se filstruktur nedenfor).
- **All koding skal være på engelsk** – variabelnavn, funksjonsnavn, ID-er, CSS-klasser, kommentarer, Supabase-kolonnenavn, localStorage-nøkler og kode-konstanter. Norsk tekst er OK kun i UI-strenger som vises til bruker (via `t()` i `i18n.js`).
- **Etter hver fullført oppgave:** oppdater relevante gjeldsposter i `CLAUDE.md` (merk som ✅ Ferdig eller slett hvis utdatert), legg til en kort post i `CHANGELOG.md`, og commit. Vurder om informasjon i `CLAUDE.md` heller bør flyttes til `docs/changelog.md` eller slettes helt når den ikke lenger er relevant som arbeidsreferanse.

---

## Infrastruktur

| | |
|---|---|
| **Live URL** | https://athlyticsport.app og https://www.athlyticsport.app |
| **GitHub** | https://github.com/fDevices/fotball (public, `main` branch) |
| **Hosting** | Vercel – prosjekt: `fdevices-projects/fotball` |
| **Routing** | `vercel.json`: `/` → `landing.html` (marketing/entrypoint), `/app` → `app.html` (appskall). To-entry-modell: `landing.html` er permanent markedsføringsside; `app.html` er selve appen. Begge må deployeres ved releaser. `landing.html` redirecter automatisk til `/app` hvis `athlytics_session` er gyldig (sjekkes i `<head>` før render). |
| **Database** | Supabase – URL og service keys settes via Vercel env vars. Anon key (`sb_publishable_`) er hardkodet i `js/config.js` — dette er design by intent; nøkkelen er offentlig og RLS beskytter data. Rotér ved mistanke om misbruk. |
| **E-post** | Resend – ⚠️ **Husk å gjenopprette e-postkonfigurasjon etter testing er fullført** |
| **Edge Functions** | `supabase/functions/delete-account/` — deployed via `supabase functions deploy delete-account`. Requires `SUPABASE_SERVICE_ROLE_KEY` set in Supabase project secrets. |

---

## Workflow

1. Utvikler tester lokalt (`file://` eller lokal server)
2. Pusher til GitHub manuelt (inkludert oppdatert `CLAUDE.md`, `app.html`, `style.css`, og alle filer i `js/`)
3. Vercel auto-deployer fra `main`
4. Ny samtale startes etter større endringer

---

## ⛔ MVP-gjeld – løs før skalering

Følgende er kjent teknisk og sikkerhetsmessig gjeld som **må** løses før appen åpnes for flere brukere:

| Problem | Alvorlighet | Løsning |
|---|---|---|
| Semantisk HTML mangler (`main`, `section`, `form`, `fieldset`, `dialog`) | 🟡 Medium | ✅ Ferdig — `<main>`, `<section aria-label>`, `<form novalidate>` implementert 2026-03-21 |
| Modaler mangler ARIA (`role="dialog"`, `aria-modal`, fokusstyring) | 🟡 Medium | ✅ Ferdig — ARIA + fokusstyring (save/restore/trap) på alle fire modaler 2026-03-21 |
| Custom dropdowns mangler keyboard/ARIA-støtte | 🟡 Medium | ✅ Ferdig — keyboard nav (arrow keys, Enter, Escape) implementert 2026-03-27 |

> Auth og RLS er implementert (Fase 4). Nye features kan nå avhenge av brukerdata.
>
> **Sikkerhetsposisjon auth.js (MVP):** Access- og refresh-token lagres i `localStorage`. Dette er standard browser-praksis for SPA-er uten backend, men betyr at XSS gir full session-kompromittering. Risikoen dempes av systematisk escaping i render-stier. Akseptabelt for MVP – vurder `httpOnly`-cookie-basert session ved hardening. `logout()` gjør `window.location.reload()` for å nullstille all app-state; dette er en bevisst forenkling og fungerer godt i en liten app. Token-refresh skjer expiry-drevet (5 min buffer).

---

## 🔧 Teknisk gjeld – kode

### main.js / app.html

| Problem | Fil | Alvorlighet | Løsning |
|---|---|---|---|
| `main.js` er blitt et god-object: eier routing, auth-overlay, demo-banner, dato-toggle, cache og bootstrap | `main.js` | 🟡 Medium | ✅ Ferdig | auth-ui.js ekstrahert 2026-03-20. ACTIONS-map → actions.js, dato-toggle → log.js 2026-03-21. |

### supabase.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `fetchSettings()` / `upsertSettings()` peker mot `profiler`-tabellen, men navngivingen antyder egen tabell | 🟡 Medium | ✅ Ferdig — renamed to English (fetchMatches, upsertProfile, etc.) 2026-03-27 |
| `fetchKamper()` sender ingen user_id-filter i query-strengen | 🟡 Merknad | Riktig arkitektur — klient-side filter er unødvendig når RLS er korrekt konfigurert. **Konsekvens:** datakorrekthet og personvern avhenger av at RLS-policy er riktig. Test policies grundig ved endringer. |

### settings.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| Domain-verdier bruker norsk: `sport='fotball'`, `seasonFormat='aar'`/`'sesong'` – lagres i localStorage og Supabase | 🟡 Medium | ✅ Ferdig — renamed to English + localStorage boot migration 2026-03-27. Supabase-rader verifisert tomme (COUNT=0), ingen SQL-migrasjon nødvendig. |

### app.html

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `app.html` inneholder norske standardstrenger (placeholders, settings-tekst) som overskrives etter load | 🟢 Lav | Bevisst valg: `updateAllText()` og `renderSettings()` kjøres ved bootstrap. Skjørt hvis render-syklusen feiler. Vurder nøytralt / tom HTML ved Fase 3-redesign. |

### profile.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `uploadImage()` lagrer base64 i localStorage – risiko for quota-feil ved store bilder | 🟡 Nesten ferdig | ✅ Ferdig – merget `feature/avatar-storage` 2026-03-21. Supabase Storage for autentiserte brukere. |
| `saveProfile()` avhenger av remote state ved lagring: fetcher Supabase for å bevare arrays/avatar, tar bare tekstfelt fra skjema | 🟡 Medium | ✅ Ferdig – bruker `Object.assign({}, getProfile(), { name, club })`. Cache er autoritativ; ingen nettverksroundtrip ved lagring. |

### modal.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `closeModal()` resetter mange felt manuelt – korrekt i dag, men kostbart å utvide | 🟡 Medium | ✅ Ferdig – `mState`-objekt + `Object.assign(mState, MODAL_DEFAULTS)` ved lukking. |

> **Kritisk invariant:** `modalAdjust()` og `adjust()` **må** alltid ha identisk clamp-logikk. Endre aldri én uten den andre.

### assessment.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| Premium-gate bruker `isDevPremium()` som alltid returnerer `true` – er dev-toggle, ikke ekte entitlement | 🟡 Medium | Assessment-funksjonen er tilgjengelig for alle i praksis. Kobles til Stripe/ekte abonnement i Fase 4. Ikke endre `isDevPremium()` til `false` uten at betalingsflyt er på plass. |
| `saveAssessment()` blander DOM-reads, API-kall, state-mutasjon, toast og knapp-state i én funksjon | 🟢 Lav | Akseptabelt nå; stopp videre vekst i samme retning. |

### navigation.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `updateLogBadge()` hardkoder sport-til-ikon-mapping inline | 🟢 Lav | Flytt til `SPORT_META`-map ved Fase 3 multi-sport |

### stats-overview.js / stats-analyse.js / stats-search.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `innerHTML` med store HTML-strenger – risiko for glemte escapes | 🟡 Medium | ✅ Auditert 2026-03-21 – all brukerdata escapes med `esc()`. Ingen hull funnet. |

### export.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| PDF-implementasjon er `window.open + print()` – kan blokkeres av popup-blokkering | 🟡 Medium | ✅ Ferdig – bruker skjult `<iframe>` istedet for `window.open()`; aldri blokkert av popup-blokkering. |

---

## Filstruktur

```
app.html                – HTML-skall, laster kun <script type="module" src="js/main.js">
style.css               – all CSS
js/
  config.js             – SUPABASE_URL, SUPABASE_KEY, storage-nøkler
  supabase.js           – alle HTTP-kall mot Supabase REST API
  state.js              – _allMatches (privat), getAllMatches(), setAllMatches(), invalidateMatchCache()
  utils.js              – esc(), isDevPremium(), clampStats(), getResult()
  toast.js              – showToast()
  settings.js           – getSettings(), saveSettings(), defaultSettings(), buildSeasonLabel(), getAllSeasons(), getDateLocale(), requestRenderSettings()
  i18n.js               – TEKST, t(), toggleLangPicker() — pure dictionary only
  auth-ui.js            – auth overlay (open/close/toggle view), login/signup handlers, demo banner
  text-refresh.js       – DOM text and flag updates: setLang(), updateFlags(), updateAllText()
  profile.js            – profil-data, cache, Supabase-sync, rendering av profil-tab
  teams.js              – alle dropdown-funksjoner for lag og turnering (logg + modal)
  navigation.js         – switchTab(), updateLogBadge()
  settings-render.js    – renderSettings(), setSport(), setSeasonFormat(), setDateFormat(), setActiveSeason(), addSeason(), applyTheme()
  log.js                – adjust(), saveMatch(), resetForm(), setMatchType(), updateResult()
  stats-overview.js     – loadStats(), renderStats(), filter state, setSeason(), setTeamFilter(), setTournamentFilter(), setMatchPage(), setOpponentSearch(), calcWDL()
  stats-analyse.js      – renderAnalyse(), renderFormStreak(), destroyCharts(), initChartDefaults()
  stats-search.js       – renderMatchListPaged() — pure renderer, no state
  modal.js              – openEditModal(), closeModal(), modalAdjust(), saveEditedMatch(), deleteMatch()
  assessment.js         – self-assessment state, rendering, save/payload functions
  export.js             – exportCSV(), exportPDF()
  danger.js             – danger zone: initDangerZone(), toggleDangerPanel(), onDangerInput(), confirmDeleteMatches(), confirmDeleteAccount()
  auth.js               – session lifecycle, login/signup/logout/restoreSession via Supabase Auth REST API
  main.js               – bootstrap, sentralisert event delegation (ACTIONS-map)
```

---

## Event delegation

All brukerinteraksjon går via sentralisert event delegation i `main.js`. **Ingen** `onclick`- eller `onchange`-attributter i `app.html`.

### Mønster i HTML:
```html
<button data-action="saveMatch">Lagre kamp</button>
<button data-action="adjust" data-type="home" data-delta="1">+</button>
<button data-action="switchTab" data-tab="stats">Statistikk</button>
<div data-action="openEditModal" data-id="{{ k.id }}">...</div>
```

### ACTIONS-map i `main.js`:
Alle actions er registrert i `const ACTIONS = { ... }`. Ved nye knapper: legg til `data-action` i HTML og en tilsvarende handler i ACTIONS-mapet.

### Cross-modul events (custom DOM events):
Brukes for å bryte sirkulære avhengigheter mellom moduler:
- `athlytics:toast` – `{ detail: { msg, type } }` → showToast() i main.js
- `athlytics:renderSettings` – dispatched by settings.js:requestRenderSettings() → renderSettings() i main.js
- `athlytics:updateAllText` – dispatched by i18n.js:setLang() → renderLogSub(), updateResult(), updateLogBadge() i main.js
- `athlytics:loadStats` – dispatched by navigation.js:switchTab() → loadStats() i main.js
- `athlytics:destroyCharts` – dispatched by navigation.js:switchTab() → destroyCharts() i main.js
- `athlytics:matchesChanged` – dispatched by modal.js after save/delete, and by danger.js after deleteAllMatches → loadStats(true) i main.js
- `athlytics:requireAuth` – dispatched by WRITE_ACTIONS gate, keydown Enter guard, and uploadImage guard → openAuthOverlay('login') i main.js

---

## Avhengighetsgraf

```
config.js
    ↓
auth.js                        ← imported by supabase.js, profile.js, settings.js, auth-ui.js, main.js
    ↓
supabase.js
    ↓
state.js    utils.js    toast.js
    ↓
settings.js
    ↓
i18n.js  ←  settings.js
    ↓
text-refresh.js  ←  i18n.js, settings.js        ← imported by main.js
auth-ui.js       ←  auth.js, profile.js, navigation.js, i18n.js, config.js  ← imported by main.js
    ↓
profile.js   teams.js   settings-render.js   navigation.js
    ↓           ↓              ↓                   ↓
  log.js     modal.js    stats-overview.js      export.js    danger.js
                  ↓          ↙      ↘
                  ↓  stats-analyse  stats-search
                  ↘              ↙
                      main.js  (orkestrator)
```

`auth.js` importeres av `supabase.js` (for session token), `profile.js`, `settings.js` og `main.js` (for `getUserId()`, `isAuthenticated()`, `restoreSession()`, `logout()`).

`state.js` bryter sirkulær risiko: `stats-overview.js`, `modal.js` og `export.js` bruker alle `getAllMatches()` uten å importere hverandre.

---

## Appens struktur

### Fire tabs

| Tab | Ikon | Funksjon |
|-----|------|----------|
| Logg | ⚽ | Registrer kampdata |
| Statistikk | 📊 | Sesongoversikt, historikk og analyse |
| Profil | 👤 | Spillerprofil, lag og turneringer |
| Innstillinger | ⚙️ | Sport, sesongformat, aktiv sesong, eksport |

---

## Datakontrakter

### Supabase-tabell: `matches`

```
id (uuid, auto)
user_id (uuid, NOT NULL, DEFAULT auth.uid(), FK to auth.users(id) ON DELETE CASCADE)
date (date)
opponent (text)
own_team (text)
tournament (text)
home_score (int)
away_score (int)
goals (int)
assists (int)
match_type (text) -- ALWAYS 'home' or 'away'
created_at (timestamptz)
result -- calculated client-side, not stored in DB
rating_overall     SMALLINT (1–5, nullable)
rating_effort      SMALLINT (1–5, nullable)
rating_focus       SMALLINT (1–5, nullable)
rating_technique   SMALLINT (1–5, nullable)
rating_team_play   SMALLINT (1–5, nullable)
rating_impact      SMALLINT (1–5, nullable)
reflection_good    TEXT (nullable)
reflection_improve TEXT (nullable)
```

### Supabase-tabell: `profiles`

```
id (uuid, FK to auth.users(id))
name (text)
club (text)
team (jsonb, default '[]')       ← DB column name is 'team'; JS in-memory field is 'teams'
favorite_team (text)
tournaments (jsonb, default '[]')
favorite_tournament (text, default '')
avatar_url (text)
sport (text, default 'football')
season_format (text, default 'year')
active_season (text, default '')
lang (text, default 'no')
created_at (timestamptz)
updated_at (timestamptz)
```

> **Merk:** JS-profilobjektet bruker feltnavn `teams` (array) internt. `saveProfileToSupabase()` mapper dette til DB-kolonnen `team`. `fetchProfileFromSupabase()` leser `row.team` og lagrer som `teams` i JS-objektet. Dette er et kjent unntak fra ellers identisk navngivning.

**All kode og alle Supabase-kolonner bruker engelske navn.** Navngivningen er konsistent med ett kjent unntak: JS bruker `teams`, DB bruker `team` (se merknad over).

### localStorage-nøkler

```
athlytics_profil    → { name, club, position, teams[], favoriteTeam, tournaments[], favoriteTournament, avatar }  ← note: Norwegian spelling in actual key
athlytics_settings  → { sport, seasonFormat, activeSeason, lang, extraSeasons[] }
sessionStorage: 'athlytics_matches'  → cache, invalidated after save/edit/delete
```

---

## Kodenavn-konvensjoner

All kode bruker engelsk for variabelnavn, funksjonsnavn, ID-er, CSS-klasser og Supabase-kolonnenavn – med ett kjent unntak:
- `teams` (JS) ↔ `team` (DB) — én kjent mapping, se profiles-kontrakten

| JS-variabel | Supabase-kolonne |
|---|---|
| `k.date` | `date` |
| `k.opponent` | `opponent` |
| `k.own_team` | `own_team` |
| `k.home_score` / `k.away_score` | `home_score` / `away_score` |
| `k.goals` | `goals` |
| `k.match_type` | `match_type` — ALWAYS `'home'` or `'away'` |

---

## ⚠️ Kritiske konvensjoner – lær av tidligere bugs

### clampStats() – delt invariant for adjust() og modalAdjust()
Begge bruker `clampStats(goals, assists, ownScore)` fra `utils.js`. Logikken er:
- Goals kan ikke overstige eget lags score
- Assist kan ikke overstige `ownScore − goals`
- Senkes score, clampes goals og assist automatisk ned
- Eget lags score = `home` i logg-skjema, `mHome`/`mAway` i modal (styres av matchType)

**Ikke dupliser clamping-logikk** — bruk alltid `clampStats()`. Endre aldri én implementasjon uten den andre.

### activeLag – filterverdier
`activeLag` bruker alltid strengen `'all'` som standardverdi og "alle team"-nøkkel. **Aldri bruk `'alle'`**.

### kamptype-verdier
`matchType` bruker **'home'** og **'away'** – dette gjelder overalt: JS-variabler, `match_type`-feltet i Supabase-payloads, og all logikk som sjekker kamptype.

### CSS-klasser for resultat
`.result-auto` bruker klassene **'wins'**, **'draw'**, **'loss'** – disse må matche nøyaktig med verdiene `getResult()` returnerer.
```css
.wins { color: #00f2ff; border-color: #00f2ff; }  /* cyan */
.draw { color: #ffe173; border-color: #ffe173; }  /* gold */
.loss { color: #ffb4ab; border-color: #ffb4ab; }  /* red */
```
Ikke bruk `.uavgjort`, `.tap` eller andre norske klassenavn. **Ikke legg til `background` på disse klassene** — semi-transparent tint over mørk bakgrunn gir stygge oliven-farger.

### adjust()-funksjonen – logg-skjema
Score (home/away) og spillerstatistikk (goals/assist) er **uavhengige**:
- `adjust('home', delta)` / `adjust('away', delta)` – endrer kun score og kaller `updateResult()`
- `adjust('goals', delta)` / `adjust('assist', delta)` – endrer kun stats, påvirker **ikke** scoren
- Mål kan maks være lik eget lags score; assist kan maks være `eget lags score − mål`
- Hvis score senkes under goals, clampes goals (og assist) automatisk ned
- Eget lags score = `home` ved hjemmekamp, `away` ved bortekamp

### In-memory cache
`getProfile()` og `getSettings()` bruker `_profileCache` / `_settingsCache` (private i sine respektive moduler).
Bruk alltid `saveProfile_local(profil)` (ikke `localStorage.setItem` direkte) for å holde cachen synkronisert.

### Modal felt-ID-er
Modal-inputene har ID `modal-dato` og `modal-motstander` (ikke `modal-date` / `modal-opponent`).

### Chart.js – destroy-pattern
**Alltid** kall `destroyCharts()` øverst i `renderStats()` og ved tab-bytte (`switchTab`).
Uten dette lekkjer Chart.js-instanser og grafer tegnes dobbelt ved re-render.

### Stats-tab HTML-struktur
```
#screen-stats
  .stats-body
    .stats-view-toggle        ← toggle Oversikt / Analyse
    #stats-filters            ← sesong + lag pills (skjules i analyse)
      #season-selector
      #team-filter-selector
    #stats-content            ← rendres av renderStats() / renderAnalyse()
```
I analyse-visningen rendres sesong/lag-selectors **inline** øverst i `#stats-content` (siden `#stats-filters` er skjult).

### Avatar upload
Avatar-circle bruker `data-action="triggerAvatarUpload"` → ACTIONS-map kaller `#avatar-upload.click()`. Avatar-input bruker `data-action="uploadImage"` → delegert `change`-event i `main.js`. Ingen `onclick`/`onchange`-attributter og ingen `window._uploadImage` global.

`uploadImage()` bruker Supabase Storage for autentiserte brukere og base64 for demo-brukere. Merget fra `feature/avatar-storage` 2026-03-21.

---

## i18n-system

```javascript
// i18n.js
const TEKST = { no: { ... }, en: { ... } };
export function t(key) { ... }
```

- `updateAllText()` – oppdaterer alle tabs ved språkskifte
- `updateFlags()` – bruker `querySelectorAll('.lang-flag-btn')` for alle tabs
- `toggleLangPicker(btn)` – finner dropdown via `btn.closest('.lang-picker-wrap')`
- **OBS:** Tab-nøkler i `TEKST` heter `tab_log`, `tab_stats`, `tab_profile`, `tab_settings` – merk `tab_profile` (ikke `tab_profil`)

---

## Design

**Kinetic Velocity design system (live on main as of 2026-03-31)**

- Font: **Space Grotesk** (headlines/labels) + **Inter** (body)
- Primary accent: `#00f2ff` (cyan) — replaces `#a8e063` (lime)
- Surface tokens: `#10141a` bg · `#1c2026` cards · `#262a31` elevated · `#31353c` nav
- Text: `#dfe2eb` primary · `#b9cacb` muted
- Gold/Pro: `#ffe173` · Error/loss: `#ffb4ab`
- Glassmorphic top nav: `#31353c` @ 60% opacity + `backdrop-filter: blur(20px)`
- Grid texture: `body::before` radial-gradient dots, 40px spacing
- Tailwind CDN (no build step) — tokens in `tailwind.config` block in `app.html`. **⚠️ CDN `<script>` must come BEFORE `tailwind.config = {...}`** — assigning config before the CDN loads throws a `ReferenceError` and all custom color tokens silently fail.
- **⚠️ Tailwind cascade override** — Tailwind CDN injects its `<style>` tag at runtime, AFTER `style.css` loads. For equal-specificity rules (e.g. `.some-class { display: flex }`), Tailwind wins. Use `!important` in `style.css` when a rule must override a Tailwind utility (e.g. `display: none !important` in media queries, `display: block !important` for forced visibility).
- Chart.js via CDN: `https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js` (defer i `<head>`)
- **CSS `:root` variables** — JS files use `var(--lime)`, `var(--gold)`, `var(--danger)`, `var(--muted)`, `var(--white)`, `var(--border)` in dynamically-rendered HTML. These are defined in `style.css :root`. Tailwind classes do NOT cover these; they must stay in `:root`.
- **Share page** (`share.html` + `js/share-viewer.js`) uses plain CSS from `style.css` — no Tailwind. Share page classes are prefixed `.share-*` and `.match-*`.

---

## Plattform-beslutninger

### Ikonsystem
SVG-ikoner ligger i `/icons/`-mappen. Tab-ikoner fargestyres via CSS `mask-image`; flaggikoner brukes som `<img>`. For å bytte et ikon: erstatt SVG-filen — ingen kodeendringer nødvendig.

Se **`ICONS.md`** for alle SVG-filinnhold og CSS-mønster.

### Portrait-lås
Appen er portrait-only. Landscape viser en overlay: "Roter telefonen til stående modus".
- CSS: `.landscape-block` med `@media (orientation: landscape) and (max-height: 600px)`
- Meta: `<meta name="screen-orientation" content="portrait">`
- Threshold `max-height: 600px` unngår at overlayden vises på desktop-browsere i smalt vindu

### Desktop (Fase 3/4)
Stats-tab har responsivt to-kolonne layout på desktop (≥900px): Oversikt + Analyse vises side om side, tab-bar strekker seg full bredde, toggle er skjult. Implementert 2026-03-23.

Gjenstående desktop-arbeid venter til Fase 3/4:
- **Mobil** – logging av kamper, rask sjekk av enkeltstatistikk
- **Desktop** – sidebar-nav istedet for tab-bar, coach/admin-visning

Desktop kobles naturlig til **Club-planen** (Fase 4).

---

## Multi-sport theming (implementert, aktiveres i Fase 3)

`THEMES`-objekt og `applyTheme(sport)` er implementert i `settings-render.js`. `sport_icon`, `stat1_label`, `stat2_label` finnes i `TEKST`. Kalles fra `setSport()` og bootstrap.

```javascript
const THEMES = {
  football:    { grass: '#1a3a1f', lime: '#a8e063', card: '#162b1a' },
  orientering: { grass: '#1a2a3a', lime: '#63b8e0', card: '#162130' },
  ski:         { grass: '#1a1a3a', lime: '#a0a8e0', card: '#161628' }
};
```

Ved ny sport: legg til rad i `THEMES`, legg til `sport_icon`/`stat1_label`/`stat2_label` i `TEKST`, valider mot tillatt-liste i `setSport()`.

---

## Roadmap

### Fase 2.5 – Deling
- [x] Share link — player generates shareable URL, third party views stats + profile (no assessments). Foundation for Fase 4 coach dashboard.

### Pro stats analysis (implementert 2026-03-29)
- [x] Performance Profile, Scoring Streaks, Head-to-Head, Monthly Breakdown (Overview tab, Pro-gated)
- [x] Rating Trend chart (Analyse tab, Pro-gated)

### Fase 3 – Multi-sport
- [ ] Orientering, ski

### Fase 4 – Monetisering
- [ ] Stripe-integrasjon
- [ ] `isPremium()` kobles til Stripe-abonnement
- [ ] Coach/parent/scout dashboard-kontoer — tredjeparter med egen innlogging som kan følge én eller flere spillere. Naturlig bygget på toppen av share-link-funksjonen (Fase 3). **Vurder Supabase Edge Functions** for dette steget: de passer godt til rollen som mellomlag (validering, tilgangsstyring, notifikasjoner) og er bedre egnet til kompleksiteten i en fler-bruker/coach-flyt enn rene PostgreSQL-funksjoner.

---

## Monetiseringsplan

| Nivå | Innhold | Pris |
|------|---------|------|
| Gratis | 1 lag, 1 sesong, basis statistikk, form-streak | kr 0 |
| Pro | Ubegrenset lag/sesonger, analyse-grafer, eksport CSV+PDF, performance profile, scoring streaks, head-to-head, monthly breakdown, rating trend chart | ~kr 49/mnd |
| Club | Flere brukere, deling, lagadmin | ~kr 199/mnd |

**Uavklart:** Per turnering-statistikk (gratis eller Pro?), multi-sport (Pro-tillegg?), PDF alene vs CSV+PDF samlet
