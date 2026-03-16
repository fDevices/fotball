# Athlytics Sport – Prosjektdokumentasjon for Claude

> Denne filen gir Claude full kontekst om prosjektet ved oppstart av nye samtaler.

---

## Instruksjoner for Claude

- **Les alltid prosjektfilene ved oppstart** av nye samtaler før du gjør endringer.
- Prosjektet er nå splittet i moduler: `index.html`, `style.css`, og `js/`-mappen (se filstruktur nedenfor).
- Arbeidsfiler: `/home/claude/` → output: `/mnt/user-data/outputs/`
- **All koding skal være på engelsk** – variabelnavn, funksjonsnavn, ID-er, CSS-klasser, kommentarer, Supabase-kolonnenavn, localStorage-nøkler og kode-konstanter. Norsk tekst er OK kun i UI-strenger som vises til bruker (via `t()` i `i18n.js`).

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
2. Pusher til GitHub manuelt (inkludert oppdatert `CLAUDE.md`, `index.html`, `style.css`, og alle filer i `js/`)
3. Vercel auto-deployer fra `main`
4. Ny samtale startes etter større endringer

---

## ⛔ MVP-gjeld – løs før skalering

Følgende er kjent teknisk og sikkerhetsmessig gjeld som **må** løses før appen åpnes for flere brukere:

| Problem | Alvorlighet | Løsning |
|---|---|---|
| RLS på Supabase er "Allow all" på begge tabeller | 🔴 Kritisk | Implementer riktig RLS-policy per bruker ved auth |
| Ingen autentisering (Supabase Auth ikke implementert) | 🔴 Kritisk | Fase 4 – `auth.js` er reservert plass i modulstrukturen |
| `innerHTML`-kall escaper ikke alltid brukerdata | ✅ Ferdig | Full audit gjennomført – all brukerdata (opponent, team, tournament, profil.name/club, søk) escapes med `esc()` konsekvent i alle filer. |
| Supabase anon key er hardkodet i `js/config.js` | 🟠 Høy | Flytt til miljøvariabel via Vercel ved auth-implementasjon |
| `supabase.js` sjekker ikke `res.ok` – HTTP-feil (401/500 osv.) håndteres ikke | ✅ Ferdig | Alle fetch-funksjoner kaster ved `!res.ok`. `insertKamp`/`updateKamp`/`deleteKamp` returnerer `res` til caller som sjekker `res.ok` og viser toast. |
| `upsertProfil()` og `upsertSettings()` ignorerer respons – silent failure ved lagring | ✅ Ferdig | Begge kaster ved `!res.ok`. |
| **Supabase-tabeller og localStorage-nøkler er migrert til engelsk** – `matches`, `profiles`, engelske kolonner | ✅ Ferdig | Gjennomført. `supabase.js`, `profile.js`, `log.js`, `modal.js`, `stats.js`, `export.js`, `config.js` bruker engelske navn. `settings.js` brukte `k.dato` i `getAllSeasons()` – nå fikset til `k.date`. |
| Semantisk HTML mangler (`main`, `section`, `form`, `fieldset`, `dialog`) | 🟡 Medium | Refaktorer i Fase 3 |
| Modaler mangler ARIA (`role="dialog"`, `aria-modal`, fokusstyring) | 🟡 Medium | Tilgjengelighetspass i Fase 3 |
| Custom dropdowns mangler keyboard/ARIA-støtte | 🟡 Medium | Tilgjengelighetspass i Fase 3 |
| i18n ikke komplett – hardkodede norske strenger i stats/export | ✅ Ferdig | `stats.js` og `export.js` fullstendig i18n-pass gjennomført. CSV-kolonner, PDF-labels, toasts og datoformatering bruker `t()` og respekterer aktivt språk. |
| `applyTheme()` og `THEMES`-objekt ikke implementert ennå | ✅ Ferdig | `THEMES`-objekt og `applyTheme()` implementert i `settings-render.js`. Kalles fra `setSport()` og bootstrap. `sport_icon`, `stat1_label`, `stat2_label` lagt til i `TEKST`. |

> **Ikke legg til nye features som avhenger av brukerdata før auth og RLS er på plass.**

---

## 🔧 Teknisk gjeld – kode (funn fra code review)

### main.js / index.html

