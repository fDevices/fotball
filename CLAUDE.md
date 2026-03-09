# Athlytics Sport – Prosjektdokumentasjon for Claude

> Denne filen gir Claude full kontekst om prosjektet ved oppstart av nye samtaler.

---

## Instruksjoner for Claude

- **Les alltid prosjektfilene ved oppstart** av nye samtaler før du gjør endringer. Prosjektet er nå tre filer: `index.html`, `style.css`, `app.js`
- Arbeidsfiler: `/home/claude/` → output: `/mnt/user-data/outputs/`
- **Ingen æøå i kode** – ikke i variabelnavn, funksjonsnavn, ID-er, CSS-klasser eller kommentarer. Norsk tekst er OK i UI-strenger som vises til bruker.

---

## Infrastruktur

| | |
|---|---|
| **Live URL** | https://athlyticsport.app og https://www.athlyticsport.app |
| **GitHub** | https://github.com/fDevices/fotball (public, `main` branch) |
| **Hosting** | Vercel – prosjekt: `fdevices-projects/fotball` |
| **Database** | Supabase – `https://gjxsebeajcrmseraypyw.supabase.co` |
| **Supabase anon key** | `sb_publishable_gkIN7XSAzQVKS9lpqj6LYQ_vV8G3VRe` |

## Workflow

1. Utvikler tester lokalt (`file://` eller lokal server)
2. Pusher til GitHub manuelt (inkludert oppdatert `CLAUDE.md`, `index.html`, `style.css`, `app.js`)
3. Vercel auto-deployer fra `main`
4. Ny samtale startes etter større endringer

---

## Appens struktur

Tre filer: `index.html` (HTML-skall), `style.css` (all CSS), `app.js` (all JavaScript).

### Fire tabs

| Tab | Ikon | Funksjon |
|-----|------|----------|
| Logg | ⚽ | Registrer kampdata |
| Statistikk | 📊 | Sesongoversikt, historikk og analyse |
| Profil | 👤 | Spillerprofil, lag og turneringer |
| Innstillinger | ⚙️ | Sport, sesongformat, aktiv sesong, eksport |

---

## Supabase-tabeller

### `kamper`
```
id (uuid, auto)
dato (date)
motstanderlag (text)
eget_lag (text)
turnering (text)
hjemme (int)
borte (int)
mal (int)
assist (int)
kamptype (text) -- 'hjemme' eller 'borte'
opprettet (timestamptz)
resultat -- kalkulert client-side
```

### `profiler`
```
id (text, default 'default')
navn, klubb, posisjon (text)
lag (jsonb, default '[]')
favoritt_lag (text)
turneringer (jsonb, default '[]')
favoritt_turnering (text, default '')
avatar_url (text)
sport (text, default 'fotball')
sesong_format (text, default 'aar')
aktiv_sesong (text, default '')
lang (text, default 'no')
opprettet, oppdatert (timestamptz)
```

RLS aktivert med "Allow all"-policy på begge tabeller.

**Viktig:** Supabase-kolonnenavn er norske og skal IKKE endres i kode. Bruk alltid de eksakte kolonnenavnene i JSON-payloads (`dato`, `motstanderlag`, `eget_lag`, `hjemme`, `borte`, `mal`, `kamptype` osv).

---

## Kodenavn-konvensjoner (JS-siden)

JavaScript bruker engelske navn, men match-objekter fra Supabase beholder norske kolonnenavn:

| JS-variabel | Supabase-kolonne |
|---|---|
| `k.dato` | `dato` |
| `k.motstanderlag` | `motstanderlag` |
| `k.eget_lag` | `eget_lag` |
| `k.hjemme` / `k.borte` | `hjemme` / `borte` |
| `k.mal` | `mal` |
| `k.kamptype` | `kamptype` |

