# Athlytics Sport – Filsplitt-plan v2

> **Status (11.03.2026):** Filsplitt fullført ✅. Alle 16 moduler levert og verifisert mot Julian 2025-testdata. `app.js` slettet. `auth.js` (steg 2) gjenstår til Fase 4.

---

## Gjeldende struktur

```
index.html
style.css
js/
  config.js         ← Supabase URL/key, localStorage-nøkler
  auth.js           ← Supabase Auth, session, bruker-ID  ⏳ Fase 4
  supabase.js       ← alle HTTP-kall mot Supabase REST API
  state.js          ← delt app-state (allMatches) – bryter sirkulære avhengigheter
  i18n.js           ← TEKST-objekt, t(), setLang(), updateAllText(), updateFlags()
  utils.js          ← esc(), isPremium()
  toast.js          ← showToast()
  profile.js        ← profil-data, cache, persistens, rendering av profil-tab
  teams.js          ← lag/turnering-domenelogikk og dropdown-rendering
  settings.js       ← settings-data, cache, persistens
  settings-render.js← rendering av settings-tab, setSport/setSeasonFormat/setActiveSeason/addSeason
  navigation.js     ← switchTab(), updateLogBadge()
  log.js            ← logg-skjema, adjust(), saveMatch(), resetForm()
  stats.js          ← loadStats(), renderStats(), renderAnalyse()
  modal.js          ← edit-modal, slett-dialog, modalAdjust(), saveEditedMatch()
  export.js         ← exportCSV(), exportPDF()
  main.js           ← bootstrap, init-rekkefølge, event delegation
```

`index.html` laster kun:
```html
<script type="module" src="js/main.js"></script>
```

---

## Avhengighetsgraf

```
config.js
    ↓
auth.js ──→ supabase.js
                ↓
            state.js    utils.js    toast.js    i18n.js
                ↓    ↘      ↓    ↘      ↓    ↘      ↓
            profile.js  settings.js  teams.js
                ↓           ↓           ↓
              log.js  settings-render.js  modal.js   export.js
                   ↘    navigation.js   ↙
                         stats.js
                            ↓
                         main.js  (orkestrator)
```

---

## Modulkontrakter

### `config.js`
**Eier:** Tilkoblingskonstanter og storage-nøkler.
```javascript
export const SUPABASE_URL
export const SUPABASE_KEY
export const CACHE_KEY    = 'athlytics_kamper'
export const PROFIL_KEY   = 'athlytics_profil'
export const SETTINGS_KEY = 'athlytics_settings'
```
> Nøkler er hardkodet inntil Vercel env vars settes opp i Fase 4.

---

### `auth.js` ⏳ Fase 4
**Eier:** Supabase Auth-session og bruker-ID.
```javascript
export async function signIn(email, password)
export async function signOut()
export async function getSession()
export function getCurrentUserId()
export function isLoggedIn()
```
**Auth-migrering er en egen leveranse (Fase 4):**
- `profiler.id` endres fra `'default'` til `auth.users.id` (UUID)
- `kamper` og `settings` får `user_id`-kolonne med FK til `auth.users`
- RLS-policies endres fra "Allow all" til `auth.uid() = user_id`
- Login/logout-UI lages

---

### `supabase.js`
**Eier:** Alle HTTP-kall mot Supabase REST API. Ingenting annet.
```javascript
export async function fetchKamper()
export async function insertKamp(body)
export async function updateKamp(id, body)
export async function deleteKamp(id)
export async function fetchProfil()
export async function upsertProfil(body)
export async function fetchSettings()
export async function upsertSettings(body)
```
> Returnerer kun data eller kaster feil. Aldri DOM, aldri toast, aldri cache.

---

### `state.js`
**Eier:** Delt app-state som krysser modulgrenser.
```javascript
export let allMatches = []
export function setAllMatches(matches)
export function invalidateMatchCache()
```
> Nøkkelen som forhindrer sirkulære avhengigheter mellom `stats.js`, `modal.js` og `export.js`.

---

### `i18n.js`
**Eier:** `TEKST`-objekt, aktivt språk, all tekst-oversetting.
```javascript
export function t(key)
export function setLang(lang)
export function updateAllText()
export function updateFlags()
export function toggleLangPicker(btn)
```
> Hardkodede norske strenger i `stats.js` og `export.js` gjenstår – flyttes til `TEKST` i Fase 3.

---

### `utils.js`
```javascript
export function esc(str)       // HTML-escape – bruk på ALT brukerdata i innerHTML
export function isPremium()    // hardkodet true – kobles til auth.js i Fase 4
```

---

### `toast.js`
```javascript
export function showToast(msg, type)
```

---

### `profile.js`
**Eier:** Profil-data, localStorage-cache, rendering av profil-tab.
```javascript
export function getProfile()
export function saveProfile_local(profil)
export async function fetchProfileFromSupabase()
export async function saveProfileToSupabase(profil)
export async function saveProfile()
export function loadProfileData(profil)
export function updateAvatar()
export function uploadImage(input)
export function showAvatarImage(src)
export function renderLogSub()
```

---

### `teams.js`
**Eier:** Lag/turnering-domenelogikk og all dropdown-rendering.
```javascript
// Logg-dropdowns
export let selectedTeam
export let selectedTournament
export function renderTeamDropdown()
export function renderTournamentDropdown()
export function selectTeam(name)
export function selectTournament(name)
export function toggleTeamDropdown()
export function toggleTournamentDropdown()
export function saveNewTeamFromDropdown()
export function saveNewTournamentFromDropdown()
export function toggleNewTeamInput()
export function toggleNewTournamentInput()

// Modal-dropdowns
export function renderModalTeamDropdown()
export function renderModalTournamentDropdown()
export function selectModalTeam(name)
export function selectModalTournament(name)
export function toggleModalTeamDropdown()
export function toggleModalTournamentDropdown()

// Profil-lister
export function renderProfileTeamList()
export function renderProfileTournamentList()
export function addTeamFromProfile()
export function deleteTeam(name)
export function setFavoriteTeam(name)
export function addTournament()
export function deleteTournament(name)
export function setFavoriteTournament(name)
```