| Problem | Fil | Alvorlighet | Løsning |
|---|---|---|---|
| `renderProfileTeamList()` kalles ikke i bootstrap | `main.js` | ✅ Ferdig | Kalt i `window.addEventListener('load', ...)` etter `renderProfileTournamentList()`. |
| Guard clauses mangler i ACTIONS-map | `main.js` | ✅ Ferdig | Alle actions bruker `closest()`-element med tidlig retur ved null. |
| `toggleLangPicker` sender rå `e.target` | `main.js` linje 20 | ✅ Ferdig | Bruker `e.target.closest('[data-action]')`. |
| `renderStats` og `renderProfileTeamList` importeres men brukes ikke direkte | `main.js` linje 1 | ✅ Ferdig | `renderProfileTeamList` brukes i bootstrap; `renderStats` ikke importert. |
| Avatar-upload bruker `onclick`/`onchange` i HTML + `window._uploadImage` | `index.html` linje 188–192, `main.js` | 🟡 Medium | Migrer til delegert `input`-lytter og `data-action`; fjern global window-eksponering |
| Profil-save-knapp mangler ID `btn-save-profil` som i18n forventer | `app.html` | ✅ Ferdig | `id="btn-save-profil"` lagt til på knappen. |
| Bootstrap-kommentarer mangler for bevisst lazy init via events | `main.js` | 🟢 Lav | Legg til kommentarer der `renderSettings`, `loadStats` m.fl. trigges via `athlytics:`-events |

> **Merk:** Guard clause-mønster for ACTIONS: `var el = e.target.closest('[data-type]'); if (!el) return; adjust(el.dataset.type, ...)`

### supabase.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `id=eq.default` hardkodet i `fetchProfil()` og `fetchSettings()` | 🟠 Høy | Forbered parametrisert bruker-ID; byttes ut med `auth.users.id` i Fase 4 |
| `fetchSettings()` / `upsertSettings()` peker mot `profiler`-tabellen, men navngivingen antyder egen tabell | 🟡 Medium | Dokumenter at settings er en del av profilraden; vurder rename ved auth-migrering |
| `headers(extra)` bruker alltid statisk anon key som bearer – ikke auth-klar | 🟡 Medium | Skrives om i Fase 4 til å bruke session/access token fra `auth.js` |

### state.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `setAllMatches()` validerer ikke input – null eller ikke-array forurenser cache | ✅ Ferdig | Validerer med `Array.isArray`, returnerer tidlig med `console.warn`. |
| `try/catch` i `setAllMatches()` og `invalidateMatchCache()` svelger feil helt stille | ✅ Ferdig | Begge bruker `console.warn(...)` ved feil. |
| `allMatches` er muterbar eksportert variabel – state-kontrakten er svak | 🟢 Lav | Gjør variabel privat, eksponer `getAllMatches()` og `setAllMatches()` som API |
| `invalidateMatchCache()` tømmer kun sessionStorage, ikke in-memory state | 🟢 Lav | Avklar kontrakt: er funksjonen kun cache-invalidering eller full state-reset? |

### settings.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `saveSettings(s)` validerer ikke input – ugyldig `lang`, `seasonFormat`, ikke-array `extraSeasons` lagres ukritisk | ✅ Ferdig | Normaliserer alle enum-felter mot tillatte verdier og sikrer `extraSeasons` er array før lagring. |
| `saveSettingsToSupabase()` svelger alle feil stille | ✅ Ferdig | Bruker `console.warn(...)` ved feil. |
| Duplisert sesonglogikk: `getAllSeasons(allMatches)` i `settings.js` og `getAllSeasonsLocal()` i `settings-render.js` | ✅ Ferdig | Se settings-render.js-seksjonen nedenfor. |
| `id: 'default'` hardkodet i settings-laget – tett koblet til midlertidig modell | 🟠 Høy | Parametriser bruker-ID; byttes ut med `auth.users.id` i Fase 4 |
| `getAllSeasons()` sorterer leksikografisk – usikkert for `2025–2026`-format | 🟡 Medium | Sorter på baseår som tall før label bygges |
| `renderSettings()` i `settings.js` renderer ikke selv – bare en event-trigger | 🟡 Medium | Rename til `requestRenderSettings()` eller flytt ansvaret tydelig |
| `defaultSettings()` er ikke eksportert, men dokumentasjonen sier den skal være det | 🟡 Medium | Eksporter funksjonen eller oppdater dokumentasjonen |

### i18n.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `TEKST`-objektet inneholder blandet norsk/engelsk i verdiene (`'Eget team / tropp'`, `'Kamp saved!'`, `'Fullt name'` osv.) | 🟠 Høy | Rydd opp og velg konsekvent språk per nøkkel i både `no`- og `en`-grenene |
| `updateAllText()` bruker hardkodet språkgren for `profil-sub` og `settings-sub` i stedet for `t('profile_sub')` / `t('settings_sub')` | ✅ Ferdig | Begge bruker nå `t()`-oppslag. |
| `toggleLangPicker()` registrerer ny `document`-click-listener ved hvert kall – mulig opphopning | ✅ Ferdig | Erstattet med én global outside-click-listener i `main.js` |
| `setLang()` lukker kun `#lang-picker-dropdown` – ikke alle tabs sine dropdowns | ✅ Ferdig | Bruker `querySelectorAll('.lang-picker-dropdown').forEach(...)`. |
| `toggleLangPicker(btn)` bruker `btn.parentElement.querySelector()` – skjør DOM-avhengighet | ✅ Ferdig | Bruker `btn.closest('.lang-picker-wrap')`. |
| `updateAllText()` bruker `innerHTML` der bare tekst/emoji settes | 🟡 Medium | Bytt til `textContent` der markup ikke trengs – konsekvent defensiv praksis |
| DOM-kontrakter i `updateAllText()` antar ID-er som ikke alltid finnes i HTML (`btn-save-profil` osv.) | ✅ Ferdig | `btn-save-profil` lagt til i `app.html`; alle ID-er synkronisert. |

