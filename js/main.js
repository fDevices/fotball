import { fetchProfileFromSupabase, loadProfileData, renderLogSub, saveProfile, updateAvatar, uploadImage, renderProfileTournamentList, renderProfileTeamList } from './profile.js';
import { renderTeamDropdown, renderTournamentDropdown, selectTeam, selectTournament, toggleTeamDropdown, toggleTournamentDropdown, saveNewTeamFromDropdown, saveNewTournamentFromDropdown, toggleNewTeamInput, toggleNewTournamentInput, addTeamFromProfile, addTournament, deleteTeam, deleteTournament, setFavoriteTeam, setFavoriteTournament, closeAllDropdowns, toggleModalTeamDropdown, toggleModalTournamentDropdown, selectModalTeam, selectModalTournament } from './teams.js';
import { switchTab, updateLogBadge } from './navigation.js';
import { setLang, toggleLangPicker, updateFlags, updateAllText } from './i18n.js';
import { loadStats, renderStats, switchStatsView, setSeason, setTeamFilter, setMatchPage, setOpponentSearch, destroyCharts, initChartDefaults } from './stats.js';
import { adjust, saveMatch, setMatchType, updateResult } from './log.js';
import { openEditModal, closeModal, setModalMatchType, modalAdjust, saveEditedMatch, deleteMatch_action, cancelDeleteMatch, confirmDeleteMatch } from './modal.js';
import { exportCSV, exportPDF } from './export.js';
import { renderSettings, setSport, setSeasonFormat, setActiveSeason, addSeason } from './settings-render.js';
import { showToast } from './toast.js';

// ── Event delegation action map ────────────────────────────────────────────

const ACTIONS = {
  saveMatch:                     () => saveMatch(),
  adjust:                        (e) => { var el = e.target.closest('[data-type]'); adjust(el.dataset.type, Number(el.dataset.delta)); },
  setMatchType:                  (e) => setMatchType(e.target.closest('[data-match-type]').dataset.matchType),
  switchTab:                     (e) => switchTab(e.target.closest('[data-tab]').dataset.tab),
  setLang:                       (e) => setLang(e.target.closest('[data-lang]').dataset.lang),
  toggleLangPicker:              (e) => toggleLangPicker(e.target),
  saveProfile:                   () => saveProfile(),
  addTeamFromProfile:            () => addTeamFromProfile(),
  addTournament:                 () => addTournament(),
  toggleTeamDropdown:            () => toggleTeamDropdown(),
  toggleTournamentDropdown:      () => toggleTournamentDropdown(),
  saveNewTeamFromDropdown:       () => saveNewTeamFromDropdown(),
  saveNewTournamentFromDropdown: () => saveNewTournamentFromDropdown(),
  toggleNewTeamInput:            () => toggleNewTeamInput(),
  toggleNewTournamentInput:      () => toggleNewTournamentInput(),
  selectTeam:                    (e) => selectTeam(e.target.closest('[data-name]').dataset.name),
  selectTournament:              (e) => selectTournament(e.target.closest('[data-name]').dataset.name),
  setFavoriteTeam:               (e) => setFavoriteTeam(e.target.closest('[data-name]').dataset.name),
  deleteTeam:                    (e) => deleteTeam(e.target.closest('[data-name]').dataset.name),
  setFavoriteTournament:         (e) => setFavoriteTournament(e.target.closest('[data-name]').dataset.name),
  deleteTournament:              (e) => deleteTournament(e.target.closest('[data-name]').dataset.name),
  toggleModalTeamDropdown:       () => toggleModalTeamDropdown(),
  toggleModalTournamentDropdown: () => toggleModalTournamentDropdown(),
  selectModalTeam:               (e) => selectModalTeam(e.target.closest('[data-name]').dataset.name),
  selectModalTournament:         (e) => selectModalTournament(e.target.closest('[data-name]').dataset.name),
  openEditModal:                 (e) => openEditModal(e.target.closest('[data-id]').dataset.id),
  closeModal:                    () => closeModal(),
  modalAdjust:                   (e) => { var el = e.target.closest('[data-type]'); modalAdjust(el.dataset.type, Number(el.dataset.delta)); },
  setModalMatchType:             (e) => setModalMatchType(e.target.closest('[data-match-type]').dataset.matchType),
  saveEditedMatch:               () => saveEditedMatch(),
  deleteMatch:                   () => deleteMatch_action(),
  cancelDeleteMatch:             () => cancelDeleteMatch(),
  confirmDeleteMatch:            () => confirmDeleteMatch(),
  switchStatsView:               (e) => switchStatsView(e.target.closest('[data-view]').dataset.view),
  setSeason:                     (e) => setSeason(e.target.closest('[data-season]').dataset.season),
  setTeamFilter:                 (e) => setTeamFilter(e.target.closest('[data-team]').dataset.team),
  setMatchPage:                  (e) => setMatchPage(Number(e.target.closest('[data-page]').dataset.page)),
  setOpponentSearch:             (e) => setOpponentSearch(e.target.value),
  clearOpponentSearch:           () => { var i = document.getElementById('opponent-search-input'); if (i) i.value = ''; setOpponentSearch(''); },
  exportCSV:                     () => exportCSV(),
  exportPDF:                     () => exportPDF(),
  addSeason:                     () => addSeason(),
  setSport:                      (e) => setSport(e.target.closest('[data-sport]').dataset.sport),
  setSeasonFormat:               (e) => setSeasonFormat(e.target.closest('[data-format]').dataset.format),
  setActiveSeason:               (e) => setActiveSeason(e.target.closest('[data-season]').dataset.season),
  showProToast:                  () => showToast('Coming soon \u2013 Stripe i Fase 4 \u{1F680}', 'success'),
};

