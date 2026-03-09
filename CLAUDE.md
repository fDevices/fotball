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
| **Database** | Supabase (URL og nøkler settes via miljøvariabler / deployment config – ikke hardkod i kode eller dokumentasjon) |

## Workflow

1. Utvikler tester lokalt (`file://` eller lokal server)
2. Pusher til GitHub manuelt (inkludert oppdatert `CLAUDE.md`, `index.html`, `style.css`, `app.js`)
3. Vercel auto-deployer fra `main`
4. Ny samtale startes etter større endringer

---

## ⛔ MVP-gjeld – løs før skalering

Følgende er kjent teknisk og sikkerhetsmessig gjeld som **må** løses før appen åpnes for flere brukere:

| Problem | Alvorlighet | Løsning |
|---|---|---|
| RLS på Supabase er "Allow all" på begge tabeller | 🔴 Kritisk | Implementer riktig RLS-policy per bruker ved auth |
| Ingen autentisering (Supabase Auth ikke implementert) | 🔴 Kritisk | Fase 1 siste steg / Fase 4 blocker |
| `innerHTML`-kall escaper ikke brukerdata | 🔴 Kritisk | Sanitiser input FØR lansering til andre brukere |
| Supabase anon key ligger hardkodet i `app.js` | 🟠 Høy | Flytt til miljøvariabel via Vercel |
| Inline `onclick`-handlers i HTML kobler DOM til JS-kontrakt | 🟡 Medium | Fases ut ved filsplitt – bruk `data-action` + event delegation i JS |
| Semantisk HTML mangler (`main`, `section`, `form`, `fieldset`, `dialog`) | 🟡 Medium | Refaktorer ved filsplitt/Fase 3 |
| Modaler mangler ARIA (`role="dialog"`, `aria-modal`, fokusstyring) | 🟡 Medium | Tilgjengelighetspass i Fase 3 |
| Custom dropdowns mangler keyboard/ARIA-støtte | 🟡 Medium | Tilgjengelighetspass i Fase 3 |

> **Ikke legg til nye features som avhenger av brukerdata før auth og RLS er på plass.**

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

## Datakontrakter

### Supabase-tabell: `kamper`

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
kamptype (text) -- ALLTID 'hjemme' eller 'away' (ikke 'borte')
opprettet (timestamptz)
resultat -- kalkulert client-side, lagres ikke i DB
```

### Supabase-tabell: `profiler`

```
id (text, default 'default')
navn (text)
klubb (text)
posisjon (text)
lag (jsonb, default '[]')
favoritt_lag (text)
turneringer (jsonb, default '[]')
favoritt_turnering (text, default '')
avatar_url (text)
sport (text, default 'fotball')
sesong_format (text, default 'aar')
aktiv_sesong (text, default '')
lang (text, default 'no')
opprettet (timestamptz)
oppdatert (timestamptz)
```

**Viktig:** Supabase-kolonnenavn er norske og skal IKKE endres. Bruk alltid de eksakte kolonnenavnene i JSON-payloads til Supabase (`dato`, `motstanderlag`, `eget_lag`, `hjemme`, `borte`, `mal`, `kamptype`, `navn`, `klubb` osv).

### localStorage vs Supabase – mapping for profil

localStorage (`athlytics_profil`) bruker engelske feltnavn internt i appen. Dette er et bevisst skille mellom persistenslag og applag:

| localStorage-felt | Supabase-kolonne |
|---|---|
| `name` | `navn` |
| `club` | `klubb` |
| `posisjon` | `posisjon` |
| `team[]` | `lag` |
| `favoriteTeam` | `favoritt_lag` |
| `tournaments[]` | `turneringer` |
| `favoriteTournament` | `favoritt_turnering` |
| `avatar` | `avatar_url` |

Mappingen håndteres i `saveProfileToSupabase()` og `fetchProfileFromSupabase()`.

### localStorage-nøkler

```
athlytics_profil    → { name, club, posisjon, team[], favoriteTeam, tournaments[], favoriteTournament, avatar }
athlytics_settings  → { sport, seasonFormat, activeSeason, lang, extraSeasons[] }
sessionStorage: 'athlytics_kamper'  → cache, invalideres etter lagre/rediger/slett
```

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
saveMatch()                     – lagrer ny kamp til Supabase
saveEditedMatch()               – PATCH eksisterende kamp
deleteMatch()                   – slett kamp
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
calcWDL(matches)                – beregner W/D/L/G/A/N for en match-liste
loadStats()                     – laster kamper fra Supabase/cache
renderMatchList()               – renderer én side med kamper
renderMatchListPaged(matches)   – renderer kamphistorikk med paginering (20 per side)
setMatchPage(page)              – bytter side i kamphistorikk uten full re-render
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
matchType               – 'hjemme' eller 'away' (NB: ikke 'borte', ikke 'home')
home / away             – score i logg-skjema
goals / assist          – spillerstatistikk i logg-skjema
matchPage               – aktiv side i kamphistorikk-paginering
PAGE_SIZE               – antall kamper per side (20)
modalMatchId            – ID til kamp som redigeres
mHome/mAway             – score i modal
mGoals/mAssists         – stats i modal
mMatchType              – 'hjemme'|'away' i modal
modalSelectedTeam       – valgt lag i modal
modalSelectedTournament – valgt turnering i modal
activeStatsView         – 'overview' | 'analyse' (styrer visning i stats-tab)
chartInstances          – { [id]: Chart } – alle aktive Chart.js-instanser
CHART_COLORS            – fargepalett for Chart.js (lime, gold, danger, muted, card, border, gridLine)
showNewTournamentInput  – boolean, styrer inline turnering-input i logg-dropdown
```