### profile.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| Supabase-mapping i `profile.js` – løses av DB-migreringen til engelske kolonnenavn | ✅ Ferdig | `posisjon` → `position` i JS-objektet og Supabase-mapping. `row.position` leses korrekt. `console.log` → `console.warn` i `saveProfileToSupabase`. |
| `fetchProfileFromSupabase()` svelger alle feil stille | ✅ Ferdig | Bruker `console.warn(...)` ved feil, faller tilbake til lokal cache. |
| `saveProfile()` kan overskrive nyere remote-data med stale lokal cache (team/tournaments) | ✅ Ferdig | Henter fersk remote-profil før merge; `team`/`tournaments`/`favoriteTeam` hentes fra remote. |
| `saveProfile_local()` mangler defensiv kopi og normalisering | ✅ Ferdig | Normaliserer `team`/`tournaments` til `[]` og lagrer kopi. |
| `uploadImage()` lagrer base64 i localStorage – risiko for quota-feil ved store bilder | 🟠 Høy | Akseptabelt i MVP; flytt til Supabase Storage ved auth-migrering |
| `showAvatarImage()` og `renderLogSub()` har hardkodede tekster uten `t()` | 🟡 Medium | Flytt "Trykk for å laste opp bilde", "Hi", "Klar til å logge kamp" m.fl. inn i `TEKST` |
| `renderProfileTeamList()` og `renderProfileTournamentList()` bør arkitektonisk tilhøre `teams.js` | 🟡 Medium | Flytt list-rendering til `teams.js`; `profile.js` skal ikke vite hvordan laglistene tegnes |
| `renderProfileTeamList()` bruker HTML-streng mens `renderProfileTournamentList()` bruker DOM API | 🟢 Lav | Velg én konsekvent strategi |

### teams.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `addTeamFromProfile()` synker ikke til Supabase – lokal-only lagring | ✅ Ferdig | Kaller `saveProfileToSupabase(profil)` etter `saveProfile_local(profil)`. |
| Lag/turnering-deduplisering er case-sensitiv – `Oppsal` og `oppsal` behandles som ulike | ✅ Ferdig | Sammenligner med `.toLowerCase()` alle 4 steder |
| Mange DOM-funksjoner mangler guard clauses (`toggleTeamDropdown`, `closeLagDropdown`, `selectTeam` m.fl.) | ✅ Ferdig | Null-sjekk lagt til i alle `getElementById()`-kall i `toggleTeamDropdown`, `closeLagDropdown`, `selectTeam`, `renderTeamDropdown`, `toggleNewTeamInput`, `toggleNewTournamentInput`. |
| Hardkodede tekster uten `t()`: "Nytt team…", "Nullstill turnering", "Laget finnes allerede" m.fl. | ✅ Ferdig | Nye nøkler lagt til i `i18n.js`: `toast_team_added`, `toast_tournament_added`, `toast_tournament_exists`, `tournament_reset`, `tournament_new`. Alle toast-meldinger og dropdown-labels bruker nå `t()`. |
| `closeAllDropdowns()` nullstiller ikke `showNewTournamentInput`, `showNewTeamInput` eller modal-state | 🟡 Medium | Reset alle interne state-variabler, ikke bare DOM-klasser |
| `selectedTeam` slettes ikke fra state hvis laget fjernes fra profilen – hengende state | 🟡 Medium | Valider `selectedTeam` mot `profil.team` ved rendering; nullstill hvis ikke lenger gyldig |
| `setFavoriteTeam()` / `setFavoriteTournament()` kaller `selectTeam()` som sideeffekt | 🟡 Medium | Avklar om favorittmarkering skal endre aktivt valg; dokumenter eller separer |
| Inkonsistent render-strategi: `renderTeamDropdown()` bruker HTML-streng, `renderTournamentDropdown()` bruker DOM API | 🟢 Lav | Velg én konsekvent strategi |
| Eksporterte variabler `selectedTeam`/`selectedTournament` i dokumentasjonen – koden eksporterer bare gettere | 🟢 Lav | Oppdater dokumentasjonen til å reflektere faktiske gettere |

