# Athlytics Sport – Prosjektdokumentasjon for Claude

> Denne filen gir Claude full kontekst om prosjektet ved oppstart av nye samtaler.

---

## Instruksjoner for Claude

- **Les alltid prosjektfilene ved oppstart** av nye samtaler før du gjør endringer.
- Prosjektet er nå splittet i moduler: `app.html`, `style.css`, og `js/`-mappen (se filstruktur nedenfor).
- **All koding skal være på engelsk** – variabelnavn, funksjonsnavn, ID-er, CSS-klasser, kommentarer, Supabase-kolonnenavn, localStorage-nøkler og kode-konstanter. Norsk tekst er OK kun i UI-strenger som vises til bruker (via `t()` i `i18n.js`).
- **Etter hver fullført oppgave:** oppdater relevante gjeldsposter i `CLAUDE.md` (merk som ✅ Ferdig eller slett hvis utdatert), legg til en kort post i `CHANGELOG.md`, og commit. Vurder om informasjon i `CLAUDE.md` heller bør flyttes til `docs/changelog.md` eller slettes helt når den ikke lenger er relevant som arbeidsreferanse.

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
2. Pusher til GitHub manuelt (inkludert oppdatert `CLAUDE.md`, `app.html`, `style.css`, og alle filer i `js/`)
3. Vercel auto-deployer fra `main`
4. Ny samtale startes etter større endringer

---

## ⛔ MVP-gjeld – løs før skalering

Følgende er kjent teknisk og sikkerhetsmessig gjeld som **må** løses før appen åpnes for flere brukere:

| Problem | Alvorlighet | Løsning |
|---|---|---|
| RLS på Supabase er "Allow all" på begge tabeller | ✅ Ferdig | RLS implementert — authenticated users: full CRUD på egne rader; anon: SELECT-only på demo-brukerens rader |
| Ingen autentisering (Supabase Auth ikke implementert) | ✅ Ferdig | auth.js implementert med email/password via Supabase Auth REST API |
| Supabase anon key er hardkodet i `js/config.js` | 🟠 Høy | Flytt til miljøvariabel via Vercel ved auth-implementasjon |
| Semantisk HTML mangler (`main`, `section`, `form`, `fieldset`, `dialog`) | 🟡 Medium | Refaktorer i Fase 3 |
| Modaler mangler ARIA (`role="dialog"`, `aria-modal`, fokusstyring) | 🟡 Medium | Tilgjengelighetspass i Fase 3 |
| Custom dropdowns mangler keyboard/ARIA-støtte | 🟡 Medium | Tilgjengelighetspass i Fase 3 |

> Auth og RLS er implementert (Fase 4). Nye features kan nå avhenge av brukerdata.

---

## 🔧 Teknisk gjeld – kode (funn fra code review)

### main.js / app.html

| Problem | Fil | Alvorlighet | Løsning |
|---|---|---|---|
| Avatar-upload bruker `onclick`/`onchange` i HTML + `window._uploadImage` | `app.html`, `main.js` | ✅ Ferdig | Delegert `change`-lytter i `main.js`; `data-action="uploadImage"` på input; `window._uploadImage` fjernet. |
| Bootstrap-kommentarer mangler for bevisst lazy init via events | `main.js` | ✅ Ferdig | Kommentarer lagt til for alle `athlytics:`-event-lyttere i main.js. |

> **Merk:** Guard clause-mønster for ACTIONS: `var el = e.target.closest('[data-type]'); if (!el) return; adjust(el.dataset.type, ...)`

### supabase.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `id=eq.default` hardkodet i `fetchProfil()` og `fetchSettings()` | ✅ Ferdig | `fetchProfil(userId)` og `fetchSettings(userId)` er parametrisert; bruker `getUserId()` fra `auth.js` |
| `fetchSettings()` / `upsertSettings()` peker mot `profiler`-tabellen, men navngivingen antyder egen tabell | 🟡 Medium | Settings er en del av profilraden; vurder rename i Fase 5 |
| `headers(extra)` bruker alltid statisk anon key som bearer – ikke auth-klar | ✅ Ferdig | Bruker session.accessToken som bearer når autentisert, faller tilbake til anon key |

### state.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `allMatches` er muterbar eksportert variabel – state-kontrakten er svak | ✅ Ferdig | `_allMatches` er privat; `getAllMatches()` / `setAllMatches()` er eneste API. |
| `invalidateMatchCache()` tømmer kun sessionStorage, ikke in-memory state | ✅ Ferdig | Tømmer nå også `_allMatches = []`. Kontrakt: full reset av både cache og in-memory state. |

