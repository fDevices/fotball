# Athlytics Sport – Changelog

> Historikk over ferdigstilte leveranser. Aktive gjøremål og teknisk gjeld ligger i `CLAUDE.md`.

---

## 2026-03-31 — Kinetic Velocity redesign (in progress, worktree: redesign/kinetic-velocity)

- **Spec + plan**: Full design spec and 14-task implementation plan committed to `docs/superpowers/specs/` and `docs/superpowers/plans/` on `main`
- **Tailwind CDN foundation** (Task 2): `app.html` `<head>` replaced — Google Fonts (Space Grotesk + Inter), 16 Kinetic Velocity color tokens in `tailwind.config`, Tailwind CDN script, Chart.js CDN kept
- **style.css rewrite** (Task 3): 1188 lines → ~200 lines — SVG mask-image icon coloring, keyframe animations, body grid texture, JS-toggled state classes (`.wins/.draw/.loss`, `.open`, `.active`), JS-rendered component styles (stat-grid, WDL bar, match-row, t-badge, season/team pills, form-streak, pro-gate, desktop two-column layout)
- **Class alias fix**: Added `.stat-num.lime`/`.stat-num.danger` and `.t-badge.goals`/`.t-badge.ga` aliases so existing JS output maps to new tokens without JS changes

---

## 2026-03-30 — Landing page auth flow

- **Auto-redirect**: logged-in users visiting `/` are immediately sent to `/app` (no flash of landing page)
- **"Logg inn" nav button**: lime outlined button added to landing page nav, opens login modal directly on the landing page
- **Split-card login/signup modal**: brand panel (left) + form panel (right) with tabbed Logg inn / Registrer. On success redirects to `/app` with session stored in `athlytics_session` (same key/shape as `js/auth.js`)
- Modal is fully accessible: `role="dialog"`, `aria-modal`, focus trap, focus restoration, close button, Enter-safe on button focus, double-submit prevention, input clearing on close
- i18n: "Logg inn" / "Log in" toggle supported in nav button and open modal
- All changes in `landing.html` + `landing.css` only — no changes to `app.html` or `js/`

---

## 2026-03-29 — Housekeeping

- Removed stale worktrees and local branches (`feature/avatar-storage`, `feature/stats-desktop-layout`)
- `.gitignore`: added `.DS_Store`, `.Rhistory`, `scripts/`
- Deleted old icon files (`match-away_old.svg`, `tab-settings_old.svg`)
- Committed stats analysis spec to `docs/superpowers/specs/`

---

## 2026-03-29 — Pro stats analysis features

- **Performance Profile** (Overview tab, Pro) — avg rating bars for all 6 dimensions; hidden when no ratings exist
- **Scoring Streaks** (Overview tab, Pro) — current streak, best streak, longest drought, scoring %
- **Head-to-Head** (Overview tab, Pro) — search by opponent, shows W/D/L, goals scored/conceded
- **Monthly Breakdown** (Overview tab, Pro) — WDL mini-bar + goals per month, smart multi-year labels
- **Rating Trend chart** (Analyse tab, Pro) — line chart with 6 toggleable datasets (overall, effort, impact, focus, technique, team play)
- Free users see blurred locked cards for all 5 features (conversion teasers)
- New i18n keys: `perf_profile_title`, `scoring_streaks_title`, `streak_*`, `h2h_*`, `monthly_title`, `rating_trend_title`
- New CSS: `.rating-pill`, `.rating-avg-*`

---

## 2026-03-28 — Danger zone

- Settings: "Danger zone" section added (visible for authenticated users only)
- **Delete match history** — inline confirm panel, typed phrase gate (`delete matches` / `slett kamper`), purges all matches from Supabase, invalidates cache + triggers stats re-render
- **Delete account** — inline confirm panel, typed phrase gate (`delete my account` / `slett kontoen min`), purges matches + share_tokens + profile, deletes auth user via Supabase Edge Function, reloads to auth screen
- New module: `js/danger.js`
- New Edge Function: `supabase/functions/delete-account/` (deploy: `supabase functions deploy delete-account`)