### log.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `saveMatch()` muterer `allMatches` direkte med `.unshift()` før `setAllMatches()` | 🟡 Medium | Bruk `setAllMatches([newMatch, ...allMatches])` – ingen direkte mutasjon av delt state |
| `saveMatch()` har hardkodet 'Lagrer...' og `'Feil: ' + err.message` – ikke i18n | ✅ Ferdig | Bruker nå `t('saving')` med norsk/engelsk oversettelse |
| `saveMatch()` antar at feilrespons alltid er JSON med `err.message` – kan krasje ved tom body | ✅ Ferdig | Fjernet JSON-parsing av feilrespons; bruker nå `t('toast_feil_lagring')` direkte. |
| `resetForm()` resetter ikke valgt lag – bevisst UX-valg eller glemt? | 🟢 Lav | Dokumenter som bevisst valg, eller legg til eksplisitt reset |
| `setMatchType()` og `updateResult()` mangler guard clauses på DOM-oppslag | 🟢 Lav | Null-sjekk på `getElementById`-kall |

### modal.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `saveEditedMatch()` mangler minimumsvalidering – kan lagre tom/ufullstendig kamp | ✅ Ferdig | Validerer `date`, `opponent`, `own_team` før API-kall; viser `toast_fyll_inn` ved feil. |
| `saveEditedMatch()` muterer `allMatches[idx]` direkte med `Object.assign()` | ✅ Ferdig | Bruker `setAllMatches(allMatches.map(...))` – ingen direkte mutasjon. |
| ID-sammenligning inkonsistent: `String(m.id)` i `openEditModal()`, men `k.id ===` i `saveEditedMatch()` | ✅ Ferdig | `String(m.id)` brukes konsekvent i begge funksjoner. |
| `closeModal()` tømmer ikke `mHome`, `mAway`, `mGoals`, `mAssists`, `mMatchType` eller inputfelter | ✅ Ferdig | Resetter all intern state og input-felter ved lukking. |
| `saveEditedMatch()` og `confirmDeleteMatch()` kaller `renderStats()` direkte – tett kobling | 🟢 Lav | Vurder domene-event `athlytics:matchesChanged` for løsere kobling |
| Modal-tittel settes til `k.motstanderlag` – hardkodet fallback 'Rediger kamp' uten `t()` | ✅ Ferdig | Bruker `t('modal_rediger')` som fallback. `'Lagrer...'` og `'denne kampen'` bruker nå også `t()`. |

> **Kritisk invariant:** `modalAdjust()` og `adjust()` **må** alltid ha identisk clamp-logikk. Endre aldri én uten den andre.

### navigation.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `switchTab()` mangler guard clauses – kaster hvis `screen-${tab}` eller `tab-${tab}` ikke finnes | 🟡 Medium | Null-sjekk på begge DOM-oppslag før `classList`-operasjoner |
| `updateLogBadge()` hardkoder sport-til-ikon-mapping inline | 🟢 Lav | Flytt til `SPORT_META`-map ved Fase 3 multi-sport |

### stats.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `setMatchPage()` ignorerer aktiv `opponentSearch` – paginering gir feil liste ved søk | ✅ Ferdig | Ruter til `renderOpponentSearchResults()` hvis `opponentSearch` er aktiv. |
| Sesongmodell er uavhengig av `settings.js` – bruker bare årstall fra `dato`, ikke `seasonFormat` | ✅ Ferdig | `getSeasons()` fjernet; bruker `getAllSeasons(allMatches)` fra `settings.js`. `getSeasonBaseYear()` helper splitter `2025–2026` til `2025` for `startsWith`-filtrering. |
| `loadStats()` leser `sessionStorage` direkte – undergraver `state.js` som eneste cache-grense | ✅ Ferdig | Sjekker `allMatches.length > 0` (in-memory) før fetch; fjernet direkte `sessionStorage`-lesing og `CACHE_KEY`-import. |
| Svært mange hardkodede norske strenger i stats-UI (20+) | ✅ Ferdig | Systematisk gjennomgang fullført – 30+ nøkler lagt til i `i18n.js`, alle strenger bruker `t()`. |
| `activeSeason` initialiseres hardkodet til `'2025'` | ✅ Ferdig | Initialiseres fra `getSettings().activeSeason` med fallback til inneværende år. |
| `renderStats()` mangler guard clauses på sentrale DOM-oppslag | ✅ Ferdig | Null-sjekk lagt til på `stats-content` og `stats-sub`. |
| Datoformatering låst til `'no-NO'` uavhengig av språkinnstilling | ✅ Ferdig | `fmtDate()` helper bruker `getSettings().lang` for å velge `en-GB` eller `no-NO`. |
| `stats.js` har blitt for stor – eier data, filtre, paging, søk, overview, analyse og charts | 🟡 Medium | Planlegg videre splitt: `stats-overview.js`, `stats-analyse.js`, `stats-search.js` (Fase 3) |
| `innerHTML` med store HTML-strenger dominerer – økt risiko for glemte escapes | 🟡 Medium | Verifiser at all brukerdata escapes med `esc()`; vurder DOM API for kritiske seksjoner |

