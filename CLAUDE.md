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

## Git-workflow (lokal Mac)
Etter endringer i prosjektfiler:
```bash
git add .
git commit -m "beskrivelse av endringen"
git push
```
Vercel auto-deployer fra `main` innen 30–60 sekunder etter push.
### Oppsett (gjort én gang)
- Git installert via `xcode-select --install`
- Repo klonet til `~/Documents/fotball`
- GitHub autentisering via Personal Access Token (classic, repo-scope)

---

## ⛔ MVP-gjeld – løs før skalering

Følgende er kjent teknisk og sikkerhetsmessig gjeld som **må** løses før appen åpnes for flere brukere:

| Problem | Alvorlighet | Løsning |
|---|---|---|
| RLS på Supabase er "Allow all" på begge tabeller | 🔴 Kritisk | Implementer riktig RLS-policy per bruker ved auth |
| Ingen autentisering (Supabase Auth ikke implementert) | 🔴 Kritisk | Fase 4 – `auth.js` er reservert plass i modulstrukturen |
| `innerHTML`-kall escaper ikke alltid brukerdata | 🔴 Kritisk | Sanitiser input FØR lansering til andre brukere |
| Supabase anon key er hardkodet i `js/config.js` | 🟠 Høy | Flytt til miljøvariabel via Vercel ved auth-implementasjon |
| `supabase.js` sjekker ikke `res.ok` – HTTP-feil (401/500 osv.) håndteres ikke | 🟠 Høy | Legg til `if (!res.ok) throw new Error(...)` i alle fetch-funksjoner |
| `upsertProfil()` og `upsertSettings()` ignorerer respons – silent failure ved lagring | 🟠 Høy | Sjekk `res.ok`, kast feil ved HTTP-feil |
| **Supabase-tabeller og localStorage-nøkler byttes til engelsk** – `kamper`→`matches`, `profiler`→`profiles`, alle kolonner | 🔴 Kritisk | **Planlagt migrering:** drop og recreate tabeller med engelske navn; oppdater alle referanser i `supabase.js`, `profile.js`, `log.js`, `modal.js`, `stats.js`, `export.js`, `config.js` (CACHE_KEY). Purge testdata og importer på nytt. |
| Semantisk HTML mangler (`main`, `section`, `form`, `fieldset`, `dialog`) | 🟡 Medium | Refaktorer i Fase 3 |
| Modaler mangler ARIA (`role="dialog"`, `aria-modal`, fokusstyring) | 🟡 Medium | Tilgjengelighetspass i Fase 3 |
| Custom dropdowns mangler keyboard/ARIA-støtte | 🟡 Medium | Tilgjengelighetspass i Fase 3 |
| i18n ikke komplett – hardkodede norske strenger i stats/export | 🟡 Medium | Fullføres i Fase 3-refaktor |
| `applyTheme()` og `THEMES`-objekt ikke implementert ennå | 🟢 Lav | Implementeres i Fase 3 (multi-sport) |

> **Ikke legg til nye features som avhenger av brukerdata før auth og RLS er på plass.**

---

## 🔧 Teknisk gjeld – kode (funn fra code review)

### main.js / index.html