### Viktige funksjoner
```
esc(str)                        – HTML-escape brukerdata (bruk på ALT i innerHTML)
saveMatch()                     – lagrer ny kamp til Supabase
saveEditedMatch()               – PATCH eksisterende kamp
deleteMatch()                   – viser custom slett-bekreftelsesdialog
confirmDeleteMatch()            – utfører faktisk sletting etter bekreftelse
cancelDeleteMatch()             – avbryter slett-dialogen
openEditModal(id)               – åpner redigeringsmodal
closeModal()                    – lukker modal
getProfile()                    – henter profil fra minnecache / localStorage
saveProfile_local(profil)       – lagrer profil til cache + localStorage (bruk alltid denne)
fetchProfileFromSupabase()      – henter profil fra Supabase
saveProfileToSupabase()         – lagrer profil til Supabase
getSettings()                   – henter innstillinger fra minnecache / localStorage
saveSettings(s)                 – lagrer innstillinger til cache + localStorage + Supabase
renderStats()                   – renderer statistikk-tab (router til overview/analyse)
renderAnalyse(matches)          – renderer Analyse-visning med Chart.js-grafer
renderFormStreak(matches)       – renderer form-streak (siste 10 kamper, gratis)
renderHomeAwaySection()         – hjemme vs borte-kort
renderTournamentSection()       – statistikk per turnering
renderOpponentSearchResults()   – viser motstandersøk-resultater i stats-tab
calcWDL(matches)                – beregner W/D/L/G/A/N for en match-liste
loadStats()                     – laster kamper fra Supabase/cache
renderMatchList()               – renderer én side med kamper
renderMatchListPaged(matches)   – renderer kamphistorikk med paginering (20 per side)
setMatchPage(page)              – bytter side i kamphistorikk uten full re-render
setOpponentSearch(val)          – setter motstandersøk og re-rendrer
selectTeam(name)                – velger lag i logg-dropdown
selectTournament(name)          – velger turnering i logg-dropdown
saveNewTournamentFromDropdown() – oppretter og velger ny turnering direkte i logg-dropdown
selectModalTeam(name)           – velger lag i redigeringsmodal
selectModalTournament(name)     – velger turnering i redigeringsmodal
updateAllText()                 – oppdaterer all i18n-tekst
switchTab(tab)                  – bytter aktiv tab (kaller destroyCharts() ved tab-bytte)
switchStatsView(view)           – bytter mellom 'overview' og 'analyse' i stats-tab
destroyCharts()                 – destroyer alle Chart.js-instanser (kall FØR re-render)
initChartDefaults()             – setter globale Chart.js-defaults (kalles ved window load)
applyTheme(sport)               – setter CSS-variabler og CHART_COLORS fra THEMES-objektet
isPremium()                     – returnerer true (hardkodet til Stripe i Fase 4)
exportCSV()                     – eksporterer aktiv sesong som CSV
exportPDF()                     – åpner PDF-rapport i nytt vindu (window.print)
adjust(type, delta)             – justerer score/mål/assist i logg-skjema
```

### Viktige variabler
```
allMatches[]            – cache av alle kamper (fra Supabase)
_profileCache           – in-memory cache for getProfile()
_settingsCache          – in-memory cache for getSettings()
selectedTeam            – valgt lag i logg-tab
selectedTournament      – valgt turnering i logg-tab
matchType               – 'hjemme' eller 'away' (NB: ikke 'borte')
home / away             – score i logg-skjema
goals / assist          – spillerstatistikk i logg-skjema
matchPage               – aktiv side i kamphistorikk-paginering
PAGE_SIZE               – antall kamper per side (20)
opponentSearch          – aktiv søkestreng i motstandersøk (tom = ingen søk)
modalMatchId            – ID til kamp som redigeres
mHome/mAway             – score i modal
mGoals/mAssists         – stats i modal
mMatchType              – 'hjemme'|'away' i modal
modalSelectedTeam       – valgt lag i modal
modalSelectedTournament – valgt turnering i modal
activeStatsView         – 'overview' | 'analyse' (styrer visning i stats-tab)
chartInstances          – { [id]: Chart } – alle aktive Chart.js-instanser
CHART_COLORS            – fargepalett for Chart.js (lime, gold, danger, muted, card, border, gridLine)
THEMES                  – { fotball, orientering, ski } – CSS-variabler per sport
showNewTournamentInput  – boolean, styrer inline turnering-input i logg-dropdown
```

