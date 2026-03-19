import { fetchProfileFromSupabase, loadProfileData, renderLogSub, saveProfile, updateAvatar, uploadImage, dismissProfilePrompt, updateProfilePrompt } from './profile.js';
import { getSettings, getDateLocale } from './settings.js';
import { renderTeamDropdown, renderTournamentDropdown, renderProfileTeamList, renderProfileTournamentList, selectTeam, selectTournament, toggleTeamDropdown, toggleTournamentDropdown, saveNewTeamFromDropdown, saveNewTournamentFromDropdown, toggleNewTeamInput, toggleNewTournamentInput, addTeamFromProfile, addTournament, deleteTeam, deleteTournament, setFavoriteTeam, setFavoriteTournament, closeAllDropdowns, toggleModalTeamDropdown, toggleModalTournamentDropdown, selectModalTeam, selectModalTournament } from './teams.js';
import { switchTab, updateLogBadge } from './navigation.js';
import { t, setLang, toggleLangPicker, updateFlags, updateAllText } from './i18n.js';
import { loadStats, switchStatsView, setSeason, setTeamFilter, setTournamentFilter, setMatchPage, setOpponentSearch, destroyCharts, initChartDefaults } from './stats.js';
import { adjust, saveMatch, setMatchType, updateResult } from './log.js';
import { openEditModal, closeModal, setModalMatchType, modalAdjust, saveEditedMatch, deleteMatch, cancelDeleteMatch, confirmDeleteMatch } from './modal.js';
import { openAssessmentSheet, closeAssessmentSheet, saveAssessment, setRating } from './assessment.js';
import { exportCSV, exportPDF } from './export.js';
import { renderSettings, setSport, setSeasonFormat, setDateFormat, setActiveSeason, addSeason, applyTheme } from './settings-render.js';
import { showToast } from './toast.js';

// ── Event delegation action map ────────────────────────────────────────────

const ACTIONS = {
  saveMatch:                     () => saveMatch(),
  adjust:                        (e) => { var el = e.target.closest('[data-type]'); if (!el) return; adjust(el.dataset.type, Number(el.dataset.delta)); },
  setMatchType:                  (e) => { var el = e.target.closest('[data-match-type]'); if (!el) return; setMatchType(el.dataset.matchType); },
  switchTab:                     (e) => { var el = e.target.closest('[data-tab]'); if (!el) return; switchTab(el.dataset.tab); },
  setLang:                       (e) => { var el = e.target.closest('[data-lang]'); if (!el) return; setLang(el.dataset.lang); },
  toggleLangPicker:              (e) => toggleLangPicker(e.target.closest('[data-action]')),
  saveProfile:                   () => saveProfile(),
  addTeamFromProfile:            () => addTeamFromProfile(),
  addTournament:                 () => addTournament(),
  toggleTeamDropdown:            () => toggleTeamDropdown(),
  toggleTournamentDropdown:      () => toggleTournamentDropdown(),
  saveNewTeamFromDropdown:       () => saveNewTeamFromDropdown(),
  saveNewTournamentFromDropdown: () => saveNewTournamentFromDropdown(),
  toggleNewTeamInput:            () => toggleNewTeamInput(),
  toggleNewTournamentInput:      () => toggleNewTournamentInput(),
  selectTeam:                    (e) => { var el = e.target.closest('[data-name]'); if (!el) return; selectTeam(el.dataset.name); },
  selectTournament:              (e) => { var el = e.target.closest('[data-name]'); if (!el) return; selectTournament(el.dataset.name); },
  setFavoriteTeam:               (e) => { var el = e.target.closest('[data-name]'); if (!el) return; setFavoriteTeam(el.dataset.name); },
  deleteTeam:                    (e) => { var el = e.target.closest('[data-name]'); if (!el) return; deleteTeam(el.dataset.name); },
  setFavoriteTournament:         (e) => { var el = e.target.closest('[data-name]'); if (!el) return; setFavoriteTournament(el.dataset.name); },
  deleteTournament:              (e) => { var el = e.target.closest('[data-name]'); if (!el) return; deleteTournament(el.dataset.name); },
  toggleModalTeamDropdown:       () => toggleModalTeamDropdown(),
  toggleModalTournamentDropdown: () => toggleModalTournamentDropdown(),
  selectModalTeam:               (e) => { var el = e.target.closest('[data-name]'); if (!el) return; selectModalTeam(el.dataset.name); },
  selectModalTournament:         (e) => { var el = e.target.closest('[data-name]'); if (!el) return; selectModalTournament(el.dataset.name); },
  openEditModal:                 (e) => { var el = e.target.closest('[data-id]'); if (!el) return; openEditModal(el.dataset.id); },
  closeModal:                    () => closeModal(),
  modalAdjust:                   (e) => { var el = e.target.closest('[data-type]'); if (!el) return; modalAdjust(el.dataset.type, Number(el.dataset.delta)); },
  setModalMatchType:             (e) => { var el = e.target.closest('[data-match-type]'); if (!el) return; setModalMatchType(el.dataset.matchType); },
  saveEditedMatch:               () => saveEditedMatch(),
  deleteMatch:                   () => deleteMatch(),
  cancelDeleteMatch:             () => cancelDeleteMatch(),
  confirmDeleteMatch:            () => confirmDeleteMatch(),
  switchStatsView:               (e) => { var el = e.target.closest('[data-view]'); if (!el) return; switchStatsView(el.dataset.view); },
  setSeason:                     (e) => { var el = e.target.closest('[data-season]'); if (!el) return; setSeason(el.dataset.season); },
  setTeamFilter:                 (e) => { var el = e.target.closest('[data-team]'); if (!el) return; setTeamFilter(el.dataset.team); },
  setTournamentFilter:           (e) => { var el = e.target.closest('[data-tournament]'); if (!el) return; setTournamentFilter(el.dataset.tournament); },
  setMatchPage:                  (e) => { var el = e.target.closest('[data-page]'); if (!el) return; setMatchPage(Number(el.dataset.page)); },
  setOpponentSearch:             (e) => setOpponentSearch(e.target.value),
  clearOpponentSearch:           () => { var i = document.getElementById('opponent-search-input'); if (i) i.value = ''; setOpponentSearch(''); },
  exportCSV:                     () => exportCSV(),
  exportPDF:                     () => exportPDF(),
  addSeason:                     () => addSeason(),
  setSport:                      (e) => { var el = e.target.closest('[data-sport]'); if (!el) return; setSport(el.dataset.sport); },
  setSeasonFormat:               (e) => { var el = e.target.closest('[data-format]'); if (!el) return; setSeasonFormat(el.dataset.format); },
  setDateFormat:                 (e) => { var el = e.target.closest('[data-format]'); if (!el) return; setDateFormat(el.dataset.format); },
  setActiveSeason:               (e) => { var el = e.target.closest('[data-season]'); if (!el) return; setActiveSeason(el.dataset.season); },
  showProToast:                  () => showToast('Coming soon \u2013 Stripe i Fase 4 \u{1F680}', 'success'),
  closeAssessmentSheet:          () => closeAssessmentSheet(),
  saveAssessment:                () => saveAssessment(),
  setRating:                     (e) => { var el = e.target.closest('[data-category]'); if (!el) return; setRating(el.dataset.category, Number(el.dataset.value), el.dataset.context); },
  dismissProfilePrompt:          () => dismissProfilePrompt(),
};