| Problem | Fil | Alvorlighet | Løsning |
|---|---|---|---|
| `renderProfileTeamList()` kalles ikke i bootstrap | `main.js` | 🟠 Høy | Legg til i `window.addEventListener('load', ...)` etter `renderProfileTournamentList()` |
| Guard clauses mangler i ACTIONS-map | `main.js` | 🟠 Høy | Hent `closest()`-element, returner tidlig hvis null, les deretter `dataset` |
| `toggleLangPicker` sender rå `e.target` | `main.js` linje 20 | 🟡 Medium | Bytt til `e.target.closest('[data-action]')` for robust referanse |
| `renderStats` og `renderProfileTeamList` importeres men brukes ikke direkte | `main.js` linje 1 | 🟡 Medium | Fjern ubrukte imports; `renderSettings` er OK – brukes via event |
| Avatar-upload bruker `onclick`/`onchange` i HTML + `window._uploadImage` | `index.html` linje 188–192, `main.js` | 🟡 Medium | Migrer til delegert `input`-lytter og `data-action`; fjern global window-eksponering |
| Profil-save-knapp mangler ID `btn-save-profil` som i18n forventer | `index.html` linje 235 | 🟡 Medium | Legg til `id="btn-save-profil"` på knappen, eller verifiser/korriger i18n-oppslaget |
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
| `setAllMatches()` validerer ikke input – null eller ikke-array forurenser cache | 🟡 Medium | Legg til `if (!Array.isArray(matches)) throw new Error(...)` |
| `try/catch` i `setAllMatches()` og `invalidateMatchCache()` svelger feil helt stille | 🟡 Medium | Bytt til `console.warn(...)` så cache-problemer er synlige |
| `allMatches` er muterbar eksportert variabel – state-kontrakten er svak | 🟢 Lav | Gjør variabel privat, eksponer `getAllMatches()` og `setAllMatches()` som API |
| `invalidateMatchCache()` tømmer kun sessionStorage, ikke in-memory state | 🟢 Lav | Avklar kontrakt: er funksjonen kun cache-invalidering eller full state-reset? |

### settings.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `saveSettings(s)` validerer ikke input – ugyldig `lang`, `seasonFormat`, ikke-array `extraSeasons` lagres ukritisk | 🟠 Høy | Normaliser og valider enum-felter og array-felter før lagring |
| `saveSettingsToSupabase()` svelger alle feil stille | 🟠 Høy | Legg til `console.warn(...)` eller re-throw, slik at lagringsfeil er sporbare |
| Duplisert sesonglogikk: `getAllSeasons(allMatches)` i `settings.js` og `getAllSeasonsLocal()` i `settings-render.js` | 🟠 Høy | Samle i én autoritativ funksjon; `settings-render.js` leser fra den, ikke fra sessionStorage direkte |
| `id: 'default'` hardkodet i settings-laget – tett koblet til midlertidig modell | 🟠 Høy | Parametriser bruker-ID; byttes ut med `auth.users.id` i Fase 4 |
| `getAllSeasons()` sorterer leksikografisk – usikkert for `2025–2026`-format | 🟡 Medium | Sorter på baseår som tall før label bygges |
| `renderSettings()` i `settings.js` renderer ikke selv – bare en event-trigger | 🟡 Medium | Rename til `requestRenderSettings()` eller flytt ansvaret tydelig |
| `defaultSettings()` er ikke eksportert, men dokumentasjonen sier den skal være det | 🟡 Medium | Eksporter funksjonen eller oppdater dokumentasjonen |

### i18n.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `TEKST`-objektet inneholder blandet norsk/engelsk i verdiene (`'Eget team / tropp'`, `'Kamp saved!'`, `'Fullt name'` osv.) | 🟠 Høy | Rydd opp og velg konsekvent språk per nøkkel i både `no`- og `en`-grenene |
| `updateAllText()` bruker hardkodet språkgren for `profil-sub` og `settings-sub` i stedet for `t('profile_sub')` / `t('settings_sub')` | 🟠 Høy | Bytt til `t()`-oppslag – nøklene finnes allerede i `TEKST` |
| `toggleLangPicker()` registrerer ny `document`-click-listener ved hvert kall – mulig opphopning | 🟡 Medium | Bruk én global outside-click-listener, eller styr åpen/lukket state eksplisitt i `main.js` |
| `setLang()` lukker kun `#lang-picker-dropdown` – ikke alle tabs sine dropdowns | 🟡 Medium | Bytt til `querySelectorAll('.lang-picker-dropdown').forEach(el => el.classList.remove('open'))` |
| `toggleLangPicker(btn)` bruker `btn.parentElement.querySelector()` – skjør DOM-avhengighet | 🟡 Medium | Bruk `btn.closest('.lang-picker-wrap').querySelector('.lang-picker-dropdown')` |
| `updateAllText()` bruker `innerHTML` der bare tekst/emoji settes | 🟡 Medium | Bytt til `textContent` der markup ikke trengs – konsekvent defensiv praksis |
| DOM-kontrakter i `updateAllText()` antar ID-er som ikke alltid finnes i HTML (`btn-save-profil` osv.) | 🟡 Medium | Synkroniser ID-er mellom `index.html` og `i18n.js`; manglende ID er stille feil |