### export.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `export.js` leser `sessionStorage` direkte – undergraver `state.js` som eneste cache-grense | ✅ Ferdig | `getMatchesForExport()` bruker `allMatches` fra `state.js` direkte; fjernet sessionStorage-fallback og `CACHE_KEY`-import. |
| Sesongfiltrering tar bare `baseYear` fra `activeSeason` – ikke kompatibelt med `2025–2026`-format | ✅ Ferdig | Splitter på `–` eller `-` for å hente baseår; fungerer for begge formater. |
| Hardkodede norske strenger i CSV-kolonner, PDF-labels og toast-meldinger | ✅ Ferdig | Fullstendig i18n-pass – alle strenger bruker `t()`; CSV og PDF reflekterer aktivt språk. |
| `showToast('Henter data...', 'success')` – feil signaltype for en pågående operasjon | ✅ Ferdig | Byttet til `'info'`-type. |
| PDF-implementasjon er `window.open + print()` – kan blokkeres av popup-blokkering | 🟡 Medium | Dokumenter som print-HTML, ikke ekte PDF; vurder bibliotek (f.eks. jsPDF) ved Fase 4 |
| `profil.name` / `profil.club` i PDF-header – koblet til lokal profilform, ikke eksplisitt kontrakt | 🟢 Lav | Avklar mot endelig profilmodell etter Supabase-mappingfix |

### 🗓️ Feature backlog

| Feature | Prioritet | Beskrivelse |
|---|---|---|
| Valg av datoformat (europeisk / amerikansk) | ✅ Ferdig | `dateFormat: 'eu' \| 'us'` i `defaultSettings()`. `getDateLocale()` i `settings.js`. UI-seksjon i settings-tab. `stats.js` og `export.js` bruker `getDateLocale()`. `setDateFormat()` i `settings-render.js` + ACTIONS. |
| Turnerings-filter i stats-tab | 🟡 Medium | Se spec nedenfor. |

#### Spec: Turnerings-filter i stats-tab

**Plassering:** I `#stats-filters`, som en tredje filterrad under sesong- og lag-pillene. Vises kun i oversikt-visningen (samme som de to øvrige radene — skjules automatisk i analyse-visningen fordi `#stats-filters` er skjult der).

Fordelen med å legge filteret her fremfor over søkefeltet er at det filtrerer **alle** stats på siden (W/D/L-kort, hjemme/borte-seksjon, per-turnering-seksjon og kamphistorikk) — ikke bare listen.

**Piller:**
- Alltid én «Alle»-pill (`activeTournament = 'all'`) — aktiv som standard
- Deretter én pill per unikt turnering i `seasonMatches` (etter sesong + lag-filter er anvendt), sortert alfabetisk
- Pill-tekst = turnerings-navn; kamper uten turnering (`k.tournament` er tom/null) samles under `t('no_tournament')`
- Raden bruker `flex-wrap: wrap` — CSS håndterer linjebryting automatisk, ingen JS-logikk nødvendig

**HTML-struktur i `#stats-filters`:**
```html
<div id="season-selector"></div>
<div id="team-filter-selector"></div>
<div id="tournament-filter-selector"></div>   ← ny rad
```

**State:**
- Ny eksportert variabel `activeTournament = 'all'` i `stats.js` (ved siden av `activeLag`, `activeSeason`)
- `setTournamentFilter(tournament)` — setter `activeTournament`, resetter `matchPage = 0`, kaller `renderStats()`
- Reset `activeTournament = 'all'` i `setSeason()` og `setTeamFilter()` (koordinert filterstate — sesonger og lag-endring nullstiller turnerings-valget)

**Filtering i `renderStats()`:**
```
seasonMatches  = allMatches filtrert på sesong
teamMatches    = seasonMatches filtrert på activeLag
matches        = teamMatches filtrert på activeTournament   ← ny
```
- `activeTournament === 'all'` → ingen ekstra filtrering
- Matcher `(k.tournament || '') === activeTournament`; tom streng mappes til `t('no_tournament')`-pill med verdi `''`

**Rendering:**
- Pill-HTML rendres i `renderStats()` på `#tournament-filter-selector`
- Aktiv pill får klasse `active`; `data-action="setTournamentFilter"` + `data-tournament="<verdi>"`
- Pillen for «ingen turnering» bruker `data-tournament=""` (tom streng)
- Skjul hele raden hvis alle kamper tilhører samme turnering (bare én unik verdi) — unødvendig støy

**i18n-nøkler:**
- `tournament_filter_all` → «Alle» / «All»
- `no_tournament` → «Ingen turnering» / «No tournament»

**ACTIONS-map (main.js):**
```javascript
setTournamentFilter: (e) => { var el = e.target.closest('[data-tournament]'); if (!el) return; setTournamentFilter(el.dataset.tournament); }
```

**`stats.js` eksporter som må oppdateres:**
- Legg til `activeTournament` og `setTournamentFilter` i eksportlisten
- Legg til `setTournamentFilter` i funksjons-oversikten i CLAUDE.md

