# Athlytics Sport – Changelog

> Historikk over ferdigstilte leveranser. Aktive gjøremål og teknisk gjeld ligger i `CLAUDE.md`.

---

## Teknisk gjeld – opprydding (økt 3, 2026-03-15) ✅

### Bugfikser
- **settings.js** – `getAllSeasons()` brukte `k.dato` i stedet for `k.date` → sesongvelger viste aldri reelle år
- **stats.js** – `setMatchPage()` ignorerte aktiv `opponentSearch` → paginering ga feil resultatliste ved søk
- **stats.js** – `activeSeason` initialisert fra `getSettings().activeSeason` i stedet for hardkodet `'2025'`
- **modal.js** – `saveEditedMatch()` muterte `allMatches` direkte; erstattet med `setAllMatches(allMatches.map(...))`
- **modal.js** – `saveEditedMatch()` manglet validering; validerer nå `date`, `opponent`, `own_team` før API-kall
- **modal.js** – ID-sammenligning normalisert til `String(m.id)` konsekvent i alle funksjoner
- **profile.js** – `posisjon` → `position` i JS-objekt og Supabase-mapping; `row.posisjon` leste et ikke-eksisterende felt

### Kode-kvalitet
- **supabase.js** – alle fetch-funksjoner kaster ved `!res.ok`; `upsertProfil`/`upsertSettings` varsler med `console.warn`
- **settings.js** – `saveSettings()` validerer og normaliserer alle enum-felter og `extraSeasons`-array før lagring
- **settings-render.js** – slettet `getAllSeasonsLocal()`; bruker `getAllSeasons(allMatches)` fra `settings.js` via `state.js`
- **state.js** – `setAllMatches()` validerer input og varsler med `console.warn`; begge catch-blokker er synlige
- **stats.js** – fjernet direkte `sessionStorage`-lesing; bruker `allMatches` fra `state.js` som eneste cache-grense
- **export.js** – fjernet direkte `sessionStorage`-lesing og `CACHE_KEY`-import
- **log.js** – fjernet usikker `res.json()` på feilrespons; bruker `t('toast_feil_lagring')` direkte
- **modal.js** – `closeModal()` resetter nå all intern state (`mHome/mAway/mGoals/mAssists/mMatchType`) og inputfelter
- **teams.js** – guard clauses lagt til i alle DOM-funksjoner (`toggleTeamDropdown`, `closeLagDropdown`, `selectTeam` m.fl.)
- **profile.js** – `saveProfileToSupabase()` bruker `console.warn` i stedet for `console.log`

### i18n
- **stats.js** – fullstendig i18n-pass: 30+ nøkler lagt til i `i18n.js`; alle hardkodede norske strenger erstattet med `t()`
- **stats.js** – datoformatering bruker nå `getSettings().lang` (`en-GB` / `no-NO`) via `fmtDate()` helper
- **stats.js** – W/D/L-forkortelser oversettes (S/U/T på norsk, W/D/L på engelsk) i alle visninger
- **teams.js** – `t()` importert; alle toast-meldinger og dropdown-labels bruker `t()`
- **modal.js** – hardkodede strenger (`'Lagrer...'`, `'Rediger kamp'`, `'denne kampen'`) erstattet med `t()`
- **i18n.js** – nye nøkler: `toast_team_added`, `toast_tournament_added`, `toast_tournament_exists`, `tournament_reset`, `tournament_new`, `this_match`, og 30 stats-relaterte nøkler

---

## Fase 2 – Analyse (grafer, Premium) ✅

- Chart.js CDN i `<head>` (defer)
- `isPremium()`, `switchStatsView()`, `destroyCharts()`, `initChartDefaults()`, `CHART_COLORS`
- Toggle-UI øverst i stats-tab (Oversikt / Analyse ⭐)
- Form-streak – siste 10 kamper som fargede bokser (gratis, begge views)
- Kumulativ seiersprosent (Chart.js linje)
- Mål & assist per kamp (Chart.js dobbel linje)
- Mål per turnering (Chart.js horisontal søyle, grouped)
- Premium-gate med blur-overlay og "Lås opp Pro"-knapp
- Sesong/lag-filter tilgjengelig i analyse-visning (rendres inline i stats-content)
- Motstandersøk i Statistikk-tab – søkefelt over kamphistorikk, mini W/D/L-oppsummering

---

## Fase 1.5 – Teknisk opprydding ✅

- Cache `getSettings()` / `getProfile()` i minnet mellom kall
- Paginering av kamphistorikk (20 per side)
- Google Fonts: preconnect + font-display swap
- Inline turnering-oppretting i logg-dropdown
- Uniform badge-bredde i turnering-statistikk
- Filsplitt: `app.js` → `js/`-moduler med ES module imports

---

## Fase 1 – MVP ✅

- Kamplogger, Vercel, custom domain
- Hjemme/borte, automatisk resultat
- Statistikk med caching
- Profil (navn, klubb, posisjon, bilde, lag-liste)
- Lag-dropdown med favoritt
- Kamphistorikk med rediger/slett
- Profil synket til Supabase
- Settings-tab
- i18n – infrastruktur komplett (full dekning gjenstår i stats/export, se CLAUDE.md)
- Flagg-velger på alle tabs
- Turnering-dropdown med favoritt
- Testdata – Julian 2025 (51 kamper)
- Kode-refaktor: ingen æøå i JS-kodeidentifikatorer (DB-kolonner migreres i Fase 1.7)
- Statistikk: hjemme vs borte-seksjon (inkl. mål/assist/G+A)
- Statistikk: per turnering med S/U/T/G/A/G+A og antall kamper
- Eksport: CSV og PDF (merket Premium)
- Bugfiks: logg-skjema score/mål/assist-logikk (clamp-regler)
- Bugfiks: modal-dato/modal-motstander ID-mismatch