### profile.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| Supabase-mapping i `profile.js` – løses av DB-migreringen til engelske kolonnenavn | 🔴 Kritisk | Fjernes når migrering er gjennomført; `fetchProfileFromSupabase()` og `saveProfileToSupabase()` trenger ikke lenger oversette feltnavn |
| `fetchProfileFromSupabase()` svelger alle feil stille | 🟠 Høy | Legg til `console.warn(...)` – stille fallback til lokal cache er OK som UX, ikke som diagnostikk |
| `saveProfile()` kan overskrive nyere remote-data med stale lokal cache (team/tournaments) | 🟠 Høy | Hent fersk profil fra remote før merge, eller merge eksplisitt mot siste kjente state |
| `saveProfile_local()` mangler defensiv kopi og normalisering | 🟠 Høy | Normaliser `team`/`tournaments` til `[]` ved manglende/feil type; lagre kopi ikke referanse |
| `uploadImage()` lagrer base64 i localStorage – risiko for quota-feil ved store bilder | 🟠 Høy | Akseptabelt i MVP; flytt til Supabase Storage ved auth-migrering |
| `showAvatarImage()` og `renderLogSub()` har hardkodede tekster uten `t()` | 🟡 Medium | Flytt "Trykk for å laste opp bilde", "Hi", "Klar til å logge kamp" m.fl. inn i `TEKST` |
| `renderProfileTeamList()` og `renderProfileTournamentList()` bør arkitektonisk tilhøre `teams.js` | 🟡 Medium | Flytt list-rendering til `teams.js`; `profile.js` skal ikke vite hvordan laglistene tegnes |
| `renderProfileTeamList()` bruker HTML-streng mens `renderProfileTournamentList()` bruker DOM API | 🟢 Lav | Velg én konsekvent strategi |

### teams.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `addTeamFromProfile()` synker ikke til Supabase – lokal-only lagring | 🟠 Høy | Legg til `saveProfileToSupabase(profil)` etter `saveProfile_local(profil)` |
| Lag/turnering-deduplisering er case-sensitiv – `Oppsal` og `oppsal` behandles som ulike | 🟠 Høy | Sammenlign på `trim().toLowerCase()`, lagre original casing bevisst |
| Mange DOM-funksjoner mangler guard clauses (`toggleTeamDropdown`, `closeLagDropdown`, `selectTeam` m.fl.) | 🟠 Høy | Legg til null-sjekk på alle `getElementById()`-kall før `.classList`-operasjoner |
| Hardkodede tekster uten `t()`: "Nytt team…", "Nullstill turnering", "Laget finnes allerede" m.fl. | 🟠 Høy | Flytt inn i `TEKST`-objektet i `i18n.js` |
| `closeAllDropdowns()` nullstiller ikke `showNewTournamentInput`, `showNewTeamInput` eller modal-state | 🟡 Medium | Reset alle interne state-variabler, ikke bare DOM-klasser |
| `selectedTeam` slettes ikke fra state hvis laget fjernes fra profilen – hengende state | 🟡 Medium | Valider `selectedTeam` mot `profil.team` ved rendering; nullstill hvis ikke lenger gyldig |
| `setFavoriteTeam()` / `setFavoriteTournament()` kaller `selectTeam()` som sideeffekt | 🟡 Medium | Avklar om favorittmarkering skal endre aktivt valg; dokumenter eller separer |
| Inkonsistent render-strategi: `renderTeamDropdown()` bruker HTML-streng, `renderTournamentDropdown()` bruker DOM API | 🟢 Lav | Velg én konsekvent strategi |
| Eksporterte variabler `selectedTeam`/`selectedTournament` i dokumentasjonen – koden eksporterer bare gettere | 🟢 Lav | Oppdater dokumentasjonen til å reflektere faktiske gettere |