---

## 2026-03-27
### Changed
- Settings: Norwegian enum values renamed to English (`'fotball'`→`'football'`, `'aar'`→`'year'`, `'sesong'`→`'season'`) — includes Supabase SQL migration + localStorage boot migration
- supabase.js: Norwegian function names renamed to English (`fetchKamper`→`fetchMatches`, `insertKamp`→`insertMatch`, etc.), dead `fetchSettings` deleted
- Dropdowns: arrow key and Escape keyboard navigation for all four team/tournament dropdowns

---

## 2026-03-23 Stats desktop layout

- Two-column Oversikt + Analyse layout at ≥900px
- Tab bar stretches full width on desktop
- Toggle hidden on desktop; both views always visible

---

## [Unreleased]
### Changed
- Stats Overview: Head-to-Head card replaced with opponent search — type to find an opponent and see W/D/L, goals scored/conceded inline

---

## 2026-03-22 — Stats Analysis Features

- Stats Overview: Performance Profile Pro card — avg rating per dimension with colour-coded bars
- Stats Overview: Scoring Streaks Pro card — current/best streak, drought, and scoring %
- Stats Overview: Head-to-Head Records Pro card — W/D/L and goals per opponent
- Stats Overview: Monthly Breakdown Pro card — WDL bar and goals per calendar month
- Stats Analyse: Rating Trend chart (Pro) — 6 dimension lines with pill toggles

---

## 2026-03-22 — Share Page Desktop Layout

- Responsive two-column layout at ≥900px: sticky left sidebar (profile + season/team/tournament filters) + scrollable right content column
- Mobile layout unchanged (single column, sidebar stacks above stats)
- Pure CSS grid media query — no JS logic changes

---

## 2026-03-22 — Share Link Feature

- Players can now generate shareable links in Settings → Del statistikk
- Each link has a label and expiry (30 days, 90 days, end of season, or permanent)
- Third parties open the link in any browser — no account required
- Viewer sees: profile card (avatar, name, club) + full stats (season/team/tournament filters, overview and analyse)
- Self-assessment data (ratings and reflections) is never exposed
- Multiple active links supported; revoke any link instantly
- Foundation for Fase 4 coach/parent dashboard accounts

---

## 2026-03-21
- refactor: extract ACTIONS map to actions.js and date-toggle to log.js — main.js shrinks from 271 to 161 lines
- feat(a11y): accessibility pass — semantic HTML (`<main>`, `<section aria-label>`, `<form novalidate>`), ARIA on all four modals (role=dialog/alertdialog, aria-modal, aria-labelledby, focus trap + save/restore), ARIA tab bar (role=tab, aria-selected), ARIA dropdowns (role=combobox/listbox/option, aria-expanded, aria-selected), aria-live on stepper displays and toast, `.sr-only` utility, log form submit handler for keyboard users

---

## [Fase 4] Auth — 2026-03-20

- Implemented Supabase email/password authentication (`auth.js`) via raw REST API
- Added per-user data isolation with RLS: authenticated users own their rows; anon users see demo data read-only
- Demo mode: unauthenticated visitors see demo data with sign-up prompt banner
- WRITE_ACTIONS intercept in `main.js` blocks all write operations for unauthenticated users
- Session persistence via localStorage with 50-min token refresh interval
- Auth overlay UI (login + signup views) in `app.html`/`style.css`
- Added 10 i18n keys for auth strings
- `profiles.id` migrated from `text` to `uuid` FK; `matches.user_id` column added

---

## Økt 15 – 2026-03-19: Selvvurdering etter kamp