### settings.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `id: 'default'` hardkodet i settings-laget – tett koblet til midlertidig modell | ✅ Ferdig | `saveSettingsToSupabase()` bruker `getUserId()` fra `auth.js` |
| `getAllSeasons()` sorterer leksikografisk – usikkert for `2025–2026`-format | ✅ Ferdig | Sorterer på `parseInt(a) - parseInt(b)` – baseår som tall. |
| `renderSettings()` i `settings.js` renderer ikke selv – bare en event-trigger | ✅ Ferdig | Renamed til `requestRenderSettings()` med kommentar om event-pattern. |
| `defaultSettings()` er ikke eksportert, men dokumentasjonen sier den skal være det | ✅ Ferdig | Eksportert. |

### i18n.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `TEKST`-objektet inneholder blandet norsk/engelsk i verdiene (`'Eget team / tropp'`, `'Kamp saved!'`, `'Fullt name'` osv.) | ✅ Ferdig | 7 blandede verdier i `no`-grenen rettet; `en`-grenen var allerede korrekt. |
| `updateAllText()` bruker `innerHTML` der bare tekst/emoji settes | ✅ Ferdig | Auditert: all tekst bruker `textContent`; eneste `innerHTML` er `profileTitle` som trenger `<span>`-markup – kommentert som bevisst valg. |

### profile.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `uploadImage()` lagrer base64 i localStorage – risiko for quota-feil ved store bilder | 🟠 Høy | Flytt til Supabase Storage i Fase 5 (auth er nå på plass) |
| `showAvatarImage()` og `renderLogSub()` har hardkodede tekster uten `t()` | ✅ Ferdig | Alle hardkodede strenger erstattet med `t()`; 6 nye nøkler lagt til i `TEKST`; døde variabler fjernet fra `renderLogSub()`. |
| `renderProfileTeamList()` og `renderProfileTournamentList()` bør arkitektonisk tilhøre `teams.js` | ✅ Ferdig | Begge funksjoner flyttet til `teams.js`; `profile.js` dispatcher `athlytics:renderProfileLists`-event; `main.js` lytter og kaller begge. |
| `renderProfileTeamList()` bruker HTML-streng mens `renderProfileTournamentList()` bruker DOM API | ✅ Ferdig | Begge bruker nå DOM API — standardisert ved flytting til `teams.js`. |

### teams.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `closeAllDropdowns()` nullstiller ikke `showNewTournamentInput`, `showNewTeamInput` eller modal-state | ✅ Ferdig | Resetter begge booleans og skjuler `tournament-new-row` i tillegg til `team-new-row`. |
| `selectedTeam` slettes ikke fra state hvis laget fjernes fra profilen – hengende state | ✅ Ferdig | `activeLag` valideres mot `profileTeams` i både `renderStats()` og `renderAnalyse()`; nullstilles til `'all'` hvis ikke lenger gyldig. |
| `setFavoriteTeam()` / `setFavoriteTournament()` kaller `selectTeam()` som sideeffekt | ✅ Ferdig | Dokumentert som bevisst valg med kommentar i koden. |
| Inkonsistent render-strategi: `renderTeamDropdown()` bruker HTML-streng, `renderTournamentDropdown()` bruker DOM API | ✅ Ferdig | `renderTeamDropdown()` konvertert til DOM API. |
| Eksporterte variabler `selectedTeam`/`selectedTournament` i dokumentasjonen – koden eksporterer bare gettere | ✅ Ferdig | Dokumentasjon oppdatert til å reflektere faktiske gettere. |

### log.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `saveMatch()` muterer `allMatches` direkte med `.unshift()` før `setAllMatches()` | ✅ Ferdig | Bruker `setAllMatches([newMatch].concat(allMatches))` – ingen direkte mutasjon av delt state. |
| `resetForm()` resetter ikke valgt lag – bevisst UX-valg eller glemt? | ✅ Ferdig | Dokumentert som bevisst valg med kommentar i koden. |
| `setMatchType()` og `updateResult()` mangler guard clauses på DOM-oppslag | ✅ Ferdig | Null-sjekk på alle 4 toggle/label-elementer i `setMatchType()`; null-sjekk på `result-display` i `updateResult()`. |

### modal.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `saveEditedMatch()` og `confirmDeleteMatch()` kaller `renderStats()` direkte – tett kobling | ✅ Ferdig | Dispatcher `athlytics:matchesChanged`; `main.js` lytter og kaller `loadStats(true)`. |

> **Kritisk invariant:** `modalAdjust()` og `adjust()` **må** alltid ha identisk clamp-logikk. Endre aldri én uten den andre.