---

## ⚠️ Kritiske konvensjoner – lær av tidligere bugs

### matchType-verdier
`matchType` bruker **'hjemme'** og **'away'** (ikke 'borte', ikke 'home').
Dette gjelder overalt: JS-variabler, `kamptype`-feltet i Supabase-payloads, og all logikk som sjekker kamptype.

### CSS-klasser for resultat
`.result-auto` bruker klassene **'wins'**, **'draw'**, **'loss'** – disse må matche nøyaktig med verdiene `getResult()` returnerer.
```css
.result-auto.wins  { ... }  /* grønn */
.result-auto.draw  { ... }  /* gull */
.result-auto.loss  { ... }  /* rød */
```
Ikke bruk `.uavgjort`, `.tap` eller andre norske klassenavn.

### adjust()-funksjonen – logg-skjema
Score (home/away) og spillerstatistikk (goals/assist) er **uavhengige**:
- `adjust('home', delta)` / `adjust('away', delta)` – endrer kun score og kaller `updateResult()`
- `adjust('goals', delta)` / `adjust('assist', delta)` – endrer kun stats, påvirker **ikke** scoren
- Mål kan maks være lik eget lags score; assist kan maks være `eget lags score − mål`
- Hvis score senkes under goals, clappes goals (og assist) automatisk ned
- Eget lags score = `home` ved hjemmekamp, `away` ved bortekamp

### In-memory cache
`getProfile()` og `getSettings()` bruker `_profileCache` / `_settingsCache`.
Bruk alltid `saveProfile_local(profil)` (ikke `localStorage.setItem` direkte) for å holde cachen synkronisert.

### saveProfile() – bevar alltid tournaments og team
`saveProfile()` må alltid hente eksisterende profil først og bevare `tournaments`, `favoriteTournament`, `team`, `favoriteTeam` og `avatar`. Disse feltene kommer ikke fra skjema-inputene og ville ellers bli slettet.

### HTML-escaping – bruk esc() på ALT brukerdata i innerHTML
`esc(str)` er definert øverst i app.js og escaper `&`, `<`, `>`, `"`, `'`.
Bruk den på **alle** bruker-/Supabase-verdier som settes inn i innerHTML:
`k.motstanderlag`, `k.eget_lag`, `k.turnering`, `profil.name`, `profil.club`, lagnavn, turneringsnavn osv.
`textContent`-tildelinger er alltid trygge uten escaping.

### Slett-bekreftelse – custom dialog, ikke confirm()
`deleteMatch()` viser en custom slide-up dialog (`#delete-confirm-dialog` / `#delete-confirm-backdrop`).
Selve slettingen skjer i `confirmDeleteMatch()`. `cancelDeleteMatch()` avbryter.
z-index på delete-confirm-dialog (401) er høyere enn edit-modal (301) – dialogen må alltid ligge over.

### Modal felt-ID-er
Modal-inputene har ID `modal-dato` og `modal-motstander` (ikke `modal-date` / `modal-opponent`).

### Chart.js – destroy-pattern
**Alltid** kall `destroyCharts()` øverst i `renderStats()` og ved tab-bytte (`switchTab`).
Uten dette lekkjer Chart.js-instanser og grafer tegnes dobbelt ved re-render.

### Stat-labels – bruk t('stat1_label') / t('stat2_label')
Aldri hardkode 'Mål'/'Assist' i render-funksjoner. Bruk alltid `t('stat1_label')` og `t('stat2_label')`.
Dette gjelder stat-cards, gjennomsnitt-rader, Chart.js dataset-labels og PDF-eksport.

### applyTheme() – kall ved oppstart og ved sport-bytte
`applyTheme(sport)` oppdaterer CSS-variabler (`--grass`, `--lime`, `--card`) og synkroniserer `CHART_COLORS`.
Kalles fra `setSport()` og fra `window.load` med `getSettings().sport`.

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