- Ny `assessment.js`-modul med selvvurdering etter kamp (5 kategorier, 1–5 tall-knapper, 2 fritekstfelter)
- Sheet-kontekst (Log-tab) og inline modal-seksjon (rediger kamp)
- 17 nye i18n-nøkler (NO + EN)
- 7 nye nullable kolonner dokumentert i datakontrakt (matches-tabell)
- Premium-gate implementert (blokket overlay hvis `!isPremium()`)

---

## Arkitektur: profile list-rendering flyttet til teams.js (økt 14, 2026-03-19) ✅

### Refaktor: renderProfileTeamList / renderProfileTournamentList
- **teams.js** – begge render-funksjoner flyttet hit fra `profile.js`; `renderProfileTeamList` konvertert fra HTML-streng til DOM API (konsistent med tournament-versjonen)
- **profile.js** – dispatcher `athlytics:renderProfileLists`-event i stedet for å kalle render-funksjonene direkte; `esc`-import fjernet (ikke lenger nødvendig)
- **main.js** – lytter på `athlytics:renderProfileLists` og kaller begge funksjoner; import oppdatert; redundante bootstrap-kall fjernet
- Sirkulær avhengighet unngått via eksisterende cross-module event-mønster

---

## To tekniske gjeldsfixer (økt 13, 2026-03-19) ✅

### Bugfiks: `activeLag` hengende state i Analyse-visning
- **stats.js** – `renderAnalyse()` validerer nå `activeLag` mot `profileTeams` og nullstiller til `'all'` hvis laget ikke lenger finnes i profilen — samme guard som allerede fantes i `renderStats()`

### Kode-kvalitet: `setSport()` allowed-list
- **settings-render.js** – `ALLOWED_SPORTS`-konstant definert (`['fotball', 'orientering', 'ski']`); `setSport()` returnerer tidlig ved ugyldig verdi i stedet for å la `saveSettings()` stille normalisere

---

## Lag-filter kortnavn-fiks (økt 12, 2026-03-19) ✅

### Bugfiks: Lag-filter matchet ikke lag lagret med fullt navn
- **stats.js** – `matchesTeamFilter()` bruker nå suffix-match: `stored === filter || stored.endsWith(' ' + filter)` med toLowerCase — "Flamme" matcher "Oppsal Flamme" uten falske treff (f.eks. "sal" matcher ikke "Oppsal")

---

## Teknisk gjeld – fire feilrettinger + Claude-instruksjon (økt 11, 2026-03-18) ✅

### Teknisk gjeld lukket
- **settings.js** – `getAllSeasons()` sorterer nå på baseår som heltall (`parseInt`) i stedet for leksikografisk string-sortering
- **settings-render.js** – `setSeasonFormat()` nullstiller `activeSeason` hvis den ikke lenger finnes blant gyldige sesonger etter formatbytte
- **teams.js** – `closeAllDropdowns()` resetter `showNewTeamInput`/`showNewTournamentInput` og skjuler `tournament-new-row` i tillegg til `team-new-row`
- **log.js** – `saveMatch()` muterer ikke lenger `allMatches` direkte; bruker `setAllMatches([newMatch].concat(allMatches))`

### Prosjektprosess
- **CLAUDE.md** – Lagt til instruksjon om å oppdatere `CLAUDE.md` og `CHANGELOG.md` etter hver oppgave, committe og pushe til `main`

---

## Full i18n-dekning (økt 10, 2026-03-18) ✅

