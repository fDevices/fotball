# Athlytics Sport – Changelog

> Historikk over ferdigstilte leveranser. Aktive gjøremål og teknisk gjeld ligger i `CLAUDE.md`.

---

## Fase 1.7 – DB-migrering og kodekonsolidering ✅

- Droppet og recreated Supabase-tabeller med engelske navn: `kamper`→`matches`, `profiler`→`profiles`
- Engelske kolonnenavn: `dato`→`date`, `motstanderlag`→`opponent`, `eget_lag`→`own_team`, `turnering`→`tournament`, `hjemme`→`home_score`, `borte`→`away_score`, `mal`→`goals`, `assist`→`assists`, `kamptype`→`match_type`
- `match_type`-verdier endret fra `'hjemme'`→`'home'` (borte var allerede `'away'`)
- Selvvurdering-kolonner lagt til på `matches`: `rating_effort`, `rating_focus`, `rating_technique`, `rating_team_play`, `rating_impact` (SMALLINT nullable), `reflection_good`, `reflection_improve` (TEXT nullable)
- Oppdaterte filer: `supabase.js`, `config.js`, `log.js`, `modal.js`, `stats.js`, `profile.js`, `export.js`, `settings.js`, `settings-render.js`, `main.js`
- Nye funksjonsnavn i `supabase.js`: `fetchMatches`, `insertMatch`, `updateMatch`, `deleteMatch`, `fetchProfile`, `upsertProfile`
- `res.ok`-sjekk og `console.warn` lagt til i alle Supabase-funksjoner
- `CACHE_KEY` endret til `athlytics_matches` i `config.js`
- `modal.js`: `deleteMatch` omdøpt til `deleteMatch_action` for å unngå navnekonflikt med Supabase-funksjonen
- `settings-render.js`: bruker nå `CACHE_KEY`-import i stedet for hardkodet `'athlytics_kamper'`
- `settings.js`: `oppdatert`→`updated_at`, `k.dato`→`k.date`
- Testdata reimportert: Julian 2025, 52 kamper, nye kolonnenavn, turneringer: Cup Gjelleråsen / Cup KFMU / Cup Heming / Cup Oppegård / Seriespill
- Tab-bar CSS-fix: `--tab-h` økt fra `64px` til `72px` for Safari iPhone-kompatibilitet

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

Reimportert 14.03.2026 via SQL etter Fase 1.7-migrering. 52 kamper fra 2025-sesongen.

**Lag i bruk:** Oppsal, Flamme  
**Turneringer:** Cup Gjelleråsen, Cup KFMU, Cup Heming, Cup Oppegård, Seriespill