### log.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `saveMatch()` muterer `allMatches` direkte med `.unshift()` før `setAllMatches()` | 🟡 Medium | Bruk `setAllMatches([newMatch, ...allMatches])` – ingen direkte mutasjon av delt state |
| `saveMatch()` har hardkodet 'Lagrer...' og `'Feil: ' + err.message` – ikke i18n | 🟡 Medium | Flytt til `t()`-nøkler i `TEKST` |
| `saveMatch()` antar at feilrespons alltid er JSON med `err.message` – kan krasje ved tom body | 🟡 Medium | Wrap JSON-parsing i try/catch, gi meningsfull fallback-feilmelding |
| `resetForm()` resetter ikke valgt lag – bevisst UX-valg eller glemt? | 🟢 Lav | Dokumenter som bevisst valg, eller legg til eksplisitt reset |
| `setMatchType()` og `updateResult()` mangler guard clauses på DOM-oppslag | 🟢 Lav | Null-sjekk på `getElementById`-kall |

### modal.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `saveEditedMatch()` mangler minimumsvalidering – kan lagre tom/ufullstendig kamp | 🟠 Høy | Valider dato, motstander og eget lag før API-kall – samme nivå som `saveMatch()` |
| `saveEditedMatch()` muterer `allMatches[idx]` direkte med `Object.assign()` | 🟡 Medium | Lag ny arraykopi: `setAllMatches(allMatches.map(m => m.id === id ? updated : m))` |
| ID-sammenligning inkonsistent: `String(m.id)` i `openEditModal()`, men `k.id ===` i `saveEditedMatch()` | 🟡 Medium | Bruk `String()`-normalisering konsekvent begge steder |
| `closeModal()` tømmer ikke `mHome`, `mAway`, `mGoals`, `mAssists`, `mMatchType` eller inputfelter | 🟡 Medium | Reset all intern modal-state ved lukking |
| `saveEditedMatch()` og `confirmDeleteMatch()` kaller `renderStats()` direkte – tett kobling | 🟢 Lav | Vurder domene-event `athlytics:matchesChanged` for løsere kobling |
| Modal-tittel settes til `k.motstanderlag` – hardkodet fallback 'Rediger kamp' uten `t()` | 🟢 Lav | Bruk `t('modal_rediger')` som fallback |

> **Kritisk invariant:** `modalAdjust()` og `adjust()` **må** alltid ha identisk clamp-logikk. Endre aldri én uten den andre.

### navigation.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `switchTab()` mangler guard clauses – kaster hvis `screen-${tab}` eller `tab-${tab}` ikke finnes | 🟡 Medium | Null-sjekk på begge DOM-oppslag før `classList`-operasjoner |
| `updateLogBadge()` hardkoder sport-til-ikon-mapping inline | 🟢 Lav | Flytt til `SPORT_META`-map ved Fase 3 multi-sport |

### stats.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `setMatchPage()` ignorerer aktiv `opponentSearch` – paginering gir feil liste ved søk | 🟠 Høy | Sjekk `opponentSearch`-state i `setMatchPage()` og rut til søke-render ved behov |
| Sesongmodell er uavhengig av `settings.js` – bruker bare årstall fra `dato`, ikke `seasonFormat` | 🟠 Høy | Bruk `getAllSeasons()` fra `settings.js` som autoritativ kilde; støtt `2025–2026`-format |
| `loadStats()` leser `sessionStorage` direkte – undergraver `state.js` som eneste cache-grense | 🟠 Høy | Les via `getAllMatches()` / `setAllMatches()` fra `state.js`; fjern direkte CACHE_KEY-oppslag |
| Svært mange hardkodede norske strenger i stats-UI (20+) | 🟠 Høy | Systematisk gjennomgang og flytt til `TEKST` i `i18n.js` |
| `activeSeason` initialiseres hardkodet til `'2025'` | 🟡 Medium | Init fra `getSettings().activeSeason` eller første tilgjengelige sesong |
| `renderStats()` mangler guard clauses på sentrale DOM-oppslag | 🟡 Medium | Null-sjekk på `season-selector`, `stats-content`, `stats-sub` m.fl. |
| Datoformatering låst til `'no-NO'` uavhengig av språkinnstilling | 🟡 Medium | Les aktivt språk fra `getSettings().lang` og formater deretter |
| `stats.js` har blitt for stor – eier data, filtre, paging, søk, overview, analyse og charts | 🟡 Medium | Planlegg videre splitt: `stats-overview.js`, `stats-analyse.js`, `stats-search.js` (Fase 3) |
| `innerHTML` med store HTML-strenger dominerer – økt risiko for glemte escapes | 🟡 Medium | Verifiser at all brukerdata escapes med `esc()`; vurder DOM API for kritiske seksjoner |