---

## ⚠️ Kritiske konvensjoner – lær av tidligere bugs

### Inline event handlers i HTML
`index.html` bruker `onclick`-attributter direkte i markup (f.eks. `onclick="switchTab('stats')"`, `onclick="saveMatch()"`). Dette er en bevisst MVP-avgjørelse. **Ikke refaktorer dette isolert** – det hører naturlig hjemme i JS-filsplittet ved Fase 3/4 hvor event delegation og `data-action`-mønster innføres samtidig.

Konsekvens: funksjonsnavn som `switchTab`, `saveMatch`, `setMatchType`, `toggleTeamDropdown`, `adjust`, `modalAdjust`, `setLang`, `toggleLangPicker`, `addSeason`, `exportCSV`, `exportPDF`, `saveProfile`, `addTournament`, `addTeamFromProfile`, `uploadImage`, `saveNewTeamFromDropdown`, `saveNewTournamentFromDropdown`, `toggleTournamentDropdown`, `toggleModalTeamDropdown`, `toggleModalTournamentDropdown`, `setModalMatchType`, `openEditModal`, `closeModal`, `deleteMatch`, `cancelDeleteMatch`, `confirmDeleteMatch`, `saveEditedMatch`, `switchStatsView` er **offentlig kontrakt** mellom HTML og JS – ikke rename uten å oppdatere begge steder.

### CSS-klasser for inline styles (lagt til ved review-cleanup)
Følgende klasser er lagt til i `style.css` for å erstatte tidligere inline styles i HTML:
- `.header` – `position: relative`
- `.settings-add-season-row` / `.settings-add-season-input` / `.settings-add-season-btn` – ny sesong-rad i Settings
- `.settings-spacer` – vertikal mellomrom under Settings
- `.team-filter-row` – `margin-bottom: 12px` på lag-filter i Stats
- `.modal-stats-grid` – 2-kolonne grid for Mål/Assist i edit-modal


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

---

## Nøkkelfunksjoner implementert ✅

- Kamplogger med hjemme/borte-toggle og automatisk beregnet resultat
- Statistikk-tab med sesongvelger, lag-filter, seier/uavgjort/tap-kort, mål/assist/G+A
- **Form-streak** – siste 10 kamper som fargede bokser (S/U/T), vises i begge stats-visninger
- **Hjemme vs Borte-seksjon** – to kort med W/D/L, mål/assist/G+A og mini-bar per kamptype
- **Per turnering-seksjon** – turneringsnavn + antall kamper, S/U/T + G/A/G+A med uniform badge-bredde
- Kamphistorikk med paginering (20 per side) og slide-up redigeringsmodal (edit + slett)
- **Analyse-tab (Fase 2)** – Chart.js-grafer bak toggle:
  - Kumulativ seiersprosent over tid (linjegraf)
  - Mål & assist per kamp (dobbel linjegraf, lime + gull)
  - Mål per turnering (horisontal søylediagram, grouped)
- **Premium-gate** – gratis ser form-streak + låst kort med blur-overlay; `isPremium()` hardkodet `true` til Fase 4
- Profil synkronisert til Supabase
- Lag-dropdown i logg (fra profil), med favorittlag
- Turnering-dropdown i logg og redigeringsmodal – ny turnering opprettes inline
- Profil: mine lag-liste og mine turneringer med ☆ favoritt og slett
- Settings-tab: sport, sesongformat, aktiv sesong
- **Eksport** – CSV-nedlasting og PDF-rapport (merket ⭐ Premium i UI)
- Fullt i18n-system (norsk/engelsk) med flagg-velger på alle tabs
- Toast-notifikasjoner
- Google Fonts med preconnect + font-display swap

## i18n-system

```javascript
const TEKST = { no: { ... }, en: { ... } };
function t(key) { return TEKST[lang][key] || key; }
```

- `updateAllText()` – oppdaterer alle tabs ved språkskifte
- `updateFlags()` – bruker `querySelectorAll('.lang-flag-btn')` for alle tabs
- `toggleLangPicker(btn)` – finner dropdown via `btn.parentElement.querySelector()`
- **OBS:** Tab-nøkler i `TEKST` heter `tab_log`, `tab_stats`, `tab_profile`, `tab_settings` – merk `tab_profile` (ikke `tab_profil`)