---

## Nøkkelfunksjoner implementert ✅

- Kamplogger med hjemme/borte-toggle og automatisk beregnet resultat
- Statistikk-tab med sesongvelger, lag-filter, seier/uavgjort/tap-kort, mål/assist/G+A
- **Form-streak** – siste 10 kamper som fargede bokser (S/U/T), vises i begge stats-visninger
- **Hjemme vs Borte-seksjon** – to kort med W/D/L, mål/assist/G+A og mini-bar per kamptype
- **Per turnering-seksjon** – turneringsnavn + antall kamper, S/U/T + G/A/G+A med uniform badge-bredde
- **Motstandersøk** – søkefelt over kamphistorikk, søker på tvers av alle sesonger, mini W/D/L per motstander
- **Nullstill turnering** – knapp øverst i turnering-dropdown når en turnering er valgt
- Kamphistorikk med paginering (20 per side) og slide-up redigeringsmodal (edit + slett)
- **Custom slett-bekreftelsesdialog** – slide-up modal istedet for `confirm()`
- **Analyse-tab (Fase 2)** – Chart.js-grafer bak toggle:
  - Kumulativ seiersprosent over tid (linjegraf)
  - Stat1 & stat2 per kamp (dobbel linjegraf, lime + gull)
  - Stat1 per turnering (horisontal søylediagram, grouped)
- **Premium-gate** – gratis ser form-streak + låst kort med blur-overlay; `isPremium()` hardkodet `true` til Fase 4
- **Sport-theming (Fase 3-forberedelse)** – `THEMES`-objekt, `applyTheme()`, `sport_icon` + `stat1_label`/`stat2_label` i `TEKST`
- Profil synkronisert til Supabase
- Lag-dropdown i logg (fra profil), med favorittlag
- Turnering-dropdown i logg og redigeringsmodal – ny turnering opprettes inline
- Profil: mine lag-liste og mine turneringer med ☆ favoritt og slett
- Settings-tab: sport, sesongformat, aktiv sesong
- **Eksport** – CSV-nedlasting og PDF-rapport (merket ⭐ Premium i UI)
- Fullt i18n-system (norsk/engelsk) med flagg-velger på alle tabs
- Toast-notifikasjoner
- Google Fonts med preconnect + font-display swap
- **HTML-escaping** – `esc()` brukes på all brukerdata i `innerHTML`

## i18n-system

```javascript
const TEKST = { no: { ... }, en: { ... } };
function t(key) { return TEKST[lang][key] || key; }
```

- `updateAllText()` – oppdaterer alle tabs ved språkskifte
- `updateFlags()` – bruker `querySelectorAll('.lang-flag-btn')` for alle tabs
- `toggleLangPicker(btn)` – finner dropdown via `btn.parentElement.querySelector()`
- **OBS:** Tab-nøkler i `TEKST` heter `tab_log`, `tab_stats`, `tab_profile`, `tab_settings` – merk `tab_profile` (ikke `tab_profil`)
- **Sport-relaterte nøkler:** `sport_icon`, `stat1_label`, `stat2_label` – brukes i render-funksjoner og Chart.js

## localStorage-nøkler

```
athlytics_profil    → { name, club, posisjon, team[], favoriteTeam, tournaments[], favoriteTournament, avatar }
athlytics_settings  → { sport, seasonFormat, activeSeason, lang, extraSeasons[] }
sessionStorage: 'athlytics_kamper'  → cache, invalideres etter lagre/rediger/slett
```

---

## Design

- Font: **Barlow Condensed** (overskrifter) + **Barlow** (brødtekst)
- Farger: `--grass: #1a3a1f` · `--lime: #a8e063` · `--card: #162b1a` · `--danger: #e05555` · `--gold: #f0c050`
- Mørk grønn estetikk (fotball), grid-mønster bakgrunn, max-width 480px sentrert
- Farger per sport styres av `THEMES`-objektet og `applyTheme()` – ikke endre CSS-variabler direkte for sport-theming
- Chart.js via CDN: `https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js` (defer i `<head>`)