### export.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `export.js` leser `sessionStorage` direkte – undergraver `state.js` som eneste cache-grense | 🟠 Høy | Les via `getAllMatches()` fra `state.js` |
| Sesongfiltrering tar bare `baseYear` fra `activeSeason` – ikke kompatibelt med `2025–2026`-format | 🟠 Høy | Bruk samme sesonglogikk som `settings.js`/`getAllSeasons()` |
| Hardkodede norske strenger i CSV-kolonner, PDF-labels og toast-meldinger | 🟠 Høy | Flytt til `TEKST` i `i18n.js`; eksport bør reflektere aktivt språk |
| `showToast('Henter data...', 'success')` – feil signaltype for en pågående operasjon | 🟡 Medium | Bytt til `'info'` eller `'loading'`-type |
| PDF-implementasjon er `window.open + print()` – kan blokkeres av popup-blokkering | 🟡 Medium | Dokumenter som print-HTML, ikke ekte PDF; vurder bibliotek (f.eks. jsPDF) ved Fase 4 |
| `profil.name` / `profil.club` i PDF-header – koblet til lokal profilform, ikke eksplisitt kontrakt | 🟢 Lav | Avklar mot endelig profilmodell etter Supabase-mappingfix |

### 🗓️ Feature backlog – datoformat i innstillinger

| Feature | Prioritet | Beskrivelse |
|---|---|---|
| Valg av datoformat (europeisk / amerikansk) | 🟡 Medium | Legg til `dateFormat: 'eu' \| 'us'` i `defaultSettings()`. EU = `DD.MM.YYYY`, US = `MM/DD/YYYY`. Render valg i settings-tab via `settings-render.js`. Bruk i `stats.js`, `export.js` og modal-dato-visning. Lagre til Supabase via eksisterende settings-sync. |

### settings-render.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `getAllSeasonsLocal()` dupliserer `getAllSeasons()` fra `settings.js` og leser `sessionStorage` direkte | 🟠 Høy | Slett `getAllSeasonsLocal()`; bruk `getAllSeasons(allMatches)` fra `settings.js` med data fra `state.js` |
| Hardkodet cache-nøkkel `'athlytics_kamper'` – ikke importert fra `config.js` | 🟡 Medium | Importer `CACHE_KEY` fra `config.js` |
| `setActiveSeason()` toast har hardkodet norsk fallback `'ingen'` – språkmix ved engelsk | 🟡 Medium | Legg til `t('none')` eller tilsvarende nøkkel i `TEKST` |
| `setSeasonFormat()` validerer ikke om `activeSeason` fortsatt er gyldig etter formatbytte | 🟡 Medium | Nullstill eller oppdater `activeSeason` når format endres |
| `setSport()` har ingen validering av gyldige sportverdier | 🟡 Medium | Valider mot en tillatt-liste; definer som konstant for gjenbruk i Fase 3 |
| `addSeason()` godtar årstall med mer enn 4 siffer (f.eks. `20256`) | 🟡 Medium | Bytt til `val.length === 4` som krav, ikke bare `>= 4` |
| `renderSettings()` bruker `innerHTML` for sport-piller med `<span>` | 🟢 Lav | Akseptabelt siden data ikke er brukerdata; men vurder DOM API for konsistens |