### settings-render.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `getAllSeasonsLocal()` dupliserte `getAllSeasons()` fra `settings.js` og leste `sessionStorage` direkte | ✅ Ferdig | Slettet `getAllSeasonsLocal()`; bruker nå `getAllSeasons(allMatches)` fra `settings.js` med `allMatches` fra `state.js`. |
| Hardkodet cache-nøkkel `'athlytics_kamper'` – ikke importert fra `config.js` | ✅ Ferdig | Løst som del av `getAllSeasonsLocal()`-slettingen – `CACHE_KEY`-importen er ikke lenger nødvendig i `settings-render.js`. |
| `setActiveSeason()` toast har hardkodet norsk fallback `'ingen'` – språkmix ved engelsk | 🟡 Medium | Legg til `t('none')` eller tilsvarende nøkkel i `TEKST` |
| `setSeasonFormat()` validerer ikke om `activeSeason` fortsatt er gyldig etter formatbytte | 🟡 Medium | Nullstill eller oppdater `activeSeason` når format endres |
| `setSport()` har ingen validering av gyldige sportverdier | 🟡 Medium | Valider mot en tillatt-liste; definer som konstant for gjenbruk i Fase 3 |
| `addSeason()` godtar årstall med mer enn 4 siffer (f.eks. `20256`) | ✅ Ferdig | Validerer med `val.length !== 4 \|\| !/^\d{4}$/.test(val)` |
| `renderSettings()` bruker `innerHTML` for sport-piller med `<span>` | 🟢 Lav | Akseptabelt siden data ikke er brukerdata; men vurder DOM API for konsistens |

### toast.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| Ingen null-check på `#toast` – kaster hvis elementet mangler i DOM | ✅ Ferdig | Fikset |
| Ikke robust mot raske samtidige kall – tidligere `setTimeout` kan slette nyere toast | ✅ Ferdig | Fikset med `_toastTimer` + `clearTimeout` |
| `className = 'toast ' + type + ' show'` overskriver alle klasser – skjørt | ✅ Ferdig | Fikset med typevalidering |
| `type`-parameter valideres ikke – ukjent verdi gir inkonsistent stil | ✅ Ferdig | Validerer mot `['success','error','info']` |

### utils.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `esc()` brukes ikke konsekvent i hele appen – funksjonen er god, forbruket er ikke | ✅ Ferdig | Full audit gjennomført – all brukerdata escapes konsekvent i alle filer. |
| `isPremium()` returnerer alltid `true` – er en dev-toggle, ikke en domenefunksjon | 🟡 Medium | Rename til `isDevPremium()` eller kommenter tydelig at dette er midlertidig til Fase 4 |

---

## Filstruktur

```
index.html              – HTML-skall, laster kun <script type="module" src="js/main.js">
style.css               – all CSS
js/
  config.js             – SUPABASE_URL, SUPABASE_KEY, storage-nøkler
  supabase.js           – alle HTTP-kall mot Supabase REST API
  state.js              – allMatches[], setAllMatches(), invalidateMatchCache()
  utils.js              – esc(), isPremium()
  toast.js              – showToast()
  settings.js           – getSettings(), saveSettings(), buildSeasonLabel(), getAllSeasons(), getDateLocale()
  i18n.js               – TEKST, t(), setLang(), updateAllText(), updateFlags(), toggleLangPicker()
  profile.js            – profil-data, cache, Supabase-sync, rendering av profil-tab
  teams.js              – alle dropdown-funksjoner for lag og turnering (logg + modal)
  navigation.js         – switchTab(), updateLogBadge()
  settings-render.js    – renderSettings(), setSport(), setSeasonFormat(), setDateFormat(), setActiveSeason(), addSeason(), applyTheme()
  log.js                – adjust(), saveMatch(), resetForm(), setMatchType(), updateResult()
  stats.js              – loadStats(), renderStats(), renderAnalyse(), calcWDL(), getResult() m.m.
  modal.js              – openEditModal(), closeModal(), modalAdjust(), saveEditedMatch(), deleteMatch()
  export.js             – exportCSV(), exportPDF()
  main.js               – bootstrap, sentralisert event delegation (ACTIONS-map)
```

`auth.js` er **ikke** implementert ennå – reservert plass for Supabase Auth i Fase 4.

---

## Event delegation

All brukerinteraksjon går via sentralisert event delegation i `main.js`. **Ingen** `onclick`-attributter i `index.html`.

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
- `athlytics:renderSettings` – trigger renderSettings() fra i18n
- `athlytics:updateAllText` – renderLogSub(), updateResult(), updateLogBadge() fra i18n
- `athlytics:loadStats` – loadStats() fra navigation
- `athlytics:destroyCharts` – destroyCharts() fra navigation

---

## Avhengighetsgraf

```
config.js
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
  log.js     modal.js       stats.js           export.js
                  ↘              ↙
                      main.js  (orkestrator)
```