### navigation.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `switchTab()` mangler guard clauses – kaster hvis `screen-${tab}` eller `tab-${tab}` ikke finnes | ✅ Ferdig | Hoister begge `getElementById`-kall, returnerer tidlig hvis enten er null; gjenbruker variablene i `classList`-operasjoner. |
| `updateLogBadge()` hardkoder sport-til-ikon-mapping inline | 🟢 Lav | Flytt til `SPORT_META`-map ved Fase 3 multi-sport |

### stats-overview.js / stats-analyse.js / stats-search.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `stats.js` hadde blitt for stor | ✅ Ferdig | Splittet i tre moduler (se filstruktur). |
| `innerHTML` med store HTML-strenger – risiko for glemte escapes | 🟡 Medium | All brukerdata escapes med `esc()`; vurder DOM API ved videre refaktorering. |

### export.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| PDF-implementasjon er `window.open + print()` – kan blokkeres av popup-blokkering | 🟡 Medium | Dokumenter som print-HTML, ikke ekte PDF; vurder bibliotek (f.eks. jsPDF) ved Fase 4 |
| `profil.name` / `profil.club` i PDF-header – koblet til lokal profilform, ikke eksplisitt kontrakt | ✅ Ferdig | Profilmodell er nå UUID-basert og stabil etter auth-migrering |

### settings-render.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `setActiveSeason()` toast har hardkodet norsk fallback `'ingen'` – språkmix ved engelsk | ✅ Ferdig | Erstattet med `t('none')` – ny `none`-nøkkel i `TEKST` (`'ingen'` / `'none'`). |
| `setSeasonFormat()` validerer ikke om `activeSeason` fortsatt er gyldig etter formatbytte | ✅ Ferdig | Sjekker mot `getAllSeasons()` etter formatbytte; nullstiller `activeSeason` hvis ikke lenger gyldig. |
| `setSport()` har ingen validering av gyldige sportverdier | ✅ Ferdig | `ALLOWED_SPORTS`-konstant definert i `settings-render.js`; `setSport()` returnerer tidlig hvis sport ikke er i lista. |
| `renderSettings()` bruker `innerHTML` for sport-piller med `<span>` | 🟢 Lav | Akseptabelt siden data ikke er brukerdata; men vurder DOM API for konsistens |

### utils.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `isPremium()` returnerer alltid `true` – er en dev-toggle, ikke en domenefunksjon | ✅ Ferdig | Renamed til `isDevPremium()` med TODO-kommentar for Fase 4. |

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
  i18n.js               – TEKST, t(), setLang(), updateAllText(), updateFlags(), toggleLangPicker()
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
- `athlytics:matchesChanged` – dispatched by modal.js after save/delete → loadStats(true) i main.js
- `athlytics:requireAuth` – dispatched by WRITE_ACTIONS gate, keydown Enter guard, and uploadImage guard → openAuthOverlay('login') i main.js

---

## Avhengighetsgraf