function updateDateLabel(val) {
  var el = document.getElementById('date-display-label');
  if (!el) return;
  var today = new Date().toISOString().split('T')[0];
  if (!val || val === today) {
    el.textContent = t('today');
  } else {
    var d = new Date(val + 'T00:00:00');
    el.textContent = d.toLocaleDateString(getDateLocale(), { weekday: 'short', day: 'numeric', month: 'short' });
  }
}

function setupDateToggle() {
  var btn = document.getElementById('date-toggle-btn');
  var input = document.getElementById('date');
  if (!btn || !input) return;
  var blurTimer = null;
  btn.addEventListener('click', function(e) {
    e.stopPropagation();
    var isOpen = input.classList.toggle('open');
    if (isOpen) input.focus();
  });
  input.addEventListener('change', function() {
    updateDateLabel(input.value);
  });
  input.addEventListener('blur', function() {
    blurTimer = setTimeout(function() {
      input.classList.remove('open');
    }, 200);
  });
  input.addEventListener('focus', function() {
    clearTimeout(blurTimer);
  });
}

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

document.addEventListener('athlytics:renderProfileLists', function() {
  renderProfileTeamList();
  renderProfileTournamentList();
});

document.addEventListener('athlytics:showAssessment', function(e) {
  if (e.detail && e.detail.matchId) openAssessmentSheet(e.detail.matchId);
});

// ── Bootstrap ──────────────────────────────────────────────────────────────

// Global outside-click handler for lang picker (runs once, not per toggle)
document.addEventListener('click', function(e) {
  if (!e.target.closest('.lang-picker-wrap')) {
    document.querySelectorAll('.lang-picker-dropdown').forEach(function(d) { d.classList.remove('open'); });
  }
});

// Expose uploadImage globally for avatar onchange handler
window._uploadImage = uploadImage;

window.addEventListener('load', async function() {
  try {
    initChartDefaults();
    var today = new Date().toISOString().split('T')[0];
    document.getElementById('date').value = today;
    updateDateLabel(today);
    setupDateToggle();
    updateResult();
    setupEventDelegation();

    var p = await fetchProfileFromSupabase();
    loadProfileData(p);
    updateProfilePrompt();
    renderTeamDropdown();
    renderLogSub();
    if (p.favoriteTeam && p.team.includes(p.favoriteTeam)) selectTeam(p.favoriteTeam);
    if (p.favoriteTournament && p.tournaments && p.tournaments.includes(p.favoriteTournament)) selectTournament(p.favoriteTournament);
    renderTournamentDropdown();
    applyTheme(getSettings().sport);
    updateLogBadge();
    updateFlags();
    updateAllText();
  } catch(err) {
    console.error('Init failed:', err);
  }
});