`state.js` bryter sirkulær risiko: `stats.js`, `modal.js` og `export.js` bruker alle `allMatches` uten å importere hverandre.

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
```

### Supabase-tabell: `profiles`

```
id (text, default 'default')
name (text)
club (text)
position (text)
teams (jsonb, default '[]')
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

**All kode og alle Supabase-kolonner bruker engelske navn.** Ingen mapping mellom lag og applag – JS-feltnavn og DB-kolonnenavn er identiske.

### localStorage-nøkler

```
athlytics_profile   → { name, club, position, teams[], favoriteTeam, tournaments[], favoriteTournament, avatar }
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
**state.js** – `allMatches[]`, `setAllMatches(matches)`, `invalidateMatchCache()`
**utils.js** – `esc(str)`, `isPremium()`
**toast.js** – `showToast(msg, type)`
**settings.js** – `getSettings()`, `saveSettings(s)`, `buildSeasonLabel(aar, format)`, `getAllSeasons(allMatches)`, `getDateLocale()`
**i18n.js** – `t(key)`, `setLang(lang)`, `updateAllText()`, `updateFlags()`, `toggleLangPicker(btn)`
**profile.js** – `getProfile()`, `saveProfile_local(profil)`, `fetchProfileFromSupabase()`, `saveProfileToSupabase(profil)`, `saveProfile()`, `loadProfileData(profil)`, `updateAvatar()`, `uploadImage(input)`, `showAvatarImage(src)`, `renderLogSub()`, `renderProfileTeamList()`, `renderProfileTournamentList()`
**teams.js** – `getSelectedTeam()`, `getSelectedTournament()`, `selectTeam(name)`, `selectTournament(name)`, `toggleTeamDropdown()`, `renderTeamDropdown()`, `renderTournamentDropdown()`, `saveNewTeamFromDropdown()`, `saveNewTournamentFromDropdown()`, `toggleNewTeamInput()`, `toggleNewTournamentInput()`, `addTeamFromProfile()`, `addTournament()`, `deleteTeam(name)`, `deleteTournament(name)`, `setFavoriteTeam(name)`, `setFavoriteTournament(name)`, `selectModalTeam(name)`, `selectModalTournament(name)`, `toggleModalTeamDropdown()`, `toggleModalTournamentDropdown()`, `renderModalTeamDropdown()`, `renderModalTournamentDropdown()`, `closeAllDropdowns()`
**navigation.js** – `switchTab(tab)`, `updateLogBadge()`
**settings-render.js** – `renderSettings()`, `renderActiveSeasonPills()`, `setSport(sport)`, `setSeasonFormat(format)`, `setDateFormat(format)`, `setActiveSeason(sesong)`, `addSeason()`, `applyTheme(sport)`
**log.js** – `adjust(type, delta)`, `saveMatch()`, `resetForm()`, `setMatchType(type)`, `updateResult()`, `getMatchType()`
**stats.js** – `loadStats(forceRefresh?)`, `renderStats()`, `renderAnalyse(matches)`, `calcWDL(matchArr)`, `getResult(k)`, `destroyCharts()`, `initChartDefaults()`, `switchStatsView(view)`, `setSeason(s)`, `setTeamFilter(team)`, `setMatchPage(page)`, `setOpponentSearch(val)`; eksporterte vars: `activeStatsView`, `activeLag`, `activeSeason`, `matchPage`, `opponentSearch`, `CHART_COLORS`
**modal.js** – `openEditModal(id)`, `closeModal()`, `setModalMatchType(type)`, `modalAdjust(type, delta)`, `saveEditedMatch()`, `deleteMatch()`, `confirmDeleteMatch()`, `cancelDeleteMatch()`
**export.js** – `exportCSV()`, `exportPDF()`
**main.js** – bootstrap, `setupEventDelegation()`, ACTIONS-map

---

## ⚠️ Kritiske konvensjoner – lær av tidligere bugs

### modalAdjust() – samme invariants som adjust()
`modalAdjust()` håndhever identiske clamps som `adjust()`:
- Goals kan ikke overstige eget lags score i modalen
- Assist kan ikke overstige `ownScore − goals`
- Senkes score, clampes goals og assist automatisk ned
- Eget lags score = `mHome` ved hjemmekamp, `mAway` ved bortekamp (styres av `mMatchType`)

**Ikke forenkle `modalAdjust()` tilbake til kun `Math.max(0, ...)`** – det vil gjeninnføre buggen der redigering kunne produsere logisk umulige kampdata (f.eks. 3 mål i en kamp der eget lag scoret 1).

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
`uploadImage()` er eksponert globalt som `window._uploadImage` fra `main.js` fordi avatar-input bruker `onchange`-attributt i HTML (eneste gjenværende `on*`-attributt).

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
- **SVG-ikonsystem** – alle ikoner i `/icons/`-mappen, fargestyrt via CSS `mask-image` (tab-bar) og `currentColor` (match-type). Flaggikoner som `<img>`. Bytt ikon ved å erstatte SVG-fil.
- Fullt i18n-system (norsk/engelsk) med flagg-velger på alle tabs
- Toast-notifikasjoner
- Google Fonts med preconnect + font-display swap
- **Filsplitt** – `app.js` erstattet av `js/`-moduler med ES module imports/exports

## i18n-system

```javascript
// i18n.js
const TEKST = { no: { ... }, en: { ... } };
export function t(key) { ... }
```

- `updateAllText()` – oppdaterer alle tabs ved språkskifte
- `updateFlags()` – bruker `querySelectorAll('.lang-flag-btn')` for alle tabs
- `toggleLangPicker(btn)` – finner dropdown via `btn.parentElement.querySelector()`
- **OBS:** Tab-nøkler i `TEKST` heter `tab_log`, `tab_stats`, `tab_profile`, `tab_settings` – merk `tab_profile` (ikke `tab_profil`)

**⚠️ i18n er ikke komplett.** Hardkodede norske strenger finnes fortsatt i `stats.js` (bl.a. "Hjemme vs Borte", "Per turnering", "Ingen kamper", "Kampfordeling", "Gjennomsnitt per kamp", "Søk motstander...") og `export.js` (kolonnenavn, labels). Datoformatering bruker alltid `'no-NO'` uavhengig av språkinnstilling. Fullføres i Fase 3-refaktoren.

---

## Design

- Font: **Barlow Condensed** (overskrifter) + **Barlow** (brødtekst)
- Farger: `--grass: #1a3a1f` · `--lime: #a8e063` · `--card: #162b1a` · `--danger: #e05555` · `--gold: #f0c050`
- Mørk grønn estetikk, grid-mønster bakgrunn, max-width 480px sentrert
- Chart.js via CDN: `https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js` (defer i `<head>`)