### Bugfiks: Gjenværende hardkodede norske strenger i Logg, Stats og Profil-tab
- **i18n.js** – 6 nye nøkler lagt til i begge språkgrener: `ph_new_team`, `ph_new_tournament`, `stats_overview`, `stats_analyse`, `tournaments_title`, `saved`
- **app.html** – `id`-attributter lagt til på 8 elementer (`team-new-save-btn`, `tournament-new-save-btn`, `profil-card-spillerinfo`, `profil-label-name`, `profil-label-club`, `profil-label-posisjon`, `profil-card-tournaments`, `profil-card-teams`); Analyse-knapp-tekst pakket i `<span id="stats-analyse-text">` for å bevare ⭐-ikonet
- **i18n.js `updateAllText()`** – 12 nye elementer koblet til `t()` med guard clauses: datoetikett (`I dag` → `Today`), dropdown-lagreknapper (`Legg til` → `Add`), stats-toggle (`Oversikt`/`Analyse` → `Overview`/`Analysis`), profilkorttitler og feltlabeler (`Spillerinfo`, `Navn`, `Klubb`, `Posisjon`, `Mine turneringer / serier`, `Mine team / tropper`), lagret-indikator (`✓ Lagret` → `✓ Saved`); `ph`-kart utvidet med `team-new-input`, `tournament-new-input`, `profile-team-input`

---

## Settings tab i18n (økt 9, 2026-03-18) ✅

### Bugfiks: Hardkodede tekster i innstillinger-fanen ble ikke oppdatert ved språkskifte
- **app.html** – Lagt til `id`-attributter på 8 seksjonstitler/beskrivelser (`st-sport-title/desc`, `st-sf-title/desc`, `st-df-title/desc`, `st-as-title/desc`) og "Legg til"-knappen; fjernet ubrukte `data-i18n`-attributter
- **settings-render.js** – `renderSettings()` oppdaterer nå alle 9 statiske elementer via `t()`; sporttitler (`⚽ Fotball` → `t('sport_fotball')`), sesongformat-piller (`t('format_aar')`, `t('format_season')`), og `(snart)` → `t('snart')` bruker nå oversettelsesnøkler

---

## Guard clauses (økt 8, 2026-03-18) ✅

### Bugfiks: Manglende null-sjekker på DOM-oppslag
- **navigation.js** – `switchTab()` hoister begge `getElementById`-kall og returnerer tidlig hvis enten element mangler; gjenbruker variablene i `classList`-operasjoner
- **log.js** – `setMatchType()` sjekker alle 4 toggle/label-elementer før DOM-operasjoner; `updateResult()` sjekker `result-display` før bruk — begge returnerer tidlig hvis element mangler

---

## i18n-opprydding del 2 (økt 7, 2026-03-18) ✅

### Bugfiks: Hardkodede UI-strenger uten `t()` i profile.js og settings-render.js
- **i18n.js** – 6 nye nøkler lagt til i begge språkgrener: `avatar_change`, `log_greeting`, `log_ready`, `no_teams_yet`, `no_tournaments_yet`, `none`
- **profile.js** – `showAvatarImage()`, `renderLogSub()`, `renderProfileTeamList()`, `renderProfileTournamentList()` bruker nå `t()` for alle UI-strenger; `renderProfileTeamList()` og `renderProfileTournamentList()` bruker `t('standard_badge')` for favorittmerking (nøkkel eksisterte allerede)
- **profile.js** – Fjernet døde variabler `s`, `isEn`, `greeting`, `ready` fra `renderLogSub()` etter overgang til `t()`
- **settings-render.js** – `setActiveSeason()` bruker nå `t('none')` i stedet for hardkodet `'ingen'`

---

## i18n-opprydding (økt 6, 2026-03-18) ✅

### Bugfiks: Blandede språkverdier i norsk TEKST-gren
- **i18n.js** – 7 nøkler i `no`-grenen rettet: `tab_settings`, `no_matches`, `ph_navn`, `no_seasons`, `toast_profile_saved`, `toast_fyll_inn`, `toast_match_saved` (blanding av engelsk og norsk, f.eks. `'Kamp saved!'` → `'Kamp lagret!'`)
- `en`-grenen var allerede korrekt – ingen endringer der

### Kodekommentar: bevisst `innerHTML` i `updateAllText()`
- **i18n.js** – Lagt til inline-kommentar over `profileTitle.innerHTML` som forklarer at `innerHTML` er bevisst (wrapper andre ord i `<span>` for todelt overskriftsfarge)
- Auditert: alle øvrige DOM-oppdateringer i `updateAllText()` bruker allerede `textContent`

