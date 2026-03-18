# Athlytics Sport – Changelog

> Historikk over ferdigstilte leveranser. Aktive gjøremål og teknisk gjeld ligger i `CLAUDE.md`.

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
