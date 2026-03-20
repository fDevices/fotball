import { fetchProfileFromSupabase, loadProfileData, renderLogSub, saveProfile, updateAvatar, uploadImage, dismissProfilePrompt, updateProfilePrompt, getProfile, isProfileComplete } from './profile.js';
import { getSettings, getDateLocale } from './settings.js';
import { renderTeamDropdown, renderTournamentDropdown, renderProfileTeamList, renderProfileTournamentList, selectTeam, selectTournament, toggleTeamDropdown, toggleTournamentDropdown, saveNewTeamFromDropdown, saveNewTournamentFromDropdown, toggleNewTeamInput, toggleNewTournamentInput, addTeamFromProfile, addTournament, deleteTeam, deleteTournament, setFavoriteTeam, setFavoriteTournament, closeAllDropdowns, toggleModalTeamDropdown, toggleModalTournamentDropdown, selectModalTeam, selectModalTournament } from './teams.js';
import { switchTab, updateLogBadge } from './navigation.js';
import { t, toggleLangPicker } from './i18n.js';
import { setLang, updateFlags, updateAllText } from './text-refresh.js';
import { loadStats, switchStatsView, setSeason, setTeamFilter, setTournamentFilter, setMatchPage, setOpponentSearch } from './stats-overview.js';
import { destroyCharts, initChartDefaults } from './stats-analyse.js';
import { adjust, saveMatch, setMatchType, updateResult } from './log.js';
import { openEditModal, closeModal, setModalMatchType, modalAdjust, saveEditedMatch, deleteMatch, cancelDeleteMatch, confirmDeleteMatch } from './modal.js';
import { openAssessmentSheet, closeAssessmentSheet, saveAssessment, setRating } from './assessment.js';
import { exportCSV, exportPDF } from './export.js';
import { renderSettings, setSport, setSeasonFormat, setDateFormat, setActiveSeason, addSeason, applyTheme } from './settings-render.js';
import { showToast } from './toast.js';
import { restoreSession, isAuthenticated, logout } from './auth.js';
import { PROFIL_KEY, SETTINGS_KEY, CACHE_KEY } from './config.js';

// ── Auth helpers ──────────────────────────────────────────────────────────

function _clearCaches() {
  localStorage.removeItem(PROFIL_KEY);
  localStorage.removeItem(SETTINGS_KEY);
  sessionStorage.removeItem(CACHE_KEY);
}

const WRITE_ACTIONS = new Set([
  'saveMatch', 'saveProfile', 'saveEditedMatch', 'confirmDeleteMatch',
  'addTeamFromProfile', 'addTournament', 'deleteTeam', 'deleteTournament',
  'setFavoriteTeam', 'setFavoriteTournament', 'saveNewTeamFromDropdown',
  'saveNewTournamentFromDropdown', 'addSeason', 'setSport', 'setSeasonFormat',
  'setDateFormat', 'setActiveSeason', 'saveAssessment', 'exportCSV', 'exportPDF'
]);

var _demoBannerDismissed = false;

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
  triggerAvatarUpload:           () => { var i = document.getElementById('avatar-upload'); if (i) i.click(); },
  dismissProfilePrompt:          () => dismissProfilePrompt(),
  logout:              () => logout(),
  openAuthOverlay:     () => openAuthOverlay('login'),
  dismissDemoBanner:   () => { _demoBannerDismissed = true; updateDemoBanner(); },
  authToggleView:      () => toggleAuthView(),
  authLogin:           () => handleAuthLogin(),
  authSignup:          () => handleAuthSignup(),
};

// ── Auth overlay ─────────────────────────────────────────────────────────

function openAuthOverlay(view) {
  var overlay = document.getElementById('auth-overlay');
  if (overlay) overlay.classList.remove('hidden');
  showAuthView(view || 'login');
}

function closeAuthOverlay() {
  var overlay = document.getElementById('auth-overlay');
  if (overlay) overlay.classList.add('hidden');
}

function showAuthView(view) {
  var loginView  = document.getElementById('auth-login-view');
  var signupView = document.getElementById('auth-signup-view');
  if (!loginView || !signupView) return;
  if (view === 'signup') {
    loginView.classList.add('hidden');
    signupView.classList.remove('hidden');
  } else {
    signupView.classList.add('hidden');
    loginView.classList.remove('hidden');
  }
}

function toggleAuthView() {
  var loginView = document.getElementById('auth-login-view');
  var isLoginVisible = loginView && !loginView.classList.contains('hidden');
  showAuthView(isLoginVisible ? 'signup' : 'login');
}

function showAuthError(viewId, msg) {
  var el = document.getElementById(viewId);
  if (!el) return;
  el.textContent = msg;
  el.classList.remove('hidden');
}

function clearAuthErrors() {
  ['auth-login-error', 'auth-signup-error'].forEach(function(id) {
    var el = document.getElementById(id);
    if (el) { el.textContent = ''; el.classList.add('hidden'); }
  });
}