### toast.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| Ingen null-check på `#toast` – kaster hvis elementet mangler i DOM | 🟠 Høy | `var el = document.getElementById('toast'); if (!el) return;` |
| Ikke robust mot raske samtidige kall – tidligere `setTimeout` kan slette nyere toast | 🟠 Høy | Lagre timeout-referanse, kall `clearTimeout` før ny toast settes |
| `className = 'toast ' + type + ' show'` overskriver alle klasser – skjørt | 🟡 Medium | Behold basis-klasse, bruk `classList.add/remove` for variants og `show` |
| `type`-parameter valideres ikke – ukjent verdi gir inkonsistent stil | 🟢 Lav | Valider mot `['success', 'error', 'info']` eller silent-fallback til `'info'` |

### utils.js

| Problem | Alvorlighet | Løsning |
|---|---|---|
| `esc()` brukes ikke konsekvent i hele appen – funksjonen er god, forbruket er ikke | 🟠 Høy | Systematisk gjennomgang av alle `innerHTML`-tilordninger; manglende `esc()` er kjent kritisk gjeld |
| `isPremium()` returnerer alltid `true` – er en dev-toggle, ikke en domenefunksjon | 🟡 Medium | Rename til `isDevPremium()` eller kommenter tydelig at dette er midlertidig til Fase 4 |

---

## Filstruktur

```
landing.html            – Landing page (/) – marketing, norsk/engelsk toggle, ingen appen-avhengigheter
landing.css             – CSS for landing page – separat fra style.css, eget design-system
app.html                – App-skallet (flyttes fra index.html) – laster kun <script type="module" src="js/main.js">
style.css               – all CSS for appen
vercel.json             – Routing: / → landing.html, /app → app.html
js/
  config.js             – SUPABASE_URL, SUPABASE_KEY, storage-nøkler
  supabase.js           – alle HTTP-kall mot Supabase REST API
  state.js              – allMatches[], setAllMatches(), invalidateMatchCache()
  utils.js              – esc(), isPremium()
  toast.js              – showToast()
  settings.js           – getSettings(), saveSettings(), buildSeasonLabel(), getAllSeasons()
  i18n.js               – TEKST, t(), setLang(), updateAllText(), updateFlags(), toggleLangPicker()
  profile.js            – profil-data, cache, Supabase-sync, rendering av profil-tab
  teams.js              – alle dropdown-funksjoner for lag og turnering (logg + modal)
  navigation.js         – switchTab(), updateLogBadge()
  settings-render.js    – renderSettings(), setSport(), setSeasonFormat(), setActiveSeason(), addSeason()
  log.js                – adjust(), saveMatch(), resetForm(), setMatchType(), updateResult()
  stats.js              – loadStats(), renderStats(), renderAnalyse(), calcWDL(), getResult() m.m.
  modal.js              – openEditModal(), closeModal(), modalAdjust(), saveEditedMatch(), deleteMatch()
  export.js             – exportCSV(), exportPDF()
  main.js               – bootstrap, sentralisert event delegation (ACTIONS-map)
```

`auth.js` er **ikke** implementert ennå – reservert plass for Supabase Auth i Fase 4.

---

## Event delegation

All brukerinteraksjon går via sentralisert event delegation i `main.js`. Bruk `data-action` og ACTIONS-map for alle nye knapper.