---

### `settings.js`
**Eier:** Settings-data og localStorage-cache.
```javascript
export function getSettings()
export function saveSettings(s)
export function defaultSettings()
export function getAllSeasons()
export function buildSeasonLabel(aar, format)
```

---

### `settings-render.js`
**Eier:** Rendering av settings-tab og settings-mutasjoner.
```javascript
export function renderSettings()
export function renderActiveSeasonPills()
export function setSport(sport)
export function setSeasonFormat(format)
export function setActiveSeason(sesong)
export function addSeason()
```

---

### `navigation.js`
**Eier:** Tab-navigasjon og log-badge.
```javascript
export function switchTab(tab)
export function updateLogBadge()
```
> `switchTab()` kaller `destroyCharts()` ved tab-bytte – ansvarlig for Chart.js-livssyklus.

---

### `log.js`
**Eier:** Logg-skjema-state og lagring av ny kamp.
```javascript
export function setMatchType(type)
export function updateResult()
export function adjust(type, delta)
export async function saveMatch()
export function resetForm()
```
> **Kritisk:** `adjust()` inneholder clamp-logikk som må holdes identisk med `modalAdjust()` i `modal.js`.

---

### `stats.js`
**Eier:** Statistikk-state, datahenting og all statistikk-rendering.
```javascript
export async function loadStats(forceRefresh)
export function renderStats()
export function getResult(k)
export function calcWDL(matches)
export function setSeason(s)
export function setTeamFilter(team)
export function setMatchPage(page)
export function setOpponentSearch(val)
export function switchStatsView(view)
export function destroyCharts()
export function initChartDefaults()
```

---

### `modal.js`
**Eier:** Redigeringsmodal og slett-dialog.
```javascript
export function openEditModal(id)
export function closeModal()
export function setModalMatchType(type)
export function modalAdjust(type, delta)
export async function saveEditedMatch()
export function deleteMatch()
export async function confirmDeleteMatch()
export function cancelDeleteMatch()
```
> **Kritisk:** `modalAdjust()` clamp-logikk må holdes identisk med `adjust()` i `log.js`.

---

### `export.js`
**Eier:** CSV- og PDF-eksport.
```javascript
export async function exportCSV()
export async function exportPDF()
```

---

### `main.js`
**Eier:** Bootstrap, init-rekkefølge, event delegation.

```javascript
window.addEventListener('load', async () => {
  try {
    await getSession();                          // auth.js – Fase 4, no-op nå
    const profil = await fetchProfileFromSupabase();
    loadProfileData(profil);
    renderTeamDropdown();
    renderTournamentDropdown();
    renderProfileTournamentList();
    if (profil.favoriteTeam) selectTeam(profil.favoriteTeam);
    if (profil.favoriteTournament) selectTournament(profil.favoriteTournament);
    renderSettings();
    initChartDefaults();
    updateLogBadge();
    updateFlags();
    updateAllText();
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
    setupEventDelegation();
    await loadStats();
  } catch (err) {
    console.error('Init failed:', err);
  }
});
```

> `main.js` er orkestrator – ikke dumping-ground. Logikk som ikke handler om init-rekkefølge eller event-binding tilhører en annen modul.

#### Event delegation
Alle brukerinteraksjoner går via ett sentralt `click`-lytter med `data-action`-attributter:
```html
<button data-action="saveMatch">Lagre kamp</button>
<button data-action="switchTab" data-tab="stats">Statistikk</button>
```
Unntaket er `window._uploadImage` (fil-input callback) som fortsatt bruker `onclick`.

---

## Sjekkpunkter

| Steg | Leveranse | Status |
|---|---|---|
| ✅ 1 | `config.js` | Levert 09.03.2026 |
| ⏳ 2 | `auth.js` + Supabase-migrering | **Fase 4** |
| ✅ 3 | `supabase.js` | Levert |
| ✅ 4 | `state.js` | Levert |
| ✅ 5 | `utils.js` + `toast.js` | Levert |
| ✅ 6 | `i18n.js` | Levert |
| ✅ 7 | `settings.js` + `settings-render.js` + `navigation.js` | Levert |
| ✅ 8 | `profile.js` + `teams.js` | Levert |
| ✅ 9 | `log.js` | Levert |
| ✅ 10 | `modal.js` | Levert |
| ✅ 11 | `stats.js` | Levert |
| ✅ 12 | `export.js` | Levert |
| ✅ 13 | `main.js` + event delegation | Levert |
| ✅ 14 | Slett `app.js` | Levert 11.03.2026 – verifisert mot Julian 2025-testdata |

---

## Gjenstående teknisk gjeld

| Hva | Når |
|---|---|
| Hardkodede norske strenger i `stats.js` / `export.js` → `TEKST` | Fase 3 |
| `auth.js` + Supabase Auth + RLS-policies | Fase 4 |
| `profiler.id = 'default'` → bruker-UUID | Fase 4 |
| `isPremium()` hardkodet `true` → kobles til Stripe/auth | Fase 4 |
| `applyTheme()` / `THEMES`-objekt per sport | Fase 3 |
| `window._uploadImage` → `data-action` | Fase 4 (ved auth-refaktor) |