---

## Plattform-beslutninger

### Ikonsystem (implementert)

SVG-ikoner ligger i `/icons/`-mappen. Tab-ikoner fargestyres via CSS `mask-image`; flaggikoner brukes som `<img>`. For å bytte et ikon: erstatt SVG-filen — ingen kodeendringer nødvendig.

Se **`ICONS.md`** for alle SVG-filinnhold og CSS-mønster.

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
sport_icon: '⚽'  // legg til i TEKST.no og TEKST.en i i18n.js
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
Kall `applyTheme(sport)` fra `setSport()` i `settings-render.js`.

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
- [ ] Innlogging (Supabase Auth) – `auth.js` lages i Fase 4
- [ ] **Sikkerhet:** Escape brukerdata i innerHTML-kall – gjøres FØR lansering til andre brukere

### Fase 1.5 – Teknisk opprydding ✅
- [x] Cache `getSettings()` / `getProfile()` i minnet mellom kall
- [x] Paginering av kamphistorikk (20 per side)
- [x] Google Fonts: preconnect + font-display swap
- [x] Inline turnering-oppretting i logg-dropdown
- [x] Uniform badge-bredde i turnering-statistikk
- [x] Filsplitt: `app.js` → `js/`-moduler med ES module imports

### Fase 1.6 – UX-polish ✅
- [x] "Nullstill turnering"-valg i logg-dropdown
- [x] Bytt `confirm()`-dialog ved sletting med custom in-app modal (`delete-confirm-dialog` + `delete-confirm-backdrop`)
- [x] Profil: `saveProfile()` henter fersk remote-data før merge – `tournaments`/`team` mistes ikke lenger

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
- [x] Motstandersøk i Statistikk-tab – søkefelt over kamphistorikk, mini W/D/L-oppsummering

### Fase 3 – Multi-sport
- [ ] Orientering, ski
- [x] Forberedelse: `THEMES`-objekt, `sport_icon` + stat-labels i TEKST, `applyTheme()` i `settings-render.js`

### Fase 4 – Monetisering
- [ ] Stripe-integrasjon
- [ ] `isPremium()` kobles til Stripe-abonnement
- [ ] Auth (Supabase Auth) + riktig RLS-policy + `auth.js`-modul
- [ ] **First login flow:** After a user authenticates for the first time (empty profile row), redirect to the Profile tab with a soft prompt encouraging them to fill in name, club, and position. Include a "Skip for now" option so users can proceed without filling anything in. Show a persistent incomplete-badge on the Profile tab icon until at least a name is entered. Returning users (profile already populated) go directly to the Log tab as normal.

---

## Monetiseringsplan

| Nivå | Innhold | Pris |
|------|---------|------|
| Gratis | 1 lag, 1 sesong, basis statistikk, form-streak | kr 0 |
| Pro | Ubegrenset lag/sesonger, analyse-grafer, eksport CSV+PDF | ~kr 49/mnd |
| Club | Flere brukere, deling, lagadmin | ~kr 199/mnd |

**Uavklart:** Per turnering-statistikk (gratis eller Pro?), multi-sport (Pro-tillegg?), PDF alene vs CSV+PDF samlet