> **Unntak (midlertidig teknisk gjeld):** Avatar-upload bruker `onchange` i HTML og `window._uploadImage` – eneste gjenværende `on*`-attributt. Migreres til delegert `input`-lytter.

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
**settings.js** – `getSettings()`, `saveSettings(s)`, `buildSeasonLabel(aar, format)`, `getAllSeasons(allMatches)`
**i18n.js** – `t(key)`, `setLang(lang)`, `updateAllText()`, `updateFlags()`, `toggleLangPicker(btn)`
**profile.js** – `getProfile()`, `saveProfile_local(profil)`, `fetchProfileFromSupabase()`, `saveProfileToSupabase(profil)`, `saveProfile()`, `loadProfileData(profil)`, `updateAvatar()`, `uploadImage(input)`, `showAvatarImage(src)`, `renderLogSub()`, `renderProfileTeamList()`, `renderProfileTournamentList()`
**teams.js** – `getSelectedTeam()`, `getSelectedTournament()`, `selectTeam(name)`, `selectTournament(name)`, `toggleTeamDropdown()`, `renderTeamDropdown()`, `renderTournamentDropdown()`, `saveNewTeamFromDropdown()`, `saveNewTournamentFromDropdown()`, `toggleNewTeamInput()`, `toggleNewTournamentInput()`, `addTeamFromProfile()`, `addTournament()`, `deleteTeam(name)`, `deleteTournament(name)`, `setFavoriteTeam(name)`, `setFavoriteTournament(name)`, `selectModalTeam(name)`, `selectModalTournament(name)`, `toggleModalTeamDropdown()`, `toggleModalTournamentDropdown()`, `renderModalTeamDropdown()`, `renderModalTournamentDropdown()`, `closeAllDropdowns()`
**navigation.js** – `switchTab(tab)`, `updateLogBadge()`
**settings-render.js** – `renderSettings()`, `renderActiveSeasonPills()`, `setSport(sport)`, `setSeasonFormat(format)`, `setActiveSeason(sesong)`, `addSeason()`
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

### match_type-verdier

**Nåværende kode (før DB-migrering):** `matchType` bruker `'hjemme'` og `'away'`.
**Etter DB-migrering:** `match_type` bruker `'home'` og `'away'` overalt.

> ⚠️ Ikke bland disse. Sjekk alltid hvilken fase koden er i. Etter migrering: aldri bruk `'hjemme'`, `'borte'` eller `'home'` fra gammel kode.

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
`uploadImage()` er eksponert globalt som `window._uploadImage` fra `main.js` fordi avatar-input bruker `onchange`-attributt i HTML. Dette er eneste gjenværende `on*`-attributt og kjent teknisk gjeld – migreres til delegert `input`-lytter.

---

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

## Selvvurdering etter kamp (planlagt feature)

### Konsept
Etter at en kamp er lagret kan spilleren vurdere egen prestasjon på 5 kategorier. Funksjonen er **valgfri** og vises bak en "expand"-knapp/toggle som dukker opp etter lagring – ikke som del av selve logg-skjemaet. Kun for kamper, ikke trening.

**Premium-feature** – gated bak `isPremium()` på samme måte som analyse-grafer.

### Kategorier (JS-identifikatorer og UI-labels)

| JS-felt | UI-label (NO) | UI-label (EN) |
|---|---|---|
| `rating_effort` | Innsats | Effort |
| `rating_focus` | Fokus | Focus |
| `rating_technique` | Teknikk | Technique |
| `rating_team_play` | Lagspill | Teamwork |
| `rating_impact` | Påvirkning | Impact |

### Skala (1–5, samme tekst for alle kategorier)
| Verdi | NO | EN |
|---|---|---|
| 1 | Veldig dårlig | Very poor |
| 2 | Under mitt nivå | Below my level |
| 3 | Greit | Okay |
| 4 | Bra | Good |
| 5 | Veldig bra | Very good |

### Refleksjonsfelter (fritekst, valgfrie)
- `reflection_good` – "Hva gikk bra?" / "What went well?"
- `reflection_improve` – "Hva vil jeg forbedre?" / "What do I want to improve?"

### Framing
Vis ikke som "objektiv vurdering" – bruk framing: **"Hvordan vurderer du deg selv i dag?"** Verdien ligger i gjentatte mønstre over tid, ikke enkeltscorer.

### DB-implikasjoner
7 nye nullable kolonner på `matches`-tabellen (alle kan være NULL for eksisterende kamper):
```
rating_effort      SMALLINT (1–5)
rating_focus       SMALLINT (1–5)
rating_technique   SMALLINT (1–5)
rating_team_play   SMALLINT (1–5)
rating_impact      SMALLINT (1–5)
reflection_good    TEXT
reflection_improve TEXT
```
Legges inn som del av **Fase 1.7**-migreringen (naturlig tidspunkt siden tabellene recreates uansett).

### Statistikk-utnyttelse (Fase 3)
Trendvisning per kategori (gjennomsnitt over sesong), utvikling per kamp, evt. korrelasjon med seier/tap. Implementeres i stats-tab som del av Fase 3 – ikke Fase 2.