---

## Plattform-beslutninger

### Portrait-lås (implementert)
Appen er portrait-only. Landscape viser en overlay: "Roter telefonen til stående modus".
- CSS: `.landscape-block` med `@media (orientation: landscape) and (max-height: 600px)`
- Meta: `<meta name="screen-orientation" content="portrait">`
- Threshold `max-height: 600px` unngår at overlayden vises på desktop-browsere i smalt vindu

### Desktop (Fase 3/4)
Desktop-versjon venter til Fase 3/4. Bruksmønster:
- **Mobil** – logging av kamper, rask sjekk av enkeltstatistikk
- **Desktop** – full analyse, større grafer, coach/admin-visning

Desktop kobles naturlig til **Club-planen** (Fase 4). Fase 2-grafene er en mobil-preview av det som blir en rikere desktop-analyseopplevelse. Ved implementering: sidebar-nav istedet for tab-bar, to-kolonne stats-layout, grafer med mer plass og detalj.

---

## Multi-sport theming (Fase 3-forberedelse ✅)

Grunnarbeidet er på plass. For å legge til en ny sport trenger man kun:

### 1. Legg til i `THEMES`-objektet
```javascript
var THEMES = {
  fotball:     { grass: '#1a3a1f', lime: '#a8e063', card: '#162b1a' },
  orientering: { grass: '#1a2a3a', lime: '#63b8e0', card: '#162130' },
  ski:         { grass: '#1a1a3a', lime: '#a0a8e0', card: '#161628' }
  // ny_sport: { grass: '...', lime: '...', card: '...' }
};
```

### 2. Legg til i `TEKST.no` og `TEKST.en`
```javascript
// no:
sport_icon: '⚽',        // bytt per sport
stat1_label: 'Mål',     // orientering: 'Poeng', ski: 'Tid'
stat2_label: 'Assist',  // orientering: 'Løp', ski: 'Runder'

// en:
sport_icon: '⚽',
stat1_label: 'Goals',
stat2_label: 'Assists',
```
NB: `sport_icon` og stat-labels er per-språk, ikke per-sport. Ved multi-sport må disse bli sport+språk-kombinasjoner (refaktores i Fase 3).

### 3. Legg til i settings-sport-listen i `renderSettings()`
```javascript
{ key: 'ny_sport', label: '🏃 Ny sport', soon: false }
```

`applyTheme()` og alle render-funksjoner henter automatisk riktig tema og labels.

---

## Testdata – Julian 2025

Importert 08.03.2026 via SQL. 51 kamper fra 2025-sesongen:

| | |
|---|---|
| Kamper | 51 |
| Seier / Uavgjort / Tap | 37 / 3 / 11 |
| Mål | 141 |
| Assist | 110 |

**Lag i bruk:** Oppsal, Oppsal Flamme, Oppsal MS  
**Turneringer:** Cup Gjelleråsen, Cup KFMU, Heming Cup, Serie, Seriespill, Kretscup

---

## Arkitektur-beslutning – Fremtidig auth-refaktor

Ved innlogging (Supabase Auth) splittes filene til:

```
js/i18n.js
js/supabase.js
js/log.js
js/stats.js
js/profile.js
js/settings.js
lang/no.json
lang/en.json
lang/de.json
```

`t()`-kallene er allerede på plass – migreringen blir mekanisk.

---

## Roadmap