---

## Design

- Font: **Barlow Condensed** (overskrifter) + **Barlow** (brødtekst)
- Farger: `--grass: #1a3a1f` · `--lime: #a8e063` · `--card: #162b1a` · `--danger: #e05555` · `--gold: #f0c050`
- Mørk grønn estetikk, grid-mønster bakgrunn, max-width 480px sentrert
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

Desktop kobles naturlig til **Club-planen** (Fase 4). Ved implementering: sidebar-nav istedet for tab-bar, to-kolonne stats-layout, grafer med mer plass og detalj.

---

## ⚠️ Forberedelse til multi-sport theming (gjøres FØR Fase 3)

Før en ny sport legges til må tre ting refaktoreres:

### 1. Sportikon i `TEKST`-objektet
```javascript
sport_icon: '⚽'  // legg til i TEKST.no og TEKST.en
```

### 2. Stat-labels i `TEKST`
```javascript
stat1_label: 'Mål',      // orientering: 'Poeng', ski: 'Tid'
stat2_label: 'Assist',   // orientering: 'Løp', ski: 'Runder'
```

### 3. `THEMES`-objekt for farger per sport
```javascript
const THEMES = {
  fotball:     { grass: '#1a3a1f', lime: '#a8e063', card: '#162b1a' },
  orientering: { grass: '#1a2a3a', lime: '#63b8e0', card: '#162130' },
  ski:         { grass: '#1a1a3a', lime: '#a0a8e0', card: '#161628' }
};
function applyTheme(sport) {
  var th = THEMES[sport] || THEMES.fotball;
  Object.keys(th).forEach(function(k) {
    document.documentElement.style.setProperty('--' + k, th[k]);
  });
}
```
Kall `applyTheme(sport)` fra `setSport()`.

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
- [ ] **Sikkerhet:** Escape brukerdata i innerHTML-kall – gjøres FØR lansering til andre brukere

### Fase 1.5 – Teknisk opprydding ✅
- [x] Cache `getSettings()` / `getProfile()` i minnet mellom kall
- [x] Paginering av kamphistorikk (20 per side)
- [x] Google Fonts: preconnect + font-display swap
- [x] Inline turnering-oppretting i logg-dropdown
- [x] Uniform badge-bredde i turnering-statistikk
- [x] Filsplitt: index.html → index.html + style.css + app.js

### Fase 1.6 – UX-polish (backlog)
- [ ] "Nullstill turnering"-valg i logg-dropdown
- [ ] Bytt `confirm()`-dialog ved sletting med custom in-app modal
- [ ] Profil: `tournaments`/`team` fra Supabase synkes ikke ved `saveProfile()` – kan miste data
- [ ] **Motstandersøk i Statistikk-tab** – søkefelt over kamphistorikk, søker på tvers av alle sesonger, mini W/D/L-oppsummering, client-side på `allMatches`, variabel `opponentSearch`, overstyrer sesong/lag-filter

### Fase 2 – Analyse (grafer, Premium) ✅
- [x] Chart.js CDN i `<head>` (defer)
- [x] `isPremium()`, `switchStatsView()`, `destroyCharts()`, `initChartDefaults()`, `CHART_COLORS`
- [x] Toggle-UI øverst i stats-tab (Oversikt / Analyse ⭐)
- [x] Form-streak – siste 10 kamper som fargede bokser (gratis, begge views)
- [x] Kumulativ seiersprosent (Chart.js linje)
- [x] Mål & assist per kamp (Chart.js dobbel linje)
- [x] Mål per turnering (Chart.js horisontal søyle, grouped)
- [x] Premium-gate med blur-overlay og "Lås opp Pro"-knapp
- [x] Sesong/lag-filter tilgjengelig i analyse-visning (rendres inline i stats-content)

### Fase 3 – Multi-sport
- [ ] Orientering, ski
- [ ] Forberedelse: `THEMES`-objekt, `sport_icon` + stat-labels i TEKST

### Fase 4 – Monetisering
- [ ] Stripe-integrasjon
- [ ] `isPremium()` kobles til Stripe-abonnement
- [ ] Auth (Supabase Auth) + riktig RLS-policy

---

## Monetiseringsplan

| Nivå | Innhold | Pris |
|------|---------|------|
| Gratis | 1 lag, 1 sesong, basis statistikk, form-streak | kr 0 |
| Pro | Ubegrenset lag/sesonger, analyse-grafer, eksport CSV+PDF | ~kr 49/mnd |
| Club | Flere brukere, deling, lagadmin | ~kr 199/mnd |

**Uavklart:** Per turnering-statistikk (gratis eller Pro?), multi-sport (Pro-tillegg?), PDF alene vs CSV+PDF samlet