### UI-pattern
1. Kamp lagres → toast "Kamp lagret ✓"
2. Under/ved siden av toasten (eller inline i skjemaet som ekspanderer): knapp "⭐ Vurder deg selv" (premium-merket)
3. Klikk → expand-seksjon med 5 sliders/stjerner + 2 tekstfelter
4. "Lagre vurdering"-knapp → `PATCH`/`updateKamp()` med ratings-feltene

---

## Roadmap

> Ferdigstilte faser ligger i `CHANGELOG.md`.

### Fase 2.5 – Landing page ✅
- [x] `landing.html` – hero, features, priser (Gratis/Pro/Club), footer
- [x] `landing.css` – polert marketing-design, Barlow Condensed, mørk grønn med lime-aksenter
- [x] `vercel.json` – routing: `/` → `landing.html`, `/app` → `app.html`
- [x] `index.html` renames til `app.html` (app flyttes til `/app`)
- [x] Norsk/engelsk toggle inline i `landing.html` (eget `TEKST`-objekt, uavhengig av app-i18n)
- [x] Responsiv – fungerer på mobil og desktop

**Landing page-arkitektur:**
- Ingen avhengigheter til app-koden (`js/`-moduler, `style.css`)
- Eget `TEKST`-objekt inline i `<script>` nederst i `landing.html`
- `landing.css` bruker egne CSS-variabler (deler fargepalett med appen, men eget design)
- Lenker til `/app` for CTA-knapper

### Fase 1.6 – UX-polish (backlog)
- [ ] Bytt `confirm()`-dialog ved sletting med custom in-app modal
- [ ] Profil: `tournaments`/`team` fra Supabase synkes ikke ved `saveProfile()` – kan miste data

### Fase 1.7 – DB-migrering og kodekonsolidering (planlagt)
- [ ] Drop og recreate `kamper`→`matches` og `profiler`→`profiles` med engelske kolonnenavn
- [ ] Oppdater `supabase.js`, `profile.js`, `log.js`, `modal.js`, `stats.js`, `export.js`, `config.js` (CACHE_KEY)
- [ ] Oppdater alle `match_type`-verdier fra `'hjemme'` til `'home'`
- [ ] Purge testdata og reimporter med nytt skjema
- [ ] Konsolider sesonglogikk til én autoritativ funksjon
- [ ] Konsolider cache-lesing bak `state.js`-grensen (fjern direkte sessionStorage-oppslag i stats.js, export.js, settings-render.js)
- [ ] Fiks `supabase.js` feilhåndtering: `res.ok`-sjekk og `throw` i alle funksjoner
- [ ] Legg til selvvurdering-kolonner på `matches`-tabellen: `rating_effort`, `rating_focus`, `rating_technique`, `rating_team_play`, `rating_impact` (SMALLINT nullable), `reflection_good`, `reflection_improve` (TEXT nullable)

### Fase 3 – Multi-sport
- [ ] Orientering, ski
- [ ] Forberedelse: `THEMES`-objekt, `sport_icon` + stat-labels i TEKST
- [ ] Selvvurdering-statistikk i stats-tab: gjennomsnitt per kategori, trendvisning per sesong, evt. korrelasjon med seier/tap

### Fase 4 – Monetisering
- [ ] Stripe-integrasjon
- [ ] `isPremium()` kobles til Stripe-abonnement
- [ ] Auth (Supabase Auth) + riktig RLS-policy + `auth.js`-modul

---

## Monetiseringsplan

| Nivå | Innhold | Pris |
|------|---------|------|
| Gratis | 1 lag, 1 sesong, basis statistikk, form-streak | kr 0 |
| Pro | Ubegrenset lag/sesonger, analyse-grafer, eksport CSV+PDF, selvvurdering etter kamp | ~kr 49/mnd |
| Club | Flere brukere, deling, lagadmin | ~kr 199/mnd |

**Uavklart:** Per turnering-statistikk (gratis eller Pro?), multi-sport (Pro-tillegg?), PDF alene vs CSV+PDF samlet