```
config.js
    ↓
auth.js                        ← imported by supabase.js, profile.js, settings.js, main.js
    ↓
supabase.js
    ↓
state.js    utils.js    toast.js
    ↓
settings.js
    ↓
i18n.js  ←  settings.js
    ↓
profile.js   teams.js   settings-render.js   navigation.js
    ↓           ↓              ↓                   ↓
  log.js     modal.js    stats-overview.js      export.js
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

> **Merk:** JS-profilobjektet bruker feltnavn `teams` (array) internt. `saveProfileToSupabase()` mapper dette til DB-kolonnen `team`. `fetchProfileFromSupabase()` leser `row.team` og lagrer som `teams` i JS-objektet. Kolonnen `position` eksisterer ikke i databasen.

**All kode og alle Supabase-kolonner bruker engelske navn.** Ingen mapping mellom lag og applag – JS-feltnavn og DB-kolonnenavn er identiske.

### localStorage-nøkler

```
athlytics_profile   → { name, club, teams[], favoriteTeam, tournaments[], favoriteTournament, avatar }
athlytics_settings  → { sport, seasonFormat, activeSeason, lang, extraSeasons[] }
sessionStorage: 'athlytics_matches'  → cache, invalidated after save/edit/delete
```

---

## Kodenavn-konvensjoner

All kode bruker engelsk – JS-variabelnavn og Supabase-kolonnenavn er identiske. Ingen mapping nødvendig.

| JS-variabel | Supabase-kolonne |
|---|---|
| `k.date` | `date` |
| `k.opponent` | `opponent` |
| `k.own_team` | `own_team` |
| `k.home_score` / `k.away_score` | `home_score` / `away_score` |
| `k.goals` | `goals` |
| `k.match_type` | `match_type` — ALWAYS `'home'` or `'away'` |

### Viktige funksjoner per modul

**config.js** – konstanter
**supabase.js** – `fetchKamper()`, `insertKamp(body)`, `updateKamp(id, body)`, `deleteKamp(id)`, `fetchProfil()`, `upsertProfil(body)`, `upsertSettings(body)`
**state.js** – `getAllMatches()`, `setAllMatches(matches)`, `invalidateMatchCache()`
**utils.js** – `esc(str)`, `isDevPremium()`, `clampStats(goals, assists, ownScore)`, `getResult(k)`
**toast.js** – `showToast(msg, type)`
**settings.js** – `getSettings()`, `saveSettings(s)`, `defaultSettings()`, `buildSeasonLabel(aar, format)`, `getAllSeasons(allMatches)`, `getDateLocale()`, `requestRenderSettings()`
**i18n.js** – `t(key)`, `setLang(lang)`, `updateAllText()`, `updateFlags()`, `toggleLangPicker(btn)`
**profile.js** – `getProfile()`, `saveProfile_local(profil)`, `fetchProfileFromSupabase()`, `saveProfileToSupabase(profil)`, `saveProfile()`, `loadProfileData(profil)`, `updateAvatar()`, `uploadImage(input)`, `showAvatarImage(src)`, `renderLogSub()`, `renderProfileTeamList()`, `renderProfileTournamentList()`
**teams.js** – `getSelectedTeam()`, `getSelectedTournament()`, `selectTeam(name)`, `selectTournament(name)`, `toggleTeamDropdown()`, `renderTeamDropdown()`, `renderTournamentDropdown()`, `saveNewTeamFromDropdown()`, `saveNewTournamentFromDropdown()`, `toggleNewTeamInput()`, `toggleNewTournamentInput()`, `addTeamFromProfile()`, `addTournament()`, `deleteTeam(name)`, `deleteTournament(name)`, `setFavoriteTeam(name)`, `setFavoriteTournament(name)`, `selectModalTeam(name)`, `selectModalTournament(name)`, `toggleModalTeamDropdown()`, `toggleModalTournamentDropdown()`, `renderModalTeamDropdown()`, `renderModalTournamentDropdown()`, `closeAllDropdowns()`
**navigation.js** – `switchTab(tab)`, `updateLogBadge()`
**settings-render.js** – `renderSettings()`, `renderActiveSeasonPills()`, `setSport(sport)`, `setSeasonFormat(format)`, `setDateFormat(format)`, `setActiveSeason(sesong)`, `addSeason()`, `applyTheme(sport)`
**log.js** – `adjust(type, delta)`, `saveMatch()`, `resetForm()`, `setMatchType(type)`, `updateResult()`, `getMatchType()`
**stats-overview.js** – `loadStats(forceRefresh?)`, `renderStats()`, `calcWDL(matchArr)`, `switchStatsView(view)`, `setSeason(s)`, `setTeamFilter(team)`, `setTournamentFilter(tournament)`, `setMatchPage(page)`, `setOpponentSearch(val)`; eksporterte vars: `activeStatsView`, `activeLag`, `activeSeason`, `activeTournament`, `matchPage`, `opponentSearch`
**stats-analyse.js** – `renderAnalyse(matches, activeLag, activeSeason)`, `renderFormStreak(matches)`, `destroyCharts()`, `initChartDefaults()`
**stats-search.js** – `renderMatchListPaged(matches, page)`
**modal.js** – `openEditModal(id)`, `closeModal()`, `setModalMatchType(type)`, `modalAdjust(type, delta)`, `saveEditedMatch()`, `deleteMatch()`, `confirmDeleteMatch()`, `cancelDeleteMatch()`
**assessment.js** – `openAssessmentSheet(matchId)`, `closeAssessmentSheet()`, `resetAssessmentState()`, `loadMatchIntoAssessment(match)`, `renderAssessmentSheet()`, `renderModalAssessmentSection()`, `setRating(category, value, context)`, `saveAssessment()`, `getAssessmentPayload()`
**export.js** – `exportCSV()`, `exportPDF()`
**auth.js** – `login(email, password)`, `signup(email, password)`, `logout()`, `restoreSession()`, `getSession()`, `getUserId()`
**main.js** – bootstrap, `setupEventDelegation()`, `openAuthOverlay(view)`, `closeAuthOverlay()`, `handleAuthLogin()`, `handleAuthSignup()`, `updateDemoBanner()`, ACTIONS-map

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
Avatar-input i `app.html` bruker `data-action="uploadImage"`. `main.js` håndterer dette via delegert `change`-event. Ingen `window._uploadImage` global og ingen `onchange`-attributt.

---

## Nøkkelfunksjoner implementert

- Kamplogger med hjemme/borte-toggle og automatisk beregnet resultat
- Statistikk-tab med sesongvelger, lag-filter, seier/uavgjort/tap-kort, mål/assist/G+A
- **Form-streak** – siste 10 kamper som fargede bokser (S/U/T), vises i begge stats-visninger
- **Hjemme vs Borte-seksjon** – to kort med W/D/L, mål/assist/G+A og mini-bar per kamptype
- **Per turnering-seksjon** – turneringsnavn + antall kamper, S/U/T + G/A/G+A med uniform badge-bredde
- Kamphistorikk med paginering (20 per side) og slide-up redigeringsmodal (edit + slett)
- **Analyse-tab** – Chart.js-grafer bak toggle: kumulativ seiersprosent, mål & assist per kamp, mål per turnering
- **Premium-gate** – gratis ser form-streak + låst kort med blur-overlay; `isPremium()` hardkodet `true` til Fase 4
- Profil synkronisert til Supabase
- Lag- og turnering-dropdown i logg og modal med favoritt og inline oppretting
- **SVG-ikonsystem** – alle ikoner i `/icons/`-mappen, fargestyrt via CSS `mask-image` (tab-bar) og `currentColor` (match-type)
- Fullt i18n-system (norsk/engelsk) med flagg-velger på alle tabs
- Datoformat-valg (europeisk / amerikansk)
- Turnerings-filter i stats-tab

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

- Font: **Barlow Condensed** (overskrifter) + **Barlow** (brødtekst)
- Farger: `--grass: #1a3a1f` · `--lime: #a8e063` · `--card: #162b1a` · `--danger: #e05555` · `--gold: #f0c050`
- Mørk grønn estetikk, grid-mønster bakgrunn, max-width 480px sentrert
- Chart.js via CDN: `https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js` (defer i `<head>`)

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
Desktop-versjon venter til Fase 3/4. Bruksmønster:
- **Mobil** – logging av kamper, rask sjekk av enkeltstatistikk
- **Desktop** – full analyse, større grafer, coach/admin-visning