function setupEventDelegation() {
  document.addEventListener('click', function(e) {
    // Close dropdowns when clicking outside team-selector-wrap
    if (!e.target.closest('.team-selector-wrap')) {
      closeAllDropdowns();
    }

    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var action = btn.dataset.action;
    if (ACTIONS[action]) {
      try { ACTIONS[action](e); } catch(err) { console.error('Action error:', action, err); }
    }
  });

  // Input events
  document.addEventListener('input', function(e) {
    if (e.target.id === 'opponent-search-input') {
      setOpponentSearch(e.target.value);
    }
    if (e.target.dataset && e.target.dataset.action === 'updateAvatar') {
      updateAvatar();
    }
  });

  // Keydown: Enter for add-item inputs
  document.addEventListener('keydown', function(e) {
    if (e.key !== 'Enter') return;
    if (e.target.id === 'team-new-input') saveNewTeamFromDropdown();
    if (e.target.id === 'tournament-new-input') saveNewTournamentFromDropdown();
    if (e.target.id === 'profile-team-input') addTeamFromProfile();
    if (e.target.id === 'profile-new-tournament') addTournament();
    if (e.target.id === 'settings-ny-sesong') addSeason();
  });
}

// ── Cross-module event listeners (break circular deps) ─────────────────────

document.addEventListener('athlytics:toast', function(e) {
  showToast(e.detail.msg, e.detail.type);
});

document.addEventListener('athlytics:renderSettings', function() {
  renderSettings();
});

document.addEventListener('athlytics:updateAllText', function() {
  renderLogSub();
  updateResult();
  updateLogBadge();
});

document.addEventListener('athlytics:loadStats', function() {
  loadStats();
});

document.addEventListener('athlytics:destroyCharts', function() {
  destroyCharts();
});

// ── Bootstrap ──────────────────────────────────────────────────────────────

// Expose uploadImage globally for avatar onchange handler
window._uploadImage = uploadImage;

window.addEventListener('load', async function() {
  try {
    initChartDefaults();
    document.getElementById('date').value = new Date().toISOString().split('T')[0];
    updateResult();
    setupEventDelegation();

    var p = await fetchProfileFromSupabase();
    loadProfileData(p);
    renderTeamDropdown();
    renderLogSub();
    if (p.favoriteTeam && p.team.includes(p.favoriteTeam)) selectTeam(p.favoriteTeam);
    if (p.favoriteTournament && p.tournaments && p.tournaments.includes(p.favoriteTournament)) selectTournament(p.favoriteTournament);
    renderTournamentDropdown();
    renderProfileTournamentList();
    updateLogBadge();
    updateFlags();
    updateAllText();
  } catch(err) {
    console.error('Init failed:', err);
  }
});