### Fase 1.6 – UX-polish (delvis)
- "Nullstill turnering"-valg i logg-dropdown ✅
- Custom delete-confirm modal (erstattet `window.confirm()`) ✅
- `saveProfile()` henter fersk remote-profil før lagring – forhindrer tap av `team`/`tournaments` ✅
- `saveProfile_local()` normaliserer `team`/`tournaments` til `[]` og lagrer kopi ✅
- `fetchProfileFromSupabase()` logger feil med `console.warn` i stedet for stille catch ✅

### Kode-gjeld og bugfikser (økt 2, Fase 1.6/1.7)
- **supabase.js** – tabellnavn oppdatert til `matches` og `profiles`; `updated_at` brukes (ikke `oppdatert`)
- **supabase.js, log.js, modal.js, stats.js, export.js** – importnavn synkronisert med eksportnavn (`fetchKamper`, `insertKamp`, `updateKamp`, `deleteKamp`)
- **modal.js** – `deleteMatch_action` renamed til `deleteMatch` (eksportnavnet manglet)
- **profile.js, settings.js** – `oppdatert` → `updated_at` i upsert-body
- **i18n.js** – `setLang()` lukker nå alle `.lang-picker-dropdown` (ikke bare én hardkodet ID)
- **app.html** – `data-match-type="hjemme"` → `"home"` på logg- og modal-knapper
- **app.html** – flagg-knapp og sesong-badge på samme linje (`header-top-row`), `lang-picker-wrap` wrapper for korrekt dropdown-posisjonering
- **style.css** – `lang-flag-btn` ikke lenger `position: absolute`; ny `.header-top-row` og `.lang-picker-wrap` CSS
- **main.js** – dato-toggle: lukker på `blur` med 200ms delay (unngår lukking mellom dag/måned/år-feltene på desktop)

---

## Nøkkelfunksjoner implementert

- Kamplogger med hjemme/borte-toggle og automatisk beregnet resultat
- Statistikk-tab med sesongvelger, lag-filter, seier/uavgjort/tap-kort, mål/assist/G+A
- Form-streak – siste 10 kamper som fargede bokser (S/U/T), vises i begge stats-visninger
- Hjemme vs Borte-seksjon – to kort med W/D/L, mål/assist/G+A og mini-bar per kamptype
- Per turnering-seksjon – turneringsnavn + antall kamper, S/U/T + G/A/G+A med uniform badge-bredde
- Kamphistorikk med paginering (20 per side) og slide-up redigeringsmodal (edit + slett)
- Analyse-tab (Fase 2) – Chart.js-grafer bak toggle: kumulativ seiersprosent, mål/assist per kamp, mål per turnering
- Premium-gate – gratis ser form-streak + låst kort med blur-overlay; `isPremium()` hardkodet `true` til Fase 4
- Profil synkronisert til Supabase
- Lag-dropdown i logg (fra profil), med favorittlag
- Turnering-dropdown i logg og redigeringsmodal – ny turnering opprettes inline
- Profil: mine lag-liste og mine turneringer med ☆ favoritt og slett
- Settings-tab: sport, sesongformat, aktiv sesong
- Eksport – CSV-nedlasting og PDF-rapport (merket ⭐ Premium i UI)
- i18n-system (norsk/engelsk) med flagg-velger på alle tabs – infrastruktur komplett
- Toast-notifikasjoner
- Google Fonts med preconnect + font-display swap
- Filsplitt – `app.js` erstattet av `js/`-moduler med ES module imports/exports

---

## Design

- Font: **Barlow Condensed** (overskrifter) + **Barlow** (brødtekst)
- Farger: `--grass: #1a3a1f` · `--lime: #a8e063` · `--card: #162b1a` · `--danger: #e05555` · `--gold: #f0c050`
- Mørk grønn estetikk, grid-mønster bakgrunn, max-width 480px sentrert
- Chart.js via CDN: `https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js` (defer i `<head>`)

---

## Plattform-beslutninger

### Portrait-lås
Appen er portrait-only. Landscape viser en overlay: "Roter telefonen til stående modus".
- CSS: `.landscape-block` med `@media (orientation: landscape) and (max-height: 600px)`
- Meta: `<meta name="screen-orientation" content="portrait">`
- Threshold `max-height: 600px` unngår at overlayden vises på desktop-browsere i smalt vindu

### Desktop (Fase 3/4)
Desktop-versjon venter til Fase 3/4. Bruksmønster:
- **Mobil** – logging av kamper, rask sjekk av enkeltstatistikk
- **Desktop** – full analyse, større grafer, coach/admin-visning

Desktop kobles naturlig til **Club-planen** (Fase 4). Ved implementering: sidebar-nav istedet for tab-bar, to-kolonne stats-layout, grafer med mer plass og detalj.

---

## Testdata – Julian 2025

Importert 08.03.2026 via SQL. 51 kamper fra 2025-sesongen (fjernes ved DB-migrering i Fase 1.7):

| | |
|---|---|
| Kamper | 51 |
| Seier / Uavgjort / Tap | 37 / 3 / 11 |
| Mål | 141 |
| Assist | 110 |

**Lag i bruk:** Oppsal, Oppsal Flamme, Oppsal MS  
**Turneringer:** Cup Gjelleråsen, Cup KFMU, Heming Cup, Serie, Seriespill, Kretscup