Desktop kobles naturlig til **Club-planen** (Fase 4). Ved implementering: sidebar-nav istedet for tab-bar, to-kolonne stats-layout, grafer med mer plass og detalj.

---

## Multi-sport theming (implementert, aktiveres i Fase 3)

`THEMES`-objekt og `applyTheme(sport)` er implementert i `settings-render.js`. `sport_icon`, `stat1_label`, `stat2_label` finnes i `TEKST`. Kalles fra `setSport()` og bootstrap.

```javascript
const THEMES = {
  fotball:     { grass: '#1a3a1f', lime: '#a8e063', card: '#162b1a' },
  orientering: { grass: '#1a2a3a', lime: '#63b8e0', card: '#162130' },
  ski:         { grass: '#1a1a3a', lime: '#a0a8e0', card: '#161628' }
};
```

Ved ny sport: legg til rad i `THEMES`, legg til `sport_icon`/`stat1_label`/`stat2_label` i `TEKST`, valider mot tillatt-liste i `setSport()`.

---

## Roadmap

### Fase 1–2 ✅ Fullført
Fase 1 (MVP), 1.5 (teknisk opprydding), 1.6 (UX-polish) og 2 (analyse/grafer) er alle fullført.

### Fase 3 – Multi-sport
- [ ] Orientering, ski

### Fase 4 – Monetisering
- [ ] Stripe-integrasjon
- [ ] `isPremium()` kobles til Stripe-abonnement
- [x] Auth (Supabase Auth) + riktig RLS-policy + `auth.js`-modul
- [x] **First login flow:** New users (empty profile) are redirected to Profile tab after login/signup. Soft prompt banner with "Skip for now" shown; gold badge on Profile tab icon until name is entered. Returning users (profile has name) go to Log tab. Banner and badge hidden for demo/unauthenticated users. Dismissal is session-only.

---

## Monetiseringsplan

| Nivå | Innhold | Pris |
|------|---------|------|
| Gratis | 1 lag, 1 sesong, basis statistikk, form-streak | kr 0 |
| Pro | Ubegrenset lag/sesonger, analyse-grafer, eksport CSV+PDF | ~kr 49/mnd |
| Club | Flere brukere, deling, lagadmin | ~kr 199/mnd |

**Uavklart:** Per turnering-statistikk (gratis eller Pro?), multi-sport (Pro-tillegg?), PDF alene vs CSV+PDF samlet