---

## Teknisk gjeld + nye features (økt 5, 2026-03-16) ✅

### Bugfiks: Sesongmodell i stats.js
- **stats.js** – Fjernet lokal `getSeasons()` som bygde rå årstallsliste direkte fra kampdatoer, uten hensyn til `seasonFormat` eller `extraSeasons`
- Bruker nå `getAllSeasons(allMatches)` fra `settings.js` som autoritativ kilde – støtter både `2025`- og `2025–2026`-format
- Ny hjelpefunksjon `getSeasonBaseYear(season)` splitter `'2025–2026'` til `'2025'` for `startsWith`-filtrering
- Alle tre filterpunkter patchet: `renderStats()`, `setMatchPage()` og `renderAnalyse()`

### Ny feature: Datoformat-innstilling
- **settings.js** – `dateFormat: 'eu' | 'us'` lagt til i `defaultSettings()` og validering i `saveSettings()`; ny `getDateLocale()` eksport returnerer `'en-US'` eller `'no-NO'` basert på innstillingen
- **i18n.js** – nye nøkler `df_title`, `df_desc`, `df_eu`, `df_us`, `toast_date_format` i norsk og engelsk
- **settings-render.js** – datoformat-piller rendres i `renderSettings()`, ny `setDateFormat(format)` funksjon
- **app.html** – ny settings-seksjon mellom sesongformat og aktiv sesong
- **stats.js**, **export.js**, **main.js** – all datoformatering bruker nå `getDateLocale()` i stedet for lang-basert hardkodet locale; dato er nå uavhengig av valgt språk

### Forberedelse til multi-sport (Fase 3)
- **i18n.js** – `sport_icon`, `stat1_label`, `stat2_label` lagt til i begge språkgrener
- **settings-render.js** – `THEMES`-objekt med fargepalett per sport (fotball/orientering/ski) og `applyTheme(sport)` eksportert; kalles fra `setSport()` og bootstrap i `main.js`

---

## Teknisk gjeld – opprydding (økt 4, 2026-03-16) ✅

### Ikoner – SVG-theming på logg-tab
- **app.html** – kalender, hjemme og borte erstattet emoji-ikoner med SVG via `<span>` + mask-image (samme mønster som tab-ikoner)
- **style.css** – eksplisitte `background-color`-regler for aktiv/inaktiv tilstand på `.match-type-mini-btn` og `.toggle-btn`; `color: var(--muted)` på `.date-toggle-btn`
- **icons/date-toggle.svg** – ny kalender-SVG lagt til

### i18n – resterende hardkodede strenger
- **app.html** – `id="btn-save-profil"` lagt til på profil-lagreknapp slik at i18n finner den
- **i18n.js** – `settings-sub` bruker nå `t('settings_sub')` i stedet for hardkodet ternary
- **i18n.js** / **main.js** – `updateDateLabel()` bruker `t('today')` og respekterer `getSettings().lang` for datoformatering; ny nøkkel `today` lagt til i TEKST

### export.js – fullstendig i18n-pass
- CSV-kolonneoverskrifter reflekterer nå aktivt språk
- PDF-labels (sesong, kamper, seier/uavgjort/tap, mål, assist, tabellhoder, footer) bruker `t()`
- W/D/L-forkortelser i PDF bruker `win_short`/`draw_short`/`loss_short` (S/U/T vs W/D/L)
- Datoformatering i PDF bruker `settings.lang` (`en-GB` / `no-NO`)
- `showToast('Henter data...')` byttet fra `'success'` til `'info'`-type
- 8 nye `export_*`-nøkler lagt til i TEKST (no + en)

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


> Nøkkelfunksjoner, design, plattform-beslutninger og testdata er dokumentert i `CLAUDE.md`.