async function handleAuthLogin() {
  clearAuthErrors();
  var email    = (document.getElementById('auth-login-email')    || {}).value || '';
  var password = (document.getElementById('auth-login-password') || {}).value || '';
  var { login: authLogin } = await import('./auth.js');
  var result = await authLogin(email, password);
  if (result.error) { showAuthError('auth-login-error', result.error); return; }
  closeAuthOverlay();
  _clearCaches();
  var p = await fetchProfileFromSupabase();
  loadProfileData(p);
  switchTab(isProfileComplete() ? 'log' : 'profile');
  updateDemoBanner();
}

async function handleAuthSignup() {
  clearAuthErrors();
  var email    = (document.getElementById('auth-signup-email')    || {}).value || '';
  var password = (document.getElementById('auth-signup-password') || {}).value || '';
  var confirm  = (document.getElementById('auth-signup-confirm')  || {}).value || '';
  if (password !== confirm) {
    showAuthError('auth-signup-error', t('auth_error_pw_mismatch'));
    return;
  }
  var { signup: authSignup } = await import('./auth.js');
  var result = await authSignup(email, password);
  if (result.error) { showAuthError('auth-signup-error', result.error); return; }
  closeAuthOverlay();
  _clearCaches();
  loadProfileData(getProfile());
  switchTab('profile');
  updateDemoBanner();
}

// ── Demo banner ───────────────────────────────────────────────────────────

function updateDemoBanner() {
  var banner = document.getElementById('demo-banner');
  if (!banner) return;
  if (isAuthenticated() || _demoBannerDismissed) {
    banner.classList.add('hidden');
  } else {
    banner.classList.remove('hidden');
  }
}

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
    if (WRITE_ACTIONS.has(action) && !isAuthenticated()) {
      document.dispatchEvent(new CustomEvent('athlytics:requireAuth'));
      return;
    }
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

  // Change events (file inputs)
  document.addEventListener('change', function(e) {
    var el = e.target.closest('input[data-action]');
    if (!el) return;
    if (el.dataset.action === 'uploadImage') {
      if (!isAuthenticated()) {
        document.dispatchEvent(new CustomEvent('athlytics:requireAuth'));
        return;
      }
      uploadImage(el);
    }
  });

  // Keydown: Enter for add-item inputs
  document.addEventListener('keydown', function(e) {
    if (e.key !== 'Enter') return;
    if (!isAuthenticated()) {
      var writeInputIds = ['team-new-input', 'tournament-new-input', 'profile-team-input', 'profile-new-tournament', 'settings-ny-sesong'];
      if (writeInputIds.includes(e.target.id)) {
        document.dispatchEvent(new CustomEvent('athlytics:requireAuth'));
        return;
      }
    }
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
  // Dispatched by settings.js:requestRenderSettings() to break circular dep
  renderSettings();
});

document.addEventListener('athlytics:updateAllText', function() {
  // Dispatched by text-refresh.js:updateAllText() after language change
  renderLogSub();
  updateResult();
  updateLogBadge();
});

document.addEventListener('athlytics:loadStats', function() {
  // Dispatched by navigation.js:switchTab() when navigating to stats tab
  loadStats();
});

document.addEventListener('athlytics:destroyCharts', function() {
  // Dispatched by navigation.js:switchTab() when leaving stats tab
  destroyCharts();
});

document.addEventListener('athlytics:matchesChanged', function() {
  // Dispatched by modal.js after save/delete — force re-fetch from Supabase
  loadStats(true);
});

document.addEventListener('athlytics:renderProfileLists', function() {
  renderProfileTeamList();
  renderProfileTournamentList();
});

document.addEventListener('athlytics:showAssessment', function(e) {
  if (e.detail && e.detail.matchId) openAssessmentSheet(e.detail.matchId);
});

document.addEventListener('athlytics:requireAuth', function() {
  // Dispatched by WRITE_ACTIONS intercept, keydown guard, and uploadImage guard
  openAuthOverlay('login');
});

// ── Bootstrap ──────────────────────────────────────────────────────────────

// Global outside-click handler for lang picker (runs once, not per toggle)
document.addEventListener('click', function(e) {
  if (!e.target.closest('.lang-picker-wrap')) {
    document.querySelectorAll('.lang-picker-dropdown').forEach(function(d) { d.classList.remove('open'); });
  }
});


window.addEventListener('load', async function() {
  try {
    await restoreSession();
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
    if (p.favoriteTeam && p.teams && p.teams.includes(p.favoriteTeam)) selectTeam(p.favoriteTeam);
    if (p.favoriteTournament && p.tournaments && p.tournaments.includes(p.favoriteTournament)) selectTournament(p.favoriteTournament);
    renderTournamentDropdown();
    applyTheme(getSettings().sport);
    updateLogBadge();
    updateFlags();
    updateAllText();
    updateDemoBanner();
  } catch(err) {
    console.error('Init failed:', err);
  }
});