### Fase 1 – MVP ✅
- [x] Kamplogger, Vercel, custom domain
- [x] Hjemme/borte, automatisk resultat
- [x] Statistikk med caching
- [x] Profil (navn, klubb, posisjon, bilde, lag-liste)
- [x] Lag-dropdown med favoritt
- [x] Kamphistorikk med rediger/slett
- [x] Profil synket til Supabase
- [x] Settings-tab
- [x] i18n – full dekning, alle strings bruker t()
- [x] Flagg-velger på alle tabs
- [x] Turnering-dropdown med favoritt
- [x] Testdata – Julian 2025 (51 kamper)
- [x] Kode-refaktor: ingen æøå i kodeidentifikatorer
- [x] Statistikk: hjemme vs borte-seksjon (inkl. mål/assist/G+A)
- [x] Statistikk: per turnering med S/U/T/G/A/G+A og antall kamper
- [x] Eksport: CSV og PDF (merket Premium)
- [x] Bugfiks: logg-skjema score/mål/assist-logikk
- [x] Bugfiks: modal-dato/modal-motstander ID-mismatch
- [ ] Innlogging (Supabase Auth) → trigger filsplitt

### Fase 1.5 – Teknisk opprydding ✅
- [x] Cache `getSettings()` / `getProfile()` i minnet mellom kall
- [x] Paginering av kamphistorikk (20 per side)
- [x] Google Fonts: preconnect + font-display swap
- [x] Inline turnering-oppretting i logg-dropdown
- [x] Uniform badge-bredde i turnering-statistikk
- [x] Filsplitt: index.html → index.html + style.css + app.js

### Fase 1.6 – UX-polish ✅
- [x] "Nullstill turnering"-valg i logg-dropdown
- [x] Bytt `confirm()`-dialog ved sletting med custom in-app modal
- [x] Bugfiks: `saveProfile()` mistet tournaments/team – nå bevart
- [x] Bugfiks: `saveProfile_local()` kalte seg selv rekursivt – nå fikset
- [x] **Motstandersøk i Statistikk-tab** – søkefelt over kamphistorikk, søker på tvers av alle sesonger, mini W/D/L per motstander
- [x] **HTML-escaping** – `esc()` på all brukerdata i innerHTML

### Fase 2 – Analyse (grafer, Premium) ✅
- [x] Chart.js CDN i `<head>` (defer)
- [x] `isPremium()`, `switchStatsView()`, `destroyCharts()`, `initChartDefaults()`, `CHART_COLORS`
- [x] Toggle-UI øverst i stats-tab (Oversikt / Analyse ⭐)
- [x] Form-streak – siste 10 kamper som fargede bokser (gratis, begge views)
- [x] Kumulativ seiersprosent (Chart.js linje)
- [x] Stat1 & stat2 per kamp (Chart.js dobbel linje)
- [x] Stat1 per turnering (Chart.js horisontal søyle, grouped)
- [x] Premium-gate med blur-overlay og "Lås opp Pro"-knapp
- [x] Sesong/lag-filter tilgjengelig i analyse-visning (rendres inline i stats-content)

### Fase 3-forberedelse ✅
- [x] `THEMES`-objekt (fotball, orientering, ski)
- [x] `applyTheme(sport)` – oppdaterer CSS-variabler + CHART_COLORS
- [x] `sport_icon`, `stat1_label`, `stat2_label` i `TEKST` (no + en)
- [x] Alle render-funksjoner bruker `t('stat1_label')` / `t('stat2_label')`

### Fase 3 – Multi-sport
- [ ] Orientering og ski som aktive sporter (fjern `soon`-flagget)
- [ ] Per-sport `sport_icon` + stat-labels (krever refaktor av TEKST til sport+språk-kombinasjoner)
- [ ] Desktop-layout (sidebar-nav, to-kolonne stats)

### Fase 4 – Monetisering
- [ ] Stripe-integrasjon
- [ ] `isPremium()` kobles til Stripe-abonnement
- [ ] Innlogging (Supabase Auth) → trigger filsplitt

---

## Monetiseringsplan

| Nivå | Innhold | Pris |
|------|---------|------|
| Gratis | 1 lag, 1 sesong, basis statistikk, form-streak | kr 0 |
| Pro | Ubegrenset lag/sesonger, analyse-grafer, eksport CSV+PDF | ~kr 49/mnd |
| Club | Flere brukere, deling, lagadmin | ~kr 199/mnd |

**Uavklart:** Per turnering-statistikk (gratis eller Pro?), multi-sport (Pro-tillegg?), PDF alene vs CSV+PDF samlet
