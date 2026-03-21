import { fetchProfileFromSupabase, loadProfileData, renderLogSub, updateAvatar, uploadImage, updateProfilePrompt } from './profile.js';
import { getSettings } from './settings.js';
import { renderTeamDropdown, renderTournamentDropdown, renderProfileTeamList, renderProfileTournamentList, selectTeam, selectTournament, closeAllDropdowns, saveNewTeamFromDropdown, saveNewTournamentFromDropdown, addTeamFromProfile, addTournament } from './teams.js';
import { updateLogBadge } from './navigation.js';
import { updateFlags, updateAllText } from './text-refresh.js';
import { loadStats, setOpponentSearch } from './stats-overview.js';
import { destroyCharts, initChartDefaults } from './stats-analyse.js';
import { updateResult, setupDateToggle, updateDateLabel } from './log.js';
import { openAssessmentSheet } from './assessment.js';
import { renderSettings, applyTheme, addSeason } from './settings-render.js';
import { showToast } from './toast.js';
import { restoreSession, isAuthenticated } from './auth.js';
import { openAuthOverlay, updateDemoBanner } from './auth-ui.js';
import { ACTIONS, WRITE_ACTIONS } from './actions.js';

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

// Global outside-click handler for lang picker — intentionally separate from setupEventDelegation()
// because it must run regardless of whether the click hit a [data-action] element.
document.addEventListener('click', function(e) {
  if (!e.target.closest('.lang-picker-wrap')) {
    document.querySelectorAll('.lang-picker-dropdown').forEach(function(d) { d.classList.remove('open'); });
  }
});


function syncViewportBottom() {
  var vp = window.visualViewport;
  var offset = vp ? Math.max(0, window.innerHeight - vp.offsetTop - vp.height) : 0;
  document.documentElement.style.setProperty('--vp-bottom', offset + 'px');
}
if (window.visualViewport) {
  window.visualViewport.addEventListener('resize', syncViewportBottom);
  window.visualViewport.addEventListener('scroll', syncViewportBottom);
}
syncViewportBottom();

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
