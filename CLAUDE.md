# Athlytics Sport – Prosjektdokumentasjon for Claude

> Denne filen gir Claude full kontekst om prosjektet ved oppstart av nye samtaler.

---

## Instruksjoner for Claude

- **Les alltid `/mnt/project/index.html` ved oppstart** av nye samtaler før du gjør endringer
- Arbeidsfil: `/home/claude/index.html` → output: `/mnt/user-data/outputs/index.html`
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
2. Pusher til GitHub manuelt (inkludert oppdatert `CLAUDE.md` og `index.html`)
3. Vercel auto-deployer fra `main`
4. Ny samtale startes etter større endringer

---

## Appens struktur

Én enkelt fil: `index.html` (~2000+ linjer). Skal splittes ved auth-refaktor (Fase 2).

### Fire tabs

| Tab | Ikon | Funksjon |
|-----|------|----------|
| Logg | ⚽ | Registrer kampdata |
| Statistikk | 📊 | Sesongoversikt og historikk |
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
saveMatch()              – lagrer ny kamp til Supabase
saveEditedMatch()        – PATCH eksisterende kamp
deleteMatch()            – slett kamp
openEditModal(id)        – åpner redigeringsmodal
closeModal()             – lukker modal
getProfile()             – henter profil fra localStorage
fetchProfileFromSupabase() – henter profil fra Supabase
saveProfileToSupabase()  – lagrer profil til Supabase
getSettings()            – henter innstillinger
renderStats()            – renderer statistikk-tab (inkl. turnering og hjemme/borte)
renderHomeAwaySection()  – hjemme vs borte-kort
renderTournamentSection() – statistikk per turnering
calcWDL(matches)         – beregner W/D/L/G/A for en match-liste
loadStats()              – laster kamper fra Supabase/cache
renderMatchList()        – renderer kamphistorikk
selectTeam(name)         – velger lag i logg-dropdown
selectTournament(name)   – velger turnering i logg-dropdown
selectModalTeam(name)    – velger lag i redigeringsmodal
selectModalTournament(name) – velger turnering i redigeringsmodal
updateAllText()          – oppdaterer all i18n-tekst
switchTab(tab)           – bytter aktiv tab
exportCSV()              – eksporterer aktiv sesong som CSV
exportPDF()              – åpner PDF-rapport i nytt vindu (window.print)
```

### Viktige variabler
```
allMatches[]       – cache av alle kamper (fra Supabase)
selectedTeam       – valgt lag i logg-tab
selectedTournament – valgt turnering i logg-tab
modalMatchId       – ID til kamp som redigeres
mHome/mAway        – score i modal
mGoals/mAssists    – stats i modal
mMatchType         – 'hjemme'|'borte' i modal
modalSelectedTeam  – valgt lag i modal
modalSelectedTournament – valgt turnering i modal
```

---

## Nøkkelfunksjoner implementert ✅

- Kamplogger med hjemme/borte-toggle og automatisk beregnet resultat
- Statistikk-tab med sesongvelger, lag-filter, seier/uavgjort/tap-kort, mål/assist/G+A
- **Hjemme vs Borte-seksjon** – to kort med W/D/L og mini-bar per kamptype
- **Per turnering-seksjon** – S/U/T + ⚽G / 🎯A / ✨G+A per turnering
- Kamphistorikk med slide-up redigeringsmodal (edit + slett)
- Profil synkronisert til Supabase
- Lag-dropdown i logg (fra profil), med favorittlag
- Turnering-dropdown i logg og redigeringsmodal (fra profil)
- Profil: mine lag-liste og mine turneringer med ☆ favoritt og slett
- Settings-tab: sport, sesongformat, aktiv sesong
- **Eksport** – CSV-nedlasting og PDF-rapport (merket ⭐ Premium i UI)
- Fullt i18n-system (norsk/engelsk) med flagg-velger på alle tabs
- Toast-notifikasjoner
- Fallback i dropdowns: kampens eksisterende lag/turnering vises selv om ikke i profil

## i18n-system

```javascript
const TEKST = { no: { ... }, en: { ... } };
function t(key) { return TEKST[lang][key] || key; }
```

- `updateAllText()` – oppdaterer alle tabs ved språkskifte
- `updateFlags()` – bruker `querySelectorAll('.lang-flag-btn')` for alle tabs
- `toggleLangPicker(btn)` – finner dropdown via `btn.parentElement.querySelector()`
- **OBS:** Tab-nøkler i `TEKST` heter `tab_log`, `tab_stats`, `tab_profile`, `tab_settings` – merk `tab_profile` (ikke `tab_profil`)

## localStorage-nøkler

```
athlytics_profil    → { navn, klubb, posisjon, lag[], favorittLag, turneringer[], favorittTurnament, avatar }
athlytics_settings  → { sport, sesongFormat, aktivSesong, lang, ekstraSesonger[] }
sessionStorage: 'athlytics_kamper'  → cache, invalideres etter lagre/rediger/slett
```

---

## Design

- Font: **Barlow Condensed** (overskrifter) + **Barlow** (brødtekst)
- Farger: `--grass: #1a3a1f` · `--lime: #a8e063` · `--card: #162b1a` · `--danger: #e05555` · `--gold: #f0c050`
- Mørk grønn estetikk, grid-mønster bakgrunn, max-width 480px sentrert

---

## ⚠️ Forberedelse til multi-sport theming (gjøres FØR Fase 3)

Før en ny sport legges til må tre ting refaktoreres:

### 1. Sportikon i `TEKST`-objektet
Sportikon (⚽) er i dag hardkodet flere steder i koden. Legg til en nøkkel:
```javascript
// I TEKST.no og TEKST.en:
sport_icon: '⚽'
```
og erstatt hardkodede ikoner med `t('sport_icon')`.

### 2. Stat-labels i `TEKST`
"Mål" og "Assist" er fotball-spesifikke. Legg til:
```javascript
stat1_label: 'Mål',      // orientering: 'Poeng', ski: 'Tid'
stat2_label: 'Assist',   // orientering: 'Løp', ski: 'Runder'
```

### 3. `THEMES`-objekt for farger per sport
Farger er allerede CSS-variabler, men byttes manuelt i dag. Legg til:
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

Ved innlogging (Supabase Auth) splittes `index.html` til:

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

### Fase 1 – MVP
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
- [x] Statistikk: hjemme vs borte-seksjon
- [x] Statistikk: per turnering med S/U/T/G/A/G+A
- [x] Eksport: CSV og PDF (merket Premium)
- [ ] Innlogging (Supabase Auth) → trigger filsplitt

### Fase 2
- [ ] Utvidet statistikk-dashboard

### Fase 3
- [ ] Multi-sport (orientering, ski)
- [ ] **Forberedelse:** Legg til `THEMES`-objekt, `sport_icon` i TEKST, stat-labels i TEKST (se seksjon over)

### Fase 4
- [ ] Stripe-monetisering

### Monetiseringsplan

| Nivå | Innhold | Pris |
|------|---------|------|
| Gratis | 1 lag, 1 sesong, basis statistikk | kr 0 |
| Pro | Ubegrenset lag/sesonger, avansert statistikk, eksport | ~kr 49/mnd |
| Club | Flere brukere, deling, lagadmin | ~kr 199/mnd |
